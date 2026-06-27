import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getProductBySlug } from "@/lib/data/products";
import { checkoutSchema } from "@/lib/validation";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured in this environment yet." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const product = await getProductBySlug(parsed.data.slug);
  if (!product) {
    return NextResponse.json({ error: "Score not found." }, { status: 404 });
  }

  const coverHttps = product.coverImage.startsWith("http")
    ? [product.coverImage]
    : undefined;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Guest checkout: Stripe collects the email; no account required.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: product.priceCents,
            product_data: {
              name: product.title,
              description: product.shortDescription?.slice(0, 250),
              images: coverHttps,
              metadata: { product_id: product.id, slug: product.slug },
            },
          },
        },
      ],
      metadata: { product_id: product.id, product_slug: product.slug },
      payment_intent_data: {
        metadata: { product_id: product.id, product_slug: product.slug },
      },
      allow_promotion_codes: false,
      success_url: absoluteUrl(
        "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      ),
      cancel_url: absoluteUrl(`/store/${product.slug}`),
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] failed:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
