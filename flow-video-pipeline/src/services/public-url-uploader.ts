import fs from "fs/promises";
import { supabase } from "../lib/supabase";

/**
 * Upload a transcoded video to Supabase Storage and return its public URL.
 * Instagram and Facebook APIs require a publicly accessible URL to fetch the video.
 */
export async function uploadToPublicUrl(
  filePath: string,
  submissionId: string,
  platform: string
): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const filename = `processed/${submissionId}-${platform}.mp4`;

  const { error } = await supabase.storage
    .from("reels")
    .upload(filename, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${platform} video to public storage: ${error.message}`);
  }

  const { data } = supabase.storage.from("reels").getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Clean up processed videos from public storage after posting.
 */
export async function cleanupPublicUrl(
  submissionId: string,
  platform: string
): Promise<void> {
  const filename = `processed/${submissionId}-${platform}.mp4`;
  await supabase.storage.from("reels").remove([filename]);
}
