import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { supabase } from "../lib/supabase";

const router = Router();

function getOAuth2Client() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  const redirectUri = domain
    ? `https://${domain}/auth/youtube/callback`
    : `http://localhost:${process.env.PORT || 3000}/auth/youtube/callback`;

  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// Step 1: Redirect to Google consent screen
router.get("/auth/youtube", (_req: Request, res: Response) => {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
router.get("/auth/youtube/callback", async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.status(400).send("Missing authorization code");
    return;
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token || !tokens.access_token) {
      res.status(400).send("Failed to get tokens. Try revoking access at myaccount.google.com/permissions and retry.");
      return;
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

    // Upsert — delete any existing row, insert new one
    await supabase.from("youtube_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("youtube_tokens").insert({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Failed to save tokens:", error.message);
      res.status(500).send("Failed to save tokens: " + error.message);
      return;
    }

    res.send("YouTube OAuth complete! Tokens saved. You can close this tab.");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth error: " + (err instanceof Error ? err.message : "Unknown error"));
  }
});

export default router;
