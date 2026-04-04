import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, artist_name, email, video_url, status, created_at, updated_at, description, youtube_url, error_message, retry_count, publish_details";

const PAGE_SIZE = 1000;

/**
 * Fetch ALL reel_submissions by paginating through Supabase's 1 000-row default.
 * Returns every row so the dashboard always reflects the full database.
 */
async function fetchAllSubmissions(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const allRows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("reel_submissions")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...data);

    // If we got fewer than PAGE_SIZE rows, we've reached the end
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const data = await fetchAllSubmissions(supabase);

    const statuses = { pending: 0, processing: 0, processed: 0, posted: 0, failed: 0, partial: 0, queued: 0 };
    for (const row of data) {
      const s = row.status as keyof typeof statuses;
      if (s in statuses) statuses[s] += 1;
    }

    return NextResponse.json({ submissions: data, counts: statuses, total: data.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
