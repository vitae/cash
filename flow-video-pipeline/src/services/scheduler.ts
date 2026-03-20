import { supabase } from "../lib/supabase";
import { publishSubmission } from "./pipeline";

// Posting schedule: every 3 hours between 7am-11pm EST
// 7am, 10am, 1pm, 4pm, 7pm, 10pm EST
const POST_HOURS_EST = [7, 10, 13, 16, 19, 22];

/**
 * Check if now is within a posting window (±5 minutes of a scheduled hour).
 * All times in EST (UTC-5) / EDT (UTC-4).
 */
function isPostingTime(): boolean {
  const now = new Date();
  // Convert to EST/EDT using Intl
  const estString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const estDate = new Date(estString);
  const hour = estDate.getHours();
  const minute = estDate.getMinutes();

  // Check if current hour matches a posting hour and we're in the first 5 minutes
  return POST_HOURS_EST.includes(hour) && minute < 5;
}

/**
 * Get the next posting time for logging purposes.
 */
function getNextPostingTime(): string {
  const now = new Date();
  const estString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const estDate = new Date(estString);
  const currentHour = estDate.getHours();

  const nextHour = POST_HOURS_EST.find(h => h > currentHour) || POST_HOURS_EST[0];
  const isNextDay = nextHour <= currentHour;

  return `${nextHour > 12 ? nextHour - 12 : nextHour}${nextHour >= 12 ? "pm" : "am"} EST${isNextDay ? " (tomorrow)" : ""}`;
}

/**
 * Publish the next batch of processed submissions.
 * Called by the scheduler at posting windows.
 */
export async function publishScheduledBatch(): Promise<void> {
  // Get up to 2 processed submissions (post 2 per window to avoid rate limits)
  const { data: readySubmissions, error } = await supabase
    .from("reel_submissions")
    .select("id")
    .in("status", ["processed", "partial", "queued"])
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) {
    console.error("Failed to fetch scheduled submissions:", error.message);
    return;
  }

  if (!readySubmissions || readySubmissions.length === 0) {
    console.log("📅 No submissions ready for scheduled publishing");
    return;
  }

  console.log(`📅 Scheduled publishing: ${readySubmissions.length} submission(s) to post`);

  for (const sub of readySubmissions) {
    try {
      await publishSubmission(sub.id);
    } catch (err) {
      console.error(`Failed to publish ${sub.id}:`, err);
    }
  }
}

/**
 * Check every minute if it's time to publish.
 * Fires at 7am, 10am, 1pm, 4pm, 7pm, 10pm EST.
 */
export function startScheduler(): void {
  console.log(`📅 Scheduler started — posting at ${POST_HOURS_EST.map(h => `${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"}`).join(", ")} EST`);
  console.log(`📅 Next posting window: ${getNextPostingTime()}`);

  let lastFiredHour = -1;

  setInterval(async () => {
    if (!isPostingTime()) return;

    // Get current EST hour to prevent double-firing
    const now = new Date();
    const estString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
    const estHour = new Date(estString).getHours();

    if (estHour === lastFiredHour) return; // Already fired this hour
    lastFiredHour = estHour;

    console.log(`📅 Posting window open (${estHour > 12 ? estHour - 12 : estHour}${estHour >= 12 ? "pm" : "am"} EST) — publishing batch...`);

    try {
      await publishScheduledBatch();
    } catch (err) {
      console.error("📅 Scheduled publishing failed:", err);
    }

    console.log(`📅 Next posting window: ${getNextPostingTime()}`);
  }, 60 * 1000); // Check every minute
}
