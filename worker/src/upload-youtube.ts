import { google } from "googleapis";
import * as fs from "fs";
import { config } from "./config";

const oauth2Client = new google.auth.OAuth2(
  config.youtube.clientId,
  config.youtube.clientSecret
);

oauth2Client.setCredentials({
  refresh_token: config.youtube.refreshToken,
});

const youtube = google.youtube({ version: "v3", auth: oauth2Client });

export interface YouTubeUploadResult {
  videoId: string;
  url: string;
}

export async function uploadToYouTube(
  filePath: string,
  title: string,
  description: string
): Promise<YouTubeUploadResult> {
  const fileStream = fs.createReadStream(filePath);

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description,
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
        madeForKids: false,
      },
    },
    media: {
      body: fileStream,
    },
  });

  const videoId = response.data.id;
  if (!videoId) {
    throw new Error("YouTube upload succeeded but no video ID returned");
  }

  return {
    videoId,
    url: `https://youtube.com/shorts/${videoId}`,
  };
}
