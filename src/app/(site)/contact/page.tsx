import type { Metadata } from "next";
import { Instagram, Youtube, Music2, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { getSocialLinks } from "@/lib/data/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Reza Ohadi for bookings, sheet-music licensing, private lessons and collaborations.",
};

export default async function ContactPage() {
  const social = await getSocialLinks();

  return (
    <>
      <PageHeader
        kicker="Contact"
        title="Let’s make something resonant"
        description="Whether it’s a performance, a commission, licensing a score, or lessons — I read every message personally."
      />

      <section className="container-editorial grid gap-14 pb-28 md:grid-cols-12 md:gap-16 md:pb-40">
        <div className="md:col-span-7">
          <ContactForm />
        </div>

        <aside className="md:col-span-5 md:border-l md:border-white/10 md:pl-14">
          <Reveal>
            <h2 className="kicker mb-5">Direct</h2>
            <a
              href={`mailto:${social.email}`}
              className="group inline-flex items-center gap-3 font-serif text-2xl text-ivory"
            >
              <Mail className="h-5 w-5 text-silver-400" />
              <span className="link-underline">{social.email}</span>
            </a>

            <h2 className="kicker mb-5 mt-12">Elsewhere</h2>
            <ul className="flex flex-col gap-4">
              {social.instagram ? (
                <li>
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-silver-200 transition-colors hover:text-ivory">
                    <Instagram className="h-5 w-5" /> <span className="link-underline">Instagram</span>
                  </a>
                </li>
              ) : null}
              {social.youtube ? (
                <li>
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-silver-200 transition-colors hover:text-ivory">
                    <Youtube className="h-5 w-5" /> <span className="link-underline">YouTube</span>
                  </a>
                </li>
              ) : null}
              {social.soundcloud ? (
                <li>
                  <a href={social.soundcloud} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-silver-200 transition-colors hover:text-ivory">
                    <Music2 className="h-5 w-5" /> <span className="link-underline">SoundCloud</span>
                  </a>
                </li>
              ) : null}
            </ul>

            <div className="mt-12 space-y-6 border-t border-white/10 pt-8">
              <div>
                <h3 className="font-serif text-lg text-ivory">Booking inquiries</h3>
                <p className="mt-1 max-w-sm font-sans text-sm leading-relaxed text-silver-300">
                  Concerts, private events and collaborations. Choose “Booking” in the form.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg text-ivory">Sheet-music licensing</h3>
                <p className="mt-1 max-w-sm font-sans text-sm leading-relaxed text-silver-300">
                  For arrangements, ensembles, or commercial use beyond personal performance.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg text-ivory">Private lessons</h3>
                <p className="mt-1 max-w-sm font-sans text-sm leading-relaxed text-silver-300">
                  Limited availability for dedicated students, in person or online.
                </p>
              </div>
            </div>
          </Reveal>
        </aside>
      </section>
    </>
  );
}
