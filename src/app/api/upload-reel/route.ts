import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/hevc",
  "video/webm",
];
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limiter (per IP, 10 uploads/hour)
const uploadCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploadCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait before trying again." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const artistName = formData.get("artistName") as string | null;
    const email = formData.get("email") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Email is optional — validate with proper regex if provided
    const validEmail = email && EMAIL_REGEX.test(email.trim()) ? email.trim().toLowerCase() : null;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: MP4, MOV, HEVC, WebM." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 500 MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "mp4";
    const slug = artistName?.trim()
      ? artistName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50)
      : "upload";
    const filename = `${slug}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from("reels")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file. Please try again." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("reels")
      .getPublicUrl(filename);

    // Save to reel_submissions table
    const { error: dbError } = await supabaseAdmin
      .from("reel_submissions")
      .insert({
        artist_name: artistName?.trim() || "Unknown Artist",
        email: validEmail,
        video_url: urlData.publicUrl,
        status: "pending",
        description: description?.trim() || null,
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    return NextResponse.json(
      { success: true, url: urlData.publicUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload reel error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
