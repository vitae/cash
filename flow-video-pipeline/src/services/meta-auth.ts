import crypto from "crypto";

const APP_SECRET = process.env.META_APP_SECRET || "8411f8ff6a144956773cf10576db89ad";

/**
 * Generate appsecret_proof for Meta Graph API calls.
 * Required when "Require App Secret" is enabled (default for production apps).
 */
export function appsecretProof(accessToken: string): string {
  return crypto.createHmac("sha256", APP_SECRET).update(accessToken).digest("hex");
}
