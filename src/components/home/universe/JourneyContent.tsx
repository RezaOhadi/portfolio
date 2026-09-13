import Link from "next/link";
import type { HomeUniverseData } from "@/lib/data/home-universe";
import styles from "./universe.module.css";

/** Normalized chapter thresholds; every reveal is reversible with native scroll. */
function beat(enter: number, exit: number, kind: "mask" | "body" | "accent") {
  return { "data-beat": kind, "data-enter": enter, "data-exit": exit };
}
export function JourneyContent({ data, selected, onSelect }: {
  data: HomeUniverseData; selected: number; onSelect: (index: number) => void;
}) {
  const paragraphs = data.biography.split(/\n\s*\n/).filter(Boolean);
  return <>
    <section id="home" data-nav-section data-editorial-chapter className={`${styles.chapter} ${styles.entry}`} aria-labelledby="hero-title">
      <div data-text-plane className={styles.textPlane}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} {...beat(0, 0.76, "accent")}>00 / Pianist · Composer</p>
          <h1 id="hero-title" className={styles.headlineMask}><span {...beat(0.08, 0.80, "mask")}>{data.name}</span></h1>
          <p className={styles.tagline} {...beat(0.28, 0.84, "body")}>{data.supporting}</p>
          <a className={`${styles.link} ${styles.drawLink}`} href="#about" {...beat(0.47, 0.88, "accent")}>Enter the piano universe <span aria-hidden>↓</span></a>
        </div>
        <span className={styles.marginNote} aria-hidden {...beat(0.55, 0.87, "accent")}>Memory / Silence / Resonance</span>
      </div>
    </section>
    <section id="about" data-nav-section data-editorial-chapter className={`${styles.chapter} ${styles.biography}`} aria-labelledby="about-title">
      <div data-text-plane className={styles.textPlane}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} {...beat(0, 0.76, "accent")}>01 / The artist</p>
          <h2 id="about-title">
            <span className={styles.headlineMask}><span {...beat(0.09, 0.79, "mask")}>A life at</span></span>{" "}
            <span className={styles.headlineMask}><em {...beat(0.17, 0.82, "mask")}>the piano.</em></span>
          </h2>
          {paragraphs.map((paragraph, index) => <p key={index} className={styles.body}
            {...beat(0.32 + index / Math.max(paragraphs.length, 1) * 0.18, 0.84 + index / Math.max(paragraphs.length, 1) * 0.03, "body")}>{paragraph}</p>)}
          <Link className={`${styles.link} ${styles.drawLink}`} href="/biography" {...beat(0.57, 0.89, "accent")}>Read the biography <span aria-hidden>↗</span></Link>
        </div>
      </div>
    </section>
    <section id="music" data-editorial-chapter className={`${styles.chapter} ${styles.music}`} aria-labelledby="music-title">
      <div data-text-plane className={styles.textPlane}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} {...beat(0, 0.77, "accent")}>02 / The music</p>
          <h2 id="music-title">
            <span className={styles.headlineMask}><span {...beat(0.07, 0.80, "mask")}>Where silence</span></span>{" "}
            <span className={styles.headlineMask}><em {...beat(0.14, 0.83, "mask")}>takes shape.</em></span>
          </h2>
          <p className={styles.body} {...beat(0.25, 0.85, "body")}>Selected works for the piano. Explore a score and the story within it.</p>
          <ol className={styles.works}>
            {data.works.map((work, index) => <li key={work.id} data-selected={selected === index}
              {...beat(0.36 + index * 0.07, 0.86 + index * 0.025, "body")}
              onPointerEnter={() => onSelect(index)} onFocus={() => onSelect(index)}>
              <span className={styles.workNumber} aria-hidden>0{index + 1}</span>
              <div>
                <Link href={work.href} className={styles.workTitle}>{work.title} <span aria-hidden>↗</span></Link>
                <p className={styles.workMeta}>{work.type}{work.durationSeconds !== null && ` · ${Math.floor(work.durationSeconds / 60)}:${String(work.durationSeconds % 60).padStart(2, "0")}`}</p>
                <p className={styles.description}>{work.description}</p>
              </div>
            </li>)}
          </ol>
          {!data.works.length && <p className={styles.body} {...beat(0.36, 0.86, "body")}>New works will be shared here soon.</p>}
          <a href="#media" className={`${styles.link} ${styles.drawLink}`} {...beat(0.64, 0.93, "accent")}>Continue to performances <span aria-hidden>↓</span></a>
        </div>
      </div>
    </section>
  </>;
}
