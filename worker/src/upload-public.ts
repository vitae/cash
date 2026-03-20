import { getSupabase } from "./supabase";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Upload a transcoded file to Supabase Storage and return its public URL.
 * Instagram and Facebook APIs need a publicly accessible URL to fetch the video.
 */
export async function uploadToPublicUrl(
  filePath: string,
  reelId: string,
  platform: string
): Promise<string> {
  const supabase = getSupabase();
  const buffer = await fs.readFile(filePath);
  const filename = `processed/${reelId}-${platform}.mp4`;

  const { error } = await supabase.storage
    .from("reels")
    .upload(filename, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload processed ${platform} video: ${error.message}`);
  }

  const { data } = supabase.storage.from("reels").getPublicUrl(filename);
  return data.publicUrl;
}
