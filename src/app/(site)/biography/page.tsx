import type { Metadata } from "next";
import Image from "next/image";
import { PianoDivider } from "@/components/ui/PianoDivider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { Button } from "@/components/ui/Button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { getBioContent } from "@/lib/data/content";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Biography",
  description:
    "The story of pianist and composer Reza Ohadi — training, performances and a personal philosophy of music.",
};

export default async function BiographyPage() {
  const bio = await getBioContent();

  return (
    <>
      {/* Hero — portrait + intro */}
      <section className="container-editorial grid items-end gap-10 pb-16 pt-32 md:grid-cols-12 md:gap-12 md:pt-44">
        <div className="md:col-span-5">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden bg-charcoal-900 ring-1 ring-white/10">
              <Image
                src={bio.portraitImage}
                alt="Portrait of Reza Ohadi"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover grayscale"
              />
            </div>
          </Reveal>
        </div>
        <div className="md:col-span-7">
          <Reveal>
            <span className="kicker flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-silver-400/60" />
              Biography
            </span>
          </Reveal>
          <TextReveal
            text="A quiet kind of music"
            as="h1"
            immediate
            className="mt-5 font-serif text-5xl leading-[1.03] text-ivory sm:text-6xl"
          />
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-prose font-sans text-lg leading-relaxed text-silver-200">
              {bio.intro}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 max-w-sm">
              <p className="kicker mb-3">Listen while reading</p>
              <AudioPlayer src={bio.listenWhileReadingUrl} title="Ambient excerpt" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pull quote */}
      {bio.pullQuotes[0] ? (
        <section className="py-20 md:py-28">
          <div className="container-editorial">
            <Reveal>
              <blockquote className="mx-auto max-w-4xl text-center font-serif text-3xl font-light italic leading-[1.3] text-ivory sm:text-4xl lg:text-5xl">
                “{bio.pullQuotes[0]}”
              </blockquote>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Composer statement */}
      <section className="container-editorial grid gap-10 py-16 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4">
          <SectionHeading kicker="Composer Statement" title="On writing" />
        </div>
        <div className="md:col-span-8">
          <Reveal>
            <p className="max-w-prose whitespace-pre-line font-sans text-lg leading-relaxed text-silver-200">
              {bio.statement}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Wide cinematic image */}
      <section className="py-12">
        <Reveal>
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-charcoal-900 md:aspect-[21/9]">
            <Image
              src={bio.wideImage}
              alt="Reza Ohadi performing"
              fill
              sizes="100vw"
              className="object-cover grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          </div>
        </Reveal>
      </section>

      <PianoDivider label="The Journey" className="py-8" />

      {/* Timeline */}
      <section className="container-editorial py-16 md:py-24">
        <SectionHeading kicker="Musical Journey" title="A timeline" className="mb-12" />
        <Stagger className="relative border-l border-white/12 pl-8 md:pl-12">
          {bio.timeline.map((entry, i) => (
            <StaggerItem key={i} className="relative pb-12 last:pb-0">
              <span className="absolute -left-[2.15rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ivory md:-left-[3.15rem]" />
              <div className="grid gap-2 md:grid-cols-12 md:gap-6">
                <span className="font-sans text-sm uppercase tracking-widest text-silver-400 md:col-span-2">
                  {entry.year}
                </span>
                <div className="md:col-span-10">
                  <h3 className="font-serif text-2xl text-ivory">{entry.title}</h3>
                  <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-silver-300">
                    {entry.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Education + Performances */}
      <section className="container-editorial grid gap-12 py-16 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeading kicker="Education & Training" title="Study" className="mb-8" />
          <Stagger className="flex flex-col">
            {bio.education.map((e, i) => (
              <StaggerItem key={i} className="border-t border-white/10 py-5 last:border-b">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-xl text-ivory">{e.title}</h3>
                  <span className="shrink-0 font-sans text-xs uppercase tracking-widest text-silver-400">
                    {e.year}
                  </span>
                </div>
                <p className="mt-1 font-sans text-sm text-silver-300">{e.description}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <div>
          <SectionHeading kicker="Performance History" title="On stage" className="mb-8" />
          <Stagger className="flex flex-col">
            {bio.performances.map((p, i) => (
              <StaggerItem key={i} className="border-t border-white/10 py-5 last:border-b">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-xl text-ivory">{p.title}</h3>
                  <span className="shrink-0 font-sans text-xs uppercase tracking-widest text-silver-400">
                    {formatDate(p.date)}
                  </span>
                </div>
                <p className="mt-1 font-sans text-sm text-silver-300">
                  {p.venue}, {p.location}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Philosophy + pull quote */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-hall-glow opacity-50" />
        <div className="container-editorial relative grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeading kicker="Personal Philosophy" title="Why I play" />
          </div>
          <div className="md:col-span-8">
            <Reveal>
              <p className="max-w-prose whitespace-pre-line font-sans text-lg leading-relaxed text-silver-200">
                {bio.philosophy}
              </p>
            </Reveal>
            {bio.signatureImage ? (
              <Reveal delay={0.1}>
                <Image
                  src={bio.signatureImage}
                  alt="Reza Ohadi signature"
                  width={220}
                  height={72}
                  className="mt-10 h-16 w-auto opacity-80"
                />
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-24 text-center md:py-32">
        <div className="container-editorial">
          <SectionHeading
            align="center"
            kicker="Continue"
            title="Hear the music, or take it home"
            className="mb-10"
            titleClassName="mx-auto"
          />
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/media" variant="outline">Watch performances</Button>
            <Button href="/store" variant="primary">Browse sheet music</Button>
          </div>
        </div>
      </section>
    </>
  );
}
