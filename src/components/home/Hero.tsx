import Link from "next/link";
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import type { HeroContent } from "@/lib/types";
import { HeroPortrait } from "@/components/home/HeroPortrait";
import heroGenerated from "@/config/hero.generated.json";

export function Hero({ hero }: { hero: HeroContent }) {
  // An admin-uploaded hero image wins; otherwise the build-time resolved local
  // portrait (public/assets/images/hero-portrait.*), falling back to profile.jpg.
  const portrait =
    hero.image && !hero.image.startsWith("/placeholders/")
      ? hero.image
      : heroGenerated.portrait;
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
        <HeroPortrait
          src={portrait}
          alt="Portrait of Reza Ohadi"
          caption="Reza Ohadi"
          subcaption="At the piano"
        />
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
