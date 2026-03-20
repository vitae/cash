import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

/**
 * Extract a frame from the video, crop the upper-left corner,
 * and use Claude vision to read the username/watermark.
 */
export async function extractUsernameFromVideo(videoPath: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("  No ANTHROPIC_API_KEY, skipping username extraction");
    return null;
  }

  const framePath = path.join(os.tmpdir(), `frame-${Date.now()}.jpg`);

  try {
    // Extract a frame from 1 second in, crop upper-left quadrant
    // Most social media watermarks appear in the top-left
    await execFileAsync("ffmpeg", [
      "-ss", "1",
      "-i", videoPath,
      "-vframes", "1",
      "-vf", "crop=iw/2:ih/4:0:0",
      "-q:v", "2",
      "-y", framePath,
    ], { timeout: 15_000 });

    const imageBuffer = await fs.readFile(framePath);
    const base64Image = imageBuffer.toString("base64");

    // Ask Claude to read the username
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "This is the upper-left corner of a social media video. Read the username or handle shown (usually starts with @). Return ONLY the username with the @ symbol, nothing else. If no username is visible, return NONE.",
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      console.error(`  Claude API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content?.[0]?.text?.trim() || "";

    if (text === "NONE" || text.length < 2) {
      console.log("  No username detected in video");
      return null;
    }

    // Clean up the response — extract just the username
    const usernameMatch = text.match(/@[\w.]+/);
    const username = usernameMatch ? usernameMatch[0] : text;

    console.log(`  Detected username from video: ${username}`);
    return username;
  } catch (err) {
    console.error("  Username extraction failed:", err);
    return null;
  } finally {
    await fs.unlink(framePath).catch(() => {});
  }
}
