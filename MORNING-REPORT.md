# Morning report — perf-adaptive

Date: 2026-10-15 (overnight run)
Branch: `perf-adaptive`, created from `golden-grand` (so it includes the Golden Grand piano page).
Nothing was merged, pushed or deployed. `main` is untouched. All servers are stopped.

```
2509a07  Adaptive quality for the home-page 3D journey   <- this work
007114a  Add Golden Grand piano page                      <- golden-grand
f55e645  feat(mobile): a richer, brighter gold ...        <- main
```

## Status at a glance

| Item | Result |
| --- | --- |
| Clean production build (`.next` and `.next-dev` deleted first) | passes, 23 routes incl. `/piano` |
| TypeScript check | clean |
| Console errors on `/`, `/piano`, `/store` at 1440x900 and 390x844 | 0 (production server, clean cache) |
| Design on capable devices | unchanged (see numbers: same fps, same main-thread time, same tier, verdict "full") |

## What changed (file list)

| File | Change |
| --- | --- |
| `src/components/journey/config.ts` | DPR caps: high tier 1.75 to 1.5, touch tier 1.5 to 1. New `lite` tier (96² particles, no post-processing, DPR 1, env 64, light materials). New constants `PROBE_SECONDS = 3`, `LITE_FPS = 40`, `POSTER_FPS = 25`. Test flag `?quality=full|lite|poster`. |
| `src/components/journey/canvas/JourneyCanvas.tsx` | New `FpsProbe`: median of the first 3 s of rendered frames after shader compile, paused frames skipped. `lite` tier uses the light materials. Mode and probe value exposed on `window.__journey`. |
| `src/components/journey/canvas/Effects.tsx` | `post` prop: the lite tier renders with no EffectComposer at all. |
| `src/components/journey/JourneyExperience.tsx` | Verdict logic: under 40 fps step down to `lite` and measure again; under 25 fps at either step show the poster. Verdict kept in `sessionStorage` (`journey:quality`) for the visit. `prefers-reduced-motion` now takes the poster and never mounts the canvas. A tier change remounts the canvas (`key={tier}`). |
| `src/components/journey/journey.module.css` | `[data-poster="true"]`: poster image behind the page, transition runways collapsed to 40svh as in reduced motion. |
| `public/assets/images/journey-poster.jpg` | New. 1920x1080 JPEG, 79 KB, captured from the live hero frame of the real scene. |

Items from the brief that were already in place and are unchanged: pausing the loop on `visibilitychange` and when no world intersects the viewport (IntersectionObserver), and lazy-loading three.js after first paint (dynamic chunk mounted from `requestIdleCallback`). Both were verified, see below.

## How the adaptive path behaves

1. Page loads, text is readable immediately, three.js chunks download after first paint (measured: first paint at 168 ms, chunks start at 265 ms).
2. Shaders compile, the scene starts, the probe counts 3 s of real drawing.
3. Median >= 40 fps: nothing changes. Verdict "full" stored for the session.
4. Median 25–40 fps: scene remounts on the `lite` tier and is probed again.
5. Median < 25 fps at either step: canvas unmounts, the poster shows, three.js is dropped. Transition runways shorten.
6. `prefers-reduced-motion: reduce`: step 5 straight away, three.js is never downloaded.

## Before / after numbers

Environment: this PC (RTX 4070 SUPER, 32 cores, 125 Hz display), Chromium driven over the Chrome DevTools Protocol, viewport 1440x900, production server. CPU slowdown via `Emulation.setCPUThrottlingRate` (the same control as the Performance panel's CPU throttling). FPS = requestAnimationFrame frame times (median and 5th percentile). Main thread = CDP `Performance.getMetrics` `TaskDuration` over the window, i.e. the main-thread busy time the Performance panel reports.

"Hero" = 4 s idle on the hero. "Scroll" = 8 s of continuous scrolling at 1200 px/s.

### Capable device (no throttle, 4x, 6x): design must not change

| CPU | Build | Hero fps median (p5) | Hero main-thread | Scroll fps median (p5) | Scroll main-thread | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| 1x | before | 125 (123.5) | 583 ms / 4 s | 125 (123.5) | 2580 ms / 8 s | n/a |
| 1x | after | 125 (123.5) | 584 ms / 4 s | 125 (123.5) | 2653 ms / 8 s | full (probe 125) |
| 4x | before | 125 (123.5) | 2573 ms / 4 s | 66.7 (43.3) | 7804 ms / 8 s | n/a |
| 4x | after | 125 (123.5) | 2635 ms / 4 s | 66.2 (43.7) | 7840 ms / 8 s | full (probe 123.5) |
| 6x | before | 125 (62.5) | 3577 ms / 4 s | 43.1 (30.8) | 7963 ms / 8 s | n/a |
| 6x | after | 125 (62.5) | 3547 ms / 4 s | 43.1 (26.2) | 7943 ms / 8 s | full (probe 91.7) |

Same within noise: on a capable device the scene, tier, DOF and pixel ratio are what they were.

### Slow device emulation (14x and 20x): the adaptive paths

| CPU | Build / mode | Probe | Hero fps median (p5) | Hero main-thread | Scroll fps median (p5) | Scroll main-thread |
| --- | --- | --- | --- | --- | --- | --- |
| 14x | before (full tier) | 30.4 | 30.4 (first probe) | – | – | – |
| 14x | after: lite tier | 30.4 then 63.3 | 64.1 (43.1) | 2985 ms / 3 s | 18.0 (10.5) | 6001 ms / 6 s |
| 20x | before (`?quality=full`) | – | 25.3 (20.6) | 3063 ms / 3 s | 9.0 (4.9) | 6098 ms / 6 s |
| 20x | after: poster | 13.5 | poster, no rendering | – | 10.6 (5.3) | 6065 ms / 6 s |

At 14x the first probe read 30.4 fps, the scene stepped down to lite, the second probe read 63.3 fps and it stayed live: hero frame rate roughly doubled. At 20x the probe read 13.5 fps and the poster took over 19 s after navigation (15.5 s of that was shader compile at 20x). Scroll numbers at 14x–20x are dominated by the page's own DOM work (Lenis, GSAP text choreography), not the canvas; that is outside this task.

### Other checks (production build)

| Check | Result |
| --- | --- |
| Desktop at devicePixelRatio 2 | canvas 2145x1350 for 1430x900 CSS px, i.e. 1.5x cap |
| Phone emulation at devicePixelRatio 3 (touch, 390x844) | canvas 390x844, i.e. 1x |
| `?quality=lite` | mode lite, DPR 1, no composer, canvas present |
| `?quality=poster` | no canvas, 0 heavy chunks downloaded, poster image loaded, runways 360 px |
| `prefers-reduced-motion: reduce` | same as poster |
| Scrolled to page bottom (last world out of view) | `data-active=false`, 0 frames in 1 s, canvas hidden |
| Document hidden (simulated `visibilitychange`) | `data-active=false`, 0 frames in 1 s; resumes at 128 fps when visible |
| Three.js lazy load | first paint 168 ms, three.js chunks requested at 265 ms |

## Things that failed or that I was unsure about

- **HEAD was moved to `main` by something outside my session.** The reflog shows `checkout: moving from golden-grand to main` between my commit on golden-grand and my `git checkout -b perf-adaptive`, which I did not run (an editor's git panel, perhaps). The branch was therefore first cut from `main` and lacked the piano commit. I caught it when `/piano` returned 404, stashed the work, reset `perf-adaptive` to `golden-grand` and re-applied it. No work was lost; the first "before" measurements were taken on a build from that wrong base, but the journey code is byte-identical on both bases so the numbers stand. The after numbers in the 1x and 4x rows come from the final build.
- **A burst of console errors during the server swap, not reproducible.** Right after replacing the production build under the same port, the first desktop loads of `/` and `/store` logged `Failed to fetch RSC payload ... Cannot read properties of undefined (reading 'call')`. That is a page from the previous build talking to the new server. With the browser cache cleared, all six page/viewport checks logged 0 errors. On Vercel every deploy gets fresh hashes, so this cannot hit visitors, but if you ever see it locally, hard-reload.
- **The thresholds (40 / 25 fps, 3 s) are not tuned on real low-end hardware.** This PC cannot trigger the step-down naturally; the paths were exercised with CPU throttling only. A real phone test would be worth a few minutes.
- **The lite tier looks flatter**: no bloom, vignette or grain. That is intentional and only ever shows on a device that could not hold 40 fps.
- **The poster is one desktop composition** (piano on the right), shown with `background-position: 68% 50%` and cover. On a phone it is a crop. The live phone scene composes differently; a portrait poster could be added later if you want.
- **Pre-existing build warning**: `@supabase/supabase-js` uses `process.version`, flagged for the Edge runtime. It was there before and is not from this work.
- **Not a trace file**: numbers come from the DevTools Protocol's performance metrics and frame timing, not from a saved Performance-panel recording. Same engine, same CPU-throttle control, but no `.json` trace is checked in.
- `reference/` (an untracked folder that predates this work) was left untracked.

## Commands

Preview the branch in production mode:

```powershell
cd "C:\Users\RezaO\Documents\RezaOhadi Website\Project"
git checkout perf-adaptive
npm run build
npx next start -p 3100
# then open http://localhost:3100
```

Dev mode instead:

```powershell
git checkout perf-adaptive
npm run dev
```

Force a mode to see it (test flags, inert without the parameter):

```
http://localhost:3100/?quality=lite
http://localhost:3100/?quality=poster
http://localhost:3100/?quality=full
```

The verdict is remembered per browser session. To re-measure on the same tab, run in DevTools: `sessionStorage.removeItem('journey:quality')` and reload.

Publish (merge into main and push; this is what deploys if Vercel builds `main`):

```powershell
git checkout main
git merge --no-ff perf-adaptive
git push origin main
```

Publish just the piano page without the performance work:

```powershell
git checkout main
git merge --no-ff golden-grand
git push origin main
```

Preview deployment on Vercel without touching main:

```powershell
git push -u origin perf-adaptive
```

Undo:

```powershell
# Drop only the performance commit, keep the piano page (on perf-adaptive)
git checkout perf-adaptive
git reset --hard golden-grand

# Throw the whole branch away
git checkout main
git branch -D perf-adaptive

# After a merge into main that you regret (before pushing)
git checkout main
git reset --hard origin/main
```
