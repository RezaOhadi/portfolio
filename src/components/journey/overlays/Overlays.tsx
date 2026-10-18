import Link from "next/link";
import type { HomeUniverseData } from "@/lib/data/home-universe";
import { SectionTitleText } from "@/components/home/SectionTitle";
import styles from "../journey.module.css";

/* Copy is the site's existing content. Each element declares its entrance
   role with data-fx; text/useTextChoreography.ts gives each role its motion. */

/** World 1: the hero, over the floating piano. */
export function HeroOverlay({ data }: { data: HomeUniverseData }) {
  return (
    <div className={styles.heroCopy} data-hero-copy>
      <p className={styles.eyebrow} data-fx="eyebrow">
        00 / Pianist · Composer
      </p>
      <h1 id="hero-title" className={styles.heroTitle} data-fx="title">
        {data.name}
      </h1>
      <p className={styles.tagline} data-fx="lede">
        {data.supporting}
      </p>
      <a className={styles.link} href="#about" data-fx="link">
        Enter the piano universe <span aria-hidden>↓</span>
      </a>
      <span className={styles.marginNote} aria-hidden data-fx="eyebrow">
        Memory / Silence / Resonance
      </span>
    </div>
  );
}

/** World 2: the biography, beside the exploded instrument. */
export function AboutOverlay({ data }: { data: HomeUniverseData }) {
  const paragraphs = data.biography.split(/\n\s*\n/).filter(Boolean);
  return (
    <div className={styles.aboutTrack}>
      <div className={styles.aboutCopy} data-about-copy>
        <p className={styles.eyebrow} data-fx="eyebrow">
          01 / The artist
        </p>
        <h2 id="about-title" className={styles.worldTitle} data-fx="title">
          <SectionTitleText title={data.titles.about} />
        </h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.body} data-fx="body">
            {paragraph}
          </p>
        ))}
        <Link className={styles.link} href="/biography" data-fx="link">
          Read the biography <span aria-hidden>↗</span>
        </Link>
      </div>
    </div>
  );
}

/** World 3 content: the selected works. */
export function MusicOverlay({ data }: { data: HomeUniverseData }) {
  return (
    <div className={styles.musicCopy}>
      <p className={styles.eyebrow} data-fx="eyebrow">
        02 / The music
      </p>
      <h2 id="music-title" className={styles.worldTitle} data-fx="title">
        <SectionTitleText title={data.titles.music} />
      </h2>
      <p className={styles.body} data-fx="body">
        Selected works for the piano. Explore a score and the story within it.
      </p>
      {data.works.length ? (
        <ol className={styles.works} data-fx="stagger">
          {data.works.map((work, index) => (
            <li key={work.id}>
              <span className={styles.workNumber} aria-hidden>
                0{index + 1}
              </span>
              <div>
                <Link href={work.href} className={styles.workTitle}>
                  {work.title} <span aria-hidden>↗</span>
                </Link>
                <p className={styles.workMeta}>
                  {work.type}
                  {work.durationSeconds !== null &&
                    ` · ${Math.floor(work.durationSeconds / 60)}:${String(work.durationSeconds % 60).padStart(2, "0")}`}
                </p>
                <p className={styles.description}>{work.description}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.body} data-fx="body">
          New works will be shared here soon.
        </p>
      )}
      <a href="#media" className={styles.link} data-fx="link">
        Continue to performances <span aria-hidden>↓</span>
      </a>
    </div>
  );
}
