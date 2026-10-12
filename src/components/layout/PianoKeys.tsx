"use client";

import { motion, useReducedMotion, useSpring, type MotionValue } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { playNote } from "@/components/journey/audio";
import styles from "./piano-keys.module.css";

/**
 * The main navigation is one octave, C4 to B4. White keys are the menu, in
 * order; black keys are decorative but playable. One gold light glides on
 * springs to whichever key is under the pointer (or keyboard focus), and the
 * active section's key stays gently pressed with a thin gold line.
 *
 * Notes sound only once the visitor has chosen sound (see journey/audio.ts),
 * so the mute control and "continue in silence" are respected everywhere.
 */
export interface OctaveKey {
  note: string;
  midi: number;
  id: string;
  label: string;
  /** Target on the home page (an anchor into the journey) and elsewhere. */
  home: string;
  route: string;
}

export const WHITE_KEYS: OctaveKey[] = [
  { note: "C", midi: 60, id: "home", label: "Home", home: "#home", route: "/" },
  { note: "D", midi: 62, id: "about", label: "About", home: "#about", route: "/biography" },
  { note: "E", midi: 64, id: "media", label: "Listen & watch", home: "#media", route: "/media" },
  { note: "F", midi: 65, id: "concerts", label: "Concerts", home: "#concerts", route: "/#concerts" },
  { note: "G", midi: 67, id: "gallery", label: "Gallery", home: "#gallery", route: "/gallery" },
  { note: "A", midi: 69, id: "contact", label: "Contact", home: "#contact", route: "/contact" },
  { note: "B", midi: 71, id: "store", label: "Sheet music", home: "/store", route: "/store" },
];

/** `after`: the white key it sits behind. `shift`: real black keys sit slightly off the seam. */
const BLACK_KEYS = [
  { note: "C sharp", midi: 61, after: 0, shift: -0.12 },
  { note: "D sharp", midi: 63, after: 1, shift: 0.12 },
  { note: "F sharp", midi: 66, after: 3, shift: -0.14 },
  { note: "G sharp", midi: 68, after: 4, shift: 0 },
  { note: "A sharp", midi: 70, after: 5, shift: 0.14 },
];

const SPRING = { stiffness: 320, damping: 34, mass: 0.7 };
const PRESS_MS = 150;

interface PianoKeysProps {
  variant: "bar" | "stack";
  /** id of the key whose section or page is current, if any. */
  active: string | null;
  /** On the home page, keys scroll the journey instead of changing route. */
  onHome: boolean;
  /** Runs as a key navigates (the menu dialog closes itself). */
  onNavigate?: () => void;
  label: string;
}

export function PianoKeys({ variant, active, onHome, onNavigate, label }: PianoKeysProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const keys = useRef<HTMLDivElement>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const width = useSpring(0, SPRING);
  const height = useSpring(0, SPRING);
  const glow = useSpring(0, { stiffness: 210, damping: 30 });

  /** The shared light moves to `el`. From darkness it appears in place; otherwise it glides. */
  const light = (el: HTMLElement) => {
    const glide = !reduced && glow.get() > 0.05;
    const to = (value: MotionValue<number>, target: number) => (glide ? value.set(target) : value.jump(target));
    to(x, el.offsetLeft);
    to(y, el.offsetTop);
    to(width, el.offsetWidth);
    to(height, el.offsetHeight);
    glow.set(1);
  };

  /** A real key press: down fast, back with the felt. Composited transform only. */
  const press = (el: HTMLElement) => {
    if (reduced) return;
    const down = variant === "bar" ? "translateY(3px)" : "translateX(5px)";
    el.animate(
      [{ transform: "none", filter: "brightness(1)" }, { transform: down, filter: "brightness(0.82)", offset: 0.28 }, { transform: "none", filter: "brightness(1)" }],
      { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  };

  const hover = (event: PointerEvent<HTMLElement>, midi: number) => {
    // Touch has no hover: the tap itself plays the note.
    if (event.pointerType !== "mouse") return;
    light(event.currentTarget);
    playNote(midi, 0.07, 1.6);
  };

  const navigate = (event: MouseEvent<HTMLAnchorElement>, key: OctaveKey) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const el = event.currentTarget;
    playNote(key.midi, 0.55, 2.6);
    press(el);
    light(el);
    onNavigate?.();
    const href = onHome ? key.home : key.route;
    // Anchors into the journey are smooth-scrolled by Lenis; the press plays during the scroll.
    if (href.startsWith("#")) return;
    event.preventDefault();
    window.setTimeout(() => router.push(href), reduced ? 0 : PRESS_MS);
  };

  // Arrow keys walk the octave; Home and End jump to its ends.
  const walk = (event: KeyboardEvent<HTMLDivElement>) => {
    const links = Array.from(keys.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    const next = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: links.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    links[(next + links.length) % links.length]?.focus();
  };

  return (
    <div
      ref={keys}
      className={`${styles.octave} ${variant === "bar" ? styles.bar : styles.stack}`}
      role="group"
      aria-label={label}
      onKeyDown={walk}
      onPointerLeave={() => glow.set(0)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) glow.set(0);
      }}
    >
      {WHITE_KEYS.map((key, i) => {
        const current = active === key.id;
        return (
          <Link
            key={key.id}
            href={onHome ? key.home : key.route}
            className={`${styles.white} ${current ? styles.current : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            aria-current={current ? (onHome && key.home.startsWith("#") ? "location" : "page") : undefined}
            onPointerEnter={(event) => hover(event, key.midi)}
            onFocus={(event) => {
              if (!event.currentTarget.matches(":focus-visible")) return;
              light(event.currentTarget);
              playNote(key.midi, 0.07, 1.6);
            }}
            onClick={(event) => navigate(event, key)}
          >
            <span className={styles.note} aria-hidden>
              {key.note}
            </span>
            <span className={styles.label}>{key.label}</span>
          </Link>
        );
      })}
      <motion.span className={styles.light} style={{ x, y, width, height, opacity: glow }} aria-hidden />
      {BLACK_KEYS.map((key) => (
        <span
          key={key.note}
          className={styles.black}
          style={{ "--after": key.after + 1, "--shift": key.shift } as React.CSSProperties}
          aria-hidden
          onPointerEnter={(event) => hover(event, key.midi)}
          onPointerDown={(event) => {
            playNote(key.midi, 0.5, 2.2);
            press(event.currentTarget);
          }}
        />
      ))}
    </div>
  );
}
