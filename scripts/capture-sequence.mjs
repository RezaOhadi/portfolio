// Renders a stretch of the journey offline, frame by frame, at full desktop quality and the
// phone's native resolution, and writes it as an AVIF image sequence for the phone player
// (src/components/journey/SequencePlayer.tsx).
//
//   node scripts/capture-sequence.mjs <base url> <name> <from segment> <to segment> [options]
//   e.g. node scripts/capture-sequence.mjs http://localhost:3100 hero piano exploded
//
// Options: --width=338 --height=686 --dpr=4.25 (the phone's CSS viewport and pixel ratio),
//          --step=8 (CSS px of scroll per frame), --quality=72 (AVIF, 4:4:4).
// Frames land in public/sequence/<name>/ with a manifest.json; the PNG masters stay in
// .sequence-masters/<name>/ (not served).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const [base, name, from, to, ...rest] = process.argv.slice(2);
if (!base || !name || !from || !to) throw new Error("usage: capture-sequence.mjs <base> <name> <from segment> <to segment>");
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, "").split("=")));
const W = Number(opt.width ?? 338), H = Number(opt.height ?? 686), DPR = Number(opt.dpr ?? 4.25);
const STEP = Number(opt.step ?? 8), QUALITY = Number(opt.quality ?? 72);
const out = join("public", "sequence", name);
const masters = join(".sequence-masters", name);
mkdirSync(out, { recursive: true });
mkdirSync(masters, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "capture-"));
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--no-first-run", "--hide-scrollbars", "--enable-gpu", "--use-angle=d3d11", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"]);
let port;
for (let i = 0; i < 100 && !port; i++) { const f = join(profile, "DevToolsActivePort"); if (existsSync(f)) port = readFileSync(f, "utf8").split("\n")[0].trim(); else await sleep(100); }
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };

try {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send("Page.navigate", { url: `${base}/?capture` });
  await sleep(16000);
  // Only the 3D: no copy, menu, controls, dimming or fallback in the frames.
  await ev(`(() => { const s = document.createElement('style'); s.textContent = 'body * { visibility: hidden !important; } [class*="stage"] canvas { visibility: visible !important; opacity: 1 !important; transition: none !important; } [class*="dim"] { display: none !important; }'; document.head.append(s); return 1; })()`);
  const range = await ev(`(() => { const a = document.querySelector('[data-segment="${from}"]'), b = document.querySelector('[data-segment="${to}"]'); return [a.offsetTop, b.offsetTop]; })()`);
  const count = Math.round((range[1] - range[0]) / STEP) + 1;
  console.log(`${name}: ${from} -> ${to}, scroll ${range[0]}..${range[1]}, ${count} frames at ${Math.round(W * DPR)}x${Math.round(H * DPR)}`);
  // Settle at the first position before recording.
  await ev(`window.scrollTo({ top: ${range[0]}, behavior: "instant" }); 1`);
  await sleep(2500);
  let bytes = 0;
  for (let i = 0; i < count; i++) {
    const y = range[0] + ((range[1] - range[0]) * i) / (count - 1);
    await ev(`window.scrollTo({ top: ${y}, behavior: "instant" }); 1`);
    await sleep(320);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const png = Buffer.from(shot.result.data, "base64");
    const file = String(i).padStart(4, "0");
    writeFileSync(join(masters, `${file}.png`), png);
    await sharp(png).avif({ quality: QUALITY, chromaSubsampling: "4:4:4", effort: 4 }).toFile(join(out, `${file}.avif`));
    bytes += statSync(join(out, `${file}.avif`)).size;
    if (i % 25 === 0) console.log(`  frame ${i}/${count}, ${(bytes / 1048576).toFixed(1)} MB so far`);
  }
  const meta = await sharp(join(masters, "0000.png")).metadata();
  writeFileSync(join(out, "manifest.json"), JSON.stringify({ name, from, to, count, width: meta.width, height: meta.height, viewport: [W, H], dpr: DPR, ext: "avif", bytes }, null, 1));
  console.log(`done: ${count} frames, ${meta.width}x${meta.height}, ${(bytes / 1048576).toFixed(2)} MB total, avg ${Math.round(bytes / count / 1024)} KB/frame`);
} finally {
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(0);
}
