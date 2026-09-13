import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArtistJsonLd } from "@/components/seo/ArtistJsonLd";
import { PianoUniverse } from "@/components/home/universe/PianoUniverse";
import { getHomeUniverseData } from "@/lib/data/home-universe";
import { FeaturedComposition } from "@/components/home/FeaturedComposition";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import {
  ScrollScene,
  SectionIndicator,
  StaggerLines,
} from "@/components/motion/ScrollScene";
import {
  HorizontalShowcase,
  ShowcaseCard,
} from "@/components/motion/HorizontalShowcase";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { SpotifyEmbed } from "@/components/media/SpotifyEmbed";
import { SocialLinks } from "@/components/media/SocialLinks";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { ContactForm } from "@/components/contact/ContactForm";
import { mediaConfig } from "@/config/media";
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
  const videos = content.media
    .filter((item) => item.type === "youtube")
    .slice(0, 3);
  return (
    <>
      <ArtistJsonLd social={content.social} />
      <PianoUniverse data={getHomeUniverseData(content, products)} />
      <section
        id="media"
        data-nav-section
        className="portfolio-section portfolio-section--reel"
        aria-labelledby="media-title"
      >
        <div className="container-editorial">
          <Reveal className="section-top">
            <div>
              <span className="section-number">02 / Listen & watch</span>
              <StaggerLines
                id="media-title"
                className="section-title"
                lines={["Music, in the moment."]}
              />
            </div>
            <Link href="/media" className="action-text">
              All performances <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          <SectionIndicator />
        </div>
        {/* Pinned horizontal reel: vertical wheel travel drives the rail
            sideways, then the page resumes vertical flow below the track. */}
        <HorizontalShowcase label="Performance reel">
          <ShowcaseCard span={0.75} className="showcase-card--intro">
            <span className="section-number">The reel</span>
            <h3>Keep scrolling — the room moves sideways.</h3>
            <p className="section-lead">
              Recitals, studio sessions and the record, laid out end to end.
            </p>
          </ShowcaseCard>
          {videos.map((item) => (
            <ShowcaseCard key={item.id} className="media-card" span={1.15}>
              <YouTubeEmbed
                url={item.youtubeUrl}
                title={item.title}
                poster={item.poster}
              />
              <span className="media-meta">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </ShowcaseCard>
          ))}
          {!videos.length ? (
            <ShowcaseCard span={1.15}>
              <p className="section-lead">
                New performances will be shared here soon.
              </p>
            </ShowcaseCard>
          ) : null}
          <ShowcaseCard span={1.5} className="showcase-card--record">
            <div>
              <span className="section-number">On record</span>
              <h3>A closer listen.</h3>
              <p className="section-lead">
                Original music and piano recordings, wherever you listen.
              </p>
              <div className="mt-6">
                <SocialLinks social={content.social} />
              </div>
            </div>
            <SpotifyEmbed
              url={content.social.spotify || mediaConfig.spotifyUrl}
            />
          </ShowcaseCard>
          {gallery.slice(0, 3).map((photo) => (
            <ShowcaseCard key={photo.id} span={0.7} className="showcase-photo">
              <Link href="/gallery" aria-label={photo.caption || "Open gallery"}>
                <span className="showcase-photo-frame">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption || "Gallery photograph"}
                    fill
                    sizes="(min-width: 761px) 32vw, 80vw"
                  />
                </span>
                <span className="gallery-caption">
                  {photo.caption || "At the piano"}
                  <ArrowUpRight size={18} aria-hidden />
                </span>
              </Link>
            </ShowcaseCard>
          ))}
          <ShowcaseCard span={0.95} className="showcase-card--outro">
            <span className="section-number">03 / On stage</span>
            <h3>Next at the piano.</h3>
            {content.home.performances.length ? (
              <ul className="showcase-dates">
                {content.home.performances.slice(0, 3).map((performance, i) => (
                  <li key={performance.date + i}>
                    <time dateTime={performance.date}>
                      {formatDate(performance.date)}
                    </time>
                    <span>{performance.title}</span>
                    <span>{performance.venue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="section-lead">
                New concert dates will be announced here.
              </p>
            )}
            <Link href="/contact" className="action-text">
              Booking inquiries <ArrowUpRight size={18} aria-hidden />
            </Link>
          </ShowcaseCard>
        </HorizontalShowcase>
      </section>
      <section
        id="concerts"
        data-nav-section
        className="portfolio-section"
        aria-labelledby="concerts-title"
      >
        <div className="container-editorial">
          <Reveal className="section-top">
            <div>
              <span className="section-number">03 / On stage</span>
              <StaggerLines
                id="concerts-title"
                className="section-title"
                lines={["Upcoming & recent."]}
              />
            </div>
            <Link href="/contact" className="action-text">
              Booking inquiries <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          <SectionIndicator />
          {content.home.performances.length ? (
            content.home.performances.map((performance, i) => (
              <ScrollScene
                key={performance.date + i}
                className="concert-row"
                depth={0.5}
              >
                <time dateTime={performance.date}>
                  {formatDate(performance.date)}
                </time>
                <h3>{performance.title}</h3>
                <p>
                  {performance.venue}
                  <br />
                  {performance.location}
                </p>
              </ScrollScene>
            ))
          ) : (
            <p className="section-lead">
              New concert dates will be announced here. Please get in touch for
              booking inquiries.
            </p>
          )}
        </div>
      </section>
      <section
        id="gallery"
        data-nav-section
        className="portfolio-section"
        aria-labelledby="gallery-title"
      >
        <div className="container-editorial">
          <Reveal className="section-top">
            <div>
              <span className="section-number">04 / In frame</span>
              <StaggerLines
                id="gallery-title"
                className="section-title"
                lines={["Beyond the notes."]}
              />
            </div>
            <Link href="/gallery" className="action-text">
              Full gallery <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          <SectionIndicator />
          {/* Not wrapped in ScrollScene: the lightbox renders a fixed overlay,
              which a transformed ancestor would re-anchor and break. */}
          <GalleryLightbox images={gallery.slice(0, 6)} />
          <div className="mt-7">
            <a
              className="action-text"
              href={content.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow @Reza_Ohadi on Instagram{" "}
              <ArrowUpRight size={18} aria-hidden />
            </a>
          </div>
        </div>
      </section>
      {featured ? (
        <section
          className="portfolio-section"
          aria-label="Featured composition"
        >
          <ScrollScene depth={0.7}>
            <FeaturedComposition product={featured} />
          </ScrollScene>
        </section>
      ) : null}
      <section className="portfolio-section" aria-labelledby="scores-title">
        <div className="container-editorial">
          <Reveal className="section-top">
            <div>
              <span className="section-number">The catalogue</span>
              <StaggerLines
                id="scores-title"
                className="section-title"
                lines={["New to the catalogue."]}
              />
            </div>
            <Link className="action-text" href="/store">
              All sheet music <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          <SectionIndicator />
          <div className="media-grid">
            {products.slice(0, 3).map((product, i) => (
              <ScrollScene key={product.id} depth={0.55 + i * 0.3}>
                <ProductCard product={product} />
              </ScrollScene>
            ))}
          </div>
        </div>
      </section>
      <section className="portfolio-section">
        <div className="container-editorial">
          <ScrollScene
            as="blockquote"
            depth={1.15}
            className="mx-auto max-w-3xl text-center font-serif text-3xl italic leading-relaxed"
          >
            In the space between two notes, a silence remembers everything the
            music meant to say.
          </ScrollScene>
        </div>
      </section>
      <section
        id="contact"
        data-nav-section
        className="portfolio-section"
        aria-labelledby="contact-title"
      >
        <div className="container-editorial contact-grid">
          <Reveal>
            <span className="section-number">05 / Get in touch</span>
            <StaggerLines
              id="contact-title"
              className="section-title"
              lines={["Let’s make", "something resonant."]}
            />
            <SectionIndicator />
            <p className="section-lead mt-6">
              Bookings, commissions & collaborations. For performances,
              sheet-music licensing, lessons, or a new idea.
            </p>
            <a
              className="action-text mt-6 break-all"
              href={"mailto:" + content.social.email}
            >
              {content.social.email} <ArrowUpRight size={18} aria-hidden />
            </a>
            <SocialLinks social={content.social} />
          </Reveal>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
