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
