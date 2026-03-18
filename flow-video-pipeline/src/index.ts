import express from "express";
import healthRouter from "./routes/health";
import webhookRouter from "./routes/webhook";
import authRouter from "./routes/auth";
import quickUploadRouter from "./routes/quick-upload";
import { processQueue } from "./services/queue";
import { sweepStaleProcessing, retryQueuedSubmissions } from "./services/sweep";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);
app.use(webhookRouter);
app.use(authRouter);
app.use(quickUploadRouter);

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, () => {
  console.log(`Video pipeline listening on port ${PORT}`);

  // Sweep stale + retry queued on startup
  sweepStaleProcessing().then(() => retryQueuedSubmissions()).then(() => processQueue());

  // Sweep stale every 5 minutes
  setInterval(() => {
    sweepStaleProcessing().then(() => processQueue());
  }, 5 * 60 * 1000);

  // Retry queued submissions every 4 hours (YouTube quota resets daily at midnight PT)
  setInterval(() => {
    console.log("Checking for queued submissions to retry...");
    retryQueuedSubmissions().then(() => processQueue());
  }, 4 * 60 * 60 * 1000);
});
