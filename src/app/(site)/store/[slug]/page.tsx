import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileText, Music, Youtube, Instagram } from "lucide-react";
import { ScorePreview } from "@/components/store/ScorePreview";
import { PurchaseButton } from "@/components/store/PurchaseButton";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/data/products";
import { absoluteUrl, formatDuration, formatPrice } from "@/lib/utils";
import { isStripeConfigured } from "@/lib/env";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Score not found" };

  const image = product.coverImage.startsWith("http")
    ? product.coverImage
    : absoluteUrl(product.coverImage);

  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: {
      title: `${product.title} — Sheet Music`,
      description: product.shortDescription,
      images: [{ url: image }],
      type: "website",
    },
  };
}

function ProductJsonLd({ product }: { product: Awaited<ReturnType<typeof getProductBySlug>> }) {
  if (!product) return null;
  const image = product.coverImage.startsWith("http")
    ? product.coverImage
    : absoluteUrl(product.coverImage);
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [image],
    description: product.shortDescription,
    brand: { "@type": "Brand", name: "Reza Ohadi" },
    category: product.genre,
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency.toUpperCase(),
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/store/${product.slug}`),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <>
      <ProductJsonLd product={product} />

      <div className="container-editorial pt-28 md:pt-36">
        <Link
          href="/store"
          className="group inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-widest text-silver-300 transition-colors hover:text-ivory"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-cinematic group-hover:-translate-x-1" />
          The Catalogue
        </Link>
      </div>

      <article className="container-editorial grid gap-12 py-10 lg:grid-cols-12 lg:gap-16 lg:py-16">
        {/* Left — identity, cover, audio, purchase */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <span className="kicker">
              {product.genre} · {product.instrument}
            </span>
            <h1 className="mt-4 font-serif text-5xl leading-[1.02] text-ivory sm:text-6xl">
              {product.title}
            </h1>
            <p className="mt-3 font-sans text-sm uppercase tracking-widest text-silver-400">
              {product.composer}
            </p>

            <div className="relative mt-8 aspect-[4/5] overflow-hidden bg-charcoal-900 ring-1 ring-white/10">
              <Image
                src={product.coverImage}
                alt={`${product.title} cover artwork`}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>

            <div className="mt-6">
              <AudioPlayer src={product.audioPreviewUrl} title="Audio preview" />
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-white/10 py-6">
              <Meta label="Difficulty" value={product.difficulty} icon={<Music className="h-4 w-4" />} />
              <Meta label="Pages" value={`${product.pages}`} icon={<FileText className="h-4 w-4" />} />
              <Meta label="Duration" value={formatDuration(product.durationSeconds)} icon={<Clock className="h-4 w-4" />} />
              <Meta label="Mood" value={product.mood} />
            </dl>

            <div className="mt-8">
              <PurchaseButton
                slug={product.slug}
                priceCents={product.priceCents}
                currency={product.currency}
                enabled={isStripeConfigured}
              />
            </div>

            {(product.youtubeUrl || product.instagramUrl) && (
              <div className="mt-6 flex items-center gap-5 text-silver-400">
                {product.youtubeUrl ? (
                  <a href={product.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors hover:text-ivory">
                    <Youtube className="h-4 w-4" /> Performance
                  </a>
                ) : null}
                {product.instagramUrl ? (
                  <a href={product.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors hover:text-ivory">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Right — preview + program note */}
        <div className="lg:col-span-7">
          <ScorePreview images={product.previewImages} title={product.title} />

          <div className="mt-12">
            <h2 className="kicker mb-4">About this score</h2>
            <p className="max-w-prose whitespace-pre-line font-sans text-base leading-relaxed text-silver-200">
              {product.longDescription || product.shortDescription}
            </p>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length ? (
        <section className="container-editorial border-t border-white/10 py-20 md:py-28">
          <SectionHeading kicker="Related" title="You may also like" className="mb-12" />
          <Stagger className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ) : null}
    </>
  );
}

function Meta({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-silver-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-serif text-xl text-ivory">{value}</dd>
    </div>
  );
}
