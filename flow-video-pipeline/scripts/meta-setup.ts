import crypto from "crypto";

const APP_ID = "1235853328654908";
const APP_SECRET = "8411f8ff6a144956773cf10576db89ad";

const shortLivedToken = process.argv[2];

if (!shortLivedToken) {
  console.log(`
Meta API Token Setup
====================
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select app: ${APP_ID}
3. Click "Generate Access Token" with these permissions:
   - pages_show_list, pages_read_engagement, pages_manage_posts, publish_video
   - instagram_basic, instagram_content_publish
4. Run: npx tsx scripts/meta-setup.ts <YOUR_SHORT_LIVED_TOKEN>
`);
  process.exit(1);
}

function appsecretProof(token: string): string {
  return crypto.createHmac("sha256", APP_SECRET).update(token).digest("hex");
}

function graphUrl(path: string, token: string, extra = ""): string {
  const proof = appsecretProof(token);
  return `https://graph.facebook.com/v21.0${path}?access_token=${token}&appsecret_proof=${proof}${extra}`;
}

async function run() {
  console.log("Step 1: Exchanging for long-lived user token...\n");

  const llRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${APP_ID}&` +
    `client_secret=${APP_SECRET}&` +
    `fb_exchange_token=${shortLivedToken}`
  );
  const llData = await llRes.json() as { access_token?: string; error?: { message: string } };

  if (llData.error || !llData.access_token) {
    console.error("Failed to get long-lived token:", llData.error?.message || llData);
    process.exit(1);
  }

  const longLivedUserToken = llData.access_token;
  console.log("  Long-lived user token obtained (60 days)\n");

  console.log("Step 2: Getting your Pages...\n");

  const pagesRes = await fetch(graphUrl("/me/accounts", longLivedUserToken));
  const pagesData = await pagesRes.json() as {
    data?: Array<{ id: string; name: string; access_token: string }>;
    error?: { message: string };
  };

  if (pagesData.error || !pagesData.data?.length) {
    console.error("Failed to get pages:", pagesData.error?.message || "No pages found");
    process.exit(1);
  }

  console.log("  Your Pages:");
  for (const page of pagesData.data) {
    console.log(`    - ${page.name} (ID: ${page.id})`);
  }

  const targetPage = pagesData.data.find(
    (p) => p.name.toLowerCase().includes("glow") || p.name.toLowerCase().includes("flow")
  ) || pagesData.data[0];

  console.log(`\n  Using page: "${targetPage.name}" (${targetPage.id})\n`);

  const pageAccessToken = targetPage.access_token;

  console.log("Step 3: Getting Instagram Business Account...\n");

  const igRes = await fetch(
    graphUrl(`/${targetPage.id}`, pageAccessToken, "&fields=instagram_business_account")
  );
  const igData = await igRes.json() as {
    instagram_business_account?: { id: string };
    error?: { message: string };
  };

  if (igData.error) {
    console.error("Failed to get Instagram account:", igData.error.message);
  }

  const igAccountId = igData.instagram_business_account?.id;

  if (igAccountId) {
    console.log(`  Instagram Business Account ID: ${igAccountId}\n`);
  } else {
    console.log("  No Instagram Business Account linked to this page.");
    console.log("  Link one at: Facebook Page Settings → Linked Accounts → Instagram\n");
  }

  console.log("=".repeat(60));
  console.log("ADD THESE ENV VARS TO RAILWAY:");
  console.log("=".repeat(60));
  console.log();
  console.log(`FACEBOOK_PAGE_ID=${targetPage.id}`);
  console.log(`FACEBOOK_ACCESS_TOKEN=${pageAccessToken}`);
  if (igAccountId) {
    console.log(`INSTAGRAM_ACCOUNT_ID=${igAccountId}`);
    console.log(`INSTAGRAM_ACCESS_TOKEN=${pageAccessToken}`);
  }
  console.log();
  console.log("NOTE: This page token never expires (derived from long-lived user token).");
  console.log("=".repeat(60));
}

run().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
