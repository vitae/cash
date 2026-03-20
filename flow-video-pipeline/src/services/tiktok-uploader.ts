import { supabase } from "../lib/supabase";

const TIKTOK_API = "https://open.tiktokapis.com/v2";
const FETCH_TIMEOUT_MS = 30_000;
const UPLOAD_TIMEOUT_MS = 300_000; // 5 min for large file uploads

export interface TikTokUploadResult {
  publishId: string;
  url: string;
}

function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

/**
 * Get a valid TikTok access token, refreshing if needed.
 */
async function getAccessToken(): Promise<string> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing TIKTOK_ACCESS_TOKEN");
  }
  return accessToken;
}

/**
 * Refresh the TikTok access token using the refresh token.
 * Throws on failure instead of returning null silently.
 */
async function refreshAccessToken(): Promise<string> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;

  if (!clientKey || !clientSecret || !refreshToken) {
    throw new Error("Cannot refresh TikTok token — missing TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, or TIKTOK_REFRESH_TOKEN");
  }

  console.log("  Refreshing TikTok access token...");

  const res = await fetchWithTimeout("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`TikTok token refresh HTTP error: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(`TikTok token refresh failed: ${data.error} — ${data.error_description}`);
  }

  // Update env for this process lifetime
  process.env.TIKTOK_ACCESS_TOKEN = data.access_token;
  if (data.refresh_token) {
    process.env.TIKTOK_REFRESH_TOKEN = data.refresh_token;
  }

  console.log("  TikTok token refreshed successfully");
  return data.access_token;
}

/**
 * Upload a video to TikTok via the Content Posting API.
 *
 * Flow:
 * 1. Initialize upload via POST /post/publish/video/init/
 * 2. Upload binary video data to TikTok's upload URL
 * 3. Poll publish status until complete
 */
export async function uploadToTikTok(
  publicVideoUrl: string,
  caption: string
): Promise<TikTokUploadResult> {
  let accessToken = await getAccessToken();

  // Download the video first (TikTok needs file size upfront)
  // Stream into an ArrayBuffer instead of using .arrayBuffer() to enable timeout
  const videoResponse = await fetchWithTimeout(publicVideoUrl, undefined, UPLOAD_TIMEOUT_MS);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video for TikTok: ${videoResponse.status}`);
  }
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  const initBody = JSON.stringify({
    post_info: {
      title: caption.slice(0, 150),
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoBuffer.length,
      chunk_size: videoBuffer.length,
      total_chunk_count: 1,
    },
  });

  // Step 1: Initialize upload
  let initRes = await fetchWithTimeout(
    `${TIKTOK_API}/post/publish/video/init/`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: initBody,
    }
  );

  // If auth fails, refresh the token and retry
  if (initRes.status === 401) {
    accessToken = await refreshAccessToken();
    initRes = await fetchWithTimeout(
      `${TIKTOK_API}/post/publish/video/init/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: initBody,
      }
    );
  }

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`TikTok init failed (${initRes.status}): ${err}`);
  }

  const initData = (await initRes.json()) as {
    data?: { publish_id: string; upload_url: string };
    error?: { code: string; message: string };
  };

  if (initData.error?.code && initData.error.code !== "ok") {
    throw new Error(`TikTok init error: ${initData.error.message}`);
  }

  const publishId = initData.data?.publish_id;
  const uploadUrl = initData.data?.upload_url;

  if (!publishId || !uploadUrl) {
    throw new Error("TikTok init missing publish_id or upload_url");
  }

  // Step 2: Upload binary video data
  const uploadRes = await fetchWithTimeout(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.length),
      "Content-Range": `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    body: videoBuffer,
  }, UPLOAD_TIMEOUT_MS);

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`TikTok upload failed (${uploadRes.status}): ${err}`);
  }

  // Step 3: Poll publish status (max 5 minutes, exponential backoff)
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const delay = Math.min(5000 * Math.pow(1.5, i), 30_000);
    await sleep(delay);

    let statusData: { data?: { status: string; publicaly_available_post_id?: string[] } } | null = null;
    try {
      const statusRes = await fetchWithTimeout(
        `${TIKTOK_API}/post/publish/status/fetch/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publish_id: publishId }),
        }
      );

      if (!statusRes.ok) {
        console.error(`  TikTok poll ${i + 1}/${maxAttempts} returned ${statusRes.status}, retrying...`);
        continue;
      }

      statusData = (await statusRes.json()) as typeof statusData;
    } catch (err) {
      console.error(`  TikTok poll ${i + 1}/${maxAttempts} failed:`, err instanceof Error ? err.message : err);
      continue;
    }

    const status = statusData?.data?.status;

    if (status === "PUBLISH_COMPLETE") {
      const postId = statusData?.data?.publicaly_available_post_id?.[0] || publishId;
      return {
        publishId,
        url: `https://www.tiktok.com/@glowwitdaflow/video/${postId}`,
      };
    }

    if (status === "FAILED") {
      throw new Error("TikTok publish failed during processing");
    }
  }

  throw new Error("TikTok publish timed out after 5 minutes");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
