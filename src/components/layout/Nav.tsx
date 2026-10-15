"use client";
import Link from "next/link";
import { useSitePath } from "@/components/layout/useSitePath";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { utilityNav } from "@/config/site";
import type { SocialLinks } from "@/lib/types";
import { PianoKeys, WHITE_KEYS } from "@/components/layout/PianoKeys";
import { LetsPlayButton } from "@/components/golden-grand/LetsPlayButton";
export function Nav({ social }: { social: SocialLinks }) {
  const pathname = useSitePath();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 40));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);
  useEffect(() => {
    setOpen(false);
    if (pathname !== "/" || !("IntersectionObserver" in window)) return;
    const visible = new Map<string, Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.target);
          else visible.delete(entry.target.id);
        });
        const nearest = [...visible.values()].sort(
          (a, b) =>
            Math.abs(a.getBoundingClientRect().top - 120) -
            Math.abs(b.getBoundingClientRect().top - 120),
        )[0];
        if (nearest) setActive(nearest.id);
      },
      { rootMargin: "-100px 0px -45% 0px", threshold: 0 },
    );
    document
      .querySelectorAll("[data-nav-section]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
    // Anything animating behind the full-screen menu can rest while it is open.
    window.dispatchEvent(new CustomEvent("site:menu", { detail: open }));
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  // The key that stays pressed: the section in view on the home page, else the current page.
  const current =
    pathname === "/"
      ? active
      : pathname.startsWith("/store")
        ? "store"
        : (WHITE_KEYS.find((key) => key.route === pathname)?.id ?? null);
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  return (
    <>
      <header className={"portfolio-nav" + (scrolled ? " is-scrolled" : "")}>
        <div className="nav-inner">
          <Link href="/" className="wordmark" aria-label="Reza Ohadi — home">
            <span className="wordmark-name">
              Reza Ohadi<span aria-hidden>.</span>
            </span>
            <span className="wordmark-role" aria-hidden>
              Pianist · Composer
            </span>
          </Link>
          <nav className="piano-nav" aria-label="Primary">
            <PianoKeys
              variant="bar"
              label="Site sections, one octave from C to B"
              active={current}
              onHome={pathname === "/"}
            />
          </nav>
          <LetsPlayButton variant="nav" />
          <button
            ref={toggle}
            type="button"
            className="menu-toggle"
            aria-label="Open navigation menu"
            aria-controls="site-menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
        </div>
      </header>
      <dialog
        ref={dialog}
        id="site-menu"
        className="navigation-dialog"
        onCancel={close}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="menu-heading">
          <span className="wordmark">
            <span className="wordmark-name">
              Reza Ohadi<span aria-hidden>.</span>
            </span>
            <span className="wordmark-role" aria-hidden>
              Pianist · Composer
            </span>
          </span>
          <button
            type="button"
            autoFocus
            onClick={close}
            aria-label="Close navigation menu"
          >
            <X aria-hidden />
          </button>
        </div>
        <nav aria-label="Full navigation">
          <PianoKeys
            variant="stack"
            label="Site sections, one octave from C to B"
            active={current}
            onHome={pathname === "/"}
            onNavigate={close}
          />
          <div className="menu-utility">
            {utilityNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
                <ArrowUpRight size={18} aria-hidden />
              </Link>
            ))}
          </div>
        </nav>
        <a className="menu-email" href={"mailto:" + social.email}>
          {social.email}
        </a>
      </dialog>
    </>
  );
}
