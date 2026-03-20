import crypto from "crypto";
import { Router, Request, Response } from "express";
import { sendInstagramReply } from "../services/instagram-dm-replier";

const router = Router();

const APP_SECRET = process.env.META_APP_SECRET || "8411f8ff6a144956773cf10576db89ad";
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "flowarts_verify_2026";

/**
 * GET /instagram-webhook — Meta webhook verification challenge.
 * Meta sends this when you register the webhook URL.
 */
router.get("/instagram-webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Instagram webhook verified");
    res.status(200).send(challenge);
  } else {
    console.error("Instagram webhook verification failed — token mismatch");
    res.status(403).send("Forbidden");
  }
});

/**
 * POST /instagram-webhook — receives Instagram messaging events.
 * Validates X-Hub-Signature-256 header, then processes incoming DMs.
 */
router.post("/instagram-webhook", async (req: Request, res: Response) => {
  // Always respond 200 quickly (Meta retries on timeout)
  res.status(200).send("EVENT_RECEIVED");

  try {
    // Validate signature
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    if (signature) {
      const body = JSON.stringify(req.body);
      const expected = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex");
      if (signature !== expected) {
        console.error("Instagram webhook signature mismatch");
        return;
      }
    }

    const payload = req.body as InstagramWebhookPayload;

    if (payload.object !== "instagram") return;

    for (const entry of payload.entry || []) {
      for (const messaging of entry.messaging || []) {
        // Skip echo messages (our own replies)
        if (messaging.message?.is_echo) continue;

        // Skip if no message text (e.g. reactions, read receipts)
        if (!messaging.message?.text && !messaging.message?.attachments) continue;

        const senderId = messaging.sender?.id;
        if (!senderId) continue;

        console.log(`  Instagram DM received from ${senderId}: "${messaging.message?.text?.slice(0, 50) || "[attachment]"}"`);

        // Send auto-reply
        await sendInstagramReply(senderId);
      }
    }
  } catch (err) {
    console.error("Instagram webhook processing error:", err);
  }
});

interface InstagramWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    time: number;
    messaging?: Array<{
      sender?: { id: string };
      recipient?: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        is_echo?: boolean;
        attachments?: Array<{ type: string; payload: { url: string } }>;
      };
    }>;
  }>;
}

export default router;
