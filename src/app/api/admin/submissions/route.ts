import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reel_submissions")
    .select("id, artist_name, email, video_url, status, created_at, updated_at, description, youtube_url, error_message, retry_count, publish_details")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const statuses = { pending: 0, processing: 0, processed: 0, posted: 0, failed: 0, partial: 0, queued: 0 };
  for (const row of data ?? []) {
    const s = row.status as keyof typeof statuses;
    if (s in statuses) statuses[s] += 1;
  }

  return NextResponse.json({ submissions: data ?? [], counts: statuses, total: (data ?? []).length });
}
