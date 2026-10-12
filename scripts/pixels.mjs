// Pixel-identical check. Renders fixed stops of the journey on desktop in the deterministic
// `?freeze` mode (time stands still, nothing random fires), screenshots only the 3D canvas,
// and compares against a stored baseline pixel for pixel.
//   node pixels.mjs <base> baseline     -> writes .playwright-mcp/pixels/baseline/<stop>.png (shoots twice, reports the noise floor)
//   node pixels.mjs <base> compare      -> compares the current build against the baseline, prints differing pixels per stop
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
const readPng = async (buf) => { const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true }); return { data, width: info.width, height: info.height, channels: info.channels }; };
const writePng = (img) => sharp(img.data, { raw: { width: img.width, height: img.height, channels: img.channels } }).png().toBuffer();

const [base, mode = "compare", onlyStops, dom] = process.argv.slice(2);
// With a 4th argument "dom", the page copy stays visible and a separate baseline folder is used.
const withDom = dom === "dom";
const STOPS = [["strings", "strings", 0.4], ["hammers", "hammers", 0.4], ["outro", "outro", 0.6], ["corridor", "corridor", 0.15], ["soundboard", "soundboard", 0.4], ["name", "name", 0.5], ["hero", "piano", 0], ["about", "exploded", 0.45]].filter(([n]) => !onlyStops || onlyStops.split(",").includes(n));
const dir = ".playwright-mcp/pixels";
const baseDir = join(dir, withDom ? "baseline-dom" : "baseline");
mkdirSync(baseDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "pix-"));
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

const shoot = async () => {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  return readPng(Buffer.from(r.result.data, "base64"));
};
const diff = (a, b) => {
  if (a.width !== b.width || a.height !== b.height) return { differing: -1, note: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  let differing = 0, maxDelta = 0;
  const c = a.channels;
  for (let i = 0; i < a.data.length; i += c) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d) { differing++; if (d > maxDelta) maxDelta = d; }
  }
  return { differing, maxDelta, total: a.width * a.height };
};

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${base}/?freeze` });
  await sleep(12000);
  // Only the 3D: no copy, menu or controls in the frame (they animate).
  if (!withDom) await ev(`(() => { const s = document.createElement('style'); s.textContent = 'body * { visibility: hidden !important; } [class*="stage"] canvas { visibility: visible !important; opacity: 1 !important; transition: none !important; } [class*="dim"] { display: none !important; }'; document.head.append(s); return 1; })()`);
  await ev(`window.__segs = [...document.querySelectorAll('[data-segment]')].map((s) => ({ id: s.dataset.segment, top: s.offsetTop, h: s.offsetHeight })); 1`);
  const results = {};
  for (const [name, seg, p] of STOPS) {
    await ev(`(() => { const s = window.__segs.find((x) => x.id === '${seg}'); window.scrollTo({ top: s.top + ${p} * Math.max(0, s.h - innerHeight), behavior: 'instant' }); return 1; })()`);
    // Let every damped value and the particle simulation settle.
    await sleep(6000);
    const a = await shoot();
    if (mode === "baseline") {
      await sleep(1500);
      const b = await shoot();
      const floor = diff(a, b);
      writeFileSync(join(baseDir, `${name}.png`), await writePng(a));
      results[name] = { noiseFloor: floor.differing, maxDelta: floor.maxDelta };
    } else {
      const file = join(baseDir, `${name}.png`);
      if (!existsSync(file)) { results[name] = "no baseline"; continue; }
      const ref = await readPng(readFileSync(file));
      const d = diff(a, ref);
      results[name] = d;
      if (d.differing > 0) writeFileSync(join(dir, `${name}${withDom ? "-dom" : ""}-now.png`), await writePng(a));
    }
    console.log(name, JSON.stringify(results[name]));
  }
  writeFileSync(join(dir, `${mode}${withDom ? "-dom" : ""}.json`), JSON.stringify(results, null, 1));
} finally {
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(0);
}
