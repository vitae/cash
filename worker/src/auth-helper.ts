/**
 * One-time helper to get a Google OAuth2 refresh token.
 *
 * Usage:
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npx tsx src/auth-helper.ts
 *
 * 1. Open the printed URL in your browser
 * 2. Authorize with your YouTube account
 * 3. Copy the code from the redirect URL
 * 4. Paste it when prompted
 * 5. Save the printed refresh_token to GOOGLE_REFRESH_TOKEN env var
 */
import { google } from "googleapis";
import * as readline from "readline";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "urn:ietf:wg:oauth:2.0:oob"
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/youtube.upload"],
  prompt: "consent",
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nAfter authorizing, paste the code below:\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Code: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n--- Save these tokens ---");
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
    console.log("-------------------------\n");
  } catch (err) {
    console.error("Token exchange failed:", err);
  }
});
