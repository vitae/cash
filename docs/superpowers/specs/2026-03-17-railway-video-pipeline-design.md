# Railway Video Pipeline — Design Spec

**Date:** 2026-03-17
**Project:** Flow Arts Professional — Video Pipeline
**Status:** Approved

---

## Overview

A standalone Node.js Express service deployed to Railway via Docker that automatically uploads artist-submitted flow arts reels to YouTube Shorts. Triggered by Supabase database webhooks on new `reel_submissions` inserts.

**Phase 1 scope:** YouTube Shorts only. Instagram/Facebook Reels deferred until Meta app approval.

---

## Architecture

```
Artist uploads video
    → Supabase Storage (reels bucket) + reel_submissions (status=pending)
    → Supabase Database Webhook fires on INSERT
    → Railway worker POST /webhook receives payload
    → Download video from Supabase Storage public URL
    → FFmpeg transcode to YouTube Shorts spec
    → YouTube Data API v3 upload
    → Update reel_submissions: status=posted, youtube_url=<link>
```

**Key decisions:**
- Monolith Express worker (not microservices) — right-sized for one platform
- Supabase webhook trigger (not polling) — near-instant, no idle compute cost
- OAuth callback lives on Railway (not flowarts.pro) — keeps Next.js app focused
- Single YouTube business channel — all reels post to one Flow Arts Professional channel
- Multiple uploads per artist — no submission limits

---

## Railway Service

### Project Structure

```
flow-video-pipeline/
├── Dockerfile
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Express app setup, route registration
│   ├── routes/
│   │   ├── webhook.ts        # POST /webhook — Supabase webhook handler
│   │   ├── auth.ts           # GET /auth/youtube, GET /auth/youtube/callback
│   │   └── health.ts         # GET /health
│   ├── services/
│   │   ├── video-processor.ts  # Download, probe, transcode via FFmpeg
│   │   ├── youtube-uploader.ts # YouTube Data API v3 upload
│   │   └── token-manager.ts    # OAuth token storage and refresh
│   ├── lib/
│   │   └── supabase.ts        # Supabase client (service role)
│   └── types.ts               # Shared TypeScript interfaces
└── .env.example
```

### Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/webhook` | POST | Receives Supabase webhook on `reel_submissions` INSERT. Validates webhook secret, kicks off processing. |
| `/auth/youtube` | GET | Redirects to Google OAuth consent screen (one-time setup). |
| `/auth/youtube/callback` | GET | Receives OAuth code, exchanges for tokens, saves to `youtube_tokens` table. |
| `/retry/:id` | POST | Resets a `failed` submission to `pending` (if `retry_count < 3`), re-enqueues for processing. |
| `/health` | GET | Health check for Railway. Returns 200. |

### Processing Pipeline

Triggered by webhook, processes asynchronously (responds 200 to webhook immediately, processes in background):

1. **Validate** — verify `x-webhook-secret` header matches `WEBHOOK_SECRET` env var. Extract `record.id` from webhook payload.
2. **Lock** — update `reel_submissions` set `status=processing` where `id=record.id` and `status=pending`. If no rows updated, abort (already processing or processed).
3. **Download** — fetch video from `record.video_url` (Supabase Storage public URL) to `/tmp/{id}.{ext}`.
4. **Probe** — `ffprobe` to get duration, resolution, codec, rotation metadata.
5. **Transcode** — convert to YouTube Shorts spec if needed:
   - Codec: H.264 video, AAC audio
   - Preserve vertical aspect ratio (9:16 preferred)
   - Max 60 seconds (truncate longer videos)
   - Reasonable bitrate for quality/size balance (~8Mbps for 1080p)
   - Output to `/tmp/{id}-processed.mp4`
   - Skip transcode if already compliant (passthrough)
6. **Upload** — YouTube Data API v3 `videos.insert`:
   - `snippet.title`: first 100 chars of artist description, or fallback `@{handle} | Flow Arts Professional`
   - `snippet.description`: full artist description + `\n\nFeatured artist: @{handle}\nSubmit your reel: flowarts.pro`
   - `snippet.tags`: `["flow arts", "Shorts", "{handle}"]`
   - `status.privacyStatus`: `public`
   - `status.selfDeclaredMadeForKids`: `false`
7. **Update** — set `status=posted`, save `youtube_url` to `reel_submissions`
8. **Cleanup** — delete temp files from `/tmp`

**Error handling:** On failure at any step, set `status=failed`, save `error_message`, cleanup temp files. Webhook returns 200 immediately regardless (processing is async).

**Retry mechanism:** Add `POST /retry/:id` endpoint. Sets `status=pending` for a `failed` submission (with `retry_count < 3` guard), re-triggers the pipeline. Also, on startup, sweep for stale `processing` rows older than 15 minutes and reset them to `pending` (crash recovery).

**Duration validation:** After the probe step, reject videos longer than 3 minutes outright (set `status=failed` with message "Video exceeds 3-minute limit"). Videos between 60s–3min are truncated to 60s for Shorts.

**Concurrency:** Process one video at a time using an in-memory queue (array + shift). Webhooks enqueue submission IDs; a single worker loop dequeues and processes sequentially. This avoids `/tmp` disk exhaustion and token refresh races.

**Webhook payload validation:** Validate incoming webhook JSON with zod schema before processing. Reject malformed payloads with 400.

### Token Management

- OAuth tokens stored in `youtube_tokens` table (single row for business channel)
- On each upload, check `expires_at`. If expired or within 5 minutes of expiry, refresh using `refresh_token`.
- Save updated `access_token` and `expires_at` back to `youtube_tokens`.
- Sequential processing (see above) eliminates token refresh race conditions — only one upload runs at a time.
- Google OAuth scopes required: `https://www.googleapis.com/auth/youtube.upload`

**YouTube API quota note:** Default quota is 10,000 units/day. `videos.insert` costs 1,600 units, allowing ~6 uploads/day. If volume exceeds this, request elevated quota from Google Cloud Console.

### Docker Image

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

### Environment Variables (Railway)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `WEBHOOK_SECRET` | Shared secret for Supabase webhook validation |
| `RAILWAY_PUBLIC_DOMAIN` | Railway-assigned domain (for OAuth redirect URI) |
| `PORT` | Express port (Railway sets this, default 3000) |

---

## Database Changes

### Existing table: `reel_submissions`

Add columns:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `description` | text | null | Artist-provided caption for the video |
| `youtube_url` | text | null | YouTube Shorts URL after successful upload |
| `error_message` | text | null | Error details if processing fails |
| `retry_count` | integer | 0 | Number of retry attempts |

Status flow: `pending` → `processing` → `posted` | `failed`

**Field mapping note:** The existing `artist_name` column stores the artist's @instagram handle (changed in commit `bb27303`). The pipeline reads `record.artist_name` from the webhook payload and uses it as the Instagram handle for YouTube title/description/tags. No rename needed — the column name is a legacy artifact but the data is correct.

### New table: `youtube_tokens`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | uuid | `gen_random_uuid()` | Primary key |
| `access_token` | text | NOT NULL | Current OAuth access token |
| `refresh_token` | text | NOT NULL | Long-lived refresh token |
| `expires_at` | timestamptz | NOT NULL | When access token expires |
| `updated_at` | timestamptz | `now()` | Last token refresh time |

Single row — one business channel's credentials.

### Migration SQL

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

-- RLS: block all access via anon/authenticated roles (service role bypasses RLS)
ALTER TABLE youtube_tokens ENABLE ROW LEVEL SECURITY;
-- No policies = no access for non-service-role clients
```

---

## Frontend Changes

### Upload form (src/app/page.tsx — UploadZone component)

- Add `<textarea>` for "Description / Caption" below the existing file input
- Optional field — placeholder text explaining it will be used as the YouTube Shorts caption
- If empty, pipeline uses fallback: `@{handle} | Flow Arts Professional`

### API route (src/app/api/upload-reel/route.ts)

- Extract `description` from FormData
- Include `description` in the `reel_submissions` INSERT alongside existing fields

### API route (src/app/api/submit-reel/route.ts)

- Also add `description` field (optional) to the JSON body schema
- Include `description` in the `reel_submissions` INSERT

---

## Supabase Webhook Configuration

Configured via Supabase Dashboard (Database → Webhooks):

- **Name:** `reel-submission-webhook`
- **Table:** `reel_submissions`
- **Events:** `INSERT`
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://{RAILWAY_PUBLIC_DOMAIN}/webhook`
- **Headers:** `x-webhook-secret: {WEBHOOK_SECRET}`

---

## Google OAuth Setup

Update Google Cloud Console (project already has OAuth credentials):

- **Redirect URI:** `https://{RAILWAY_PUBLIC_DOMAIN}/auth/youtube/callback`
- **Scopes:** `https://www.googleapis.com/auth/youtube.upload`
- Credentials: stored as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars on Railway (values in user's memory/vault — not checked into code or docs)
- Redirect URI needs updating from `flowarts.pro` to Railway domain in Google Cloud Console

---

## Future Extensibility

Phase 2 (after Meta app approval):
- Add `instagram_url` and `facebook_url` columns to `reel_submissions`
- Add `services/instagram-uploader.ts` and `services/facebook-uploader.ts`
- Pipeline processes each platform in sequence after transcode
- Status tracks per-platform success/failure

---

## Out of Scope

- Admin dashboard for managing submissions (manual via Supabase dashboard)
- Email notifications to artists when their reel goes live
- Video moderation/approval workflow before posting
- Analytics or view count tracking
