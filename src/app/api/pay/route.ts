import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_SITE_URL || "https://flowarts.pro",
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
      "https://flowarts.pro";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      // Don't restrict payment_method_types — lets Stripe auto-enable
      // Apple Pay, Google Pay, Link, and other wallets based on device
      line_items: [
        {
          price: "price_1TC9DpQQiXDm8D55crP980w8",
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
            "One-Time Payment. Unlimited Lifetime Access. Your generators will be unlocked instantly.",
        },
      },
      return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json(
      { clientSecret: session.client_secret },
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
