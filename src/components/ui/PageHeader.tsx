import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";

export function PageHeader({
  kicker,
  title,
  description,
  aside,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "container-editorial pb-12 pt-32 md:pb-16 md:pt-44",
        className,
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          {kicker ? (
            <Reveal>
              <span className="kicker flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-silver-400/60" />
                {kicker}
              </span>
            </Reveal>
          ) : null}
          <TextReveal
            text={title}
            as="h1"
            immediate
            className="mt-5 max-w-4xl font-serif text-5xl leading-[1.02] text-ivory sm:text-6xl lg:text-7xl"
          />
          {description ? (
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-prose font-sans text-base leading-relaxed text-silver-300">
                {description}
              </p>
            </Reveal>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}
