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

const DOWNLOAD_TIMEOUT_MS = 120_000; // 2 minutes
const MAX_REDIRECTS = 5;

export async function downloadVideo(url: string, outputPath: string, redirectCount = 0): Promise<void> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`Too many redirects (${MAX_REDIRECTS}) downloading ${url}`);
  }

  const proto = url.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      req.destroy();
      reject(new Error(`Download timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s: ${url}`));
    }, DOWNLOAD_TIMEOUT_MS);

    const req = proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        clearTimeout(timeout);
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadVideo(redirectUrl, outputPath, redirectCount + 1).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        clearTimeout(timeout);
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const fileStream = fsSync.createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on("finish", () => {
        clearTimeout(timeout);
        fileStream.close();
        resolve();
      });
      fileStream.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    req.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
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

export interface MusicTrackInfo {
  path: string;
  name: string;
}

// Fetch the highest-popularity unused music track
// Uses music_tracks table (ranked by popularity_score DESC)
// Falls back to raw bucket files if table is empty
// Each track is used ONCE then permanently deleted
async function getTopMusicTrack(): Promise<MusicTrackInfo | null> {
  // Strategy 1: Use music_tracks table (ranked by popularity)
  const { data: topTrack, error: dbError } = await supabase
    .from("music_tracks")
    .select("*")
    .eq("used", false)
    .order("popularity_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (topTrack && !dbError) {
    console.log(`🎵 Top track: "${topTrack.name}" by ${topTrack.artist_name} (popularity: ${topTrack.popularity_score})`);

    // Download from storage
    const { data: urlData } = supabase.storage
      .from("music")
      .getPublicUrl(topTrack.storage_path);

    const musicPath = path.join(os.tmpdir(), `music-${Date.now()}.mp3`);
    await downloadVideo(urlData.publicUrl, musicPath);

    // Mark as used in database
    await supabase
      .from("music_tracks")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", topTrack.id);

    // Delete from storage bucket
    const { error: deleteError } = await supabase.storage
      .from("music")
      .remove([topTrack.storage_path]);

    if (deleteError) {
      console.error(`Failed to delete ${topTrack.storage_path}:`, deleteError);
    } else {
      console.log(`🗑️ Deleted "${topTrack.name}" from bucket after use`);
    }

    // Count remaining
    const { count } = await supabase
      .from("music_tracks")
      .select("*", { count: "exact", head: true })
      .eq("used", false);
    console.log(`🎵 ${count ?? 0} tracks remaining in library`);

    return { path: musicPath, name: `${topTrack.name} by ${topTrack.artist_name}` };
  }

  // Strategy 2: Fallback to raw bucket files (for legacy tracks without DB entries)
  const { data: files, error } = await supabase.storage
    .from("music")
    .list("", { limit: 200 });

  if (error || !files || files.length === 0) {
    console.log("⚠️ No music tracks available — uploading without audio. Run the music discovery function!");
    return null;
  }

  const audioFiles = files.filter(f =>
    f.name.match(/\.(mp3|aac|m4a|wav|ogg)$/i)
  );

  if (audioFiles.length === 0) {
    console.log("⚠️ No audio files in music bucket");
    return null;
  }

  console.log(`🎵 Fallback: ${audioFiles.length} untracked files in bucket`);

  // Pick first available
  const track = audioFiles[0];
  console.log(`🎵 Using: ${track.name} (unranked)`);

  const { data: urlData } = supabase.storage
    .from("music")
    .getPublicUrl(track.name);

  const musicPath = path.join(os.tmpdir(), `music-${Date.now()}.mp3`);
  await downloadVideo(urlData.publicUrl, musicPath);

  // Delete from bucket
  await supabase.storage.from("music").remove([track.name]);
  console.log(`🗑️ Deleted ${track.name} from bucket after use`);

  return { path: musicPath, name: track.name };
}

export interface TranscodeResult {
  outputPath: string;
  musicTrackName: string | null;
}

export async function transcodeForShorts(
  inputPath: string,
  outputPath: string,
  probe: ProbeResult
): Promise<TranscodeResult> {
  // Try to get a music track to mix in
  const musicTrack = await getTopMusicTrack();

  const videoDuration = Math.min(probe.duration, 60);

  if (musicTrack) {
    // Copy video stream (no re-encode = low memory), only encode audio
    const args: string[] = [
      "-i", inputPath,
      "-i", musicTrack.path,
      "-c:v", "copy",          // Copy video as-is (no re-encode, saves RAM)
      "-map", "0:v:0",         // Use video from first input
      "-map", "1:a:0",         // Use audio from second input (music)
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

    console.log("Mixing music into video (video copy, audio encode)...");
    try {
      await execFileAsync("ffmpeg", args, { timeout: 300_000 });
      console.log("Music mix complete");
      await cleanup(musicTrack.path);
      return { outputPath, musicTrackName: musicTrack.name };
    } catch (err) {
      console.error("Music mix failed, falling back to silent:", err);
      await cleanup(musicTrack.path);
    }
  }

  // Fallback: copy video without audio (no re-encode)
  const args: string[] = [
    "-i", inputPath,
    "-c:v", "copy",            // Copy video as-is
    "-an",
    "-movflags", "+faststart",
  ];

  if (probe.duration > 60) {
    args.push("-t", "60");
  }

  args.push("-y", outputPath);

  console.log("Copying video (no audio)...");
  await execFileAsync("ffmpeg", args, { timeout: 300_000 });
  console.log("Copy complete");

  return { outputPath, musicTrackName: null };
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
