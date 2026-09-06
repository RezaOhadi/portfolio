import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import type { HeroContent } from "@/lib/types";

export function Hero({ hero }: { hero: HeroContent }) {
  const portrait = hero.image.startsWith("/placeholders/")
    ? "/profile.jpg"
    : hero.image;
  return (
    <section
      id="home"
      data-nav-section
      className="portfolio-hero"
      aria-labelledby="hero-title"
    >
      <div className="container-editorial hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">Concert pianist · Composer · Technologist</p>
          <h1 id="hero-title" className="hero-title">
            {hero.headline}
          </h1>
          <p className="hero-subtitle">{hero.subtitle}</p>
          <p className="hero-supporting">{hero.supporting}</p>
          <div className="hero-actions">
            <a className="action-primary" href="#media">
              <Play size={17} aria-hidden /> Explore the music
            </a>
            <Link className="action-text" href="/store">
              Discover sheet music <ArrowUpRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
        <figure className="hero-portrait">
          <div className="portrait-frame">
            <Image
              src={portrait}
              alt="Reza Ohadi at the piano"
              fill
              priority
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 45vw, 85vw"
              className="object-cover"
            />
          </div>
          <figcaption>
            <span>Reza Ohadi</span>
            <span>At the piano</span>
          </figcaption>
        </figure>
        <div className="hero-baseline">
          <span>Classical roots. An open horizon.</span>
          <a href="#about">
            Discover <ArrowDown size={16} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
