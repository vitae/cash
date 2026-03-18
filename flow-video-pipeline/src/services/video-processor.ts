import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import https from "https";
import http from "http";
import { supabase } from "../lib/supabase";

const execFileAsync = promisify(execFile);

interface ProbeResult {
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
}

export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const proto = url.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadVideo(redirectUrl, outputPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const fileStream = fsSync.createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on("finish", () => { fileStream.close(); resolve(); });
      fileStream.on("error", reject);
    }).on("error", reject);
  });
}

export async function probeVideo(filePath: string): Promise<ProbeResult> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_streams",
    "-show_format",
    filePath,
  ]);

  const info = JSON.parse(stdout);
  const videoStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === "video");
  const audioStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === "audio");

  return {
    duration: parseFloat(info.format?.duration || "0"),
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
    videoCodec: videoStream?.codec_name || "unknown",
    audioCodec: audioStream?.codec_name || "unknown",
  };
}

// Fetch a random music track from Supabase Storage "music" bucket
async function getRandomMusicTrack(): Promise<string | null> {
  const { data: files, error } = await supabase.storage
    .from("music")
    .list("", { limit: 100 });

  if (error || !files || files.length === 0) {
    console.log("No music tracks found in music bucket, uploading without audio");
    return null;
  }

  // Filter to audio files only
  const audioFiles = files.filter(f =>
    f.name.match(/\.(mp3|aac|m4a|wav|ogg)$/i)
  );

  if (audioFiles.length === 0) {
    console.log("No audio files found in music bucket");
    return null;
  }

  // Pick random track
  const track = audioFiles[Math.floor(Math.random() * audioFiles.length)];
  console.log(`Selected music track: ${track.name}`);

  // Download to temp
  const { data: urlData } = supabase.storage
    .from("music")
    .getPublicUrl(track.name);

  const musicPath = path.join(os.tmpdir(), `music-${Date.now()}.mp3`);
  await downloadVideo(urlData.publicUrl, musicPath);

  return musicPath;
}

export async function transcodeForShorts(
  inputPath: string,
  outputPath: string,
  probe: ProbeResult
): Promise<string> {
  // Try to get a music track to mix in
  const musicPath = await getRandomMusicTrack();

  const videoDuration = Math.min(probe.duration, 60);

  if (musicPath) {
    // Transcode video + mix in music track
    // -shortest ensures output stops when the shorter input ends
    const args: string[] = [
      "-i", inputPath,
      "-i", musicPath,
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-map", "0:v:0",        // Use video from first input
      "-map", "1:a:0",        // Use audio from second input (music)
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
    ];

    // Truncate to 60s if longer
    if (probe.duration > 60) {
      args.push("-t", "60");
      console.log(`Truncating video from ${probe.duration.toFixed(1)}s to 60s`);
    } else {
      // Trim music to match video length
      args.push("-t", videoDuration.toFixed(2));
    }

    // Fade out music in the last 2 seconds
    const fadeStart = Math.max(0, videoDuration - 2);
    args.push("-af", `afade=t=out:st=${fadeStart.toFixed(2)}:d=2`);

    args.push("-y", outputPath);

    console.log("Transcoding video with music...");
    try {
      await execFileAsync("ffmpeg", args, { timeout: 300_000 });
      console.log("Transcode with music complete");
      await cleanup(musicPath);
      return outputPath;
    } catch (err) {
      console.error("Music mix failed, falling back to silent:", err);
      await cleanup(musicPath);
    }
  }

  // Fallback: transcode without audio
  const args: string[] = [
    "-i", inputPath,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-an",
    "-movflags", "+faststart",
  ];

  if (probe.duration > 60) {
    args.push("-t", "60");
  }

  args.push("-y", outputPath);

  console.log("Transcoding video (no audio)...");
  await execFileAsync("ffmpeg", args, { timeout: 300_000 });
  console.log("Transcode complete");

  return outputPath;
}

export async function cleanup(...paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      await fs.unlink(p);
    } catch {
      // Ignore cleanup errors
    }
  }
}
