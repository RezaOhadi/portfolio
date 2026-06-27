/**
 * Generates elegant, on-brand SVG placeholder assets into /public/placeholders.
 *
 *   node scripts/gen-placeholders.mjs
 *
 * These are intentionally tasteful (deep black, ivory, piano-key motifs) so the
 * site looks finished before real photography / cover art is supplied. Replace
 * them by uploading real assets via the admin dashboard, or by dropping files
 * into /public and updating the data layer. See README "Replacing placeholders".
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "placeholders");
mkdirSync(OUT, { recursive: true });

const INK = "#0A0A0C";
const INK2 = "#121215";
const IVORY = "#F2EEE6";
const SILVER = "#8C8C96";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const grain = (id, freq = 0.85, opacity = 0.05) => `
  <filter id="${id}">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
  </filter>`;

const defs = (w, h, id) => `
  <defs>
    <radialGradient id="glow-${id}" cx="50%" cy="-5%" r="85%">
      <stop offset="0%" stop-color="${IVORY}" stop-opacity="0.16"/>
      <stop offset="45%" stop-color="${IVORY}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${IVORY}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vign-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
    ${grain(`grain-${id}`)}
  </defs>`;

/** A row of perspective piano keys along the bottom edge. */
function keyboard(w, h, { y, height = 120, opacity = 1 } = {}) {
  const keyW = w / 14;
  let whites = "";
  let blacks = "";
  for (let i = 0; i < 14; i++) {
    const x = i * keyW;
    whites += `<rect x="${x + 1}" y="${y}" width="${keyW - 2}" height="${height}" fill="${IVORY}" opacity="${0.9 * opacity}"/>`;
    // black keys sit between certain whites (classic pattern)
    if (![2, 6, 9, 13].includes(i % 7 ? i : -1) && i % 7 !== 2 && i % 7 !== 6) {
      const bx = x + keyW * 0.66;
      blacks += `<rect x="${bx}" y="${y}" width="${keyW * 0.62}" height="${height * 0.62}" fill="${INK}" opacity="${opacity}"/>`;
    }
  }
  return `<g>${whites}${blacks}</g>`;
}

/** Horizontal music staff lines. */
function staff(x, y, w, gap = 12, color = IVORY, opacity = 0.5, sw = 1) {
  let lines = "";
  for (let i = 0; i < 5; i++) {
    lines += `<line x1="${x}" y1="${y + i * gap}" x2="${x + w}" y2="${y + i * gap}" stroke="${color}" stroke-width="${sw}" opacity="${opacity}"/>`;
  }
  return lines;
}

function write(name, svg) {
  writeFileSync(join(OUT, name), svg.trim() + "\n");
  console.log("  ✓", name);
}

/* ----------------------------------- HERO ---------------------------------- */
function hero() {
  const w = 1600, h = 900, id = "hero";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cinematic placeholder">
  ${defs(w, h, id)}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
  <g opacity="0.5">${staff(0, h * 0.32, w, 26, IVORY, 0.10, 1)}</g>
  <g transform="translate(${w / 2} ${h * 0.62}) skewX(-8)">
    <g transform="translate(-${w / 2} 0)">${keyboard(w, h, { y: 0, height: 220, opacity: 0.22 })}</g>
  </g>
  <rect width="${w}" height="${h}" fill="url(#vign-${id})"/>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${IVORY}" opacity="0.16" letter-spacing="14">REZA OHADI</text>
</svg>`;
  write("hero.svg", svg);
}

/* --------------------------------- PORTRAIT -------------------------------- */
function portrait(name = "portrait.svg", label = "PORTRAIT") {
  const w = 1000, h = 1250, id = "por";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Portrait placeholder">
  ${defs(w, h, id)}
  <rect width="${w}" height="${h}" fill="${INK2}"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
  <ellipse cx="${w / 2}" cy="${h * 0.42}" rx="190" ry="240" fill="none" stroke="${IVORY}" stroke-width="1.2" opacity="0.18"/>
  <circle cx="${w / 2}" cy="${h * 0.34}" r="86" fill="none" stroke="${IVORY}" stroke-width="1.2" opacity="0.2"/>
  <g opacity="0.6">${keyboard(w, h, { y: h - 150, height: 150, opacity: 0.25 })}</g>
  <rect width="${w}" height="${h}" fill="url(#vign-${id})"/>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
  <text x="${w / 2}" y="${h - 60}" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="${IVORY}" opacity="0.32" letter-spacing="10">${esc(label)}</text>
</svg>`;
  write(name, svg);
}

/* ------------------------------- BIO WIDE ---------------------------------- */
function bioWide() {
  const w = 1600, h = 1000, id = "bio";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Biography placeholder">
  ${defs(w, h, id)}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
  <g opacity="0.5">${staff(120, h * 0.5, w - 240, 30, IVORY, 0.12, 1)}</g>
  <g transform="translate(0 ${h - 200})">${keyboard(w, h, { y: 0, height: 200, opacity: 0.2 })}</g>
  <rect width="${w}" height="${h}" fill="url(#vign-${id})"/>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
  write("bio-wide.svg", svg);
}

/* --------------------------------- COVERS ---------------------------------- */
const motifs = [
  // concentric spotlight rings + centre point
  (w, h) => `<g opacity="0.55"><circle cx="${w / 2}" cy="${h * 0.4}" r="170" fill="none" stroke="${IVORY}" stroke-width="1.2"/><circle cx="${w / 2}" cy="${h * 0.4}" r="112" fill="none" stroke="${IVORY}" stroke-width="0.8" opacity="0.6"/><circle cx="${w / 2}" cy="${h * 0.4}" r="3.5" fill="${IVORY}"/></g>`,
  // staves with a clef-like flourish
  (w, h) => `<g opacity="0.55">${staff(w * 0.16, h * 0.3, w * 0.68, 18, IVORY, 0.7, 1.3)}<path d="M ${w * 0.24} ${h * 0.26} C ${w * 0.32} ${h * 0.3}, ${w * 0.18} ${h * 0.42}, ${w * 0.27} ${h * 0.46}" fill="none" stroke="${IVORY}" stroke-width="1.4"/></g>`,
  // piano-lid sweep (two curves)
  (w, h) => `<g opacity="0.6"><path d="M ${w * 0.16} ${h * 0.52} Q ${w / 2} ${h * 0.16} ${w * 0.84} ${h * 0.5}" fill="none" stroke="${IVORY}" stroke-width="1.4"/><path d="M ${w * 0.23} ${h * 0.56} Q ${w / 2} ${h * 0.3} ${w * 0.77} ${h * 0.55}" fill="none" stroke="${IVORY}" stroke-width="0.7" opacity="0.6"/></g>`,
  // nested rotated squares
  (w, h) => `<g opacity="0.55" transform="rotate(45 ${w / 2} ${h * 0.4})"><rect x="${w * 0.3}" y="${h * 0.2}" width="${w * 0.4}" height="${h * 0.4}" fill="none" stroke="${IVORY}" stroke-width="1.1"/><rect x="${w * 0.37}" y="${h * 0.27}" width="${w * 0.26}" height="${h * 0.26}" fill="none" stroke="${IVORY}" stroke-width="0.7" opacity="0.6"/></g>`,
  // vertical key bars of varied height
  (w, h) => `<g opacity="0.65">${Array.from({ length: 9 }, (_, i) => { const x = w * 0.18 + i * (w * 0.64 / 8); const bh = h * (0.16 + 0.22 * Math.abs(Math.sin(i * 0.9))); return `<rect x="${x}" y="${h * 0.46 - bh}" width="7" height="${bh}" fill="${IVORY}" opacity="${0.22 + (i % 2) * 0.32}"/>`; }).join("")}</g>`,
  // low sun over a horizon
  (w, h) => `<g opacity="0.55"><circle cx="${w / 2}" cy="${h * 0.42}" r="122" fill="none" stroke="${IVORY}" stroke-width="1"/><line x1="${w * 0.14}" y1="${h * 0.42}" x2="${w * 0.86}" y2="${h * 0.42}" stroke="${IVORY}" stroke-width="1"/><line x1="${w * 0.26}" y1="${h * 0.49}" x2="${w * 0.74}" y2="${h * 0.49}" stroke="${IVORY}" stroke-width="0.6" opacity="0.55"/></g>`,
];

function cover(i, title, composer) {
  const w = 900, h = 1200, id = `cov${i}`;
  const motif = motifs[i % motifs.length](w, h);
  const titleSize = title.length > 15 ? 48 : 58;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)} cover">
  ${defs(w, h, id)}
  <rect width="${w}" height="${h}" fill="${i % 2 ? INK2 : INK}"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
  <ellipse cx="${w / 2}" cy="${h * 0.4}" rx="${w * 0.44}" ry="${h * 0.3}" fill="${IVORY}" opacity="0.05"/>
  <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="${IVORY}" stroke-width="1" opacity="0.2"/>
  ${motif}
  <g>${keyboard(w, h, { y: h - 90, height: 90, opacity: 0.3 })}</g>
  <rect width="${w}" height="${h}" fill="url(#vign-${id})"/>
  <text x="${w / 2}" y="${h * 0.72}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${titleSize}" fill="${IVORY}">${esc(title)}</text>
  <text x="${w / 2}" y="${h * 0.72 + 44}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="6" fill="#A6A6AE">${esc(composer.toUpperCase())}</text>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
  write(`cover-${i + 1}.svg`, svg);
}

/* ---------------------------- SHEET-MUSIC PREVIEW -------------------------- */
function preview(i, title) {
  const w = 900, h = 1165, id = `pv${i}`;
  let systems = "";
  for (let s = 0; s < 6; s++) {
    const y = 230 + s * 140;
    systems += staff(90, y, w - 180, 11, "#0c0c0e", 0.85, 1.1);
    // faux notes (blurred to suggest a low-res preview)
    let notes = "";
    for (let n = 0; n < 10; n++) {
      const nx = 120 + n * ((w - 220) / 10) + (s % 2) * 8;
      const ny = y + (n % 5) * 11 + 4;
      notes += `<ellipse cx="${nx}" cy="${ny}" rx="6.5" ry="4.6" fill="#0c0c0e" transform="rotate(-18 ${nx} ${ny})"/><line x1="${nx + 6}" y1="${ny}" x2="${nx + 6}" y2="${ny - 34}" stroke="#0c0c0e" stroke-width="1.4"/>`;
    }
    systems += `<g filter="url(#blur-${id})" opacity="0.8">${notes}</g>`;
  }
  // diagonal repeating watermark
  let wm = "";
  for (let r = -1; r < 7; r++) {
    for (let c = -1; c < 4; c++) {
      wm += `<text x="${c * 320 + (r % 2) * 160}" y="${r * 190}" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="6" fill="#0a0a0c" opacity="0.10" transform="rotate(-30 ${c * 320} ${r * 190})">PREVIEW · REZA OHADI</text>`;
    }
  }
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)} preview page">
  <defs>
    <filter id="blur-${id}"><feGaussianBlur stdDeviation="1.3"/></filter>
    ${grain(`grain-${id}`, 0.6, 0.06)}
  </defs>
  <rect width="${w}" height="${h}" fill="#E9E4D8"/>
  <text x="${w / 2}" y="120" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="40" fill="#1a1a1d">${esc(title)}</text>
  <text x="${w / 2}" y="160" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="5" fill="#55555f">REZA OHADI — PREVIEW · PAGE ${i + 1}</text>
  ${systems}
  ${wm}
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#1a1a1d" stroke-width="1" opacity="0.15"/>
</svg>`;
  write(`preview-${i + 1}.svg`, svg);
}

/* --------------------------------- GALLERY --------------------------------- */
function gallery(i, ratio) {
  const sizes = { tall: [1000, 1300], wide: [1300, 950], square: [1100, 1100] };
  const [w, h] = sizes[ratio];
  const id = `g${i}`;
  // Off-centre "studio light" position per image for a directional, editorial feel.
  const lx = [30, 68, 50, 38][i % 4];
  const ly = [24, 30, 18, 62][i % 4];
  const variant = i % 4;
  let art = "";
  if (variant === 0) {
    // piano keyboard catching the light
    art = `<g transform="translate(0 ${h - h * 0.36})">${keyboard(w, h, { y: 0, height: h * 0.36, opacity: 0.34 })}</g>`;
  } else if (variant === 1) {
    // a sheet of score on a music stand
    art = `<rect x="${w * 0.12}" y="${h * 0.14}" width="${w * 0.76}" height="${h * 0.72}" fill="${IVORY}" opacity="0.04"/><g>${staff(w * 0.2, h * 0.34, w * 0.6, 22, IVORY, 0.28, 1)}${staff(w * 0.2, h * 0.56, w * 0.6, 22, IVORY, 0.2, 1)}</g>`;
  } else if (variant === 2) {
    // a portrait spotlight
    art = `<ellipse cx="${w / 2}" cy="${h * 0.46}" rx="${Math.min(w, h) * 0.26}" ry="${Math.min(w, h) * 0.33}" fill="none" stroke="${IVORY}" stroke-width="1.1" opacity="0.24"/><circle cx="${w / 2}" cy="${h * 0.37}" r="${Math.min(w, h) * 0.12}" fill="none" stroke="${IVORY}" stroke-width="1.1" opacity="0.28"/>`;
  } else {
    // the strings inside an open piano
    art = `<g>${Array.from({ length: 12 }, (_, k) => `<line x1="${w * 0.1 + k * (w * 0.8 / 11)}" y1="${h * 0.12}" x2="${w * 0.1 + k * (w * 0.8 / 11)}" y2="${h * 0.88}" stroke="${IVORY}" stroke-width="0.7" opacity="${0.1 + (k % 3) * 0.09}"/>`).join("")}</g>`;
  }
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Gallery placeholder ${i + 1}">
  <defs>
    <radialGradient id="light-${id}" cx="${lx}%" cy="${ly}%" r="78%">
      <stop offset="0%" stop-color="${IVORY}" stop-opacity="0.20"/>
      <stop offset="42%" stop-color="${IVORY}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${IVORY}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="vg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>
    ${grain(`grain-${id}`, 0.7, 0.07)}
  </defs>
  <rect width="${w}" height="${h}" fill="${i % 2 ? INK : INK2}"/>
  <rect width="${w}" height="${h}" fill="url(#light-${id})"/>
  ${art}
  <rect width="${w}" height="${h}" fill="url(#vg-${id})"/>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
  write(`gallery-${i + 1}.svg`, svg);
}

/* ----------------------------------- OG ------------------------------------ */
function og(name, title, subtitle) {
  const w = 1200, h = 630, id = "og";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
  ${defs(w, h, id)}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
  <g transform="translate(0 ${h - 120})">${keyboard(w, h, { y: 0, height: 120, opacity: 0.18 })}</g>
  <text x="64" y="300" font-family="Georgia, serif" font-size="92" fill="${IVORY}">${esc(title)}</text>
  <text x="68" y="350" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="8" fill="${SILVER}">${esc(subtitle.toUpperCase())}</text>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
  write(name, svg);
}

/* --------------------------------- SIGNATURE ------------------------------- */
function signature() {
  const w = 620, h = 200;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Signature placeholder">
  <path d="M30 140 C 80 40, 120 40, 130 110 C 138 160, 170 60, 210 110 C 240 150, 250 70, 300 90 C 360 115, 330 40, 400 70 C 470 100, 520 90, 590 60"
    fill="none" stroke="${IVORY}" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
  <text x="30" y="180" font-family="Georgia, serif" font-style="italic" font-size="20" fill="${SILVER}" opacity="0.5">Reza Ohadi</text>
</svg>`;
  write("signature.svg", svg);
}

console.log("Generating placeholders →", OUT);
hero();
portrait("portrait.svg", "PORTRAIT");
portrait("artist.svg", "REZA OHADI");
bioWide();
[
  ["Nocturne in Ash", "Reza Ohadi"],
  ["Veil of Snow", "Reza Ohadi"],
  ["The Quiet Hour", "Reza Ohadi"],
  ["Letters to the Sea", "Reza Ohadi"],
  ["Elegy for a Still Room", "Reza Ohadi"],
  ["Northern Light", "Reza Ohadi"],
].forEach((c, i) => cover(i, c[0], c[1]));
[0, 1, 2].forEach((i) => preview(i, "Nocturne in Ash"));
["tall", "wide", "square", "tall", "wide", "square", "tall", "wide"].forEach((r, i) => gallery(i, r));
og("og-default.svg", "Reza Ohadi", "Pianist · Composer");
signature();
console.log("Done.");
