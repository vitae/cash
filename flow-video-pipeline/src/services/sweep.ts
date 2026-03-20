import { supabase } from "../lib/supabase";
import { enqueue } from "./queue";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export async function sweepStaleProcessing(): Promise<void> {
  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  // Reset submissions stuck in "processing" for over 15 minutes
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

  // Pick up any pending submissions that were never enqueued
  // (e.g. inserted while service was down, or webhook missed)
  const { data: pending, error: pendingError } = await supabase
    .from("reel_submissions")
    .select("id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);

  if (pendingError) {
    console.error("Pending pickup error:", pendingError.message);
    return;
  }

  if (pending && pending.length > 0) {
    console.log(`Found ${pending.length} pending submission(s) to enqueue`);
    for (const row of pending) {
      enqueue(row.id);
    }
  }
}

// Retry queued and partial submissions — called on a longer interval
// "queued" = all platforms failed (e.g. quota), "partial" = some succeeded, some still need posting
// These need Phase 2 (publishing), so set them back to "processed" for the scheduler to pick up
export async function retryQueuedSubmissions(): Promise<void> {
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

  // Set to "processed" so the scheduler picks them up for Phase 2 (publishing)
  // NOT "pending" — that would re-run Phase 1 and lose publish_details
  const { error: updateError } = await supabase
    .from("reel_submissions")
    .update({ status: "processed" })
    .in("id", ids);

  if (updateError) {
    console.error("Retry queued update error:", updateError.message);
    return;
  }

  console.log(`Reset ${ids.length} queued/partial submissions to processed for re-publishing`);
}
