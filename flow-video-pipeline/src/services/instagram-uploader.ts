const GRAPH_API = "https://graph.facebook.com/v21.0";

export interface InstagramUploadResult {
  mediaId: string;
  permalink: string;
}

/**
 * Upload a Reel to Instagram via the Instagram Graph API.
 *
 * Flow:
 * 1. Create a media container with video URL (must be publicly accessible)
 * 2. Poll until the container is ready
 * 3. Publish the container
 */
export async function uploadToInstagram(
  publicVideoUrl: string,
  caption: string
): Promise<InstagramUploadResult> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error("Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID");
  }

  // Step 1: Create media container
  const createRes = await fetch(
    `${GRAPH_API}/${accountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: publicVideoUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Instagram create container failed: ${err}`);
  }

  const { id: containerId } = (await createRes.json()) as { id: string };

  // Step 2: Poll until ready (max 5 minutes)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(10_000);

    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = (await statusRes.json()) as { status_code: string };

    if (statusData.status_code === "FINISHED") break;
    if (statusData.status_code === "ERROR") {
      throw new Error("Instagram media processing failed");
    }
    if (i === maxAttempts - 1) {
      throw new Error("Instagram media processing timed out after 5 minutes");
    }
  }

  // Step 3: Publish
  const publishRes = await fetch(
    `${GRAPH_API}/${accountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish failed: ${err}`);
  }

  const { id: mediaId } = (await publishRes.json()) as { id: string };

  // Get permalink
  const mediaRes = await fetch(
    `${GRAPH_API}/${mediaId}?fields=permalink&access_token=${accessToken}`
  );
  const mediaData = (await mediaRes.json()) as { permalink?: string };

  return {
    mediaId,
    permalink: mediaData.permalink ?? `https://www.instagram.com/reel/`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
