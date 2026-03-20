import { supabase } from "../lib/supabase";
import { enqueue } from "./queue";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export async function sweepStaleProcessing(): Promise<void> {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  const { data, error } = await supabase
    .from("reel_submissions")
    .update({ status: "pending" })
    .eq("status", "processing")
    .lt("updated_at", threshold)
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

// Retry queued and partial submissions — called on a longer interval
// "queued" = all platforms failed (e.g. quota), "partial" = some succeeded, some still need posting
export async function retryQueuedSubmissions(): Promise<void> {
  // First select the IDs to retry (can't order/limit on an update query)
  const { data: toRetry, error: selectError } = await supabase
    .from("reel_submissions")
    .select("id")
    .in("status", ["queued", "partial"])
    .order("created_at", { ascending: true })
    .limit(3);

  if (selectError) {
    console.error("Retry queued select error:", selectError.message);
    return;
  }

  if (!toRetry || toRetry.length === 0) return;

  const ids = toRetry.map((r) => r.id);

  // Then update their status
  const { error: updateError } = await supabase
    .from("reel_submissions")
    .update({ status: "pending" })
    .in("id", ids);

  if (updateError) {
    console.error("Retry queued update error:", updateError.message);
    return;
  }

  console.log(`Retrying ${ids.length} queued/partial submissions`);
  for (const id of ids) {
    enqueue(id);
  }
}
