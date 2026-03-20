import { appsecretProof } from "./meta-auth";

const GRAPH_API = "https://graph.facebook.com/v21.0";
const FETCH_TIMEOUT_MS = 30_000;
const UPLOAD_TIMEOUT_MS = 300_000; // 5 min for large file uploads

export interface FacebookUploadResult {
  videoId: string;
  url: string;
}

function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.status >= 500 && attempt < retries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error("fetchWithRetry: unreachable");
}

/**
 * Upload a Reel to a Facebook Page via the Graph API.
 *
 * Flow:
 * 1. Initialize an upload session -> get video_id
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
  const uploadRes = await fetchWithRetry(
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
    throw new Error(`Facebook Reel init failed (${uploadRes.status}): ${err}`);
  }

  const { video_id: videoId } = (await uploadRes.json()) as { video_id: string };

  // Step 2: Download the video and upload binary data to Facebook's rupload endpoint
  const videoResponse = await fetchWithTimeout(publicVideoUrl, undefined, UPLOAD_TIMEOUT_MS);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video for Facebook upload: ${videoResponse.status}`);
  }
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  const transferRes = await fetchWithTimeout(
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
    },
    UPLOAD_TIMEOUT_MS
  );

  if (!transferRes.ok) {
    const err = await transferRes.text();
    throw new Error(`Facebook Reel binary upload failed (${transferRes.status}): ${err}`);
  }

  // Step 3: Finish and publish
  const finishRes = await fetchWithRetry(
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
    throw new Error(`Facebook Reel publish failed (${finishRes.status}): ${err}`);
  }

  return {
    videoId,
    url: `https://www.facebook.com/reel/${videoId}`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
