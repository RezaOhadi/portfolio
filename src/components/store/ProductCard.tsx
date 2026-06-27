import Image from "next/image";
import Link from "next/link";
import { Headphones, ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * Premium editorial product card. Whole card is a single link; hover reveals a
 * "View Score" affordance and gently zooms the artwork. CSS-only interactions
 * for performance (no per-card JS).
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const canListen = Boolean(product.audioPreviewUrl || product.youtubeUrl);

  return (
    <article className="group">
      <Link
        href={`/store/${product.slug}`}
        className="block focus-visible:outline-none"
        aria-label={`View score — ${product.title}, ${formatPrice(product.priceCents, product.currency)}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-charcoal-900 ring-1 ring-white/10 transition-all duration-700 ease-cinematic group-hover:ring-white/25">
          <Image
            src={product.coverImage}
            alt={`${product.title} — cover artwork`}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-[1300ms] ease-cinematic will-change-transform group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent opacity-90" />

          {/* top meta */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <span className="kicker text-ivory/80">{product.difficulty}</span>
            {canListen ? (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/40 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-ivory/80 backdrop-blur">
                <Headphones className="h-3 w-3" /> Listen
              </span>
            ) : null}
          </div>

          {/* hover CTA */}
          <div className="absolute inset-x-0 bottom-0 translate-y-3 p-5 opacity-0 transition-all duration-500 ease-cinematic group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center gap-2 border-b border-ivory pb-1 text-[0.72rem] uppercase tracking-widest text-ivory">
              View Score <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-2xl text-ivory">
              {product.title}
            </h3>
            <p className="kicker mt-1 truncate normal-case tracking-wider text-silver-400">
              {product.genre} · {product.instrument}
            </p>
          </div>
          <span className="shrink-0 font-sans text-sm tabular-nums text-ivory">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>
      </Link>
    </article>
  );
}
