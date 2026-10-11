"use client";

import type * as ToneNS from "tone";

/**
 * Piano voice for the journey. Tone.js and the samples load only when the
 * visitor switches sound on; nothing plays before that click.
 *
 * Samples: Salamander Grand Piano by Alexander Holm, CC BY 3.0, served from
 * /public/audio/salamander (every minor third, A0 to C8; Tone pitch-shifts
 * the notes in between).
 */
let Tone: typeof ToneNS | null = null;
let sampler: ToneNS.Sampler | null = null;
let ready: Promise<void> | null = null;
let enabled = false;
let lastNoteAt = 0;

function sampleMap() {
  const urls: Record<string, string> = { A0: "A0.mp3", C8: "C8.mp3" };
  for (let octave = 1; octave <= 7; octave++) {
    urls[`C${octave}`] = `C${octave}.mp3`;
    urls[`D#${octave}`] = `Ds${octave}.mp3`;
    urls[`F#${octave}`] = `Fs${octave}.mp3`;
    urls[`A${octave}`] = `A${octave}.mp3`;
  }
  return urls;
}

/** Must be called from a user gesture: it unlocks the AudioContext. */
export async function enableSound() {
  if (!ready) {
    ready = (async () => {
      Tone = await import("tone");
      await Tone.start();
      const reverb = new Tone.Reverb({ decay: 4.8, wet: 0.3, preDelay: 0.02 }).toDestination();
      const limiter = new Tone.Limiter(-3).connect(reverb);
      sampler = new Tone.Sampler({ urls: sampleMap(), baseUrl: "/audio/salamander/", release: 1.4 }).connect(limiter);
      sampler.volume.value = -8;
      await Tone.loaded();
    })();
  } else if (Tone) {
    await Tone.start();
  }
  await ready;
  enabled = true;
}

export function disableSound() {
  enabled = false;
  sampler?.releaseAll();
}

export function isSoundReady() {
  return enabled && sampler !== null;
}

/** midi: 21 (A0) .. 108 (C8). velocity 0..1. Rate-limited so hover sweeps stay musical. */
export function playNote(midi: number, velocity = 0.6, duration = 2.4) {
  if (!enabled || !sampler || !Tone) return;
  const now = Tone.now();
  if (now - lastNoteAt < 0.045) return;
  lastNoteAt = now;
  const note = Tone.Frequency(Math.round(midi), "midi").toNote();
  sampler.triggerAttackRelease(note, duration, now, Math.max(0.05, Math.min(1, velocity)));
}
