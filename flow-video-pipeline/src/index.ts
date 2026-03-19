import express from "express";
import healthRouter from "./routes/health";
import webhookRouter from "./routes/webhook";
import authRouter from "./routes/auth";
import quickUploadRouter from "./routes/quick-upload";
import { processQueue } from "./services/queue";
import { sweepStaleProcessing, retryQueuedSubmissions } from "./services/sweep";
import { discoverMusic } from "./services/music-discovery";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);
app.use(webhookRouter);
app.use(authRouter);
app.use(quickUploadRouter);

const PORT = parseInt(process.env.PORT || "3000", 10);

// Music discovery endpoint (can be called manually or by cron)
app.post("/discover-music", async (req, res) => {
  const secret = req.headers["x-webhook-secret"];
  if (secret !== process.env.WEBHOOK_SECRET) {
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

app.listen(PORT, () => {
  console.log(`Video pipeline listening on port ${PORT}`);

  // Sweep stale + retry queued on startup
  sweepStaleProcessing().then(() => retryQueuedSubmissions()).then(() => processQueue());

  // Discover music on startup (stock the library)
  discoverMusic(15).catch(err => console.error("Startup music discovery failed:", err));

  // Sweep stale every 5 minutes
  setInterval(() => {
    sweepStaleProcessing().then(() => processQueue());
  }, 5 * 60 * 1000);

  // Retry queued submissions every 4 hours (YouTube quota resets daily at midnight PT)
  setInterval(() => {
    console.log("Checking for queued submissions to retry...");
    retryQueuedSubmissions().then(() => processQueue());
  }, 4 * 60 * 60 * 1000);

  // Discover new music every 6 hours to keep library stocked
  setInterval(() => {
    console.log("🎵 Running scheduled music discovery...");
    discoverMusic(10).catch(err => console.error("Scheduled music discovery failed:", err));
  }, 6 * 60 * 60 * 1000);
});
