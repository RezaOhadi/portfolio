import { Fragment } from "react";
import type { SectionTitle } from "@/lib/types";

/**
 * Renders an editable section title exactly as the hardcoded ones were:
 * line breaks become <br>, and the optional accent is the italic ending.
 */
export function SectionTitleText({ title }: { title: SectionTitle }) {
  const lines = title.text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
      {title.accent ? (
        <>
          {" "}
          <em>{title.accent}</em>
        </>
      ) : null}
    </>
  );
}
