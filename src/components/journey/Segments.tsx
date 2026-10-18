import type { CSSProperties, ReactNode } from "react";
import { SEGMENTS } from "./config";
import styles from "./journey.module.css";

/** A world: real page content laid over one 3D world. Server-renderable. */
export function World({
  id,
  as = "div",
  sectionId,
  nav = false,
  labelledBy,
  className,
  children,
}: {
  id: string;
  as?: "div" | "section";
  sectionId?: string;
  nav?: boolean;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag
      id={sectionId}
      data-segment={id}
      data-kind="world"
      data-nav-section={nav || undefined}
      data-fx-scope=""
      aria-labelledby={labelledBy}
      className={[styles.world, className].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}

/** An empty scroll runway where the piano changes form. Decorative only. */
export function Transition({ id }: { id: string }) {
  const def = SEGMENTS.find((s) => s.id === id);
  const runway = def?.runway ?? 1;
  // Unbuilt worlds collapse their runway until they land. Built ones hand their lengths to
  // the stylesheet, which picks the phone length under STACKED_QUERY (journey.module.css).
  const style = def?.built
    ? ({ "--runway": runway, "--runway-stacked": def.runwayStacked ?? runway } as CSSProperties)
    : { height: "0px" };
  return (
    <div
      aria-hidden
      data-segment={id}
      data-kind="transition"
      data-built={def?.built ? "true" : "false"}
      className={styles.transition}
      style={style}
    />
  );
}
