import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "https://cash-gwdf.vercel.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://cash-gwdf.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 500,
            product_data: {
              name: "Flow Arts Professional — All 3 Generators",
              description:
                "Custom Sponsor Pitch + Event Booking Sheet + Artist Press Kit. One-time payment, lifetime access, unlimited uses.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        flow_type: body.flowType || "all",
        source: "flow_arts_professional_gwdf",
      },
      custom_text: {
        submit: {
          message:
            "The Thinking Has Already Been Done, So You Can Create! Your generators will be unlocked instantly after payment.",
        },
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=true`,
    });

    return NextResponse.json(
      { url: session.url, sessionId: session.id },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    const message =
      err instanceof Stripe.errors.StripeError
        ? `Stripe error: ${err.message}`
        : "Failed to create checkout session. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
