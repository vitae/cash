import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_TYPES = ["sponsor", "booking", "epk", "festival", "instagram"] as const;
type GenerationType = (typeof VALID_TYPES)[number];

const MAX_GENERATIONS_PER_SESSION = 10;

const PROMPTS: Record<GenerationType, string> = {
  sponsor:
    "You are a professional copywriter for flow artists. Write a compelling sponsor pitch email based on the artist's info. Professional but warm. Include: subject line, intro, why they fit, proposal, social proof, CTA, sign-off. Under 400 words.",
  booking:
    "You are an event industry copywriter creating booking sheets for flow arts performers. Create a clean, scannable booking document. Include: header, performance types, tech rider, rate card, availability, contact.",
  epk:
    "You are a publicist creating an Electronic Press Kit for a flow artist. Write a third-person artist profile for production companies and festivals. Include: one-line bio, full bio, signature prop, achievements, testimonials, socials.",
  festival:
    "You are an experienced festival performer who has been accepted to 100+ festivals. Write a compelling festival performer application that stands out from hundreds of other applicants. Be specific about what this artist brings that's unique. Include: attention-grabbing opening statement, performance description with sensory details, relevant experience and festivals, what makes their act special for THIS specific festival's audience, technical requirements, workshop offering if applicable, and a confident closing. Keep it under 500 words. Make it feel authentic and passionate, not corporate.",
  instagram:
    "You are a viral content strategist, direct-response copywriter, and short-form video growth hacker for flow arts. Given an artist's profile, generate a complete Instagram Reels content engine. Output the following four sections:\n\n## SECTION 1 — 10 HIGH-PERFORMING REEL IDEAS\nFor each idea provide:\n- **Title**: Short punchy name\n- **Hook** (first 1–2 seconds): Exact text or action that stops the scroll\n- **Content Type**: e.g. Tutorial, Viral, Progression, Aesthetic, Behind-the-Scenes, Transformation\n- **Why It Performs**: 1–2 sentences on the psychology / algorithm reason\n\nConstraints: fits fire/LED/dance/movement, visually engaging in first 2 seconds, beginner-friendly or aspirational, remixable from existing content.\n\n## SECTION 2 — DIRECT-RESPONSE COPY (pick the top 3 ideas from Section 1)\nFor each of the 3 ideas provide:\n- **Caption** (short, punchy, no fluff, curiosity + simplicity)\n- **CTA**: Drives traffic to link in bio — must include a call to the free starter pack, $9 beginner product, or $20/month subscription\n- **3 Caption Variations** labeled A, B, C\n\n## SECTION 3 — 5 VIDEO VARIATIONS\nFor the single strongest idea, generate 5 variations:\n- Different hook\n- Different caption tone\n- Pacing note (slow / fast / loop)\n- Emotional angle (beginner / advanced / aesthetic / transformation / aspirational)\n\nGoal: maximize reach and retention.\n\n## SECTION 4 — CONVERSION STRATEGY\n- **Primary CTA** that drives to link in bio\n- **Landing Page Hook**: One headline that matches the reel's energy\n- **Offer Angles** for each tier:\n  - Free Starter Pack\n  - $9 Beginner Product\n  - $20/month Subscription\n\nTone: no fluff, direct, make beginners feel like they can do it. Under 900 words total.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, formData } = body;
    const sessionId =
      body.session_id ||
      request.nextUrl.searchParams.get("session_id");

    // --- Stripe session verification ---
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id. Payment is required." },
        { status: 401 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed. Please complete checkout first." },
        { status: 402 }
      );
    }

    // --- Input validation ---
    if (!type || !VALID_TYPES.includes(type as GenerationType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!formData || typeof formData !== "object" || Object.keys(formData).length === 0) {
      return NextResponse.json(
        { error: "Missing or empty formData." },
        { status: 400 }
      );
    }

    // --- Rate limiting per session ---
    const { count } = await supabaseAdmin
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("stripe_session_id", sessionId);

    if ((count ?? 0) >= MAX_GENERATIONS_PER_SESSION) {
      return NextResponse.json(
        {
          error: `Generation limit reached (${MAX_GENERATIONS_PER_SESSION} per purchase). Please purchase again for more.`,
        },
        { status: 429 }
      );
    }

    // --- Look up purchase row ---
    const { data: purchase } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    // --- Build prompt ---
    const lines = [`Generate a ${type} for this flow artist:\n`];
    for (const [key, value] of Object.entries(formData)) {
      if (!value) continue;
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      lines.push(
        `${label}: ${Array.isArray(value) ? (value as string[]).join(", ") : value}`
      );
    }

    // --- Stream from Anthropic ---
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: PROMPTS[type as GenerationType],
      messages: [{ role: "user", content: lines.join("\n") }],
    });

    // Collect artist name for the log
    const artistName =
      formData.artist_name ||
      formData.artistName ||
      formData.name ||
      "Unknown";

    // Log generation to Supabase
    await supabaseAdmin.from("generations").insert({
      purchase_id: purchase?.id || null,
      stripe_session_id: sessionId,
      type,
      artist_name: artistName,
    });

    // Return a streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Generate error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
