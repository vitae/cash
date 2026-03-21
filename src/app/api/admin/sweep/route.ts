import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "of079dkzzdwq5snjgeyv4zdzbflaqwt9";
const RAILWAY_URL = process.env.RAILWAY_URL || "https://cash-production-680c.up.railway.app";

export async function POST(req: NextRequest) {

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(`${RAILWAY_URL}/sweep`, {
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
