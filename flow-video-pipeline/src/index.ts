import express from "express";
import healthRouter from "./routes/health";
import webhookRouter from "./routes/webhook";
import authRouter from "./routes/auth";
import { processQueue } from "./services/queue";
import { sweepStaleProcessing } from "./services/sweep";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(healthRouter);
app.use(webhookRouter);
app.use(authRouter);

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, () => {
  console.log(`Video pipeline listening on port ${PORT}`);
  sweepStaleProcessing().then(() => {
    processQueue();
  });
});
