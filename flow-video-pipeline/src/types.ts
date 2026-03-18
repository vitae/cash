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
