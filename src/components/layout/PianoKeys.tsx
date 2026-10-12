"use client";

import { motion, useReducedMotion, useSpring, type MotionValue } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { playPitch } from "@/components/journey/audio";
import { BLACK_KEYS, WHITE_KEYS, type OctaveKey } from "./octave";
import styles from "./piano-keys.module.css";

export { WHITE_KEYS };

/**
 * The main navigation: a slice cut out of a grand piano. Everything is drawn
 * as vector (CSS gradients and shadows, one inline SVG for the cheek block)
 * and every label is real text, so it stays sharp at any zoom or density.
 *
 * Two lights live on the keys, both on springs: the hover light follows the
 * pointer (or keyboard focus) from key to key, and the active light rests on
 * the current section and glides to the next one as the visitor scrolls.
 */
const SPRING = { stiffness: 260, damping: 32, mass: 0.75 };
const PRESS_MS = 150;

/**
 * A light that travels between keys on springs. Transform and opacity only:
 * the element keeps one white key's size and is translated and scaled onto
 * the target (a black key is narrower), so a glide never triggers layout.
 */
function useLight() {
  const node = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const scaleX = useSpring(1, SPRING);
  const scaleY = useSpring(1, SPRING);
  const opacity = useSpring(0, { stiffness: 170, damping: 28 });
  /** Out of darkness the light appears in place; while lit it glides. */
  const moveTo = (el: HTMLElement, glide: boolean) => {
    const base = node.current;
    if (!base) return;
    const to = (value: MotionValue<number>, target: number) => (glide && opacity.get() > 0.05 ? value.set(target) : value.jump(target));
    to(x, el.offsetLeft);
    to(y, el.offsetTop);
    to(scaleX, el.offsetWidth / (base.offsetWidth || 1));
    to(scaleY, el.offsetHeight / (base.offsetHeight || 1));
    opacity.set(1);
  };
  return { node, style: { x, y, scaleX, scaleY, opacity, originX: 0, originY: 0 }, moveTo, fade: () => opacity.set(0) };
}

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
  const reduced = useReducedMotion() ?? false;
  const row = useRef<HTMLDivElement>(null);
  const hover = useLight();
  const lit = useLight();

  // The active light follows the current section: a glide across the keys, not a jump.
  const place = useRef<(glide: boolean) => void>(() => {});
  place.current = (glide) => {
    const el = active ? row.current?.querySelector<HTMLElement>(`[data-key="${active}"]`) : null;
    if (el) lit.moveTo(el, glide && !reduced);
    else lit.fade();
  };
  useEffect(() => place.current(true), [active, reduced]);
  // Key sizes follow the viewport; on a real resize the light snaps to its key.
  useEffect(() => {
    const host = row.current;
    if (!host) return;
    let width = host.offsetWidth;
    let height = host.offsetHeight;
    const resize = new ResizeObserver(() => {
      if (host.offsetWidth === width && host.offsetHeight === height) return;
      width = host.offsetWidth;
      height = host.offsetHeight;
      place.current(false);
    });
    resize.observe(host);
    return () => resize.disconnect();
  }, []);

  /** A real key: down fast, back up slower with a small settle. Transform only. */
  const press = (el: HTMLElement) => {
    if (reduced) return;
    const axis = variant === "bar" ? "translateY" : "translateX";
    el.animate(
      [
        { transform: `${axis}(0)` },
        { transform: `${axis}(3.5px)`, offset: 0.18, easing: "cubic-bezier(0.3, 0, 0.5, 1)" },
        { transform: `${axis}(-0.6px)`, offset: 0.72, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        { transform: `${axis}(0)` },
      ],
      { duration: 560 },
    );
  };

  const enter = (event: PointerEvent<HTMLElement>, pitch: string) => {
    // Touch has no hover: the tap itself plays the note.
    if (event.pointerType !== "mouse") return;
    hover.moveTo(event.currentTarget, !reduced);
    playPitch(pitch, 0.07, 1.6);
  };

  const navigate = (event: MouseEvent<HTMLAnchorElement>, key: OctaveKey) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    playPitch(key.pitch, 0.55, 2.6);
    press(event.currentTarget);
    onNavigate?.();
    const href = onHome ? key.home : key.route;
    // Anchors into the journey are smooth-scrolled by Lenis; the press plays during the scroll.
    if (href.startsWith("#")) return;
    event.preventDefault();
    window.setTimeout(() => router.push(href), reduced ? 0 : PRESS_MS);
  };

  // Arrow keys walk the octave; Home and End jump to its ends.
  const walk = (event: KeyboardEvent<HTMLDivElement>) => {
    const links = Array.from(row.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    const next = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: links.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    links[(next + links.length) % links.length]?.focus();
  };

  return (
    <div className={`${styles.slice} ${variant === "bar" ? styles.bar : styles.stack}`}>
      <span className={styles.endBlock} aria-hidden />
      <div className={styles.bed}>
        <span className={styles.fallboard} aria-hidden />
        <div
          ref={row}
          className={styles.keys}
          role="group"
          aria-label={label}
          onKeyDown={walk}
          onPointerLeave={hover.fade}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hover.fade();
          }}
        >
          {WHITE_KEYS.map((key, i) => {
            const current = active === key.id;
            return (
              <Link
                key={key.id}
                data-key={key.id}
                href={onHome ? key.home : key.route}
                className={`${styles.white} ${current ? styles.current : ""}`}
                style={{ "--i": i } as React.CSSProperties}
                aria-current={current ? (onHome && key.home.startsWith("#") ? "location" : "page") : undefined}
                onPointerEnter={(event) => enter(event, key.pitch)}
                onFocus={(event) => {
                  if (!event.currentTarget.matches(":focus-visible")) return;
                  hover.moveTo(event.currentTarget, !reduced);
                  playPitch(key.pitch, 0.07, 1.6);
                }}
                onClick={(event) => navigate(event, key)}
              >
                <span className={styles.shade} aria-hidden />
                <span className={styles.sheen} aria-hidden />
                <span className={styles.note} aria-hidden>
                  {key.note}
                </span>
                <span className={styles.label}>{key.label}</span>
              </Link>
            );
          })}
          <motion.span ref={lit.node} className={`${styles.light} ${styles.activeLight}`} style={lit.style} aria-hidden />
          <motion.span ref={hover.node} className={`${styles.light} ${styles.hoverLight}`} style={hover.style} aria-hidden />
          {BLACK_KEYS.map((key, i) => (
            <span
              key={key.pitch}
              className={styles.black}
              style={{ "--after": key.after + 1, "--shift": key.shift, "--i": key.after + 0.5 } as React.CSSProperties}
              aria-hidden
              onPointerEnter={(event) => enter(event, key.pitch)}
              onPointerDown={(event) => {
                playPitch(key.pitch, 0.5, 2.2);
                press(event.currentTarget);
              }}
              data-index={i}
            />
          ))}
        </div>
        <span className={styles.keyslip} aria-hidden />
        {/* The active key's light spills onto the lacquer around it and travels with it. */}
        <motion.span
          className={styles.halo}
          style={
            variant === "bar"
              ? { x: lit.style.x, scaleX: lit.style.scaleX, opacity: lit.style.opacity, originX: 0 }
              : { y: lit.style.y, scaleY: lit.style.scaleY, opacity: lit.style.opacity, originY: 0 }
          }
          aria-hidden
        />
      </div>
      {variant === "bar" ? <Cheek /> : <span className={styles.cheekBlock} aria-hidden />}
    </div>
  );
}

/**
 * The cheek block at the treble end of the keyboard, as vector: a lacquer
 * shape that rises above the fallboard and rolls over to the right, with a
 * soft specular streak and a thin gold rim that follow its curve.
 */
function Cheek() {
  const id = useId().replace(/:/g, "");
  // One contour: the shoulder rolls over, then a long S sweeps down and flares into the foot on the key slip.
  const body = "M0 114V20C0 11 5.5 6 14 5.2 40 3 70 2.6 96 3c17 .3 27.5 5 33.5 14.5 6 9.5 7 23.5 10 38.5 3.5 17 11 32 23.5 42 5 4 9.5 6.5 13 7.5V114z";
  const rim = "M14 5.2C40 3 70 2.6 96 3c17 .3 27.5 5 33.5 14.5 6 9.5 7 23.5 10 38.5 3.5 17 11 32 23.5 42 5 4 9.5 6.5 13 7.5";
  const gloss = "M14 9.6C40 7.6 70 7.2 95.5 7.6c14.5.3 23.4 4.3 28.6 12.4 5.4 8.4 6.4 22.4 9.4 37.4 3.6 18 11.6 33.5 25 43.8";
  return (
    <svg className={styles.cheek} viewBox="0 0 176 114" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${id}-glow`} cx="0.86" cy="0.62" r="0.62">
          <stop offset="0" stopColor="#f2b56a" stopOpacity="0.66" />
          <stop offset="0.45" stopColor="#c98f52" stopOpacity="0.26" />
          <stop offset="1" stopColor="#8a5a2b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#010102" />
          <stop offset="0.35" stopColor="#0c0c0f" />
          <stop offset="0.66" stopColor="#18181c" />
          <stop offset="0.86" stopColor="#09090b" />
          <stop offset="1" stopColor="#020203" />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="0.7" cy="0.16" r="0.5">
          <stop offset="0" stopColor="#f3d6ae" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#d5ae88" stopOpacity="0.08" />
          <stop offset="1" stopColor="#d5ae88" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-foot`} cx="0.97" cy="0.97" r="0.34">
          <stop offset="0" stopColor="#f6c98c" stopOpacity="0.7" />
          <stop offset="0.45" stopColor="#d5ae88" stopOpacity="0.16" />
          <stop offset="1" stopColor="#d5ae88" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gloss`} gradientUnits="userSpaceOnUse" x1="14" y1="8" x2="160" y2="102">
          <stop offset="0" stopColor="#f3d6ae" stopOpacity="0" />
          <stop offset="0.3" stopColor="#f6dcb6" stopOpacity="0.5" />
          <stop offset="0.56" stopColor="#fff6e8" stopOpacity="1" />
          <stop offset="0.74" stopColor="#f6dcb6" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f2b56a" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} gradientUnits="userSpaceOnUse" x1="14" y1="4" x2="176" y2="106">
          <stop offset="0" stopColor="#f6dcb6" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#f6dcb6" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.95" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        <filter id={`${id}-bloom`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* Warm light just beyond the contour, as if the lamp sits behind the case. */}
      <rect x="96" y="0" width="80" height="114" fill={`url(#${id}-glow)`} />
      <path d={body} fill={`url(#${id}-body)`} />
      <path d={body} fill={`url(#${id}-sheen)`} />
      <path d={body} fill={`url(#${id}-foot)`} />
      <rect x="0" y="18" width="12" height="96" fill={`url(#${id}-face)`} />
      {/* A glossy highlight riding the curve: a soft bloom, then the crisp streak on top. */}
      <path d={gloss} fill="none" stroke={`url(#${id}-gloss)`} strokeWidth="6" strokeLinecap="round" opacity="0.4" filter={`url(#${id}-bloom)`} />
      <path d={gloss} fill="none" stroke={`url(#${id}-gloss)`} strokeWidth="1.8" strokeLinecap="round" filter={`url(#${id}-soft)`} />
      <path d={rim} fill="none" stroke={`url(#${id}-rim)`} strokeWidth="0.9" />
    </svg>
  );
}
