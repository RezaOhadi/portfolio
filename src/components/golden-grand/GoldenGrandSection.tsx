import { LetsPlayButton } from "./LetsPlayButton";
import styles from "./golden-grand-section.module.css";

/** Home page closer: the invitation to open the Golden Grand (/piano). */
export function GoldenGrandSection() {
  return (
    <section className={styles.section} aria-labelledby="golden-grand-title">
      <div className={styles.inner}>
        <span className={styles.eyebrow}>The Golden Grand</span>
        <h2 id="golden-grand-title" className={styles.title}>
          Step inside and play
        </h2>
        <p className={styles.lead}>
          A golden concert grand in a royal hall. Play it, record it, make it
          yours.
        </p>
        <div className={styles.action}>
          <LetsPlayButton variant="section" />
        </div>
      </div>
    </section>
  );
}
