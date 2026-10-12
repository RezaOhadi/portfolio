import { createPiano, frequencyOf, pitchOf, sampleUrls } from "@/components/journey/audio";

/**
 * Renders each note of the navigation octave offline through the site's own
 * Salamander sampler, then measures its fundamental with an FFT.
 *
 * Measurement: 1 s of the sustain (from 150 ms, past the hammer transient),
 * Hann window, zero-padded to 2^19 points (0.084 Hz bins at 44.1 kHz). A
 * harmonic product spectrum picks the fundamental (robust when the second
 * partial is louder), and a parabolic fit on the log magnitude of that peak
 * gives the frequency to a small fraction of a bin.
 */
export const OCTAVE = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"];
export const TOLERANCE_CENTS = 3;

export interface PitchResult {
  note: string;
  expected: number;
  measured: number;
  cents: number;
  pass: boolean;
}

const RATE = 44100;
const SIZE = 1 << 19;

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }
}

/** Fundamental frequency of a mono signal, in Hz. */
export function fundamental(samples: Float32Array, rate = RATE) {
  const start = Math.round(0.15 * rate);
  const length = Math.min(rate, samples.length - start);
  const re = new Float64Array(SIZE);
  const im = new Float64Array(SIZE);
  for (let i = 0; i < length; i++) re[i] = samples[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1)));
  fft(re, im);
  const bin = rate / SIZE;
  const top = Math.ceil(7000 / bin);
  const mag = new Float64Array(top);
  for (let k = 0; k < top; k++) mag[k] = Math.hypot(re[k], im[k]) + 1e-12;
  // Harmonic product spectrum over the first three partials, 60 Hz to 2.2 kHz.
  let best = 0;
  let bestScore = -Infinity;
  for (let k = Math.floor(60 / bin); k < Math.ceil(2200 / bin); k++) {
    const score = Math.log(mag[k]) + Math.log(mag[2 * k]) + Math.log(mag[3 * k]);
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  // The true peak of that partial, within a quarter tone.
  const span = Math.max(2, Math.round(best * (2 ** (50 / 1200) - 1)));
  let peak = best;
  for (let k = best - span; k <= best + span; k++) if (mag[k] > mag[peak]) peak = k;
  const [a, b, c] = [Math.log(mag[peak - 1]), Math.log(mag[peak]), Math.log(mag[peak + 1])];
  const offset = (0.5 * (a - c)) / (a - 2 * b + c);
  return (peak + offset) * bin;
}

/** Renders one frequency through the site's sampler, offline. */
async function render(tone: typeof import("tone"), hz: number) {
  const buffer = await tone.Offline(
    async () => {
      const piano = createPiano(tone).toDestination();
      await tone.loaded();
      piano.triggerAttackRelease(hz, 1.8, 0, 0.8);
    },
    1.6,
    1,
    RATE,
  );
  return buffer.getChannelData(0);
}

export async function runPitchTest(onResult?: (result: PitchResult) => void) {
  const tone = await import("tone");
  const results: PitchResult[] = [];
  for (const note of OCTAVE) {
    // Exactly what a key press sends: the note name resolved by pitchOf().
    const measured = fundamental(await render(tone, pitchOf(note)));
    const expected = frequencyOf(note);
    const cents = 1200 * Math.log2(measured / expected);
    const result = { note, expected, measured, cents, pass: Math.abs(cents) <= TOLERANCE_CENTS };
    results.push(result);
    onResult?.(result);
  }
  return results;
}

/** Tuning of each recording itself (played at its own pitch, uncorrected), C2 to C7. */
export async function measureSamples() {
  const tone = await import("tone");
  const rows: { sample: string; cents: number }[] = [];
  for (const sample of Object.keys(sampleUrls())) {
    const octave = Number(sample.slice(-1));
    if (octave < 2 || octave > 7 || (octave === 7 && sample !== "C7")) continue;
    const measured = fundamental(await render(tone, frequencyOf(sample)));
    rows.push({ sample, cents: 1200 * Math.log2(measured / frequencyOf(sample)) });
  }
  return rows;
}
