import { config } from "./config";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export interface FacebookUploadResult {
  videoId: string;
  url: string;
}

/**
 * Upload a Reel to Facebook Page via the Graph API.
 *
 * Flow:
 * 1. Initialize an upload session
 * 2. Upload the video file
 * 3. Publish as a Reel
 */
export async function uploadToFacebook(
  publicVideoUrl: string,
  description: string
): Promise<FacebookUploadResult> {
  // Upload video via URL to the Page's video endpoint
  const uploadRes = await fetch(
    `${GRAPH_API}/${config.facebook.pageId}/video_reels`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "start",
        access_token: config.facebook.accessToken,
      }),
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Facebook Reel init failed: ${err}`);
  }

  const { video_id: videoId } = (await uploadRes.json()) as { video_id: string };

  // Upload the video file via URL
  const transferRes = await fetch(
    `${GRAPH_API}/${videoId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "transfer",
        file_url: publicVideoUrl,
        access_token: config.facebook.accessToken,
      }),
    }
  );

  if (!transferRes.ok) {
    const err = await transferRes.text();
    throw new Error(`Facebook Reel transfer failed: ${err}`);
  }

  // Finish and publish
  const finishRes = await fetch(
    `${GRAPH_API}/${config.facebook.pageId}/video_reels`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "finish",
        video_id: videoId,
        video_state: "PUBLISHED",
        description,
        access_token: config.facebook.accessToken,
      }),
    }
  );

  if (!finishRes.ok) {
    const err = await finishRes.text();
    throw new Error(`Facebook Reel publish failed: ${err}`);
  }

  return {
    videoId,
    url: `https://www.facebook.com/reel/${videoId}`,
  };
}
