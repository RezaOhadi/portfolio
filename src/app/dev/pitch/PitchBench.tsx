"use client";

import { useEffect, useState } from "react";
import { measureSamples, runPitchTest, TOLERANCE_CENTS, type PitchResult } from "@/lib/audio/pitchTest";

declare global {
  interface Window {
    __pitch?: Promise<PitchResult[]>;
    /** ?samples: the tuning of each recording itself, for SAMPLE_TUNING in audio.ts. */
    __samples?: Promise<{ sample: string; cents: number }[]>;
  }
}

/** Renders the twelve notes offline and shows the measured pitch of each. */
export function PitchBench() {
  const [rows, setRows] = useState<PitchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.__pitch || window.__samples) return;
    if (new URLSearchParams(location.search).has("samples")) {
      window.__samples = measureSamples();
      return;
    }
    window.__pitch = runPitchTest((row) => setRows((all) => [...all, row]));
    window.__pitch.catch((reason: unknown) => setError(String(reason)));
  }, []);

  return (
    <main style={{ padding: "48px", fontFamily: "var(--font-sans)", color: "#f2eee6", background: "#0a0a0c", minHeight: "100dvh" }}>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 40, marginBottom: 8 }}>Pitch test</h1>
      <p style={{ marginBottom: 24 }}>
        Each note rendered offline through the Salamander sampler; fundamental measured by FFT. Pass within ±{TOLERANCE_CENTS} cents of equal
        temperament, A4 = 440 Hz.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      <table data-done={rows.length === 12 || undefined} style={{ borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr>
            {["Note", "Expected Hz", "Measured Hz", "Cents", "Result"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "6px 18px 6px 0" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.note}>
              <td style={{ padding: "4px 18px 4px 0" }}>{r.note}</td>
              <td>{r.expected.toFixed(2)}</td>
              <td>{r.measured.toFixed(2)}</td>
              <td>{(r.cents >= 0 ? "+" : "") + r.cents.toFixed(2)}</td>
              <td>{r.pass ? "pass" : "FAIL"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
