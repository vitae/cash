import { appsecretProof } from "./meta-auth";

const GRAPH_API = "https://graph.threads.net/v1.0";
const FETCH_TIMEOUT_MS = 30_000;

export interface ThreadsUploadResult {
  mediaId: string;
  permalink: string;
}

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
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
  const createRes = await fetchWithRetry(
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
    throw new Error(`Threads create container failed (${createRes.status}): ${err}`);
  }

  const { id: containerId } = (await createRes.json()) as { id: string };

  // Step 2: Poll until ready (max 5 minutes, exponential backoff)
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const delay = Math.min(5000 * Math.pow(1.5, i), 30_000);
    await sleep(delay);

    let statusData: { status?: string } | null = null;
    try {
      const statusRes = await fetchWithTimeout(
        `${GRAPH_API}/${containerId}?fields=status&access_token=${accessToken}&appsecret_proof=${proof}`
      );
      if (!statusRes.ok) {
        console.error(`  Threads poll ${i + 1}/${maxAttempts} returned ${statusRes.status}, retrying...`);
        continue;
      }
      statusData = (await statusRes.json()) as { status?: string };
    } catch (err) {
      console.error(`  Threads poll ${i + 1}/${maxAttempts} failed:`, err instanceof Error ? err.message : err);
      continue;
    }

    if (statusData?.status === "FINISHED") break;
    if (statusData?.status === "ERROR") {
      throw new Error("Threads media processing failed");
    }
    if (i === maxAttempts - 1) {
      throw new Error("Threads media processing timed out after 5 minutes");
    }
  }

  // Step 3: Publish
  const publishRes = await fetchWithRetry(
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
    throw new Error(`Threads publish failed (${publishRes.status}): ${err}`);
  }

  const { id: mediaId } = (await publishRes.json()) as { id: string };

  // Get permalink
  let permalink = `https://www.threads.net/@glowwitdaflow`;
  try {
    const mediaRes = await fetchWithTimeout(
      `${GRAPH_API}/${mediaId}?fields=permalink&access_token=${accessToken}&appsecret_proof=${proof}`
    );
    if (mediaRes.ok) {
      const mediaData = (await mediaRes.json()) as { permalink?: string };
      if (mediaData.permalink) permalink = mediaData.permalink;
    }
  } catch {
    // Non-critical — use fallback permalink
  }

  return { mediaId, permalink };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
