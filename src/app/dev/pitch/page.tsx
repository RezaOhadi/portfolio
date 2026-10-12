import { notFound } from "next/navigation";
import { PitchBench } from "./PitchBench";

/** Development-only test bench for the piano voice (see scripts/pitch-test.mjs). */
export const metadata = { title: "Pitch test", robots: { index: false } };

export default function PitchTestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PitchBench />;
}
