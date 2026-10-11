"use client";

import { registerLabel } from "./canvas/labels";
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
