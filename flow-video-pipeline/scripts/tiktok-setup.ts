/**
 * TikTok OAuth2 Token Setup
 *
 * Step 1: Run this script with no args to get the authorization URL
 * Step 2: Open the URL in your browser, authorize the app
 * Step 3: Copy the `code` from the redirect URL
 * Step 4: Run this script with the code to exchange it for tokens
 *
 * Usage:
 *   npx tsx scripts/tiktok-setup.ts                    # Get auth URL
 *   npx tsx scripts/tiktok-setup.ts <AUTH_CODE>        # Exchange code for tokens
 *   npx tsx scripts/tiktok-setup.ts refresh <TOKEN>    # Refresh an expired token
 */

const CLIENT_KEY = "awzhf5uwsfx4xio6";
const CLIENT_SECRET = "ZmlAd5jzG3p0AXEKTE16iwBaDWpmy9mc";
const REDIRECT_URI = "https://flowarts.pro/api/tiktok-callback";

const arg = process.argv[2];
const arg2 = process.argv[3];

async function exchangeCode(code: string) {
  console.log("Exchanging authorization code for access token...\n");

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await res.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_expires_in?: number;
    open_id?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    console.error(`Error: ${data.error} — ${data.error_description}`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("ADD THESE ENV VARS TO RAILWAY:");
  console.log("=".repeat(60));
  console.log();
  console.log(`TIKTOK_ACCESS_TOKEN=${data.access_token}`);
  console.log(`TIKTOK_REFRESH_TOKEN=${data.refresh_token}`);
  console.log(`TIKTOK_OPEN_ID=${data.open_id}`);
  console.log();
  console.log(`Access token expires in: ${Math.round((data.expires_in || 0) / 3600)} hours`);
  console.log(`Refresh token expires in: ${Math.round((data.refresh_expires_in || 0) / 86400)} days`);
  console.log();
  console.log("NOTE: Use 'npx tsx scripts/tiktok-setup.ts refresh <REFRESH_TOKEN>'");
  console.log("to get a new access token when it expires.");
  console.log("=".repeat(60));
}

async function refreshToken(refreshToken: string) {
  console.log("Refreshing access token...\n");

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    console.error(`Error: ${data.error} — ${data.error_description}`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("UPDATE THESE ENV VARS IN RAILWAY:");
  console.log("=".repeat(60));
  console.log();
  console.log(`TIKTOK_ACCESS_TOKEN=${data.access_token}`);
  console.log(`TIKTOK_REFRESH_TOKEN=${data.refresh_token}`);
  console.log();
  console.log(`New access token expires in: ${Math.round((data.expires_in || 0) / 3600)} hours`);
  console.log("=".repeat(60));
}

async function run() {
  if (arg === "refresh" && arg2) {
    await refreshToken(arg2);
    return;
  }

  if (arg) {
    await exchangeCode(arg);
    return;
  }

  // No args — show auth URL
  const scopes = "user.info.basic,video.publish,video.upload";
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
    `client_key=${CLIENT_KEY}&` +
    `scope=${scopes}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${state}`;

  console.log(`
TikTok OAuth Setup
==================

1. Open this URL in your browser:

${authUrl}

2. Log in and authorize the app

3. You'll be redirected to:
   ${REDIRECT_URI}?code=XXXXXX&state=${state}

4. Copy the 'code' value from the URL and run:
   npx tsx scripts/tiktok-setup.ts <CODE>
`);
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
