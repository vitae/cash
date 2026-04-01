import { supabase } from "../lib/supabase";
import { publishSubmission } from "./pipeline";

// Publish every 2 hours (interval in milliseconds)
const PUBLISH_INTERVAL_MS = 2 * 60 * 60 * 1000;

/**
 * Publish all ready submissions. Called every 2 hours by the scheduler.
 */
export async function publishScheduledBatch(): Promise<void> {
  const { data: readySubmissions, error } = await supabase
    .from("reel_submissions")
    .select("id")
    .in("status", ["processed", "partial", "queued"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch scheduled submissions:", error.message);
    return;
  }

  if (!readySubmissions || readySubmissions.length === 0) {
    console.log("📅 No submissions ready for scheduled publishing");
    return;
  }

  console.log(`📅 Scheduled publishing: ${readySubmissions.length} submission(s) to post`);

  let published = 0;
  for (const sub of readySubmissions) {
    try {
      const didPublish = await publishSubmission(sub.id);
      if (didPublish) published++;
    } catch (err) {
      console.error(`Failed to publish ${sub.id}:`, err);
    }
  }

  console.log(`📅 Published ${published}/${readySubmissions.length} submission(s)`);
}

/**
 * Publish a batch every 2 hours. Fires once on startup, then repeats.
 */
export function startScheduler(): void {
  const hours = PUBLISH_INTERVAL_MS / (60 * 60 * 1000);
  console.log(`📅 Scheduler started — publishing every ${hours} hours`);

  // Fire immediately on startup so the first batch doesn't wait 2 hours
  publishScheduledBatch().catch(err =>
    console.error("📅 Initial publish batch failed:", err)
  );

  setInterval(async () => {
    console.log("📅 Scheduled publish cycle starting...");
    try {
      await publishScheduledBatch();
    } catch (err) {
      console.error("📅 Scheduled publishing failed:", err);
    }
  }, PUBLISH_INTERVAL_MS);
}
