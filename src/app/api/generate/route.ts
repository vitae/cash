import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const PROMPTS: Record<string, string> = {
  sponsor: "You are a professional copywriter for flow artists. Write a compelling sponsor pitch email based on the artist's info. Professional but warm. Include: subject line, intro, why they fit, proposal, social proof, CTA, sign-off. Under 400 words.",
  booking: "You are an event industry copywriter creating booking sheets for flow arts performers. Create a clean, scannable booking document. Include: header, performance types, tech rider, rate card, availability, contact.",
  epk: "You are a publicist creating an Electronic Press Kit for a flow artist. Write a third-person artist profile for production companies and festivals. Include: one-line bio, full bio, signature prop, achievements, testimonials, socials.",
};

export async function POST(request: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const { type, formData } = await request.json();
    if (!type || !formData) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const lines = [`Generate a ${type} for this flow artist:\n`];
    for (const [key, value] of Object.entries(formData)) {
      if (!value) continue;
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      lines.push(`${label}: ${Array.isArray(value) ? (value as string[]).join(", ") : value}`);
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: PROMPTS[type] || PROMPTS.sponsor,
      messages: [{ role: "user", content: lines.join("\n") }],
    });

    const content = message.content.filter((b) => b.type === "text").map((b) => b.type === "text" ? b.text : "").join("\n");
    return NextResponse.json({ content });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
