import { appsecretProof } from "./meta-auth";

const GRAPH_API = "https://graph.threads.net/v1.0";

export interface ThreadsUploadResult {
  mediaId: string;
  permalink: string;
}

/**
 * Upload a video to Threads via the Threads Publishing API.
 *
 * Flow:
 * 1. Create a media container with video URL
 * 2. Poll until the container is ready
 * 3. Publish the container
 *
 * Uses the same access token as Instagram (Meta Graph API).
 */
export async function uploadToThreads(
  publicVideoUrl: string,
  caption: string
): Promise<ThreadsUploadResult> {
  const accessToken = process.env.THREADS_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;

  if (!accessToken || !userId) {
    throw new Error("Missing THREADS_ACCESS_TOKEN (or INSTAGRAM_ACCESS_TOKEN) or THREADS_USER_ID");
  }

  const proof = appsecretProof(accessToken);

  // Step 1: Create media container
  const createRes = await fetch(
    `${GRAPH_API}/${userId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "VIDEO",
        video_url: publicVideoUrl,
        text: caption,
        access_token: accessToken,
        appsecret_proof: proof,
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Threads create container failed: ${err}`);
  }

  const { id: containerId } = (await createRes.json()) as { id: string };

  // Step 2: Poll until ready (max 5 minutes)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(10_000);

    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status&access_token=${accessToken}&appsecret_proof=${proof}`
    );
    const statusData = (await statusRes.json()) as { status: string };

    if (statusData.status === "FINISHED") break;
    if (statusData.status === "ERROR") {
      throw new Error("Threads media processing failed");
    }
    if (i === maxAttempts - 1) {
      throw new Error("Threads media processing timed out after 5 minutes");
    }
  }

  // Step 3: Publish
  const publishRes = await fetch(
    `${GRAPH_API}/${userId}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
        appsecret_proof: proof,
      }),
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Threads publish failed: ${err}`);
  }

  const { id: mediaId } = (await publishRes.json()) as { id: string };

  // Get permalink
  const mediaRes = await fetch(
    `${GRAPH_API}/${mediaId}?fields=permalink&access_token=${accessToken}&appsecret_proof=${proof}`
  );
  const mediaData = (await mediaRes.json()) as { permalink?: string };

  return {
    mediaId,
    permalink: mediaData.permalink ?? `https://www.threads.net/@glowwitdaflow`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
