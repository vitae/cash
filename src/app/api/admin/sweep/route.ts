import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "glowwitdaflow2026";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "of079dkzzdwq5snjgeyv4zdzbflaqwt9";
const RAILWAY_URL = process.env.RAILWAY_URL || "https://cash-production-680c.up.railway.app";

export async function POST(req: NextRequest) {
  const secret =
    req.headers.get("x-admin-secret") ||
    req.nextUrl.searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${RAILWAY_URL}/publish-now`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, message: text || "Sweep triggered" };
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sweep request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
