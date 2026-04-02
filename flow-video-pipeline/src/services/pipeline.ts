import path from "path";
import os from "os";
import { supabase } from "../lib/supabase";
import { downloadVideo, probeVideo, transcodeForShorts, cleanup } from "./video-processor";
import { uploadToYouTube } from "./youtube-uploader";
import { uploadToInstagram } from "./instagram-uploader";
import { uploadToFacebook } from "./facebook-uploader";
import { uploadToTikTok } from "./tiktok-uploader";
import { uploadToThreads } from "./threads-uploader";
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

function isTikTokEnabled(): boolean {
  // TikTok disabled until token auth is resolved
  return false;
}

function isThreadsEnabled(): boolean {
  return !!((process.env.THREADS_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN) && process.env.THREADS_USER_ID);
}

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

/**
 * Phase 1: Process submission — download, extract username, transcode with music.
 * Saves the processed video to public storage and sets status to "processed".
 * Does NOT post to any platform.
 */
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
      .in("status", ["pending"])
      .select("*")
      .single();

    if (lockError || !lockData) {
      console.log(`Submission ${submissionId} is not available for processing, skipping`);
      return;
    }

    const submission = lockData as ReelSubmission;
    const submittedHandle = submission.artist_name?.replace(/^@+/, "") || "";

    // Download
    console.log(`Downloading video from ${submission.video_url}`);
    await downloadVideo(submission.video_url, inputPath);

    // Extract username from the upper-left corner of the video
    console.log("  Extracting username from video...");
    const detectedUsername = await extractUsernameFromVideo(inputPath);
    const handle = detectedUsername
      ? detectedUsername.replace(/^@+/, "")
      : (submittedHandle && submittedHandle !== "Unknown Artist" ? submittedHandle : "glowwitdaflow");
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

    // Upload processed video to public storage for later publishing
    const publicVideoUrl = await uploadToPublicUrl(processedPath, submissionId, "social");
    console.log(`  Processed video stored: ${publicVideoUrl}`);

    // Build publish_details with metadata for later publishing
    const publishDetails: PublishDetails = {
      music_track: transcodeResult.musicTrackName || undefined,
      processed_url: publicVideoUrl,
      artist_handle: handle,
    };

    // Mark as processed — ready for scheduled publishing
    await supabase
      .from("reel_submissions")
      .update({
        status: "processed",
        publish_details: publishDetails,
        error_message: null,
      })
      .eq("id", submissionId);

    console.log(`Submission ${submissionId} processed — queued for scheduled publishing`);
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

/**
 * Phase 2: Publish a processed submission to all enabled platforms.
 * Called by the scheduler every 3 hours (2 per batch).
 * Returns true if it actually published to at least one platform, false if skipped.
 */
export async function publishSubmission(submissionId: string): Promise<boolean> {
  const tmpDir = os.tmpdir();
  const processedPath = path.join(tmpDir, `${submissionId}-publish.mp4`);

  try {
    // Lock: accept processed, queued, or partial
    const { data: lockData, error: lockError } = await supabase
      .from("reel_submissions")
      .update({ status: "processing" })
      .eq("id", submissionId)
      .in("status", ["processed", "queued", "partial"])
      .select("*")
      .single();

    if (lockError || !lockData) {
      console.log(`Submission ${submissionId} not available for publishing, skipping`);
      return false;
    }

    const submission = lockData as ReelSubmission;
    const prior: PublishDetails = submission.publish_details || {};
    const handle = prior.artist_handle || submission.artist_name?.replace(/^@+/, "") || "glowwitdaflow";
    const publicVideoUrl = prior.processed_url || null;

    if (!publicVideoUrl) {
      console.error(`Submission ${submissionId} has no processed video URL — re-queuing as pending`);
      await supabase.from("reel_submissions").update({ status: "pending" }).eq("id", submissionId);
      return false;
    }

    // Download processed video for YouTube upload (needs local file)
    const needsYouTube = !prior.youtube;
    if (needsYouTube) {
      await downloadVideo(publicVideoUrl, processedPath);
    }

    // Build captions
    const caption = captions[Math.floor(Math.random() * captions.length)];
    const title = submission.description
      ? submission.description.slice(0, 100)
      : `${caption} @${handle}`;

    const hashtags = "#dance #edm #rave #hulahoop #flowarts #Shorts";

    const description = [
      submission.description || "",
      "",
      `Featured artist: @${handle}`,
      "Submit your reel at https://flowarts.pro",
      "",
      hashtags,
    ].join("\n").trim();

    const tags = ["dance", "edm", "rave", "hulahoop", "flow arts", "Shorts", handle];

    const socialCaption = [
      submission.description || caption,
      "",
      `Artist: @${handle}`,
      "Submit your reel at https://flowarts.pro",
      "",
      "#dance #edm #rave #hulahoop #flowarts",
    ].join("\n").trim();

    // Determine which platforms still need posting
    const needsInstagram = isInstagramEnabled() && !prior.instagram;
    const needsFacebook = isFacebookEnabled() && !prior.facebook;
    const needsTikTok = isTikTokEnabled() && !prior.tiktok;
    const needsThreads = isThreadsEnabled() && !prior.threads;

    // Carry forward prior successes, clear old errors for retries
    const publishDetails: PublishDetails = { ...prior };
    if (needsYouTube) delete publishDetails.youtube_error;
    if (needsInstagram) delete publishDetails.instagram_error;
    if (needsFacebook) delete publishDetails.facebook_error;
    if (needsTikTok) delete publishDetails.tiktok_error;
    if (needsThreads) delete publishDetails.threads_error;

    if (!needsYouTube && !needsInstagram && !needsFacebook && !needsTikTok && !needsThreads) {
      console.log(`Submission ${submissionId} already posted to all enabled platforms, skipping`);
      await supabase
        .from("reel_submissions")
        .update({ status: "posted", error_message: null })
        .eq("id", submissionId);
      return false;
    }

    const platformsToPost = [
      needsYouTube ? "YouTube" : null,
      needsInstagram ? "Instagram" : null,
      needsFacebook ? "Facebook" : null,
      needsTikTok ? "TikTok" : null,
      needsThreads ? "Threads" : null,
    ].filter(Boolean).join(", ");
    console.log(`  Publishing to: ${platformsToPost}`);

    // Upload to platforms in parallel
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

    // TikTok
    if (needsTikTok && publicVideoUrl) {
      uploadPromises.push(
        uploadToTikTok(publicVideoUrl, socialCaption)
          .then((result) => {
            publishDetails.tiktok = result.url;
            console.log(`  TikTok: ${result.url}`);
          })
          .catch((err) => {
            console.error("  TikTok upload failed:", err);
            publishDetails.tiktok_error = err instanceof Error ? err.message : String(err);
          })
      );
    }

    // Threads
    if (needsThreads && publicVideoUrl) {
      uploadPromises.push(
        uploadToThreads(publicVideoUrl, socialCaption)
          .then((result) => {
            publishDetails.threads = result.permalink;
            console.log(`  Threads: ${result.permalink}`);
          })
          .catch((err) => {
            console.error("  Threads upload failed:", err);
            publishDetails.threads_error = err instanceof Error ? err.message : String(err);
          })
      );
    }

    await Promise.all(uploadPromises);

    // Determine results
    const postedYouTube = !!publishDetails.youtube;
    const postedInstagram = !!publishDetails.instagram;
    const postedFacebook = !!publishDetails.facebook;
    const postedTikTok = !!publishDetails.tiktok;
    const postedThreads = !!publishDetails.threads;

    // Treat auth-level failures (invalid/expired token) as "not enabled" so they
    // don't block the queue. These will auto-resolve once the token is fixed.
    const isTikTokAuthFailure = !!publishDetails.tiktok_error
      && (String(publishDetails.tiktok_error).includes("access_token_invalid")
        || String(publishDetails.tiktok_error).includes("token_expired"));

    const stillMissingYouTube = !postedYouTube;
    const stillMissingInstagram = isInstagramEnabled() && !postedInstagram;
    const stillMissingFacebook = isFacebookEnabled() && !postedFacebook;
    const stillMissingTikTok = isTikTokEnabled() && !postedTikTok && !isTikTokAuthFailure;
    const stillMissingThreads = isThreadsEnabled() && !postedThreads;
    const allDone = !stillMissingYouTube && !stillMissingInstagram && !stillMissingFacebook && !stillMissingTikTok && !stillMissingThreads;

    const postedPlatforms = [
      postedYouTube ? "YouTube" : null,
      postedInstagram ? "Instagram" : null,
      postedFacebook ? "Facebook" : null,
      postedTikTok ? "TikTok" : null,
      postedThreads ? "Threads" : null,
    ].filter(Boolean).join(", ");

    // Detect YouTube quota errors — always requeue instead of failing
    const ytError = publishDetails.youtube_error || "";
    const isQuotaError = ytError.includes("exceeded the number of videos")
      || ytError.includes("quotaExceeded")
      || ytError.includes("uploadLimitExceeded");

    if (isQuotaError) {
      // Queue for retry regardless of other platform results — YouTube is required
      await supabase
        .from("reel_submissions")
        .update({
          status: "queued",
          youtube_url: publishDetails.youtube || null,
          publish_details: publishDetails,
          error_message: `YouTube quota reached — will retry next cycle. ${postedPlatforms ? `Already posted to: ${postedPlatforms}` : ""}`.trim(),
        })
        .eq("id", submissionId);
      console.log(`Submission ${submissionId} queued for retry (YouTube quota exceeded)`);
      return true;
    }

    if (allDone) {
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
      return true;
    } else if (postedYouTube || postedInstagram || postedFacebook || postedTikTok || postedThreads) {
      const missing = [
        stillMissingYouTube ? "YouTube" : null,
        stillMissingInstagram ? "Instagram" : null,
        stillMissingFacebook ? "Facebook" : null,
        stillMissingTikTok ? "TikTok" : null,
        stillMissingThreads ? "Threads" : null,
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
      return true;
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
      return true;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Publishing failed for ${submissionId}:`, errorMessage);

    await supabase
      .from("reel_submissions")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", submissionId);
    return false;
  } finally {
    await cleanup(processedPath);
  }
}
