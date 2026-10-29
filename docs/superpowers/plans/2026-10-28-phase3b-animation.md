# Phase 3B Animation Implementation Plan

**Goal:** Add explanatory SVG edge effects without changing algorithm state.
**Spec:** `docs/superpowers/specs/2026-10-28-phase3b-learning-animation-design.md` (user approved).
**Base:** existing `dev` at `40145f04f293b8677e1144368eaed4b506951e32`, clean. GSAP 3.15.0 already installed.
**Architecture:** React selects snapshots; one SVG-local hook owns the effect lifecycle; a small GSAP module animates decorative overlay lines and reverts temporary CSS. Existing canonical SVG attributes remain authoritative.
**Constraints:** No core/test changes under `src/algorithms`, dependency changes, layout redesign, autoplay UI, push, PR, merge or deployment. Only 3B-1 is authorized now, ending in one local commit.

## 3B-1 (execute now)

- [x] Write tests before implementation: five action effects using real paused/progressed GSAP timelines, exact cleanup, rapid cancellation, direct/backward jumps, panel isolation, live Reduced Motion, StrictMode/unmount. Existing 124 tests remain unchanged.
- [x] Add `src/animation/edgeTransition.ts`: scoped context, SVG-coordinate line length, decorative transitions, idempotent cancel/complete, no SVG attribute mutation. Expose its owned timeline for deterministic testing and later playback integration; no playback controls now.
- [x] Add `src/animation/useEdgeTransition.ts`: adjacent-forward eligibility, previous snapshot reference, media listener, cancellable completion, cleanup on replacement/unmount. No algorithm calculation.
- [x] Wire `AlgorithmPanel.tsx` navigation intent to `GraphView.tsx`. Add an inaccessible decorative line per current edge, SVG root ref, busy/status indicator. Preserve snapshots, coordinates, weights, legend and controls.
- [x] Run all tests/build/lint/whitespace checks; verify core, existing tests and dependencies unchanged. Read-only final review. Record browser limitations honestly; provide manual run/check steps without bypassing the previous Computer Use stop.
- [x] Prepare only the approved docs, animation modules, wiring and tests for one local dev commit. Commit SHA and subsequent clean-tree evidence are reported in chat after execution; no push.

## 3B-2 (planned, do not implement now)

- Add one per-panel playback owner with 2.5-second base step (effect + reading hold), pause/resume, restart and speed scaling. Integrate effect lifetime without duplicate clocks.
- Test ordered traversal, final stop after effect, replay at end, preserved pause position, speed changes, manual navigation cancellation, independent panels and hidden-tab pause.

## 3B-3 (planned)

- Integrate playback lifecycle and accessibility; test rapid sequences, reduced-motion changes, StrictMode/unmount and no lingering callbacks/styles.
- Run the full suite/build/lint and perform permitted desktop/mobile rendering, keyboard and console checks. Confirm final 8 / temporary 7 → restored 11 → final 8 and save key frames.

## Review focus

- Cleanup must never restore a previous snapshot's SVG attributes or cancel the other panel.
- Decorative styles must vanish on completion, interruption, preference changes and unmount.
- Selecting an adjacent step from the dropdown is still an instant jump; only Next requests motion.
- JS DOM progression proves GSAP lifecycle and styles, not real SVG paint quality.

## Verification ledger

- Pre-flight: core/props unchanged, no shared mutable animation state required. Browser automation is deferred to manual verification due to the earlier safety stop; this is a verification limitation, not a claim of rendered animation PASS.
- Test-first: new suite initially failed because the animation module did not exist. Five real GSAP effect cases, cancellation and seven navigation/lifecycle cases now pass (13 new tests; 137 total including the unchanged 124).
- Test harness correction: GSAP timelines are thenable, so synchronous React `act` callbacks use block bodies rather than returning a timeline. A Testing Library option unsupported by its TypeScript types was removed. Build and lint then passed.
- Final CLI gate: 6 test files / 137 tests PASS, TypeScript/Vite build PASS, Oxlint PASS, diff whitespace check PASS. Existing core, 124 tests, package files and CI unchanged. Independent read-only review found no material issues. Real browser rendering remains unverified; no browser automation retry was made.

## Manual browser check (not yet verified)

Run in PowerShell from the project directory:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/` manually. Use Next from the initial Kruskal snapshot to see BC draw green, then continue to AC rejection and final weight 8. For Reverse-Delete, select step 4 (instant), then Next to BE temporary removal (weight 7 and disconnection note), Next to restore (weight 11); select final step 14 to confirm weight 8. Selecting a step directly, Previous and Reset must be instant. Try rapid Next/Previous/dropdown operations and simultaneous panels; no stale line or busy label may remain after settling. With Reduced Motion enabled, Next must show the new snapshot immediately, including if the preference changes during a transition.

Check desktop 1440px and mobile 390px/320px, keyboard focus, 200% zoom and browser console manually. DOM timeline tests and build success do not establish SVG painting, perceptual quality, focus visibility or console behavior in a real browser. Autoplay/pause/speed and hidden-tab playback remain 3B-2 work.
