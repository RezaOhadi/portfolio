"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Instagram, Youtube, Music2 } from "lucide-react";
import { navItems, utilityNav, siteConfig } from "@/config/site";
import type { SocialLinks } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/motion/presets";

export function Nav({ social }: { social: SocialLinks }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Glass bar after a little scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body scroll lock + Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      toggleRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Top bar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[70] transition-colors duration-500",
          scrolled && !open ? "glass" : "bg-transparent",
        )}
      >
        <div className="container-editorial flex h-16 items-center justify-between md:h-20">
          <Link
            href="/"
            className="font-serif text-lg tracking-wide text-ivory transition-opacity hover:opacity-70 md:text-xl"
            aria-label={`${siteConfig.name} — home`}
          >
            Reza&nbsp;Ohadi
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            <Link
              href="/store"
              className="kicker text-silver-300 transition-colors hover:text-ivory"
            >
              Sheet Music
            </Link>
            <Link
              href="/library"
              className="kicker text-silver-300 transition-colors hover:text-ivory"
            >
              My Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Menu toggle — always on top */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="fixed right-5 top-5 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-ink/40 backdrop-blur transition-colors hover:border-ivory md:right-8 md:top-6"
      >
        <span className="relative block h-3 w-5">
          <span
            className={cn(
              "absolute left-0 block h-px w-5 bg-ivory transition-all duration-300 ease-cinematic",
              open ? "top-1.5 rotate-45" : "top-0.5",
            )}
          />
          <span
            className={cn(
              "absolute left-0 block h-px w-5 bg-ivory transition-all duration-300 ease-cinematic",
              open ? "top-1.5 -rotate-45" : "top-2.5",
            )}
          />
        </span>
      </button>

      {/* Full-screen menu */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-[90] overflow-hidden bg-ink-deep"
            initial={{ opacity: reduce ? 0 : 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: EASE } }}
          >
            {/* Piano-key panels covering the screen */}
            <div className="absolute inset-0 flex" aria-hidden>
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={i % 2 === 0 ? "h-full flex-1 bg-ink-deep" : "h-full flex-1 bg-charcoal-900"}
                  style={{ originY: 1 }}
                  initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
                  animate={{ scaleY: 1, transition: { duration: 0.6, ease: EASE, delay: i * 0.04 } }}
                  exit={{ scaleY: 0, transition: { duration: 0.4, ease: EASE, delay: i * 0.03 } }}
                />
              ))}
            </div>

            {/* Content */}
            <motion.div
              className="relative z-10 flex h-full flex-col justify-between gap-8 overflow-y-auto px-6 pb-10 pt-24 sm:px-10 md:px-16 md:pt-28"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07, delayChildren: reduce ? 0 : 0.3 } },
              }}
            >
              <span className="kicker">Index</span>

              <nav aria-label="Full menu" className="flex flex-col gap-1 py-8">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      variants={{
                        hidden: { opacity: 0, y: 24 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
                      }}
                    >
                      <Link
                        href={item.href}
                        className="group flex items-baseline gap-5 py-1.5"
                      >
                        <span className="w-8 shrink-0 font-sans text-xs tracking-widest text-silver-400">
                          {item.index}
                        </span>
                        <span
                          className={cn(
                            "font-serif text-[2.6rem] leading-[1.05] transition-all duration-500 ease-cinematic group-hover:translate-x-3 sm:text-6xl",
                            active ? "text-ivory" : "text-silver-300 group-hover:text-ivory",
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="mb-2 h-px w-0 self-end bg-ivory transition-all duration-500 ease-cinematic group-hover:w-12" />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
                }}
                className="flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between"
              >
                <div className="flex flex-col gap-2">
                  {utilityNav.map((u) => (
                    <Link
                      key={u.href}
                      href={u.href}
                      className="kicker text-silver-300 transition-colors hover:text-ivory"
                    >
                      {u.label}
                    </Link>
                  ))}
                  <a
                    href={`mailto:${social.email}`}
                    className="font-serif text-xl text-ivory link-underline"
                  >
                    {social.email}
                  </a>
                </div>
                <div className="flex items-center gap-5 text-silver-300">
                  {social.instagram ? (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-colors hover:text-ivory">
                      <Instagram className="h-5 w-5" />
                    </a>
                  ) : null}
                  {social.youtube ? (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-colors hover:text-ivory">
                      <Youtube className="h-5 w-5" />
                    </a>
                  ) : null}
                  {social.soundcloud ? (
                    <a href={social.soundcloud} target="_blank" rel="noopener noreferrer" aria-label="SoundCloud" className="transition-colors hover:text-ivory">
                      <Music2 className="h-5 w-5" />
                    </a>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
