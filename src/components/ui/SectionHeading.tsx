import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
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
        as="h2"
        className={cn(
          "max-w-3xl font-serif text-4xl leading-[1.05] text-ivory sm:text-5xl lg:text-6xl",
          align === "center" && "mx-auto",
          titleClassName,
        )}
      />
      {description ? (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "max-w-prose font-sans text-base leading-relaxed text-silver-300",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
