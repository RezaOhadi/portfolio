import Link from "next/link";
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import type { HeroContent } from "@/lib/types";
import { HeroPortrait } from "@/components/home/HeroPortrait";
import { HeroScrub, HeroStage } from "@/components/home/HeroStage";
import { heroPortraitSrc, isUnoptimizedSource } from "@/config/site";
import heroGenerated from "@/config/hero.generated.json";

/**
 * Resolution order is documented on `heroPortraitSrc` in config/site.ts: an
 * admin upload wins, then the editable constant / env override, then the
 * build-time scan of public/assets/images, then the legacy profile shot.
 */
function resolvePortrait(hero: HeroContent): string {
  if (hero.image && !hero.image.startsWith("/placeholders/")) return hero.image;
  if (heroPortraitSrc) return heroPortraitSrc;
  return heroGenerated.portrait;
}

export function Hero({ hero }: { hero: HeroContent }) {
  const portrait = resolvePortrait(hero);
  return (
    <HeroStage>
      <div className="container-editorial hero-layout">
        <HeroScrub className="hero-copy" from={0.3} to={0.72} lift={130}>
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
        </HeroScrub>
        <HeroPortrait
          src={portrait}
          alt="Portrait of Reza Ohadi"
          caption="Reza Ohadi"
          subcaption="At the piano"
          unoptimized={isUnoptimizedSource(portrait)}
        />
        <HeroScrub className="hero-baseline" from={0.18} to={0.54} lift={80}>
          <span>Classical roots. An open horizon.</span>
          <a href="#about">
            Discover <ArrowDown size={16} aria-hidden />
          </a>
        </HeroScrub>
      </div>
    </HeroStage>
  );
}
