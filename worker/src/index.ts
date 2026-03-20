import { config } from "./config";
import {
  fetchPendingReels,
  updateReelStatus,
  downloadVideo,
  ReelSubmission,
} from "./supabase";
import { transcodeForPlatforms, cleanupFiles } from "./ffmpeg";
import { uploadToYouTube } from "./upload-youtube";
import { uploadToInstagram } from "./upload-instagram";
import { uploadToFacebook } from "./upload-facebook";
import { uploadToPublicUrl } from "./upload-public";

async function processReel(reel: ReelSubmission): Promise<void> {
  console.log(`Processing reel ${reel.id} from ${reel.artist_name}`);

  await updateReelStatus(reel.id, "processing");

  // Download original video from Supabase Storage
  const videoBuffer = await downloadVideo(reel.video_url);
  console.log(`  Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Transcode for all platforms
  console.log("  Transcoding for all platforms...");
  const files = await transcodeForPlatforms(videoBuffer, reel.id);

  const caption = buildCaption(reel);
  const details: Record<string, string> = {};

  // Upload transcoded IG/FB files to public storage (APIs need a URL)
  const igPublicUrl = await uploadToPublicUrl(files.instagram, reel.id, "instagram");
  const fbPublicUrl = await uploadToPublicUrl(files.facebook, reel.id, "facebook");

  // YouTube Shorts
  try {
    console.log("  Uploading to YouTube Shorts...");
    const yt = await uploadToYouTube(
      files.youtube,
      `${reel.artist_name} | Flow Arts`,
      caption
    );
    details.youtube = yt.url;
    console.log(`  YouTube: ${yt.url}`);
  } catch (err) {
    console.error("  YouTube upload failed:", err);
    details.youtube_error = String(err);
  }

  // Instagram Reels
  try {
    console.log("  Uploading to Instagram Reels...");
    const ig = await uploadToInstagram(igPublicUrl, caption);
    details.instagram = ig.permalink;
    console.log(`  Instagram: ${ig.permalink}`);
  } catch (err) {
    console.error("  Instagram upload failed:", err);
    details.instagram_error = String(err);
  }

  // Facebook Reels
  try {
    console.log("  Uploading to Facebook Reels...");
    const fb = await uploadToFacebook(fbPublicUrl, caption);
    details.facebook = fb.url;
    console.log(`  Facebook: ${fb.url}`);
  } catch (err) {
    console.error("  Facebook upload failed:", err);
    details.facebook_error = String(err);
  }

  // Clean up temp files
  await cleanupFiles(files);

  // Determine final status
  const hasAnySuccess = details.youtube || details.instagram || details.facebook;
  const finalStatus = hasAnySuccess ? "published" : "failed";

  await updateReelStatus(reel.id, finalStatus, details);
  console.log(`  Reel ${reel.id} -> ${finalStatus}`);
}

function buildCaption(reel: ReelSubmission): string {
  const parts: string[] = [];

  if (reel.description) {
    parts.push(reel.description);
  }

  parts.push(`Artist: ${reel.artist_name}`);

  if (reel.instagram_handle) {
    parts.push(`@${reel.instagram_handle.replace(/^@/, "")}`);
  }

  parts.push("");
  parts.push("#flowarts #flow #spinning #performance");

  return parts.join("\n");
}

async function pollLoop(): Promise<void> {
  console.log("Reel worker started. Polling every", config.pollIntervalMs / 1000, "seconds");

  while (true) {
    try {
      const reels = await fetchPendingReels();

      if (reels.length > 0) {
        console.log(`Found ${reels.length} pending reel(s)`);
      }

      for (const reel of reels) {
        try {
          await processReel(reel);
        } catch (err) {
          console.error(`Failed to process reel ${reel.id}:`, err);
          await updateReelStatus(reel.id, "failed", {
            error: String(err),
          }).catch((e) => console.error("Failed to update status:", e));
        }
      }
    } catch (err) {
      console.error("Poll cycle error:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
}

pollLoop().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});
