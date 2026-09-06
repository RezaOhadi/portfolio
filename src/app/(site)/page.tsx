import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArtistJsonLd } from "@/components/seo/ArtistJsonLd";
import { Hero } from "@/components/home/Hero";
import { FeaturedComposition } from "@/components/home/FeaturedComposition";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
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
      <Hero hero={content.hero} />
      <section
        id="about"
        data-nav-section
        className="portfolio-section"
        aria-labelledby="about-title"
      >
        <div className="container-editorial about-grid">
          <Reveal>
            <span className="section-number">01 / The artist</span>
            <h2 id="about-title" className="section-title">
              A life at
              <br />
              the piano.
            </h2>
          </Reveal>
          <Reveal className="about-copy">
            <p className="section-lead">{content.bio.intro}</p>
            <blockquote>{content.home.artistStatement}</blockquote>
            {content.bio.signatureImage ? (
              <Image
                src={content.bio.signatureImage}
                alt="Reza Ohadi signature"
                width={200}
                height={64}
                className="mb-6 h-12 w-auto"
              />
            ) : null}
            <Link href="/biography" className="action-text">
              Read the full biography <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>
      <section
        id="media"
        data-nav-section
        className="portfolio-section"
        aria-labelledby="media-title"
      >
        <div className="container-editorial">
          <Reveal className="section-top">
            <div>
              <span className="section-number">02 / Listen & watch</span>
              <h2 id="media-title" className="section-title">
                Music, in the moment.
              </h2>
            </div>
            <Link href="/media" className="action-text">
              All performances <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          <div className="media-grid">
            {videos.map((item) => (
              <Reveal key={item.id} className="media-card">
                <YouTubeEmbed
                  url={item.youtubeUrl}
                  title={item.title}
                  poster={item.poster}
                />
                <span className="media-meta">{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Reveal>
            ))}
          </div>
          {!videos.length ? (
            <p className="section-lead">
              New performances will be shared here soon.
            </p>
          ) : null}
          <div className="spotify-panel">
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
          </div>
        </div>
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
              <h2 id="concerts-title" className="section-title">
                Upcoming & recent.
              </h2>
            </div>
            <Link href="/contact" className="action-text">
              Booking inquiries <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          {content.home.performances.length ? (
            content.home.performances.map((performance, i) => (
              <Reveal key={performance.date + i} className="concert-row">
                <time dateTime={performance.date}>
                  {formatDate(performance.date)}
                </time>
                <h3>{performance.title}</h3>
                <p>
                  {performance.venue}
                  <br />
                  {performance.location}
                </p>
              </Reveal>
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
              <h2 id="gallery-title" className="section-title">
                Beyond the notes.
              </h2>
            </div>
            <Link href="/gallery" className="action-text">
              Full gallery <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
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
          <FeaturedComposition product={featured} />
        </section>
      ) : null}
      <section className="portfolio-section" aria-labelledby="scores-title">
        <div className="container-editorial">
          <Reveal className="section-top">
            <div>
              <span className="section-number">The catalogue</span>
              <h2 id="scores-title" className="section-title">
                New to the catalogue.
              </h2>
            </div>
            <Link className="action-text" href="/store">
              All sheet music <ArrowUpRight size={18} aria-hidden />
            </Link>
          </Reveal>
          <div className="media-grid">
            {products.slice(0, 3).map((product) => (
              <Reveal key={product.id}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="portfolio-section">
        <div className="container-editorial">
          <Reveal
            as="blockquote"
            className="mx-auto max-w-3xl text-center font-serif text-3xl italic leading-relaxed"
          >
            In the space between two notes, a silence remembers everything the
            music meant to say.
          </Reveal>
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
            <h2 id="contact-title" className="section-title">
              Let’s make
              <br />
              something resonant.
            </h2>
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
