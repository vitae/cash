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
 * 1. Initialize an upload session
 * 2. Transfer the video file via URL
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

  // Step 2: Transfer video file via URL
  const transferRes = await fetch(
    `${GRAPH_API}/${videoId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_phase: "transfer",
        file_url: publicVideoUrl,
        access_token: accessToken,
        appsecret_proof: proof,
      }),
    }
  );

  if (!transferRes.ok) {
    const err = await transferRes.text();
    throw new Error(`Facebook Reel transfer failed: ${err}`);
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
        access_token: accessToken,
        appsecret_proof: proof,
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
