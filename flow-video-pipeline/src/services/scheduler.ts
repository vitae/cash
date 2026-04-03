import { supabase } from "../lib/supabase";
import { publishSubmission } from "./pipeline";

// Publish 1 video every 3 hours, 7am–10pm EST
const PUBLISH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const BATCH_SIZE = 1;
const START_HOUR_EST = 7;
const END_HOUR_EST = 22; // 10pm

function getCurrentEST(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

function isWithinPublishWindow(): boolean {
  const hour = getCurrentEST().getHours();
  return hour >= START_HOUR_EST && hour < END_HOUR_EST;
}

/**
 * Publish 1 ready submission if within the 7am–10pm EST window.
 */
export async function publishScheduledBatch(): Promise<void> {
  if (!isWithinPublishWindow()) {
    const hour = getCurrentEST().getHours();
    console.log(`📅 Outside publish window (${hour}:00 EST, window is ${START_HOUR_EST}:00–${END_HOUR_EST}:00) — skipping`);
    return;
  }

  const { data: readySubmissions, error } = await supabase
    .from("reel_submissions")
    .select("id")
    .in("status", ["processed", "partial", "queued"])
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

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
 * Publish 1 video every 3 hours between 7am–10pm EST.
 * Fires once on startup, then repeats.
 */
export function startScheduler(): void {
  console.log(`📅 Scheduler started — publishing ${BATCH_SIZE} video every 3 hours (${START_HOUR_EST}:00–${END_HOUR_EST}:00 EST)`);

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
