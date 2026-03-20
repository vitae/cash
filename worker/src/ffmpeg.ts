import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { config } from "./config";

const execFileAsync = promisify(execFile);

export interface TranscodeResult {
  youtube: string;
  instagram: string;
  facebook: string;
}

async function ensureTmpDir(): Promise<void> {
  await fs.mkdir(config.tmpDir, { recursive: true });
}

/**
 * Transcode a video for all three platforms.
 * All platforms want vertical 9:16, H.264, AAC.
 * - YouTube Shorts: max 60s, 1080x1920, 30fps
 * - Instagram Reels: max 90s, 1080x1920, 30fps, max 250MB
 * - Facebook Reels: max 90s, 1080x1920, 30fps
 */
export async function transcodeForPlatforms(
  inputBuffer: Buffer,
  reelId: string
): Promise<TranscodeResult> {
  await ensureTmpDir();

  const inputPath = path.join(config.tmpDir, `${reelId}-input.mp4`);
  await fs.writeFile(inputPath, inputBuffer);

  const baseArgs = [
    "-i", inputPath,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "44100",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
    "-r", "30",
    "-movflags", "+faststart",
    "-y",
  ];

  const youtubeOut = path.join(config.tmpDir, `${reelId}-youtube.mp4`);
  const instagramOut = path.join(config.tmpDir, `${reelId}-instagram.mp4`);
  const facebookOut = path.join(config.tmpDir, `${reelId}-facebook.mp4`);

  // Transcode all platforms in parallel
  await Promise.all([
    // YouTube Shorts: 60s max
    execFileAsync("ffmpeg", [
      ...baseArgs,
      "-t", "60",
      youtubeOut,
    ], { timeout: 300_000 }),

    // Instagram Reels: 90s max, slightly lower bitrate to stay under 250MB
    execFileAsync("ffmpeg", [
      ...baseArgs,
      "-t", "90",
      "-maxrate", "20M",
      "-bufsize", "25M",
      instagramOut,
    ], { timeout: 300_000 }),

    // Facebook Reels: 90s max
    execFileAsync("ffmpeg", [
      ...baseArgs,
      "-t", "90",
      facebookOut,
    ], { timeout: 300_000 }),
  ]);

  // Clean up input
  await fs.unlink(inputPath).catch(() => {});

  return {
    youtube: youtubeOut,
    instagram: instagramOut,
    facebook: facebookOut,
  };
}

export async function cleanupFiles(result: TranscodeResult): Promise<void> {
  await Promise.all([
    fs.unlink(result.youtube).catch(() => {}),
    fs.unlink(result.instagram).catch(() => {}),
    fs.unlink(result.facebook).catch(() => {}),
  ]);
}
