"use client";

import type * as ToneNS from "tone";

/**
 * Piano voice for the site. Tone.js and the samples load only when the
 * visitor switches sound on; nothing plays before that click. The five
 * recordings behind the menu octave (C4-B4) load first, so sound is ready in
 * one small download; the full range follows in the background and takes over
 * once it has arrived.
 *
 * Samples: Salamander Grand Piano by Alexander Holm, CC BY 3.0, served from
 * /public/audio/salamander (every minor third, A0 to C8; Tone pitch-shifts
 * the notes in between). They are MP3 data under a neutral ".sample"
 * extension: download managers such as IDM intercept *.mp3 and audio/* responses
 * in every browser on the machine and hand the page an empty reply, which
 * silenced the site for those visitors. Notes are always addressed by name ("E4"), equal
 * temperament with A4 = 440 Hz, so the same key always sounds the same pitch.
 */
let Tone: typeof ToneNS | null = null;
let sampler: ToneNS.Sampler | null = null;
/** True once the full A0-C8 range is loaded; before that only notes near the menu octave play. */
let complete = false;
let ready: Promise<void> | null = null;
let enabled = false;
let lastNoteAt = 0;

export const SAMPLE_BASE = "/audio/salamander/";

/** Sample files by the exact note each one was recorded at. */
export function sampleUrls() {
  const urls: Record<string, string> = { A0: "A0.sample", C8: "C8.sample" };
  for (let octave = 1; octave <= 7; octave++) {
    urls[`C${octave}`] = `C${octave}.sample`;
    urls[`D#${octave}`] = `Ds${octave}.sample`;
    urls[`F#${octave}`] = `Fs${octave}.sample`;
    urls[`A${octave}`] = `A${octave}.sample`;
  }
  return urls;
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** MIDI number to scientific pitch name: 60 -> "C4", 61 -> "C#4". */
export function noteName(midi: number) {
  const m = Math.round(midi);
  return `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

/** Equal temperament, A4 = 440 Hz. */
export function frequencyOf(name: string) {
  const match = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`Not a note name: ${name}`);
  const midi = NAMES.indexOf(match[1]) + (Number(match[2]) + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * How far each recording sits from equal temperament, in cents, measured by
 * `npm run test:pitch -- --samples`. Only the recordings behind the C4-B4 menu
 * octave are corrected, so every key there is exact; the rest of the range
 * keeps the piano's natural stretch tuning (bass a little flat, treble up to
 * ~8 cents sharp), which is what makes a real piano's octaves sound in tune.
 */
export const SAMPLE_TUNING: Record<string, number> = {
  C4: -1.44,
  "D#4": 1.19,
  "F#4": -2.88,
  A4: 0.63,
  C5: 5.19,
};

/** The recording Tone.Sampler stretches for a note: the nearest sample, the one above on a tie. */
export function sampleFor(name: string) {
  const midi = Math.round(69 + 12 * Math.log2(frequencyOf(name) / 440));
  const available = new Set(Object.keys(sampleUrls()).map((n) => Math.round(69 + 12 * Math.log2(frequencyOf(n) / 440))));
  for (let interval = 0; interval < 96; interval++) {
    if (available.has(midi + interval)) return noteName(midi + interval);
    if (available.has(midi - interval)) return noteName(midi - interval);
  }
  return name;
}

/** The exact frequency to ask the sampler for: the note, corrected for its sample's tuning. */
export function pitchOf(name: string) {
  return frequencyOf(name) * 2 ** (-(SAMPLE_TUNING[sampleFor(name)] ?? 0) / 1200);
}

/** The recordings the C4-B4 menu keys play from (each key's nearest sample, as in the full set). */
export const MENU_SAMPLES = ["C4", "D#4", "F#4", "A4", "C5"];
/** Notes the menu samples cover without stretching further than the full set would. */
const MENU_RANGE = [57, 75]; // A3 .. D#5

/** The one piano voice: the app and the pitch test build it the same way. */
export function createPiano(tone: typeof ToneNS, only?: string[], onload?: () => void) {
  const all = sampleUrls();
  const urls = only ? Object.fromEntries(only.map((n) => [n, all[n]])) : all;
  return new tone.Sampler({ urls, baseUrl: SAMPLE_BASE, release: 1.4, onload });
}

/** Must be called from a user gesture: it unlocks the AudioContext. */
export async function enableSound() {
  if (!ready) {
    ready = (async () => {
      Tone = await import("tone");
      await Tone.start();
      const reverb = new Tone.Reverb({ decay: 4.8, wet: 0.3, preDelay: 0.02 }).toDestination();
      const limiter = new Tone.Limiter(-3).connect(reverb);
      const tone = Tone;
      // Menu octave first: sound is ready after five small files.
      const menu = await new Promise<ToneNS.Sampler>((resolve, reject) => {
        const voice: ToneNS.Sampler = createPiano(tone, MENU_SAMPLES, () => resolve(voice));
        voice.connect(limiter);
        voice.volume.value = -8;
        window.setTimeout(() => reject(new Error("Piano samples did not load")), 30000);
      });
      sampler = menu;
      // Then the whole keyboard, quietly in the background.
      const full: ToneNS.Sampler = createPiano(tone, undefined, () => {
        sampler = full;
        complete = true;
        window.setTimeout(() => menu.dispose(), 6000);
      });
      full.connect(limiter);
      full.volume.value = -8;
    })();
    // A failed load must not wedge the switch: the next attempt starts over.
    ready.catch(() => {
      ready = null;
    });
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

/** Plays a note by name ("E4", "F#4"). Rate-limited so hover sweeps stay musical. */
export function playPitch(name: string, velocity = 0.6, duration = 2.4) {
  if (!enabled || !sampler || !Tone) return;
  const now = Tone.now();
  if (now - lastNoteAt < 0.045) return;
  if (!complete) {
    const midi = Math.round(69 + 12 * Math.log2(frequencyOf(name) / 440));
    if (midi < MENU_RANGE[0] || midi > MENU_RANGE[1]) return;
  }
  lastNoteAt = now;
  sampler.triggerAttackRelease(pitchOf(name), duration, now, Math.max(0.05, Math.min(1, velocity)));
}

/** midi: 21 (A0) .. 108 (C8). velocity 0..1. */
export function playNote(midi: number, velocity = 0.6, duration = 2.4) {
  playPitch(noteName(midi), velocity, duration);
}

/** A closing cadence (V - I in Ab), the answer to a sent message. */
export function playCadence() {
  if (!enabled || !sampler || !Tone) return;
  const now = Tone.now();
  if (!complete) return;
  const at = (midis: number[], delay: number, velocity: number, duration: number) =>
    sampler!.triggerAttackRelease(midis.map((m) => pitchOf(noteName(m))), duration, now + delay, velocity);
  at([39, 51, 55, 58, 63], 0, 0.42, 1.6);
  at([32, 44, 56, 60, 63, 68], 0.9, 0.5, 4.5);
  at([72], 1.25, 0.32, 3.5);
}
