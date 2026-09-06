import Link from "next/link";
import { Music2 } from "lucide-react";
import { SocialLinks } from "@/components/media/SocialLinks";
import { navItems, utilityNav, siteConfig } from "@/config/site";
import type { SocialLinks as SocialData } from "@/lib/types";
import { Waveform } from "@/components/ui/Waveform";

export function Footer({ social }: { social: SocialData }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/10 bg-ink-deep">
      <div className="container-editorial py-16 md:py-24">
        <Waveform className="mb-14" mode="reveal" />

        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="font-serif text-3xl text-ivory">
              Reza Ohadi
            </Link>
            <p className="mt-4 max-w-sm font-sans text-sm leading-relaxed text-silver-300">
              {siteConfig.tagline} Original compositions and a curated catalogue
              of digital sheet music.
            </p>
            <a
              href={`mailto:${social.email}`}
              className="mt-6 inline-block font-serif text-xl text-ivory link-underline"
            >
              {social.email}
            </a>
          </div>

          <nav className="md:col-span-3" aria-label="Footer">
            <h2 className="kicker mb-5">Explore</h2>
            <ul className="flex flex-col gap-3">
              {navItems.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    className="font-sans text-sm text-silver-300 transition-colors hover:text-ivory"
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h2 className="kicker mb-5">Elsewhere</h2>
            <ul className="flex flex-col gap-3">
              {utilityNav.map((u) => (
                <li key={u.href}>
                  <Link
                    href={u.href}
                    className="font-sans text-sm text-silver-300 transition-colors hover:text-ivory"
                  >
                    {u.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="font-sans text-sm text-silver-300 transition-colors hover:text-ivory"
                >
                  Booking &amp; Licensing
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <SocialLinks social={social} />
              {social.soundcloud ? (
                <a
                  className="action-text mt-3"
                  href={social.soundcloud}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Music2 size={18} aria-hidden /> SoundCloud
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-silver-400 sm:flex-row sm:items-center">
          <p className="font-sans text-xs">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="font-sans text-xs">Crafted as a quiet musical world.</p>
        </div>
      </div>
    </footer>
  );
}
