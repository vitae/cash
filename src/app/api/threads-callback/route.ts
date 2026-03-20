import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<html><body style="background:#000;color:#ff5050;font-family:monospace;padding:40px">
        <h2>Threads Authorization Failed</h2>
        <p>Error: ${error}</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code) {
    return new NextResponse(
      `<html><body style="background:#000;color:#ff5050;font-family:monospace;padding:40px">
        <h2>No authorization code received</h2>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(
    `<html><body style="background:#000;color:#00ff00;font-family:monospace;padding:40px">
      <h2>Threads Authorization Successful!</h2>
      <p>Your authorization code:</p>
      <pre style="background:#111;padding:20px;border-radius:8px;font-size:18px;word-break:break-all">${code}</pre>
      <p style="color:#888;margin-top:20px">Now run this in your terminal:</p>
      <pre style="background:#111;padding:15px;border-radius:8px;color:#ff00ff">cd flow-video-pipeline && npx tsx scripts/threads-setup.ts ${code}</pre>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
