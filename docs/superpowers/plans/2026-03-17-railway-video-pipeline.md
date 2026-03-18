# Railway Video Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Railway-deployed Express worker that auto-posts artist-submitted flow reels to YouTube Shorts, triggered by Supabase database webhooks.

**Architecture:** Standalone Node.js Express service with FFmpeg. Supabase webhook fires on `reel_submissions` INSERT → Railway worker downloads video → transcodes → uploads to YouTube Shorts via Data API v3 → updates submission status. Sequential in-memory queue for concurrency control.

**Tech Stack:** Node.js 20, Express, TypeScript, FFmpeg, googleapis (YouTube Data API v3), @supabase/supabase-js, zod, Docker

**Spec:** `docs/superpowers/specs/2026-03-17-railway-video-pipeline-design.md`

---

## Chunk 1: Database Migrations + Frontend Changes (Existing App)

### Task 1: Run Database Migrations

**Files:**
- Reference: `docs/superpowers/specs/2026-03-17-railway-video-pipeline-design.md:181-201`

- [ ] **Step 1: Run migration on Supabase**

Execute via Supabase MCP `apply_migration` tool (project ID: `vemidcrbwhuyrrcuirbd`):

```sql
ALTER TABLE reel_submissions ADD COLUMN description text;
ALTER TABLE reel_submissions ADD COLUMN youtube_url text;
ALTER TABLE reel_submissions ADD COLUMN error_message text;
ALTER TABLE reel_submissions ADD COLUMN retry_count integer DEFAULT 0;

CREATE TABLE youtube_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE youtube_tokens ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Verify migration**

Run via Supabase MCP `execute_sql`:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'reel_submissions'
ORDER BY ordinal_position;
```

Expected: `description`, `youtube_url`, `error_message`, `retry_count` columns present.

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'youtube_tokens';
```

Expected: `id`, `access_token`, `refresh_token`, `expires_at`, `created_at`, `updated_at`.

---

### Task 2: Add Description Field to Upload API Route

**Files:**
- Modify: `src/app/api/upload-reel/route.ts:17-79`

- [ ] **Step 1: Add description extraction from FormData**

In `src/app/api/upload-reel/route.ts`, after line 20 (`const email = ...`), add:

```typescript
const description = formData.get("description") as string | null;
```

- [ ] **Step 2: Include description in DB insert**

In the `.insert()` call (line 72-79), add `description`:

```typescript
const { error: dbError } = await supabaseAdmin
  .from("reel_submissions")
  .insert({
    artist_name: artistName.trim(),
    email: email.trim().toLowerCase(),
    video_url: urlData.publicUrl,
    status: "pending",
    description: description?.trim() || null,
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload-reel/route.ts
git commit -m "feat: add description field to upload-reel API route"
```

---

### Task 3: Add Description Field to Submit-Reel API Route

**Files:**
- Modify: `src/app/api/submit-reel/route.ts:8-49`

- [ ] **Step 1: Extract description from JSON body**

In `src/app/api/submit-reel/route.ts`, line 9, add `description` to destructuring:

```typescript
const { artistName, email, videoUrl, description } = body;
```

- [ ] **Step 2: Include description in DB insert**

In the `.insert()` call (line 42-49), add `description`:

```typescript
const { data, error } = await supabaseAdmin
  .from("reel_submissions")
  .insert({
    artist_name: artistName.trim(),
    email: email.trim().toLowerCase(),
    video_url: videoUrl.trim(),
    status: "pending",
    description: typeof description === "string" ? description.trim() || null : null,
  })
  .select("id")
  .single();
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/submit-reel/route.ts
git commit -m "feat: add description field to submit-reel API route"
```

---

### Task 4: Add Description Textarea to UploadZone Component

**Files:**
- Modify: `src/app/page.tsx:848-1038` (UploadZone component)

- [ ] **Step 1: Add description state**

After line 853 (`const [email, setEmail] = useState("");`), add:

```typescript
const [description, setDescription] = useState("");
```

- [ ] **Step 2: Append description to FormData**

In `handleSubmit` (line 891-894), after `fd.append("email", ...)`, add:

```typescript
fd.append("file", file);
fd.append("artistName", instagram.trim());
fd.append("email", email.trim());
if (description.trim()) fd.append("description", description.trim());
```

- [ ] **Step 3: Reset description on success**

In the success branch (line 899-901), add `setDescription("")`:

```typescript
setFile(null);
setInstagram("");
setEmail("");
setDescription("");
```

- [ ] **Step 4: Add textarea between email input and submit button**

After the email `<input>` (line 1013-1018) and before the submit `<button>` (line 1019), insert:

```tsx
<textarea
  placeholder="Caption / Description (optional — used for YouTube Shorts)"
  value={description}
  onChange={e => setDescription(e.target.value)}
  rows={3}
  style={{
    ...inputStyle,
    resize: "vertical" as const,
    minHeight: 60,
  }}
  onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.5)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,255,0,0.15)"; }}
  onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
/>
```

- [ ] **Step 5: Test manually in browser**

Run: `npm run dev`
Navigate to the upload zone, verify textarea appears, submit a test upload with a description.
Check Supabase `reel_submissions` table to verify description is saved.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add description textarea to reel upload form"
```

---

## Chunk 2: Railway Pipeline — Project Scaffold + Supabase Client + Types

### Task 5: Scaffold the Railway Project

**Files:**
- Create: `flow-video-pipeline/package.json`
- Create: `flow-video-pipeline/tsconfig.json`
- Create: `flow-video-pipeline/.env.example`
- Create: `flow-video-pipeline/Dockerfile`
- Create: `flow-video-pipeline/.gitignore`

- [ ] **Step 1: Create project directory and package.json**

```bash
mkdir -p flow-video-pipeline/src/{routes,services,lib}
```

Create `flow-video-pipeline/package.json`:

```json
{
  "name": "flow-video-pipeline",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.99.2",
    "express": "^5.1.0",
    "googleapis": "^148.0.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@types/express": "^5.0.3",
    "@types/node": "^25.5.0",
    "tsx": "^4.20.3",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `flow-video-pipeline/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .env.example**

Create `flow-video-pipeline/.env.example`:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
WEBHOOK_SECRET=
RAILWAY_PUBLIC_DOMAIN=
PORT=3000
```

- [ ] **Step 4: Create Dockerfile**

Create `flow-video-pipeline/Dockerfile`:

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 5: Create .gitignore**

Create `flow-video-pipeline/.gitignore`:

```
node_modules/
dist/
.env
```

- [ ] **Step 6: Install dependencies**

```bash
cd flow-video-pipeline && npm install
```

- [ ] **Step 7: Commit**

```bash
git add flow-video-pipeline/
git commit -m "feat: scaffold Railway video pipeline project"
```

---

### Task 6: Create Types and Supabase Client

**Files:**
- Create: `flow-video-pipeline/src/types.ts`
- Create: `flow-video-pipeline/src/lib/supabase.ts`

- [ ] **Step 1: Create types.ts**

Create `flow-video-pipeline/src/types.ts`:

```typescript
import { z } from "zod";

export interface ReelSubmission {
  id: string;
  artist_name: string;
  email: string;
  video_url: string;
  description: string | null;
  status: "pending" | "processing" | "posted" | "failed";
  youtube_url: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

export interface YouTubeTokens {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Supabase webhook payload for INSERT events
export const webhookPayloadSchema = z.object({
  type: z.literal("INSERT"),
  table: z.literal("reel_submissions"),
  schema: z.string(),
  record: z.object({
    id: z.string().uuid(),
    artist_name: z.string(),
    email: z.string(),
    video_url: z.string().url(),
    description: z.string().nullable(),
    status: z.string(),
  }),
  old_record: z.null(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
```

- [ ] **Step 2: Create Supabase client**

Create `flow-video-pipeline/src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd flow-video-pipeline && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add flow-video-pipeline/src/types.ts flow-video-pipeline/src/lib/supabase.ts
git commit -m "feat: add types, zod schemas, and Supabase client for pipeline"
```

---

## Chunk 3: Railway Pipeline — Express App + Routes

### Task 7: Create Health Route and Express App Entry Point

**Files:**
- Create: `flow-video-pipeline/src/routes/health.ts`
- Create: `flow-video-pipeline/src/index.ts`

- [ ] **Step 1: Create health route**

Create `flow-video-pipeline/src/routes/health.ts`:

```typescript
import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
```

- [ ] **Step 2: Create Express app entry point**

Create `flow-video-pipeline/src/index.ts`:

```typescript
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
```

Note: `webhookRouter`, `authRouter`, `processQueue`, and `sweepStaleProcessing` will be created in subsequent tasks. The app won't compile until those are created — that's expected.

- [ ] **Step 3: Commit**

```bash
git add flow-video-pipeline/src/routes/health.ts flow-video-pipeline/src/index.ts
git commit -m "feat: add Express app entry point and health route"
```

---

### Task 8: Create Webhook Route + In-Memory Queue

**Files:**
- Create: `flow-video-pipeline/src/routes/webhook.ts`
- Create: `flow-video-pipeline/src/services/queue.ts`
- Create: `flow-video-pipeline/src/services/sweep.ts`

- [ ] **Step 1: Create the queue service**

Create `flow-video-pipeline/src/services/queue.ts`:

```typescript
import { processSubmission } from "./pipeline";

const queue: string[] = [];
let processing = false;

export function enqueue(submissionId: string): void {
  if (!queue.includes(submissionId)) {
    queue.push(submissionId);
    console.log(`Enqueued submission ${submissionId}. Queue length: ${queue.length}`);
  }
}

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const id = queue.shift()!;
    console.log(`Processing submission ${id}...`);
    try {
      await processSubmission(id);
      console.log(`Completed submission ${id}`);
    } catch (err) {
      console.error(`Failed processing submission ${id}:`, err);
    }
  }

  processing = false;
}
```

- [ ] **Step 2: Create the sweep service**

Create `flow-video-pipeline/src/services/sweep.ts`:

```typescript
import { supabase } from "../lib/supabase";
import { enqueue } from "./queue";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export async function sweepStaleProcessing(): Promise<void> {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  const { data, error } = await supabase
    .from("reel_submissions")
    .update({ status: "pending" })
    .eq("status", "processing")
    .lt("created_at", threshold)
    .select("id");

  if (error) {
    console.error("Sweep error:", error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Swept ${data.length} stale processing submissions back to pending`);
    for (const row of data) {
      enqueue(row.id);
    }
  }
}
```

- [ ] **Step 3: Create webhook route**

Create `flow-video-pipeline/src/routes/webhook.ts`:

```typescript
import { Router, Request, Response } from "express";
import { webhookPayloadSchema } from "../types";
import { enqueue, processQueue } from "../services/queue";

const router = Router();

router.post("/webhook", (req: Request, res: Response) => {
  // Validate webhook secret
  const secret = req.headers["x-webhook-secret"];
  if (secret !== process.env.WEBHOOK_SECRET) {
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

  // Validate admin secret (reuse webhook secret for simplicity)
  const secret = req.headers["x-webhook-secret"];
  if (secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { supabase } = await import("../lib/supabase");

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
```

- [ ] **Step 4: Commit**

```bash
git add flow-video-pipeline/src/routes/webhook.ts flow-video-pipeline/src/services/queue.ts flow-video-pipeline/src/services/sweep.ts
git commit -m "feat: add webhook route, in-memory queue, and stale sweep"
```

---

### Task 9: Create OAuth Auth Route

**Files:**
- Create: `flow-video-pipeline/src/routes/auth.ts`

- [ ] **Step 1: Create auth route**

Create `flow-video-pipeline/src/routes/auth.ts`:

```typescript
import { Router, Request, Response } from "express";
import { google } from "googleapis";
import { supabase } from "../lib/supabase";

const router = Router();

function getOAuth2Client() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  const redirectUri = domain
    ? `https://${domain}/auth/youtube/callback`
    : `http://localhost:${process.env.PORT || 3000}/auth/youtube/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// Step 1: Redirect to Google consent screen
router.get("/auth/youtube", (_req: Request, res: Response) => {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
router.get("/auth/youtube/callback", async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.status(400).send("Missing authorization code");
    return;
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token || !tokens.access_token) {
      res.status(400).send("Failed to get tokens. Try revoking access at myaccount.google.com/permissions and retry.");
      return;
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    // Upsert — delete any existing row, insert new one
    await supabase.from("youtube_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("youtube_tokens").insert({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Failed to save tokens:", error.message);
      res.status(500).send("Failed to save tokens: " + error.message);
      return;
    }

    res.send("YouTube OAuth complete! Tokens saved. You can close this tab.");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth error: " + (err instanceof Error ? err.message : "Unknown error"));
  }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add flow-video-pipeline/src/routes/auth.ts
git commit -m "feat: add YouTube OAuth auth routes"
```

---

## Chunk 4: Railway Pipeline — Core Services (Video Processor, Token Manager, YouTube Uploader)

### Task 10: Create Token Manager Service

**Files:**
- Create: `flow-video-pipeline/src/services/token-manager.ts`

- [ ] **Step 1: Create token manager**

Create `flow-video-pipeline/src/services/token-manager.ts`:

```typescript
import { google } from "googleapis";
import { supabase } from "../lib/supabase";
import type { YouTubeTokens } from "../types";

export async function getAuthenticatedClient() {
  // Fetch tokens from DB
  const { data, error } = await supabase
    .from("youtube_tokens")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No YouTube tokens found. Visit /auth/youtube to authenticate.");
  }

  const tokens = data as YouTubeTokens;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.expires_at).getTime(),
  });

  // Check if token needs refresh (within 5 minutes of expiry)
  const expiresAt = new Date(tokens.expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() >= expiresAt - fiveMinutes) {
    console.log("Access token expired or expiring soon, refreshing...");
    const { credentials } = await oauth2Client.refreshAccessToken();

    const newExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    await supabase
      .from("youtube_tokens")
      .update({
        access_token: credentials.access_token!,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tokens.id);

    console.log("Token refreshed successfully");
  }

  return oauth2Client;
}
```

- [ ] **Step 2: Commit**

```bash
git add flow-video-pipeline/src/services/token-manager.ts
git commit -m "feat: add YouTube OAuth token manager with auto-refresh"
```

---

### Task 11: Create Video Processor Service

**Files:**
- Create: `flow-video-pipeline/src/services/video-processor.ts`

- [ ] **Step 1: Create video processor**

Create `flow-video-pipeline/src/services/video-processor.ts`:

```typescript
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import https from "https";
import http from "http";

const execFileAsync = promisify(execFile);

interface ProbeResult {
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
}

export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const proto = url.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadVideo(redirectUrl, outputPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const fileStream = fsSync.createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on("finish", () => { fileStream.close(); resolve(); });
      fileStream.on("error", reject);
    }).on("error", reject);
  });
}

export async function probeVideo(filePath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_streams",
    "-show_format",
    filePath,
  ]);

  const info = JSON.parse(stdout);
  const videoStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === "video");
  const audioStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === "audio");

  return {
    duration: parseFloat(info.format?.duration || "0"),
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    videoCodec: videoStream?.codec_name || "unknown",
    audioCodec: audioStream?.codec_name || "unknown",
  };
}

export async function transcodeForShorts(
  inputPath: string,
  outputPath: string,
  probe: ProbeResult
): Promise<string> {
  // Check if already compliant (H.264 + AAC + ≤60s)
  const isCompliant =
    probe.videoCodec === "h264" &&
    probe.audioCodec === "aac" &&
    probe.duration <= 60;

  if (isCompliant) {
    console.log("Video already compliant, copying as-is");
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }

  const args: string[] = [
    "-i", inputPath,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
  ];

  // Truncate to 60s if longer
  if (probe.duration > 60) {
    args.push("-t", "60");
    console.log(`Truncating video from ${probe.duration.toFixed(1)}s to 60s`);
  }

  args.push("-y", outputPath);

  console.log("Transcoding video...");
  await execFileAsync("ffmpeg", args, { timeout: 300_000 }); // 5 minute timeout
  console.log("Transcode complete");

  return outputPath;
}

export async function cleanup(...paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      await fs.unlink(p);
    } catch {
      // Ignore cleanup errors
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add flow-video-pipeline/src/services/video-processor.ts
git commit -m "feat: add video processor — download, probe, transcode for Shorts"
```

---

### Task 12: Create YouTube Uploader Service

**Files:**
- Create: `flow-video-pipeline/src/services/youtube-uploader.ts`

- [ ] **Step 1: Create YouTube uploader**

Create `flow-video-pipeline/src/services/youtube-uploader.ts`:

```typescript
import { google } from "googleapis";
import fs from "fs";
import { getAuthenticatedClient } from "./token-manager";

interface UploadOptions {
  filePath: string;
  title: string;
  description: string;
  tags: string[];
}

export async function uploadToYouTube(options: UploadOptions): Promise<string> {
  const auth = await getAuthenticatedClient();
  const youtube = google.youtube({ version: "v3", auth });

  console.log(`Uploading to YouTube: "${options.title}"`);

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: options.title.slice(0, 100),
        description: options.description,
        tags: options.tags,
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(options.filePath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) {
    throw new Error("YouTube upload succeeded but no video ID returned");
  }

  const youtubeUrl = `https://youtube.com/shorts/${videoId}`;
  console.log(`Upload complete: ${youtubeUrl}`);

  return youtubeUrl;
}
```

- [ ] **Step 2: Commit**

```bash
git add flow-video-pipeline/src/services/youtube-uploader.ts
git commit -m "feat: add YouTube Shorts uploader service"
```

---

## Chunk 5: Railway Pipeline — Main Pipeline Orchestrator + Build + Deploy

### Task 13: Create Main Pipeline Orchestrator

**Files:**
- Create: `flow-video-pipeline/src/services/pipeline.ts`

- [ ] **Step 1: Create pipeline service**

Create `flow-video-pipeline/src/services/pipeline.ts`:

```typescript
import path from "path";
import os from "os";
import { supabase } from "../lib/supabase";
import { downloadVideo, probeVideo, transcodeForShorts, cleanup } from "./video-processor";
import { uploadToYouTube } from "./youtube-uploader";
import type { ReelSubmission } from "../types";

const MAX_DURATION_SECONDS = 180; // 3 minutes

export async function processSubmission(submissionId: string): Promise<void> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${submissionId}-input.mp4`);
  const outputPath = path.join(tmpDir, `${submissionId}-processed.mp4`);

  try {
    // Lock: set status to processing (only if still pending)
    const { data: lockData, error: lockError } = await supabase
      .from("reel_submissions")
      .update({ status: "processing" })
      .eq("id", submissionId)
      .eq("status", "pending")
      .select("*")
      .single();

    if (lockError || !lockData) {
      console.log(`Submission ${submissionId} is no longer pending, skipping`);
      return;
    }

    const submission = lockData as ReelSubmission;
    const handle = submission.artist_name;

    // Download
    console.log(`Downloading video from ${submission.video_url}`);
    await downloadVideo(submission.video_url, inputPath);

    // Probe
    const probe = await probeVideo(inputPath);
    console.log(`Video: ${probe.width}x${probe.height}, ${probe.duration.toFixed(1)}s, ${probe.videoCodec}/${probe.audioCodec}`);

    // Duration validation
    if (probe.duration > MAX_DURATION_SECONDS) {
      throw new Error(`Video exceeds 3-minute limit (${probe.duration.toFixed(0)}s)`);
    }

    // Transcode
    const processedPath = await transcodeForShorts(inputPath, outputPath, probe);

    // Build YouTube metadata
    const title = submission.description
      ? submission.description.slice(0, 100)
      : `@${handle} | Flow Arts Professional`;

    const description = [
      submission.description || "",
      "",
      `Featured artist: @${handle}`,
      "Submit your reel: flowarts.pro",
    ].join("\n").trim();

    const tags = ["flow arts", "Shorts", handle];

    // Upload to YouTube
    const youtubeUrl = await uploadToYouTube({
      filePath: processedPath,
      title,
      description,
      tags,
    });

    // Update status to posted
    await supabase
      .from("reel_submissions")
      .update({
        status: "posted",
        youtube_url: youtubeUrl,
        error_message: null,
      })
      .eq("id", submissionId);

    console.log(`Submission ${submissionId} posted: ${youtubeUrl}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Pipeline failed for ${submissionId}:`, errorMessage);

    await supabase
      .from("reel_submissions")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", submissionId);
  } finally {
    await cleanup(inputPath, outputPath);
  }
}
```

- [ ] **Step 2: Verify full project compiles**

```bash
cd flow-video-pipeline && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add flow-video-pipeline/src/services/pipeline.ts
git commit -m "feat: add main pipeline orchestrator — download, transcode, upload, update"
```

---

### Task 14: Build Docker Image and Test Locally

- [ ] **Step 1: Build TypeScript**

```bash
cd flow-video-pipeline && npm run build
```

Expected: `dist/` directory created with compiled JS.

- [ ] **Step 2: Test Docker build**

```bash
cd flow-video-pipeline && docker build -t flow-video-pipeline .
```

Expected: Build succeeds, image created.

- [ ] **Step 3: Verify FFmpeg is available in container**

```bash
docker run --rm flow-video-pipeline ffmpeg -version
```

Expected: FFmpeg version info printed.

- [ ] **Step 4: Commit any build fixes**

```bash
git add -A && git commit -m "fix: resolve any build issues" --allow-empty
```

---

### Task 15: Deploy to Railway

- [ ] **Step 1: Initialize Railway project**

Go to https://railway.app/new and create a new project from the `flow-video-pipeline/` directory.
Or use Railway CLI:

```bash
cd flow-video-pipeline && railway init
```

- [ ] **Step 2: Set environment variables on Railway**

Add all env vars from the `.env.example` plus the actual values (provided separately to user).

- [ ] **Step 3: Deploy**

```bash
cd flow-video-pipeline && railway up
```

- [ ] **Step 4: Note the Railway public domain**

After deploy, Railway assigns a domain (e.g., `flow-video-pipeline-production-xxxx.up.railway.app`). Record this.

- [ ] **Step 5: Update Google Cloud Console**

Add redirect URI: `https://<railway-domain>/auth/youtube/callback`

- [ ] **Step 6: Authenticate YouTube**

Visit: `https://<railway-domain>/auth/youtube`
Complete the Google OAuth consent flow. Verify "YouTube OAuth complete!" message.

- [ ] **Step 7: Configure Supabase Database Webhook**

In Supabase Dashboard → Database → Webhooks → Create:
- Name: `reel-submission-webhook`
- Table: `reel_submissions`
- Events: INSERT
- URL: `https://<railway-domain>/webhook`
- Headers: `x-webhook-secret: <your-webhook-secret>`

- [ ] **Step 8: End-to-end test**

Upload a test video via the flowarts.pro upload form. Check:
1. Supabase `reel_submissions` shows status progressing: `pending` → `processing` → `posted`
2. `youtube_url` is populated
3. Video appears on YouTube Shorts channel

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat: Railway video pipeline — complete YouTube Shorts auto-posting"
```
