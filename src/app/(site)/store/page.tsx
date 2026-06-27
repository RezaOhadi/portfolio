import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StoreGrid } from "@/components/store/StoreGrid";
import { getProducts } from "@/lib/data/products";
import { isStripeConfigured } from "@/lib/env";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sheet Music",
  description:
    "A curated catalogue of original piano sheet music by Reza Ohadi — instant, secure PDF delivery after purchase.",
};

export default async function StorePage() {
  const products = await getProducts();

  return (
    <>
      <PageHeader
        kicker="Sheet Music"
        title="The catalogue"
        description="Original compositions for solo piano, engraved with care. Preview every score, then purchase for instant, secure PDF delivery."
      />

      <section className="container-editorial pb-28 md:pb-40">
        {!isStripeConfigured ? (
          <p className="mb-10 rounded-sm border border-white/12 bg-white/[0.03] px-5 py-4 font-sans text-xs leading-relaxed text-silver-300">
            <span className="uppercase tracking-widest text-ivory">Demo mode</span> — checkout
            is disabled until Stripe is configured. Browsing and previews work fully.
          </p>
        ) : null}
        <StoreGrid products={products} />
      </section>
    </>
  );
}
