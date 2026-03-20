import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return client;
}

export interface ReelSubmission {
  id: string;
  artist_name: string;
  email: string | null;
  video_url: string;
  description: string | null;
  status: string;
  instagram_handle: string | null;
  created_at: string;
}

export async function fetchPendingReels(): Promise<ReelSubmission[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reel_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch pending reels: ${error.message}`);
  }
  return data ?? [];
}

export async function updateReelStatus(
  id: string,
  status: "processing" | "published" | "failed",
  details?: Record<string, string>
): Promise<void> {
  const supabase = getSupabase();
  const update: Record<string, unknown> = { status };
  if (details) {
    update.publish_details = details;
  }
  const { error } = await supabase
    .from("reel_submissions")
    .update(update)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update reel ${id}: ${error.message}`);
  }
}

export async function downloadVideo(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
