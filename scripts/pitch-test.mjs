#!/usr/bin/env node
/**
 * Pitch test for the piano voice: renders C4..B4 offline through the site's
 * Salamander sampler and checks every fundamental is within ±3 cents of equal
 * temperament (A4 = 440 Hz).
 *
 *   npm run dev            (in another terminal)
 *   npm run test:pitch     [-- http://localhost:3000]
 *
 * No test dependencies: it drives an installed Chrome or Edge headless over the
 * DevTools protocol, with a throwaway profile (so no extensions interfere).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const samplesMode = args.includes("--samples");
const base = args.find((a) => !a.startsWith("--")) ?? process.env.PITCH_BASE_URL ?? "http://localhost:3000";
const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executable = browsers.find((path) => existsSync(path));
if (!executable) {
  console.error("No Chrome or Edge found. Set CHROME_PATH.");
  process.exit(2);
}

const profile = mkdtempSync(join(tmpdir(), "pitch-test-"));
const browser = spawn(executable, [
  "--headless=new",
  `--user-data-dir=${profile}`,
  "--remote-debugging-port=0",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let exitCode = 1;
try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    const file = join(profile, "DevToolsActivePort");
    if (existsSync(file)) port = readFileSync(file, "utf8").split("\n")[0].trim();
    else await sleep(100);
  }
  if (!port) throw new Error("Browser did not start");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((t) => t.type === "page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      pending.set(++id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.navigate", { url: `${base}/dev/pitch${samplesMode ? "?samples" : ""}` });
  if (samplesMode) {
    const { result } = (
      await send("Runtime.evaluate", {
        expression: `(async () => { for (let i = 0; i < 600 && !window.__samples; i++) await new Promise((r) => setTimeout(r, 100)); return JSON.stringify(await window.__samples); })()`,
        awaitPromise: true,
        returnByValue: true,
        timeout: 300000,
      })
    ).result;
    // Paste into SAMPLE_TUNING (src/components/journey/audio.ts).
    console.log("Recording tuning, cents from equal temperament:");
    for (const r of JSON.parse(result.value)) console.log(`  "${r.sample}": ${r.cents.toFixed(2)},`);
    exitCode = 0;
    throw "done";
  }
  const { result, exceptionDetails } = (
    await send("Runtime.evaluate", {
      expression: `(async () => {
        for (let i = 0; i < 600 && !window.__pitch; i++) await new Promise((r) => setTimeout(r, 100));
        if (!window.__pitch) throw new Error("Pitch bench did not start (is the dev server running?)");
        return JSON.stringify(await window.__pitch);
      })()`,
      awaitPromise: true,
      returnByValue: true,
      timeout: 180000,
    })
  ).result;
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  const rows = JSON.parse(result.value);

  const pad = (s, n) => String(s).padEnd(n);
  console.log("\nPiano voice pitch test (Salamander, A4 = 440 Hz, tolerance ±3 cents)\n");
  console.log(pad("Note", 6) + pad("Expected Hz", 13) + pad("Measured Hz", 13) + pad("Cents", 9) + "Result");
  for (const r of rows) {
    const cents = (r.cents >= 0 ? "+" : "") + r.cents.toFixed(2);
    console.log(pad(r.note, 6) + pad(r.expected.toFixed(2), 13) + pad(r.measured.toFixed(2), 13) + pad(cents, 9) + (r.pass ? "pass" : "FAIL"));
  }
  const failed = rows.filter((r) => !r.pass);
  console.log(`\n${rows.length - failed.length}/${rows.length} notes within tolerance.`);
  exitCode = failed.length || rows.length !== 12 ? 1 : 0;
  socket.close();
} catch (error) {
  if (error !== "done") console.error(error instanceof Error ? error.message : error);
} finally {
  browser.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
  process.exit(exitCode);
}
