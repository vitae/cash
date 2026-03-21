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
  // Hype & energy
  "Look at them GLOW!",
  "Glow Wit Da Flow!",
  "This is INSANE!",
  "The vibes are UNREAL!",
  "YOOO this is fire!",
  "SHEESH!",
  "Somebody call 911!",
  "No words. Just WOW!",
  "Drop what you're doing and WATCH!",
  "Can't. Look. Away!",
  "How is this even real?!",
  "Literal chills!",
  "This right here is EVERYTHING!",
  "Okay we SEE you!",

  // Flow state & artistry
  "Flow state activated!",
  "The flow is IMMACULATE!",
  "That flow hits DIFFERENT!",
  "Absolutely hypnotizing!",
  "Mesmerizing!",
  "Pure magic right here!",
  "That's what we call ART!",
  "Flow game on another level!",
  "Poetry in motion!",
  "When the prop becomes an extension of your soul!",
  "This is what peak flow looks like!",
  "Art in every rotation!",
  "The kind of flow that stops you mid-scroll!",

  // Community & encouragement
  "Main character energy!",
  "Keep spinning keep winning!",
  "Born to glow!",
  "We don't gatekeep flow!",
  "Spin it like you mean it!",
  "Give this person a stage!",
  "Rave fam approved!",
  "Living for this energy!",
  "Sending all the flow vibes!",
  "The glow up is REAL!",
  "Love what you do!",
  "They ATE this up!",
  "This one RIGHT HERE!",
  "The talent is INSANE!",
  "Every spinner has a story — this one gave us goosebumps!",
  "Community over competition, always!",
  "This is why we flow!",

  // Rave & festival culture
  "Rave to the GRAVE!",
  "Festival ready!",
  "The energy is ELECTRIC!",
  "Catch these vibes!",
  "Light it UP!",
  "The flow never stops!",
  "When the music hits just right!",
  "Flowing into the weekend like...",
  "Can't stop watching this!",
  "This is how we do it!",
  "PLUR: peace love unity respect!",
  "Under the lasers, everything flows!",
  "Bass drops and fire props!",
  "The night is young and the flow is eternal!",
  "Waiting for the beat to drop like...",
  "Lost in the lights, found in the flow!",

  // Fresh & playful
  "Get paid honey!",
  "She's on FIRE!",
  "Amazing Flow!",
  "You go girl!",
  "Brb picking my jaw up off the floor!",
  "Tell me you flow without telling me you flow!",
  "POV: you just discovered your new obsession!",
  "Scientists can't explain this level of glow!",
  "Warning: may cause spontaneous urge to spin!",
  "They said flow arts aren't a sport — show them THIS!",
  "Not me rewatching this for the 47th time!",
  "The algorithm brought you here for a reason!",

  // Flow Arts Olympics
  "Gold medal flow right here!",
  "Olympic-level spinning!",
  "If flow arts were in the Olympics, this would be the opening ceremony!",
  "10 out of 10 from every judge!",
  "Going for GOLD!",
  "World record flow!",
  "This routine deserves a podium!",
  "Training for the Flow Arts Olympics!",
  "Champion-level performance!",
  "Representing the flow arts nation!",

  // ESPN of Flow Arts
  "BREAKING: jaw officially on the floor!",
  "And the crowd goes WILD!",
  "Ladies and gentlemen, you are witnessing GREATNESS!",
  "Top 10 plays of the week, EASY!",
  "This just in — flow arts have a new MVP!",
  "Instant replay NEEDED!",
  "Did you see that?! REWIND!",
  "Welcome to the highlight reel!",
  "SportsCenter top play material!",
  "That's one for the record books!",

  // Life is a party
  "Life is a party and flow is the dance floor!",
  "Every day is a celebration when you flow!",
  "The party doesn't start until the props come out!",
  "Life's too short to NOT spin!",
  "Confetti energy in every spin!",
  "This is the after-party and everyone's invited!",
  "Who needs a DJ when you ARE the vibe?",
  "Birthday energy every single day!",
  "Pop the glow sticks, it's a celebration!",
  "Living life like one big festival!",

  // Rhymes
  "Spin and grin, let the magic begin!",
  "Glow with the flow, steal the whole show!",
  "Light up the night, what a beautiful sight!",
  "Feel the beat, move your feet, watch the fire and the heat!",
  "Round and round, the best flow we've found!",
  "Twist and shout, that's what flow's about!",
  "Hoop don't lie, watch this artist FLY!",
  "Catch the wave, from the cradle to the rave!",
  "Props in the air, nothing else can compare!",
  "Dance and sway, glow the night away!",
  "Drop the bass, watch the light trails trace!",
  "Born to spin, feel the fire within!",
  "Flow so clean, best you've ever seen!",
  "Shine so bright, owning every night!",
  "Step by step, every move is kept!",
  "Feel the groove, watch this artist MOVE!",
  "Spark and spin, let the show begin!",
  "Lost in the sound, best flow around!",
  "Glow and go, putting on a show!",
  "Rise and shine, every move's divine!",
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
 * Called by the scheduler at posting times (every 3 hours, 7am-11pm EST).
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

    const stillMissingYouTube = !postedYouTube;
    const stillMissingInstagram = isInstagramEnabled() && !postedInstagram;
    const stillMissingFacebook = isFacebookEnabled() && !postedFacebook;
    const stillMissingTikTok = isTikTokEnabled() && !postedTikTok;
    const stillMissingThreads = isThreadsEnabled() && !postedThreads;
    const allDone = !stillMissingYouTube && !stillMissingInstagram && !stillMissingFacebook && !stillMissingTikTok && !stillMissingThreads;

    const postedPlatforms = [
      postedYouTube ? "YouTube" : null,
      postedInstagram ? "Instagram" : null,
      postedFacebook ? "Facebook" : null,
      postedTikTok ? "TikTok" : null,
      postedThreads ? "Threads" : null,
    ].filter(Boolean).join(", ");

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
            error_message: "YouTube quota reached — will retry at next scheduled time",
          })
          .eq("id", submissionId);
        console.log(`Submission ${submissionId} queued for retry (quota exceeded)`);
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
      }
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
