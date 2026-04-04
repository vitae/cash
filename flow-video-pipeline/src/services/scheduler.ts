import { supabase } from "../lib/supabase";
import { publishSubmission } from "./pipeline";

// Fixed posting times in EST (24-hour format)
const PUBLISH_HOURS_EST = [7, 10, 13, 16, 19, 22]; // 7am, 10am, 1pm, 4pm, 7pm, 10pm
const BATCH_SIZE = 1;
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

function getCurrentEST(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
}

function isPublishTime(): boolean {
  const now = getCurrentEST();
  const hour = now.getHours();
  const minute = now.getMinutes();
  // Trigger during the first minute of each scheduled hour (e.g. 7:00)
  return PUBLISH_HOURS_EST.includes(hour) && minute === 0;
}

function formatSchedule(): string {
  return PUBLISH_HOURS_EST.map(h => {
    const suffix = h >= 12 ? "pm" : "am";
    const display = h > 12 ? h - 12 : h;
    return `${display}${suffix}`;
  }).join(", ");
}

/**
 * Publish 1 ready submission.
 * @param force - Skip the time check (used by manual /publish-now trigger)
 */
export async function publishScheduledBatch(force = false): Promise<void> {
  if (!force && !isPublishTime()) {
    return;
  }

  const now = getCurrentEST();
  console.log(`📅 Publish slot hit: ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} EST`);

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
 * Publish 1 video at fixed EST times: 7am, 10am, 1pm, 4pm, 7pm, 10pm.
 * Checks every minute and fires when the clock matches a slot.
 */
export function startScheduler(): void {
  console.log(`📅 Scheduler started — publishing ${BATCH_SIZE} video at fixed EST times: ${formatSchedule()}`);

  setInterval(async () => {
    try {
      await publishScheduledBatch();
    } catch (err) {
      console.error("📅 Scheduled publishing failed:", err);
    }
  }, CHECK_INTERVAL_MS);
}
