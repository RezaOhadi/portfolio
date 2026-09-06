"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { navItems, utilityNav } from "@/config/site";
import type { SocialLinks } from "@/lib/types";
const sections = [
  { id: "about", label: "About", route: "/biography" },
  { id: "media", label: "Listen & watch", route: "/media" },
  { id: "concerts", label: "Concerts", route: "/#concerts" },
  { id: "gallery", label: "Gallery", route: "/gallery" },
  { id: "contact", label: "Contact", route: "/contact" },
];
export function Nav({ social }: { social: SocialLinks }) {
  const pathname = usePathname();
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
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  return (
    <>
      <header className={"portfolio-nav" + (scrolled ? " is-scrolled" : "")}>
        <div className="nav-inner">
          <Link href="/" className="wordmark" aria-label="Reza Ohadi — home">
            Reza Ohadi<span aria-hidden>.</span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary">
            {sections.map((section) => {
              const selected =
                pathname === "/"
                  ? active === section.id
                  : pathname === section.route;
              return (
                <Link
                  key={section.id}
                  href={pathname === "/" ? "#" + section.id : section.route}
                  className={selected ? "is-active" : ""}
                  aria-current={
                    selected
                      ? pathname === "/"
                        ? "location"
                        : "page"
                      : undefined
                  }
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/store" className="nav-store">
            Sheet music <ArrowUpRight size={15} aria-hidden />
          </Link>
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
          <span className="wordmark">Reza Ohadi.</span>
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
          {(pathname === "/"
            ? [
                { label: "Home", href: "#home", index: "01" },
                ...sections.map((section, i) => ({
                  label: section.label,
                  href: "#" + section.id,
                  index: String(i + 2).padStart(2, "0"),
                })),
                { label: "Sheet Music", href: "/store", index: "07" },
                ...utilityNav,
              ]
            : [...navItems, ...utilityNav]
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <span>{item.index}</span>
              {item.label}
              <ArrowUpRight size={22} aria-hidden />
            </Link>
          ))}
        </nav>
        <a className="menu-email" href={"mailto:" + social.email}>
          {social.email}
        </a>
      </dialog>
    </>
  );
}
