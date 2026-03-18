import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import https from "https";
import http from "http";

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

export async function transcodeForShorts(
  inputPath: string,
  outputPath: string,
  probe: ProbeResult
): Promise<string> {
  // Check if already compliant (H.264 + AAC + ≤60s)
  const isCompliant =
    probe.videoCodec === "h264" &&
    probe.audioCodec === "aac" &&
    probe.duration <= 60;

  if (isCompliant) {
    console.log("Video already compliant, copying as-is");
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }

  const args: string[] = [
    "-i", inputPath,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
  ];

  // Truncate to 60s if longer
  if (probe.duration > 60) {
    args.push("-t", "60");
    console.log(`Truncating video from ${probe.duration.toFixed(1)}s to 60s`);
  }

  args.push("-y", outputPath);

  console.log("Transcoding video...");
  await execFileAsync("ffmpeg", args, { timeout: 300_000 }); // 5 minute timeout
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
