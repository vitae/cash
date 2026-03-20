/**
 * Threads OAuth2 Token Setup
 *
 * Usage:
 *   npx tsx scripts/threads-setup.ts                 # Get auth URL
 *   npx tsx scripts/threads-setup.ts <AUTH_CODE>      # Exchange code for tokens
 */

const APP_ID = "1982427272652594";
const APP_SECRET = "d8d20135d7eb0e62788d4c56c79def76";
const REDIRECT_URI = "https://flowarts.pro/api/threads-callback";

const code = process.argv[2];

async function exchangeCode(code: string) {
  console.log("Step 1: Exchanging code for short-lived token...\n");

  const res = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    user_id?: number;
    error_message?: string;
  };

  if (!data.access_token) {
    console.error("Failed:", data.error_message || JSON.stringify(data));
    process.exit(1);
  }

  console.log(`  Short-lived token obtained for user ${data.user_id}\n`);

  // Step 2: Exchange for long-lived token (60 days)
  console.log("Step 2: Exchanging for long-lived token...\n");

  const llRes = await fetch(
    `https://graph.threads.net/access_token?` +
    `grant_type=th_exchange_token&` +
    `client_secret=${APP_SECRET}&` +
    `access_token=${data.access_token}`
  );

  const llData = (await llRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };

  if (!llData.access_token) {
    console.error("Long-lived exchange failed:", llData.error?.message || JSON.stringify(llData));
    // Fall back to short-lived token
    console.log("\nUsing short-lived token instead.\n");
    printResults(data.access_token, String(data.user_id));
    return;
  }

  console.log(`  Long-lived token obtained (expires in ${Math.round((llData.expires_in || 0) / 86400)} days)\n`);
  printResults(llData.access_token, String(data.user_id));
}

function printResults(token: string, userId: string) {
  console.log("=".repeat(60));
  console.log("ADD THESE ENV VARS TO RAILWAY:");
  console.log("=".repeat(60));
  console.log();
  console.log(`THREADS_USER_ID=${userId}`);
  console.log(`THREADS_ACCESS_TOKEN=${token}`);
  console.log();
  console.log("=".repeat(60));
}

async function run() {
  if (code) {
    await exchangeCode(code);
    return;
  }

  const scopes = "threads_basic,threads_content_publish";
  const authUrl = `https://threads.net/oauth/authorize?` +
    `client_id=${APP_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${scopes}&` +
    `response_type=code`;

  console.log(`
Threads OAuth Setup
===================

1. Open this URL in your browser:

${authUrl}

2. Log in and authorize the app

3. You'll be redirected with a code — copy it and run:
   npx tsx scripts/threads-setup.ts <CODE>
`);
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
