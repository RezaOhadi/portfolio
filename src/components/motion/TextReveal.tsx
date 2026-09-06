import type { ElementType } from "react";
import { Reveal } from "./Reveal";
/** Server-visible headings; one subtle entrance rather than hidden word spans. */
export function TextReveal({
  text,
  className,
  as = "h2",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  immediate?: boolean;
  stagger?: number;
}) {
  return (
    <Reveal as={as} className={className} delay={delay}>
      {text}
    </Reveal>
  );
}
