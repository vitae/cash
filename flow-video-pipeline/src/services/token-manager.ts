import { OAuth2Client } from "google-auth-library";
import { supabase } from "../lib/supabase";
import type { YouTubeTokens } from "../types";

export async function getAuthenticatedClient() {
  // Fetch tokens from DB
  const { data, error } = await supabase
    .from("youtube_tokens")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No YouTube tokens found. Visit /auth/youtube to authenticate.");
  }

  const tokens = data as YouTubeTokens;

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.expires_at).getTime(),
  });

  // Check if token needs refresh (within 5 minutes of expiry)
  const expiresAt = new Date(tokens.expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() >= expiresAt - fiveMinutes) {
    console.log("Access token expired or expiring soon, refreshing...");
    const { credentials } = await oauth2Client.refreshAccessToken();

    const newExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    await supabase
      .from("youtube_tokens")
      .update({
        access_token: credentials.access_token!,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tokens.id);

    console.log("Token refreshed successfully");
  }

  return oauth2Client;
}
