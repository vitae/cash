import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function sendWelcomeEmail(email: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Flow Arts Professional <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Flow Arts Professional — Your Generators Are Ready",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #000; color: #fff; padding: 40px 32px; border-radius: 16px;">
          <h1 style="color: #00FF00; font-size: 28px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 8px;">Flow Arts Professional</h1>
          <div style="width: 200px; height: 2px; background: rgba(255,0,255,0.4); margin-bottom: 24px;"></div>
          <p style="color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.7; margin-bottom: 20px;">Thank you for your purchase! Your 3 AI-powered generators are now unlocked:</p>
          <div style="margin-bottom: 24px;">
            <div style="padding: 12px 16px; background: rgba(0,255,0,0.06); border: 1px solid rgba(0,255,0,0.15); border-radius: 12px; margin-bottom: 8px;">
              <span style="color: #00FF00; font-weight: 600;">Custom Sponsor Pitch</span>
              <span style="color: rgba(255,255,255,0.4); font-size: 13px;"> — Personalized outreach to 50+ brands</span>
            </div>
            <div style="padding: 12px 16px; background: rgba(255,0,255,0.06); border: 1px solid rgba(255,0,255,0.15); border-radius: 12px; margin-bottom: 8px;">
              <span style="color: #FF00FF; font-weight: 600;">Event Booking Sheet</span>
              <span style="color: rgba(255,255,255,0.4); font-size: 13px;"> — Tech rider, rates, and availability</span>
            </div>
            <div style="padding: 12px 16px; background: rgba(0,255,0,0.06); border: 1px solid rgba(0,255,0,0.15); border-radius: 12px;">
              <span style="color: #00FF00; font-weight: 600;">Artist Press Kit</span>
              <span style="color: rgba(255,255,255,0.4); font-size: 13px;"> — Full EPK with bio, reels, and socials</span>
            </div>
          </div>
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6;">You have <strong style="color: #00FF00;">10 generations</strong> included. Use them wisely to craft the perfect pitch, booking sheet, and press kit.</p>
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
            <p style="color: rgba(255,0,255,0.4); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Glow Wit Da Flow</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email send error:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { verified: false, error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { verified: false, error: "Payment not completed" },
        { status: 402 }
      );
    }

    const customerEmail = session.customer_details?.email || null;

    // Check if purchase is already recorded
    const { data: existing } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("purchases").insert({
        stripe_session_id: sessionId,
        stripe_customer_email: customerEmail,
        amount_cents: session.amount_total || 500,
        status: "paid",
      });

      // Send welcome email on first verification
      if (customerEmail) {
        sendWelcomeEmail(customerEmail);
      }
    }

    return NextResponse.json({
      verified: true,
      email: customerEmail,
    });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json(
      { verified: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
