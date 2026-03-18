import path from "path";
import os from "os";
import { supabase } from "../lib/supabase";
import { downloadVideo, probeVideo, transcodeForShorts, cleanup } from "./video-processor";
import { uploadToYouTube } from "./youtube-uploader";
import type { ReelSubmission } from "../types";

const MAX_DURATION_SECONDS = 180; // 3 minutes

export async function processSubmission(submissionId: string): Promise<void> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${submissionId}-input.mp4`);
  const outputPath = path.join(tmpDir, `${submissionId}-processed.mp4`);

  try {
    // Lock: set status to processing (only if still pending)
    const { data: lockData, error: lockError } = await supabase
      .from("reel_submissions")
      .update({ status: "processing" })
      .eq("id", submissionId)
      .eq("status", "pending")
      .select("*")
      .single();

    if (lockError || !lockData) {
      console.log(`Submission ${submissionId} is no longer pending, skipping`);
      return;
    }

    const submission = lockData as ReelSubmission;
    const handle = submission.artist_name;

    // Download
    console.log(`Downloading video from ${submission.video_url}`);
    await downloadVideo(submission.video_url, inputPath);

    // Probe
    const probe = await probeVideo(inputPath);
    console.log(`Video: ${probe.width}x${probe.height}, ${probe.duration.toFixed(1)}s, ${probe.videoCodec}/${probe.audioCodec}`);

    // Duration validation
    if (probe.duration > MAX_DURATION_SECONDS) {
      throw new Error(`Video exceeds 3-minute limit (${probe.duration.toFixed(0)}s)`);
    }

    // Transcode
    const processedPath = await transcodeForShorts(inputPath, outputPath, probe);

    // Build YouTube metadata
    const title = submission.description
      ? submission.description.slice(0, 100)
      : `@${handle} | Flow Arts Professional`;

    const description = [
      submission.description || "",
      "",
      `Featured artist: @${handle}`,
      "Submit your reel: flowarts.pro",
    ].join("\n").trim();

    const tags = ["flow arts", "Shorts", handle];

    // Upload to YouTube
    const youtubeUrl = await uploadToYouTube({
      filePath: processedPath,
      title,
      description,
      tags,
    });

    // Update status to posted
    await supabase
      .from("reel_submissions")
      .update({
        status: "posted",
        youtube_url: youtubeUrl,
        error_message: null,
      })
      .eq("id", submissionId);

    console.log(`Submission ${submissionId} posted: ${youtubeUrl}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Pipeline failed for ${submissionId}:`, errorMessage);

    await supabase
      .from("reel_submissions")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", submissionId);
  } finally {
    await cleanup(inputPath, outputPath);
  }
}
