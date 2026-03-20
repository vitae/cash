import path from "path";
import os from "os";
import { supabase } from "../lib/supabase";
import { downloadVideo, probeVideo, transcodeForShorts, cleanup } from "./video-processor";
import { uploadToYouTube } from "./youtube-uploader";
import { uploadToInstagram } from "./instagram-uploader";
import { uploadToFacebook } from "./facebook-uploader";
import { uploadToPublicUrl, cleanupPublicUrl } from "./public-url-uploader";
import { extractUsernameFromVideo } from "./username-extractor";
import type { ReelSubmission, PublishDetails } from "../types";

const MAX_DURATION_SECONDS = 180; // 3 minutes

function isInstagramEnabled(): boolean {
  return !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID);
}

function isFacebookEnabled(): boolean {
  return !!(process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID);
}

export async function processSubmission(submissionId: string): Promise<void> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${submissionId}-input.mp4`);
  const outputPath = path.join(tmpDir, `${submissionId}-processed.mp4`);

  try {
    // Lock: set status to processing (accept pending, queued, or partial for retries)
    const { data: lockData, error: lockError } = await supabase
      .from("reel_submissions")
      .update({ status: "processing" })
      .eq("id", submissionId)
      .in("status", ["pending", "queued", "partial"])
      .select("*")
      .single();

    if (lockError || !lockData) {
      console.log(`Submission ${submissionId} is not available for processing, skipping`);
      return;
    }

    const submission = lockData as ReelSubmission;
    const fallbackHandle = submission.artist_name.replace(/^@+/, "");

    // Carry forward prior successful posts (don't re-post to platforms that already worked)
    const prior: PublishDetails = submission.publish_details || {};

    // Download
    console.log(`Downloading video from ${submission.video_url}`);
    await downloadVideo(submission.video_url, inputPath);

    // Extract username from the upper-left corner of the video
    console.log("  Extracting username from video...");
    const detectedUsername = await extractUsernameFromVideo(inputPath);
    const handle = detectedUsername
      ? detectedUsername.replace(/^@+/, "")
      : fallbackHandle;
    console.log(`  Using artist handle: @${handle}`);

    // Probe
    const probe = await probeVideo(inputPath);
    console.log(`Video: ${probe.width}x${probe.height}, ${probe.duration.toFixed(1)}s, ${probe.videoCodec}/${probe.audioCodec}`);

    // Validation
    if (probe.duration > MAX_DURATION_SECONDS) {
      throw new Error(`Video exceeds 3-minute limit (${probe.duration.toFixed(0)}s)`);
    }
    if (probe.duration < 1) {
      throw new Error(`Video too short or unreadable (${probe.duration.toFixed(1)}s)`);
    }
    if (probe.width === 0 || probe.height === 0) {
      throw new Error(`Invalid video dimensions (${probe.width}x${probe.height}) — file may be corrupted`);
    }

    // Transcode
    const transcodeResult = await transcodeForShorts(inputPath, outputPath, probe);
    const processedPath = transcodeResult.outputPath;

    // Build metadata
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
      "You go girl!",
      "This is how we do it!",
      "Rave to the GRAVE!",
      "Love what you do!",
      "Get paid honey!",
      "Okay we SEE you!",
      "Somebody call 911!",
      "No words. Just WOW!",
      "The talent is INSANE!",
      "Keep spinning keep winning!",
      "Born to glow!",
      "Catch these vibes!",
      "The flow never stops!",
      "Light it UP!",
      "SHEESH!",
      "We don't gatekeep flow!",
      "Spin it like you mean it!",
      "That's what we call ART!",
      "Festival ready!",
      "The energy is ELECTRIC!",
      "Flowing into the weekend like...",
      "Can't. Look. Away!",
      "Give this person a stage!",
      "Rave fam approved!",
      "This right here is EVERYTHING!",
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
      "Submit your reel: https://flowarts.pro",
      "",
      hashtags,
    ].join("\n").trim();

    const tags = ["flow arts", "edm", "dance", "hulahoop", "poi", "rave", "Shorts", handle];

    // Social media caption (IG/FB use a shorter format)
    const socialCaption = [
      submission.description || caption,
      "",
      `Artist: @${handle}`,
      "Submit your reel at flowarts.pro",
      "",
      "#flowarts #edm #dance #hulahoop #poi #rave #flow #spinning #performance",
    ].join("\n").trim();

    // Determine which platforms still need posting
    const needsYouTube = !prior.youtube;
    const needsInstagram = isInstagramEnabled() && !prior.instagram;
    const needsFacebook = isFacebookEnabled() && !prior.facebook;

    // Carry forward prior successes, clear old errors for platforms we're retrying
    const publishDetails: PublishDetails = { ...prior };
    if (transcodeResult.musicTrackName) {
      publishDetails.music_track = transcodeResult.musicTrackName;
    }
    if (needsYouTube) delete publishDetails.youtube_error;
    if (needsInstagram) delete publishDetails.instagram_error;
    if (needsFacebook) delete publishDetails.facebook_error;

    if (!needsYouTube && !needsInstagram && !needsFacebook) {
      console.log(`Submission ${submissionId} already posted to all enabled platforms, skipping`);
      await supabase
        .from("reel_submissions")
        .update({ status: "posted", error_message: null })
        .eq("id", submissionId);
      return;
    }

    const platformsToPost = [
      needsYouTube ? "YouTube" : null,
      needsInstagram ? "Instagram" : null,
      needsFacebook ? "Facebook" : null,
    ].filter(Boolean).join(", ");
    console.log(`  Posting to: ${platformsToPost}`);

    // Upload processed video to public URL for IG/FB (they need a URL to fetch)
    let publicVideoUrl: string | null = null;
    if (needsInstagram || needsFacebook) {
      try {
        publicVideoUrl = await uploadToPublicUrl(processedPath, submissionId, "social");
        console.log(`  Public URL ready for IG/FB: ${publicVideoUrl}`);
      } catch (err) {
        console.error("  Failed to create public URL for IG/FB:", err);
      }
    }

    // Upload to platforms in parallel (only ones that still need posting)
    const uploadPromises: Promise<void>[] = [];

    // YouTube Shorts
    if (needsYouTube) {
      uploadPromises.push(
        uploadToYouTube({ filePath: processedPath, title, description, tags })
          .then((youtubeUrl) => {
            publishDetails.youtube = youtubeUrl;
            console.log(`  YouTube: ${youtubeUrl}`);
          })
          .catch((err) => {
            console.error("  YouTube upload failed:", err);
            publishDetails.youtube_error = err instanceof Error ? err.message : String(err);
          })
      );
    }

    // Instagram Reels
    if (needsInstagram && publicVideoUrl) {
      uploadPromises.push(
        uploadToInstagram(publicVideoUrl, socialCaption)
          .then((result) => {
            publishDetails.instagram = result.permalink;
            console.log(`  Instagram: ${result.permalink}`);
          })
          .catch((err) => {
            console.error("  Instagram upload failed:", err);
            publishDetails.instagram_error = err instanceof Error ? err.message : String(err);
          })
      );
    }

    // Facebook Reels
    if (needsFacebook && publicVideoUrl) {
      uploadPromises.push(
        uploadToFacebook(publicVideoUrl, socialCaption)
          .then((result) => {
            publishDetails.facebook = result.url;
            console.log(`  Facebook: ${result.url}`);
          })
          .catch((err) => {
            console.error("  Facebook upload failed:", err);
            publishDetails.facebook_error = err instanceof Error ? err.message : String(err);
          })
      );
    }

    await Promise.all(uploadPromises);

    // Clean up public URL from storage
    if (publicVideoUrl) {
      cleanupPublicUrl(submissionId, "social").catch((err) =>
        console.error("  Failed to cleanup public URL:", err)
      );
    }

    // Determine which platforms succeeded (including prior successes)
    const postedYouTube = !!publishDetails.youtube;
    const postedInstagram = !!publishDetails.instagram;
    const postedFacebook = !!publishDetails.facebook;

    // Which enabled platforms are still missing?
    const stillMissingYouTube = !postedYouTube;
    const stillMissingInstagram = isInstagramEnabled() && !postedInstagram;
    const stillMissingFacebook = isFacebookEnabled() && !postedFacebook;
    const allDone = !stillMissingYouTube && !stillMissingInstagram && !stillMissingFacebook;

    const postedPlatforms = [
      postedYouTube ? "YouTube" : null,
      postedInstagram ? "Instagram" : null,
      postedFacebook ? "Facebook" : null,
    ].filter(Boolean).join(", ");

    if (allDone) {
      // All enabled platforms succeeded
      await supabase
        .from("reel_submissions")
        .update({
          status: "posted",
          youtube_url: publishDetails.youtube || null,
          publish_details: publishDetails,
          error_message: null,
        })
        .eq("id", submissionId);
      console.log(`Submission ${submissionId} fully posted to: ${postedPlatforms}`);
    } else if (postedYouTube || postedInstagram || postedFacebook) {
      // Some platforms succeeded, some still need retry — mark as partial
      const missing = [
        stillMissingYouTube ? "YouTube" : null,
        stillMissingInstagram ? "Instagram" : null,
        stillMissingFacebook ? "Facebook" : null,
      ].filter(Boolean).join(", ");
      await supabase
        .from("reel_submissions")
        .update({
          status: "partial",
          youtube_url: publishDetails.youtube || null,
          publish_details: publishDetails,
          error_message: `Posted to ${postedPlatforms}; still need: ${missing}`,
        })
        .eq("id", submissionId);
      console.log(`Submission ${submissionId} partial — posted: ${postedPlatforms}, pending: ${missing}`);
    } else {
      // Nothing succeeded at all
      const ytError = publishDetails.youtube_error || "";
      const isQuotaError = ytError.includes("exceeded the number of videos")
        || ytError.includes("quotaExceeded")
        || ytError.includes("uploadLimitExceeded");

      if (isQuotaError) {
        await supabase
          .from("reel_submissions")
          .update({
            status: "queued",
            publish_details: publishDetails,
            error_message: "YouTube quota reached — will retry all platforms",
          })
          .eq("id", submissionId);
        console.log(`Submission ${submissionId} queued for retry (quota exceeded)`);
      } else {
        const errors = Object.entries(publishDetails)
          .filter(([k]) => k.endsWith("_error"))
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ");
        await supabase
          .from("reel_submissions")
          .update({
            status: "failed",
            publish_details: publishDetails,
            error_message: errors || "All platform uploads failed",
          })
          .eq("id", submissionId);
      }
    }
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
