const TIKTOK_API = "https://open.tiktokapis.com/v2";

export interface TikTokUploadResult {
  publishId: string;
  url: string;
}

/**
 * Upload a video to TikTok via the Content Posting API.
 *
 * Flow:
 * 1. Initialize upload via POST /post/publish/video/init/
 * 2. Upload binary video data to TikTok's upload URL
 * 3. Poll publish status until complete
 *
 * Requires:
 * - TIKTOK_ACCESS_TOKEN (from OAuth2 with video.publish scope)
 */
export async function uploadToTikTok(
  publicVideoUrl: string,
  caption: string
): Promise<TikTokUploadResult> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Missing TIKTOK_ACCESS_TOKEN");
  }

  // Download the video first (TikTok needs file size upfront)
  const videoResponse = await fetch(publicVideoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video for TikTok: ${videoResponse.status}`);
  }
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  // Step 1: Initialize upload
  const initRes = await fetch(
    `${TIKTOK_API}/post/publish/video/init/`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
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
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`TikTok init failed: ${err}`);
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
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.length),
      "Content-Range": `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`TikTok upload failed: ${err}`);
  }

  // Step 3: Poll publish status (max 5 minutes)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(10_000);

    const statusRes = await fetch(
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

    if (!statusRes.ok) continue;

    const statusData = (await statusRes.json()) as {
      data?: { status: string; publicaly_available_post_id?: string[] };
    };

    const status = statusData.data?.status;

    if (status === "PUBLISH_COMPLETE") {
      const postId = statusData.data?.publicaly_available_post_id?.[0] || publishId;
      return {
        publishId,
        url: `https://www.tiktok.com/@glowwitdaflow/video/${postId}`,
      };
    }

    if (status === "FAILED") {
      throw new Error("TikTok publish failed during processing");
    }

    // PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, SENDING_TO_USER_INBOX — keep waiting
  }

  throw new Error("TikTok publish timed out after 5 minutes");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
