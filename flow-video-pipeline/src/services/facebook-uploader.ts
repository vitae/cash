import { appsecretProof } from "./meta-auth";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export interface FacebookUploadResult {
  videoId: string;
  url: string;
}

/**
 * Upload a Reel to a Facebook Page via the Graph API.
 *
 * Flow:
 * 1. Initialize an upload session → get video_id
 * 2. Upload binary video data to rupload.facebook.com
 * 3. Finish and publish as a Reel
 */
export async function uploadToFacebook(
  publicVideoUrl: string,
  description: string
): Promise<FacebookUploadResult> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    throw new Error("Missing FACEBOOK_ACCESS_TOKEN or FACEBOOK_PAGE_ID");
  }

  const proof = appsecretProof(accessToken);

  // Step 1: Start upload session
  const uploadRes = await fetch(
    `${GRAPH_API}/${pageId}/video_reels`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "start",
        access_token: accessToken,
        appsecret_proof: proof,
      }),
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Facebook Reel init failed: ${err}`);
  }

  const { video_id: videoId } = (await uploadRes.json()) as { video_id: string };

  // Step 2: Download the video and upload binary data to Facebook's rupload endpoint
  const videoResponse = await fetch(publicVideoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video for Facebook upload: ${videoResponse.status}`);
  }
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  const transferRes = await fetch(
    `https://rupload.facebook.com/video-upload/v21.0/${videoId}`,
    {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}`,
        "offset": "0",
        "file_size": String(videoBuffer.length),
        "Content-Type": "application/octet-stream",
      },
      body: videoBuffer,
    }
  );

  if (!transferRes.ok) {
    const err = await transferRes.text();
    throw new Error(`Facebook Reel binary upload failed: ${err}`);
  }

  // Step 3: Finish and publish
  const finishRes = await fetch(
    `${GRAPH_API}/${pageId}/video_reels`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "finish",
        video_id: videoId,
        video_state: "PUBLISHED",
        description,
        place: "110843418940484", // Honolulu, Hawaii
        access_token: accessToken,
        appsecret_proof: proof,
      }),
    }
  );

  if (!finishRes.ok) {
    const err = await finishRes.text();
    throw new Error(`Facebook Reel publish failed: ${err}`);
  }

  // Step 4: Set location on the published video (Reels finish phase may ignore place)
  try {
    await fetch(
      `${GRAPH_API}/${videoId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place: "110843418940484", // Honolulu, Hawaii
          access_token: accessToken,
          appsecret_proof: proof,
        }),
      }
    );
  } catch {
    // Non-critical — location is best-effort
    console.warn("Failed to set location on Facebook Reel (non-critical)");
  }

  return {
    videoId,
    url: `https://www.facebook.com/reel/${videoId}`,
  };
}
