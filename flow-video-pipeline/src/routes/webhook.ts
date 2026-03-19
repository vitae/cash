import crypto from "crypto";
import { Router, Request, Response } from "express";
import { webhookPayloadSchema } from "../types";
import { enqueue, processQueue } from "../services/queue";
import { supabase } from "../lib/supabase";

function safeCompare(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const router = Router();

router.post("/webhook", (req: Request, res: Response) => {
  // Validate webhook secret (timing-safe)
  const secret = req.headers["x-webhook-secret"] as string | undefined;
  if (!safeCompare(secret, process.env.WEBHOOK_SECRET)) {
    res.status(401).json({ error: "Invalid webhook secret" });
    return;
  }

  // Validate payload structure
  const parsed = webhookPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Invalid webhook payload:", parsed.error.issues);
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const submissionId = parsed.data.record.id;
  console.log(`Webhook received for submission ${submissionId}`);

  // Enqueue and respond immediately
  enqueue(submissionId);
  res.status(200).json({ accepted: true });

  // Kick off processing (non-blocking)
  processQueue();
});

// Retry endpoint
router.post("/retry/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate admin secret (timing-safe)
  const retrySecret = req.headers["x-webhook-secret"] as string | undefined;
  if (!safeCompare(retrySecret, process.env.WEBHOOK_SECRET)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Fetch current state
  const { data: current } = await supabase
    .from("reel_submissions")
    .select("id, retry_count")
    .eq("id", id)
    .eq("status", "failed")
    .lt("retry_count", 3)
    .single();

  if (!current) {
    res.status(404).json({ error: "Submission not found, not failed, or max retries reached" });
    return;
  }

  const newRetryCount = (current.retry_count || 0) + 1;

  // Atomic update: reset status and increment retry_count in one call
  const { error } = await supabase
    .from("reel_submissions")
    .update({ status: "pending", retry_count: newRetryCount })
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  enqueue(id);
  res.status(200).json({ retrying: true, retry_count: newRetryCount });

  processQueue();
});

export default router;
