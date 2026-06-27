import { getStripe } from "./server";
import { getProductBySlug } from "@/lib/data/products";
import { upsertPurchase } from "@/lib/data/purchases";
import { sendPurchaseEmail } from "@/lib/email/purchase";
import type { Purchase } from "@/lib/types";

export type FulfillResult =
  | { ok: true; purchase: Purchase }
  | { ok: false; reason: "not_configured" | "not_paid" | "missing_data" | "store_failed" };

/**
 * Verifies a Checkout Session with Stripe and records the purchase (idempotent).
 * Sends the confirmation email exactly once (only when the row is first created).
 * Called from BOTH the webhook and the success page so fulfillment is reliable
 * regardless of which arrives first.
 */
export async function fulfillCheckout(sessionId: string): Promise<FulfillResult> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, reason: "not_configured" };

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }

  const productId = session.metadata?.product_id;
  const slug = session.metadata?.product_slug ?? null;
  const email = session.customer_details?.email ?? session.customer_email ?? null;

  if (!productId || !email) return { ok: false, reason: "missing_data" };

  const product = slug ? await getProductBySlug(slug) : null;

  const result = await upsertPurchase({
    productId,
    productSlug: slug,
    productTitle: product?.title ?? null,
    customerEmail: email,
    stripeSessionId: session.id,
    stripePaymentIntent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountCents: session.amount_total ?? product?.priceCents ?? 0,
    currency: session.currency ?? product?.currency ?? "usd",
    status: "paid",
  });

  if (!result) return { ok: false, reason: "store_failed" };

  if (result.created) {
    // Fire the confirmation email once. Don't fail fulfillment if email fails.
    try {
      await sendPurchaseEmail(result.purchase);
    } catch (e) {
      console.error("[fulfill] email failed:", e);
    }
  }

  return { ok: true, purchase: result.purchase };
}
