"use client";

import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { disableSound, enableSound } from "./audio";
import styles from "./journey.module.css";
import { emit, emitSparks, journey } from "./store";

gsap.registerPlugin(SplitText, useGSAP);

type Choice = "pending" | "sound" | "silence";

/**
 * One decision at the threshold: enter with sound, or in silence. After it,
 * sound simply follows every interaction; a single quiet mute control stays
 * in the corner on every breakpoint. Scrolling past the hero counts as
 * silence, never as a blocked page.
 */
export function SoundControls({ ready }: { ready: boolean }) {
  const [choice, setChoice] = useState<Choice>("pending");
  const [on, setOn] = useState(false);
  const gate = useRef<HTMLDivElement>(null);
  const corner = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  const dismiss = (next: Choice) => {
    const node = gate.current;
    if (!node || leaving.current) return;
    leaving.current = true;
    const r = node.getBoundingClientRect();
    emitSparks(r.left + r.width / 2, r.top + r.height / 2, r.width, r.height, 70);
    gsap.to(node, {
      filter: "opacity(0) blur(10px)",
      y: -20,
      duration: 0.9,
      ease: "power3.in",
      onComplete: () => setChoice(next),
    });
  };

  const enterWithSound = async () => {
    dismiss("sound");
    try {
      await enableSound();
      journey.sound = true;
      setOn(true);
      emit();
    } catch {
      setOn(false);
    }
  };

  const toggle = async () => {
    if (on) {
      disableSound();
      journey.sound = false;
      setOn(false);
    } else {
      await enableSound();
      journey.sound = true;
      setOn(true);
    }
    emit();
  };

  // Scrolling away from the threshold means silence.
  useEffect(() => {
    if (choice !== "pending") return;
    const check = () => {
      if (window.scrollY > window.innerHeight * 0.45) dismiss("silence");
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [choice]);

  // Gate entrance: a gold hairline draws, the invitation rises letter by letter.
  useGSAP(
    () => {
      const node = gate.current;
      if (!node || !ready || choice !== "pending") return;
      if (journey.reduced) {
        gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.8 });
        return;
      }
      const split = SplitText.create(node.querySelector("[data-gate-title]"), { type: "chars", mask: "chars" });
      gsap
        .timeline({ delay: 1.6 })
        .set(node, { opacity: 1 })
        .from(node.querySelector("[data-gate-line]"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" })
        .from(split.chars, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.028 }, "-=0.7")
        .from(node.querySelector("[data-gate-ring]"), { scale: 0.6, opacity: 0, duration: 1.2, ease: "expo.out" }, "<")
        .from(node.querySelector("[data-gate-alt]"), { opacity: 0, letterSpacing: "0.6em", duration: 1.2, ease: "expo.out" }, "-=0.8");
    },
    { dependencies: [ready, choice], scope: gate },
  );

  // The corner control draws itself in once the threshold is behind us.
  useGSAP(
    () => {
      if (choice === "pending" || !corner.current) return;
      gsap.from(corner.current, { opacity: 0, scale: 0.7, rotate: -40, duration: 1.1, ease: "expo.out" });
    },
    { dependencies: [choice], scope: corner },
  );

  return (
    <>
      {choice === "pending" && (
        <div ref={gate} className={styles.gate} style={{ opacity: 0 }}>
          <span className={styles.gateLine} data-gate-line aria-hidden />
          <button type="button" className={styles.gateButton} onClick={enterWithSound}>
            <span className={styles.gateRing} data-gate-ring aria-hidden>
              <Volume2 size={16} strokeWidth={1.5} />
            </span>
            <span data-gate-title>Enter with sound</span>
          </button>
          <button type="button" className={styles.gateAlt} data-gate-alt onClick={() => dismiss("silence")}>
            or continue in silence
          </button>
        </div>
      )}
      {choice !== "pending" && (
        <div ref={corner} className={styles.corner}>
          <motion.button
            type="button"
            className={styles.mute}
            aria-label={on ? "Mute sound" : "Turn sound on"}
            aria-pressed={on}
            onClick={toggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            {on ? <Volume2 size={15} strokeWidth={1.5} /> : <VolumeX size={15} strokeWidth={1.5} />}
          </motion.button>
          {on && (
            <a className={styles.credit} href="https://sfzinstruments.github.io/pianos/salamander" target="_blank" rel="noopener noreferrer">
              Salamander Grand, A. Holm, CC BY 3.0
            </a>
          )}
        </div>
      )}
    </>
  );
}
