import assert from "node:assert/strict";
import { test } from "node:test";
import { access, readFile } from "node:fs/promises";
import ts from "typescript";

/*
 * The piano voice and the navigation octave, without a browser: every key names
 * one exact pitch, and that pitch is the equal-tempered frequency (A4 = 440 Hz).
 * The audible check (offline render + FFT, ±3 cents) is scripts/pitch-test.mjs.
 */
async function load(file) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
}
const audio = await load("src/components/journey/audio.ts");
const octave = await load("src/components/layout/octave.ts");

const EXPECTED = {
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23,
  "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0, "A#4": 466.16, B4: 493.88,
};

test("Equal temperament, A4 = 440 Hz, matches the reference table to the hundredth of a hertz", () => {
  for (const [name, hz] of Object.entries(EXPECTED)) assert.equal(Math.round(audio.frequencyOf(name) * 100) / 100, hz, name);
});

test("Every key names one fixed pitch: white keys C4 to B4 in menu order, black keys their sharps", () => {
  assert.deepEqual(octave.WHITE_KEYS.map((k) => k.pitch), ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]);
  assert.deepEqual(octave.WHITE_KEYS.map((k) => k.note), ["C", "D", "E", "F", "G", "A", "B"]);
  assert.deepEqual(octave.WHITE_KEYS.map((k) => k.label), ["Home", "About", "Listen & Watch", "Concerts", "Gallery", "Contact", "Sheet Music"]);
  assert.deepEqual(octave.BLACK_KEYS.map((k) => k.pitch), ["C#4", "D#4", "F#4", "G#4", "A#4"]);
});

test("A note name always resolves to the same frequency, within a few cents of its true pitch", () => {
  for (const name of Object.keys(EXPECTED)) {
    const first = audio.pitchOf(name);
    for (let i = 0; i < 5; i++) assert.equal(audio.pitchOf(name), first, `${name} is deterministic`);
    const cents = 1200 * Math.log2(first / audio.frequencyOf(name));
    assert.ok(Math.abs(cents) < 6, `${name}: tuning correction ${cents.toFixed(2)} cents stays small`);
  }
});

test("MIDI numbers convert to the right names, and every sample file exists", async () => {
  assert.deepEqual([60, 61, 62, 69, 70, 71, 72].map(audio.noteName), ["C4", "C#4", "D4", "A4", "A#4", "B4", "C5"]);
  for (const file of Object.values(audio.sampleUrls())) await access(new URL(`../public/audio/salamander/${file}`, import.meta.url));
});
