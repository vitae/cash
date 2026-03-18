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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const artistName = formData.get("artistName") as string | null;
    const email = formData.get("email") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!artistName || artistName.trim().length === 0) {
      return NextResponse.json({ error: "Artist name is required." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
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
    const slug = artistName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
        artist_name: artistName.trim(),
        email: email.trim().toLowerCase(),
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
