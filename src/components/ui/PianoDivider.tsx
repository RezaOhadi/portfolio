import { cn } from "@/lib/utils";

/**
 * Recurring visual language: a cinematic divider inspired by the keys + strings
 * inside a grand piano. Pure SVG, no JS. Used between editorial sections.
 */
export function PianoDivider({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const keys = Array.from({ length: 28 });
  return (
    <div className={cn("relative w-full select-none", className)} aria-hidden>
      <div className="container-editorial">
        <div className="flex items-end justify-between gap-[3px] opacity-60">
          {keys.map((_, i) => {
            // Every few keys, drop a "black key" accent.
            const isBlack = [1, 2, 4, 5, 6].includes(i % 7);
            return (
              <span
                key={i}
                className={cn(
                  "block flex-1 origin-bottom rounded-[1px]",
                  isBlack ? "h-3 bg-ivory/15" : "h-6 bg-ivory/35",
                )}
              />
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="hairline" />
          {label ? <span className="kicker shrink-0">{label}</span> : null}
          <span className="hairline" />
        </div>
      </div>
    </div>
  );
}
