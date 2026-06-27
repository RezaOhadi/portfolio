import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { fulfillCheckout } from "@/lib/stripe/fulfill";
import { env } from "@/lib/env";

// Webhooks need the raw body + Node runtime (no edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as { id: string };
        await fulfillCheckout(session.id);
        break;
      }
      default:
        // Ignore other events.
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] handler error:", e);
    // 500 → Stripe will retry.
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
