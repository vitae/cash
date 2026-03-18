import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistName, email, videoUrl } = body;

    if (!artistName || typeof artistName !== "string" || artistName.trim().length === 0) {
      return NextResponse.json(
        { error: "artistName is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { error: "videoUrl is required." },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(videoUrl);
    } catch {
      return NextResponse.json(
        { error: "videoUrl must be a valid URL." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("reel_submissions")
      .insert({
        artist_name: artistName.trim(),
        email: email.trim().toLowerCase(),
        video_url: videoUrl.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Reel submission error:", error);
      return NextResponse.json(
        { error: "Failed to save submission. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, submissionId: data.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Submit reel error:", err);
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
