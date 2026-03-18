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
    const handle = submission.artist_name.replace(/^@+/, "");

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
    const captions = [
      "Look at them GLOW!",
      "Glow Wit Da Flow!",
      "She's on FIRE!",
      "Amazing Flow!",
      "This is INSANE!",
      "The vibes are UNREAL!",
      "Flow state activated!",
      "Can't stop watching this!",
      "Pure magic right here!",
      "They ATE this up!",
      "The flow is IMMACULATE!",
      "Mesmerizing!",
      "How is this even real?!",
      "Living for this energy!",
      "That flow hits DIFFERENT!",
      "Absolutely hypnotizing!",
      "YOOO this is fire!",
      "Main character energy!",
      "The glow up is REAL!",
      "Sending all the flow vibes!",
      "This one RIGHT HERE!",
      "Drop what you're doing and WATCH!",
      "Literal chills!",
      "Flow game on another level!",
      "When the music hits just right!",
    ];
    const caption = captions[Math.floor(Math.random() * captions.length)];

    const title = submission.description
      ? submission.description.slice(0, 100)
      : `${caption} @${handle}`;

    const hashtags = "#flowarts #edm #dance #hulahoop #poi #rave #Shorts";

    const description = [
      submission.description || "",
      "",
      `Featured artist: @${handle}`,
      "Submit your reel: flowarts.pro",
      "",
      hashtags,
    ].join("\n").trim();

    const tags = ["flow arts", "edm", "dance", "hulahoop", "poi", "rave", "Shorts", handle];

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
