import { appsecretProof } from "./meta-auth";

const GRAPH_API = "https://graph.facebook.com/v21.0";

const AUTO_REPLY_MESSAGE = `Hey! Thanks for sharing your flow!

Submit your flow reels here: https://flowarts.pro

We post the best submissions to YouTube, Instagram, Facebook, Threads, FOR FREE!`;

// Track recently replied user IDs to avoid spamming (in-memory, resets on deploy)
const repliedUsers = new Map<string, number>();
const REPLY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Send an auto-reply DM to a user on Instagram.
 */
export async function sendInstagramReply(recipientId: string): Promise<void> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    console.error("  Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID for DM reply");
    return;
  }

  // Check cooldown — don't reply to the same user within 24h
  const lastReply = repliedUsers.get(recipientId);
  if (lastReply && Date.now() - lastReply < REPLY_COOLDOWN_MS) {
    console.log(`  Skipping reply to ${recipientId} — already replied within 24h`);
    return;
  }

  const proof = appsecretProof(accessToken);

  const res = await fetch(
    `${GRAPH_API}/${accountId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: AUTO_REPLY_MESSAGE },
        access_token: accessToken,
        appsecret_proof: proof,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`  Failed to send DM reply to ${recipientId}: ${err}`);
    return;
  }

  repliedUsers.set(recipientId, Date.now());
  console.log(`  Auto-replied to Instagram DM from ${recipientId}`);
}
