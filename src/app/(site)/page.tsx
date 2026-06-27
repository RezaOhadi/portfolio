import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { ArtistJsonLd } from "@/components/seo/ArtistJsonLd";
import { FeaturedComposition } from "@/components/home/FeaturedComposition";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PianoDivider } from "@/components/ui/PianoDivider";
import { Button } from "@/components/ui/Button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { DrawLine } from "@/components/motion/DrawLine";
import { getSiteContent } from "@/lib/data/content";
import { getProducts } from "@/lib/data/products";
import { getGalleryImages } from "@/lib/data/gallery";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const [content, products, gallery] = await Promise.all([
    getSiteContent(),
    getProducts(),
    getGalleryImages(),
  ]);

  const featured =
    products.find((p) => p.slug === content.home.featuredProductSlug) ??
    products.find((p) => p.featured) ??
    products[0];
  const latest = products.slice(0, 3);
  const galleryPreview = gallery.slice(0, 4);
  const statementLines = content.home.artistStatement
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <ArtistJsonLd social={content.social} />
      <Hero hero={content.hero} />

      {/* Featured composition */}
      {featured ? (
        <section className="py-24 md:py-32">
          <FeaturedComposition product={featured} />
        </section>
      ) : null}

      <PianoDivider label="The Catalogue" />

      {/* Latest sheet music */}
      <section className="py-24 md:py-32">
        <div className="container-editorial">
          <div className="mb-14 flex items-end justify-between gap-6">
            <SectionHeading
              kicker="Latest Sheet Music"
              title="New to the catalogue"
            />
            <Reveal className="hidden shrink-0 sm:block">
              <Link
                href="/store"
                className="group inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-widest text-silver-300 transition-colors hover:text-ivory"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-cinematic group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <Stagger className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Artist statement */}
      <section className="relative overflow-hidden py-28 md:py-40">
        <div className="pointer-events-none absolute inset-0 bg-hall-glow opacity-60" />
        <div className="container-editorial relative">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <span className="kicker">Artist Statement</span>
            </Reveal>
            <Stagger
              as="blockquote"
              stagger={0.14}
              className="mt-8 font-serif text-3xl font-light leading-[1.3] text-ivory sm:text-4xl lg:text-5xl"
            >
              {statementLines.map((line, i) => (
                <StaggerItem as="span" key={i} className="block">
                  {i === 0 ? "“" : ""}
                  {line}
                  {i === statementLines.length - 1 ? "”" : ""}
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal delay={0.1} className="mt-12 flex flex-col items-center gap-5">
              {content.bio.signatureImage ? (
                <Image
                  src={content.bio.signatureImage}
                  alt="Reza Ohadi signature"
                  width={200}
                  height={64}
                  className="h-14 w-auto opacity-80"
                />
              ) : null}
              <DrawLine className="text-silver-300/60" />
              <Link
                href="/biography"
                className="group inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-widest text-silver-300 transition-colors hover:text-ivory"
              >
                Read the full biography
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-cinematic group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Selected performances */}
      {content.home.performances.length ? (
        <section className="py-24 md:py-32">
          <div className="container-editorial">
            <SectionHeading
              kicker="Selected Performances"
              title="Upcoming & recent"
              className="mb-12"
            />
            <Stagger className="flex flex-col">
              {content.home.performances.map((perf, i) => (
                <StaggerItem
                  key={i}
                  className="group grid grid-cols-1 gap-2 border-t border-white/10 py-7 transition-colors last:border-b hover:bg-white/[0.02] sm:grid-cols-12 sm:items-baseline sm:gap-6"
                >
                  <span className="font-sans text-xs uppercase tracking-widest text-silver-400 sm:col-span-3">
                    {formatDate(perf.date)}
                  </span>
                  <span className="font-serif text-2xl text-ivory sm:col-span-6">
                    {perf.title}
                  </span>
                  <span className="font-sans text-sm text-silver-300 sm:col-span-3 sm:text-right">
                    {perf.venue}, {perf.location}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <PianoDivider label="In Frame" />

      {/* Gallery preview */}
      <section className="py-24 md:py-32">
        <div className="container-editorial">
          <div className="mb-12 flex items-end justify-between gap-6">
            <SectionHeading kicker="Gallery" title="Moments in black & white" />
            <Reveal className="hidden shrink-0 sm:block">
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-widest text-silver-300 transition-colors hover:text-ivory"
              >
                Full gallery
                <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-cinematic group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
          <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {galleryPreview.map((img) => (
              <StaggerItem key={img.id}>
                <Link
                  href="/gallery"
                  className="group relative block aspect-[3/4] overflow-hidden bg-charcoal-900 ring-1 ring-white/10"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.caption ?? "Gallery image"}
                    fill
                    sizes="(min-width: 768px) 22vw, 45vw"
                    className="object-cover grayscale transition-all duration-700 ease-cinematic group-hover:scale-105 group-hover:grayscale-0"
                  />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-white/10 py-28 md:py-40">
        <div className="container-editorial text-center">
          <Reveal>
            <span className="kicker">Get in touch</span>
          </Reveal>
          <SectionHeading
            align="center"
            title="Bookings, commissions & collaborations"
            className="mt-6"
            titleClassName="mx-auto"
          />
          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <Button href="/contact" variant="primary" size="lg">
              Start a conversation <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
