"use client";

import { useEffect } from "react";
import { labelLayout, registerLabel } from "./canvas/labels";
import styles from "./journey.module.css";

/** Static list so the DOM bundle never imports the 3D code. Ids match canvas/piano/build.ts. */
const LABELS: [string, string][] = [
  ["lid", "Lid"],
  ["desk", "Music desk"],
  ["fallboard", "Fallboard"],
  ["strings", "Strings"],
  ["plate", "Cast-iron plate"],
  ["action", "Action"],
  ["soundboard", "Soundboard"],
  ["rim", "Rim"],
  ["keyboard", "Keyboard"],
  ["legBass", "Leg"],
  ["legTreble", "Legs"],
  ["legTail", "Leg"],
  ["lyre", "Pedal lyre"],
];

/**
 * Exploded-diagram labels: an aligned column on the left margin, each with a
 * hairline leader running to its part. Position, leader length and opacity are
 * written by the render loop.
 */
export function PartLabels() {
  // The copy column only moves horizontally on resize, so measure it then, never per frame.
  useEffect(() => {
    const measure = () => {
      const copy = document.querySelector<HTMLElement>("[data-about-copy]");
      const beside = window.matchMedia("(min-width: 761px)").matches;
      labelLayout.copyLeft = copy && beside ? copy.getBoundingClientRect().left : Infinity;
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      window.removeEventListener("resize", measure);
      labelLayout.copyLeft = Infinity;
    };
  }, []);
  return (
    <div className={styles.labels} aria-hidden>
      {LABELS.map(([id, label]) => (
        <div key={id} ref={(node) => registerLabel(id, node)} className={styles.label} style={{ opacity: 0 }}>
          <span className={styles.labelText}>{label}</span>
          <span className={styles.leader} />
        </div>
      ))}
    </div>
  );
}
