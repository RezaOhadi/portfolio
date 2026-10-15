import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArtistJsonLd } from "@/components/seo/ArtistJsonLd";
import { JourneyExperience } from "@/components/journey/JourneyExperience";
import { Transition, World } from "@/components/journey/Segments";
import {
  AboutOverlay,
  HeroOverlay,
  MusicOverlay,
} from "@/components/journey/overlays/Overlays";
import journeyStyles from "@/components/journey/journey.module.css";
import { getHomeUniverseData } from "@/lib/data/home-universe";
import { FeaturedComposition } from "@/components/home/FeaturedComposition";
import { GoldenGrandSection } from "@/components/golden-grand/GoldenGrandSection";
import { ProductCard } from "@/components/store/ProductCard";
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

/*
 * The home page is one continuous journey through a 3D piano. Every text
 * element declares its entrance role with data-fx (title, eyebrow, lede,
 * body, number, link, block, stagger, rule); see
 * components/journey/text/useTextChoreography.ts.
 */
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
  const universe = getHomeUniverseData(content, products);
  return (
    <>
      <ArtistJsonLd social={content.social} />
      <JourneyExperience>
        <World
          id="piano"
          as="section"
          sectionId="home"
          nav
          labelledBy="hero-title"
          className={journeyStyles.heroWorld}
        >
          <HeroOverlay data={universe} />
        </World>
        <Transition id="explode" />
        <World
          id="exploded"
          as="section"
          sectionId="about"
          nav
          labelledBy="about-title"
          className={journeyStyles.aboutWorld}
        >
          <AboutOverlay data={universe} />
        </World>
        <Transition id="dive" />
        <World id="corridor">
          <section
            id="music"
            data-fx-scope
            aria-labelledby="music-title"
            className={journeyStyles.musicWorld}
          >
            <MusicOverlay data={universe} />
          </section>
          {featured ? (
            <section
              data-fx-scope
              className="portfolio-section"
              aria-label="Featured composition"
            >
              <div data-fx="block">
                <FeaturedComposition product={featured} />
              </div>
            </section>
          ) : null}
          <section
            data-fx-scope
            className="portfolio-section"
            aria-labelledby="scores-title"
          >
            <div className="container-editorial">
              <div className="section-top">
                <div>
                  <span className="section-number" data-fx="eyebrow">
                    The catalogue
                  </span>
                  <h2
                    id="scores-title"
                    className="section-title"
                    data-fx="title"
                  >
                    New to the catalogue.
                  </h2>
                </div>
                <Link className="action-text" href="/store" data-fx="link">
                  All sheet music <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>
              <div data-fx="rule" aria-hidden />
              <div className="media-grid" data-fx="stagger">
                {products.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        </World>
        <Transition id="twist" />
        <World id="hammers">
          <section
            id="media"
            data-nav-section
            data-fx-scope
            className="portfolio-section portfolio-section--reel"
            aria-labelledby="media-title"
          >
            <div className="container-editorial">
              <div className="section-top">
                <div>
                  <span className="section-number" data-fx="eyebrow">
                    02 / Listen & watch
                  </span>
                  <h2
                    id="media-title"
                    className="section-title"
                    data-fx="title"
                  >
                    Music, in the moment.
                  </h2>
                </div>
                <Link href="/media" className="action-text" data-fx="link">
                  All performances <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>
              <div data-fx="rule" aria-hidden />
            </div>
            {/* Pinned horizontal reel: vertical wheel travel drives the rail
            sideways, then the page resumes vertical flow below the track. */}
            <HorizontalShowcase label="Performance reel">
              <ShowcaseCard span={0.75} className="showcase-card--intro">
                <span className="section-number" data-fx="eyebrow">
                  The reel
                </span>
                <h3 data-fx="lede">Keep scrolling — the room moves sideways.</h3>
                <p className="section-lead" data-fx="body">
                  Recitals, studio sessions and the record, laid out end to end.
                </p>
              </ShowcaseCard>
              {videos.map((item) => (
                <ShowcaseCard key={item.id} className="media-card" span={1.15}>
                  <div data-fx="block">
                    <YouTubeEmbed
                      url={item.youtubeUrl}
                      title={item.title}
                      poster={item.poster}
                    />
                  </div>
                  <span className="media-meta" data-fx="eyebrow">
                    {item.category}
                  </span>
                  <h3 data-fx="lede">{item.title}</h3>
                  <p data-fx="body">{item.description}</p>
                </ShowcaseCard>
              ))}
              {!videos.length ? (
                <ShowcaseCard span={1.15}>
                  <p className="section-lead" data-fx="lede">
                    New performances will be shared here soon.
                  </p>
                </ShowcaseCard>
              ) : null}
              <ShowcaseCard span={1.5} className="showcase-card--record">
                <div>
                  <span className="section-number" data-fx="eyebrow">
                    On record
                  </span>
                  <h3 data-fx="lede">A closer listen.</h3>
                  <p className="section-lead" data-fx="body">
                    Original music and piano recordings, wherever you listen.
                  </p>
                  <div className="mt-6" data-fx="stagger">
                    <SocialLinks social={content.social} />
                  </div>
                </div>
                <div data-fx="block">
                  <SpotifyEmbed
                    url={content.social.spotify || mediaConfig.spotifyUrl}
                  />
                </div>
              </ShowcaseCard>
              {gallery.slice(0, 3).map((photo) => (
                <ShowcaseCard
                  key={photo.id}
                  span={0.7}
                  className="showcase-photo"
                >
                  <Link
                    href="/gallery"
                    aria-label={photo.caption || "Open gallery"}
                    data-fx="block"
                  >
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
                <span className="section-number" data-fx="eyebrow">
                  03 / On stage
                </span>
                <h3 data-fx="lede">Next at the piano.</h3>
                {content.home.performances.length ? (
                  <ul className="showcase-dates" data-fx="stagger">
                    {content.home.performances
                      .slice(0, 3)
                      .map((performance, i) => (
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
                  <p className="section-lead" data-fx="body">
                    New concert dates will be announced here.
                  </p>
                )}
                <Link href="/contact" className="action-text" data-fx="link">
                  Booking inquiries <ArrowUpRight size={18} aria-hidden />
                </Link>
              </ShowcaseCard>
            </HorizontalShowcase>
          </section>
        </World>
        <Transition id="portal" />
        <World id="strings" className={journeyStyles.stringsWorld}>
          <section
            id="concerts"
            data-nav-section
            className="portfolio-section"
            aria-labelledby="concerts-title"
          >
            <div className="container-editorial">
              <div className="section-top">
                <div>
                  <span className="section-number" data-fx="eyebrow">
                    03 / On stage
                  </span>
                  <h2
                    id="concerts-title"
                    className="section-title"
                    data-fx="title"
                  >
                    Upcoming & recent.
                  </h2>
                </div>
                <Link href="/contact" className="action-text" data-fx="link">
                  Booking inquiries <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>
              <div data-fx="rule" aria-hidden />
              {content.home.performances.length ? (
                content.home.performances.map((performance, i) => (
                  <div key={performance.date + i} className="concert-row">
                    <time dateTime={performance.date} data-fx="number">
                      {formatDate(performance.date)}
                    </time>
                    <h3 data-fx="lede">{performance.title}</h3>
                    <p data-fx="body">
                      {performance.venue}
                      <br />
                      {performance.location}
                    </p>
                  </div>
                ))
              ) : (
                <p className="section-lead" data-fx="lede">
                  New concert dates will be announced here. Please get in touch
                  for booking inquiries.
                </p>
              )}
            </div>
          </section>
        </World>
        <Transition id="dissolve" />
        <World id="soundboard">
          <section
            id="gallery"
            data-nav-section
            data-fx-scope
            className="portfolio-section"
            aria-labelledby="gallery-title"
          >
            <div className="container-editorial">
              <div className="section-top">
                <div>
                  <span className="section-number" data-fx="eyebrow">
                    04 / In frame
                  </span>
                  <h2
                    id="gallery-title"
                    className="section-title"
                    data-fx="title"
                  >
                    Beyond the notes.
                  </h2>
                </div>
                <Link href="/gallery" className="action-text" data-fx="link">
                  Full gallery <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>
              <div data-fx="rule" aria-hidden />
              {/* The tiles animate individually: the lightbox is a native
              dialog in the top layer, so no ancestor transform re-anchors it. */}
              <div data-fx="stagger" data-fx-items=".gallery-tile">
                <GalleryLightbox images={gallery.slice(0, 6)} />
              </div>
              <div className="mt-7">
                <a
                  className="action-text"
                  href={content.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-fx="link"
                >
                  Follow @Reza_Ohadi on Instagram{" "}
                  <ArrowUpRight size={18} aria-hidden />
                </a>
              </div>
            </div>
          </section>
        </World>
        <Transition id="morph" />
        <World id="name" className={journeyStyles.nameWorld}>
          <section className="portfolio-section">
            <div className="container-editorial">
              <blockquote
                className="mx-auto max-w-3xl text-center font-serif text-3xl italic leading-relaxed"
                data-fx="lede"
              >
                In the space between two notes, a silence remembers everything
                the music meant to say.
              </blockquote>
            </div>
          </section>
        </World>
        <Transition id="reassemble" />
        <World id="outro">
          <section
            id="contact"
            data-nav-section
            data-fx-scope
            className="portfolio-section"
            aria-labelledby="contact-title"
          >
            <div className="container-editorial contact-grid">
              <div>
                <span className="section-number" data-fx="eyebrow">
                  05 / Get in touch
                </span>
                <h2
                  id="contact-title"
                  className="section-title"
                  data-fx="title"
                >
                  Let’s make
                  <br />
                  something resonant.
                </h2>
                <div data-fx="rule" aria-hidden />
                <p className="section-lead mt-6" data-fx="lede">
                  Bookings, commissions & collaborations. For performances,
                  sheet-music licensing, lessons, or a new idea.
                </p>
                <a
                  className="action-text mt-6 break-all"
                  href={"mailto:" + content.social.email}
                  data-fx="link"
                >
                  {content.social.email} <ArrowUpRight size={18} aria-hidden />
                </a>
                <div data-fx="stagger" data-fx-items=".social-links > *">
                  <SocialLinks social={content.social} />
                </div>
              </div>
              <div data-fx="block">
                <ContactForm />
              </div>
            </div>
          </section>
        </World>
      </JourneyExperience>
      <GoldenGrandSection />
    </>
  );
}
