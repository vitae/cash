function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  supabase: {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  youtube: {
    clientId: requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    refreshToken: requireEnv("GOOGLE_REFRESH_TOKEN"),
  },
  instagram: {
    accessToken: requireEnv("INSTAGRAM_ACCESS_TOKEN"),
    accountId: requireEnv("INSTAGRAM_ACCOUNT_ID"),
  },
  facebook: {
    accessToken: requireEnv("FACEBOOK_ACCESS_TOKEN"),
    pageId: requireEnv("FACEBOOK_PAGE_ID"),
  },
  pollIntervalMs: parseInt(optionalEnv("POLL_INTERVAL_MS", "30000"), 10),
  tmpDir: optionalEnv("TMP_DIR", "/tmp/reels"),
} as const;
