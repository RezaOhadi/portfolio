import Link from "next/link";
import type { HomeUniverseData } from "@/lib/data/home-universe";
import styles from "./universe.module.css";

/** Semantic editorial beats; the observer assigns time-based entrance delays. */
function beat(kind: "mask" | "body" | "accent") {
  return { "data-beat": kind };
}
export function JourneyContent({ data, selected, onSelect }: {
  data: HomeUniverseData; selected: number; onSelect: (index: number) => void;
}) {
  const paragraphs = data.biography.split(/\n\s*\n/).filter(Boolean);
  return <>
    <section id="home" data-nav-section data-editorial-chapter className={`${styles.chapter} ${styles.entry}`} aria-labelledby="hero-title">
      <div data-text-plane className={styles.textPlane}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} {...beat("accent")}>00 / Pianist · Composer</p>
          <h1 id="hero-title" className={styles.headlineMask}><span {...beat("mask")}>{data.name}</span></h1>
          <p className={styles.tagline} {...beat("body")}>{data.supporting}</p>
          <p className={styles.scrollCue} {...beat("accent")}>Scroll to explore <span aria-hidden>↓</span></p>
          <a className={`${styles.link} ${styles.drawLink}`} href="#about" {...beat("accent")}>Enter the piano universe <span aria-hidden>↓</span></a>
        </div>
        <span className={styles.marginNote} aria-hidden {...beat("accent")}>Memory / Silence / Resonance</span>
      </div>
    </section>
    <section id="about" data-nav-section data-editorial-chapter className={`${styles.chapter} ${styles.biography}`} aria-labelledby="about-title">
      <div data-text-plane className={styles.textPlane}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} {...beat("accent")}>01 / The artist</p>
          <h2 id="about-title">
            <span className={styles.headlineMask}><span {...beat("mask")}>A life at</span></span>{" "}
            <span className={styles.headlineMask}><em {...beat("mask")}>the piano.</em></span>
          </h2>
          {paragraphs.map((paragraph, index) => <p key={index} className={styles.body}
            {...beat("body")}>{paragraph}</p>)}
          <Link className={`${styles.link} ${styles.drawLink}`} href="/biography" {...beat("accent")}>Read the biography <span aria-hidden>↗</span></Link>
        </div>
      </div>
    </section>
    <section id="music" data-editorial-chapter className={`${styles.chapter} ${styles.music}`} aria-labelledby="music-title">
      <div data-text-plane className={styles.textPlane}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} {...beat("accent")}>02 / The music</p>
          <h2 id="music-title">
            <span className={styles.headlineMask}><span {...beat("mask")}>Where silence</span></span>{" "}
            <span className={styles.headlineMask}><em {...beat("mask")}>takes shape.</em></span>
          </h2>
          <p className={styles.body} {...beat("body")}>Selected works for the piano. Explore a score and the story within it.</p>
          <ol className={styles.works}>
            {data.works.map((work, index) => <li key={work.id} data-selected={selected === index}
              {...beat("body")}
              onPointerEnter={() => onSelect(index)} onFocus={() => onSelect(index)}>
              <span className={styles.workNumber} aria-hidden>0{index + 1}</span>
              <div>
                <Link href={work.href} className={styles.workTitle}>{work.title} <span aria-hidden>↗</span></Link>
                <p className={styles.workMeta}>{work.type}{work.durationSeconds !== null && ` · ${Math.floor(work.durationSeconds / 60)}:${String(work.durationSeconds % 60).padStart(2, "0")}`}</p>
                <p className={styles.description}>{work.description}</p>
              </div>
            </li>)}
          </ol>
          {!data.works.length && <p className={styles.body} {...beat("body")}>New works will be shared here soon.</p>}
          <a href="#media" className={`${styles.link} ${styles.drawLink}`} {...beat("accent")}>Continue to performances <span aria-hidden>↓</span></a>
        </div>
      </div>
    </section>
  </>;
}
