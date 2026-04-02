import crypto from "crypto";
import express from "express";
import healthRouter from "./routes/health";
import webhookRouter from "./routes/webhook";
import authRouter from "./routes/auth";
import quickUploadRouter from "./routes/quick-upload";
import instagramWebhookRouter from "./routes/instagram-webhook";
import { processQueue } from "./services/queue";
import { sweepStaleProcessing, retryQueuedSubmissions } from "./services/sweep";
import { discoverMusic, purgeAllMusic } from "./services/music-discovery";
import { startScheduler, publishScheduledBatch } from "./services/scheduler";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);
app.use(webhookRouter);
app.use(authRouter);
app.use(quickUploadRouter);
app.use(instagramWebhookRouter);

const PORT = parseInt(process.env.PORT || "3000", 10);

// Timing-safe secret comparison to prevent timing attacks
function safeCompare(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Music discovery endpoint (can be called manually or by cron)
app.post("/discover-music", async (req, res) => {
  const secret = req.headers["x-webhook-secret"] as string | undefined;
  if (!safeCompare(secret, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const count = parseInt(req.body?.count || "15", 10);
    const result = await discoverMusic(count);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Music discovery error:", err);
    res.status(500).json({ error: "Discovery failed" });
  }
});

// Purge all music and repopulate with fresh dubstep/bass EDM
app.post("/purge-music", async (req, res) => {
  const secret = req.headers["x-webhook-secret"] as string | undefined;
  if (!safeCompare(secret, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const purgeResult = await purgeAllMusic();
    const discoverResult = await discoverMusic(50);
    res.json({
      success: true,
      message: `Purged ${purgeResult.deleted} old tracks, added ${discoverResult.added} fresh dubstep/bass tracks`,
      purged: purgeResult.deleted,
      added: discoverResult.added,
    });
  } catch (err) {
    console.error("Purge-music error:", err);
    res.status(500).json({ error: "Purge failed" });
  }
});

// Manual sweep trigger — resets stale jobs, enqueues pending, runs process queue
app.post("/sweep", async (req, res) => {
  const secret = req.headers["x-webhook-secret"] as string | undefined;
  if (!safeCompare(secret, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await sweepStaleProcessing();
    await processQueue();
    await retryQueuedSubmissions();
    res.json({ success: true, message: "Sweep completed: stale reset, pending enqueued, queue processed, retries scheduled" });
  } catch (err) {
    console.error("Manual sweep error:", err);
    res.status(500).json({ error: "Sweep failed" });
  }
});

// Manual publish trigger (for testing or forcing a publish cycle)
app.post("/publish-now", async (req, res) => {
  const secret = req.headers["x-webhook-secret"] as string | undefined;
  if (!safeCompare(secret, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await publishScheduledBatch();
    res.json({ success: true, message: "Publish cycle triggered" });
  } catch (err) {
    console.error("Manual publish error:", err);
    res.status(500).json({ error: "Publish failed" });
  }
});

// Global unhandled rejection handler
process.on("unhandledRejection", (err) => {
  console.error("\u26a0\ufe0f Unhandled rejection:", err);
});

// Safe async wrapper for interval callbacks
function safeInterval(fn: () => Promise<void>, ms: number, label: string) {
  setInterval(() => {
    fn().catch(err => console.error(`\u26a0\ufe0f ${label} failed:`, err));
  }, ms);
}

app.listen(PORT, () => {
  console.log(`Video pipeline listening on port ${PORT}`);

  // Sweep stale on startup + process any pending
  sweepStaleProcessing()
    .then(() => processQueue())
    .catch(err => console.error("\u26a0\ufe0f Startup sweep failed:", err));

  // Discover music on startup (stock the library with 30 tracks)
  discoverMusic(30).catch(err => console.error("\u26a0\ufe0f Startup music discovery failed:", err));

  // Start the scheduled publisher (2 videos every 3 hours)
  startScheduler();

  // Sweep stale every 5 minutes — reset stuck processing jobs, pick up pending, run process queue
  safeInterval(
    () => sweepStaleProcessing().then(() => processQueue()),
    5 * 60 * 1000,
    "Sweep/process"
  );

  // Retry queued/partial submissions every 30 minutes
  safeInterval(
    () => retryQueuedSubmissions(),
    30 * 60 * 1000,
    "Retry queued/partial"
  );

  // Discover 10 new music tracks every hour to keep library stocked
  safeInterval(
    async () => {
      console.log("\ud83c\udfb5 Running scheduled music discovery...");
      await discoverMusic(10);
    },
    60 * 60 * 1000,
    "Music discovery"
  );
});
