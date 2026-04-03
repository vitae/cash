import { youtube } from "@googleapis/youtube";
import fs from "fs";
import { getAuthenticatedClient } from "./token-manager";

interface UploadOptions {
  filePath: string;
  title: string;
  description: string;
  tags: string[];
}

export async function uploadToYouTube(options: UploadOptions): Promise<string> {
  const auth = await getAuthenticatedClient();
  const yt = youtube({ version: "v3", auth });

  console.log(`Uploading to YouTube: "${options.title}"`);

  const res = await yt.videos.insert({
    part: ["snippet", "status", "recordingDetails"],
    requestBody: {
      snippet: {
        title: options.title.slice(0, 100),
        description: options.description,
        tags: options.tags,
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
      recordingDetails: {
        location: {
          latitude: 21.3069,
          longitude: -157.8583,
        },
        locationDescription: "Honolulu, Hawaii",
      },
    },
    media: {
      body: fs.createReadStream(options.filePath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) {
    throw new Error("YouTube upload succeeded but no video ID returned");
  }

  const youtubeUrl = `https://youtube.com/shorts/${videoId}`;
  console.log(`Upload complete: ${youtubeUrl}`);

  return youtubeUrl;
}
