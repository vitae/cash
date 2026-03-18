import { processSubmission } from "./pipeline";

const queue: string[] = [];
let processing = false;

export function enqueue(submissionId: string): void {
  if (!queue.includes(submissionId)) {
    queue.push(submissionId);
    console.log(`Enqueued submission ${submissionId}. Queue length: ${queue.length}`);
  }
}

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const id = queue.shift()!;
    console.log(`Processing submission ${id}...`);
    try {
      await processSubmission(id);
      console.log(`Completed submission ${id}`);
    } catch (err) {
      console.error(`Failed processing submission ${id}:`, err);
    }
  }

  processing = false;
}
