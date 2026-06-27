import Link from "next/link";
import { Instagram, Youtube, Music2 } from "lucide-react";
import { navItems, utilityNav, siteConfig } from "@/config/site";
import type { SocialLinks } from "@/lib/types";
import { Waveform } from "@/components/ui/Waveform";

export function Footer({ social }: { social: SocialLinks }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/10 bg-ink-deep">
      <div className="container-editorial py-16 md:py-24">
        <Waveform className="mb-14" />

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
            <div className="mt-6 flex items-center gap-5 text-silver-300">
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
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-silver-400 sm:flex-row sm:items-center">
          <p className="font-sans text-xs">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="font-sans text-xs">
            Crafted as a quiet musical world.
          </p>
        </div>
      </div>
    </footer>
  );
}
