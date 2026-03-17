import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json();
    const origin = request.headers.get("origin") || "https://cash-gwdf.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: 500,
          product_data: {
            name: "Flow Arts Professional — All 3 Generators",
            description: "Custom Sponsor Pitch + Event Booking Sheet + Artist Press Kit. One-time payment, lifetime access, unlimited uses.",
          },
        },
        quantity: 1,
      }],
      metadata: { flow_type: body.flowType || "all", source: "flow_arts_professional_gwdf" },
      custom_text: {
        submit: { message: "The Thinking Has Already Been Done, So You Can Create! Your generators will be unlocked instantly after payment." },
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=true`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
