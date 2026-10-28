# Phase 3B-1.5 Implementation Plan

**Spec:** `docs/superpowers/specs/2026-10-28-phase3b-visual-polish-design.md` (approved scope).
**Base:** `fffdb755af26a1a820cd1fbd57521e9def743315`; clean; baseline 137 tests. Preserve this commit and add one local commit only.
**Architecture:** Reuse snapshot navigation and the existing SVG-scoped GSAP owner; share context cleanup across entrance and judgment scenes. No new dependencies or algorithm logic.

## Small implementation units

- [x] Test first: entrance creation/finish/cancel, reduced motion, current-edge streak and endpoint waves, final-only completion from run data, isolation and StrictMode. Observe missing behavior before implementing.
- [x] Dark stage: update `graphPresentation.ts` palette and stage-only CSS, preserve line patterns/coordinates/light UI. Update literal color assertions in existing tests without removing cases.
- [x] Entrance: shared `scopedTimeline.ts`, small `graphEntrance.ts`, and existing hook ownership. Animate nodes/edges/badges in 1.2–2s; no repeat on steps. Any navigation cancels entrance and renders instant state.
- [x] Inspection: extend `edgeTransition.ts` with one label-based timeline for highlight/streak/endpoints/decision; extend existing GraphView decorations; keep final canonical styles exact.
- [x] Completion: append only on Next into last snapshot; use `MstRun.mst` IDs and existing weight output ref. No hardcoded MST edges or number tween. Direct jumps remain instant.
- [x] Lifecycle: one hook owns the active scene; navigation revision, runtime Reduced Motion, strict cleanup, accessible status and hidden decorations. Snapshot component grouping is display-only.
- [x] Run relevant tests per unit, then full tests/build/lint/diff check and read-only review. Assert core, CI and package/lockfile unchanged. Record original137 + added count accurately.
- [x] Document manual desktop1440/mobile390/320/200%, reduced-motion, keyboard, console and short recording checks without retrying the prior blocked Computer Use path. Prepare approved files for one local commit; resulting SHA and clean-tree evidence are reported in chat.

## Review focus

- Entrance interruption must not spawn a judgment effect for the same user request.
- Cleanup must restore attributes/styles on removed, reused or detached SVG nodes; no other panel is touched.
- Only source/target nodes pulse during inspection; final completion may affect all nodes and only MST edges.
- Static results, interim 7/restored11/final8, pending CD/DE and descriptions stay authoritative during motion.
- A non-busy final SVG must have no visible decorations or temporary transforms/opacity/strokes.

## Ledger

- Pre-flight: expected clean local dev/HEAD confirmed. Existing module owns CSS overlays, context cancellation, per-panel refs and live Reduced Motion. Existing tests exercise13 motion cases plus124 core/UI cases; actual browser painting was not established.
- TDD: 10 new cases first failed against the old implementation. Added a removed-halo regression and replaced synthetic same-value change with real pointer/keyboard picker-opening cases (both observed failing before the fix). Final new count:12.
- Preserved all137 baseline cases. Intentional updates: dark palette literals, judgment-label timing after the new inspection prelude, current-overlay selector and explicit entrance settlement in existing effect tests. No case removed.
- Review: one material finding about native select not firing change on same-option reselection. Fixed by cancelling on pointer/selection-navigation keys before value changes; two real input paths now pass. No deferred material issue.
- Final timing regression: final-node wave initial values were applied before the completion label by GSAP fromTo. A new assertion first reproduced this (opacity0.8 on non-endpoints), then `immediateRender: false` deferred wave/completion-overlay setup to the scheduled time. All149 tests pass after the fix.
- Final CLI: 7 files /149 tests PASS (137 baseline +12 new), TypeScript/Vite build PASS, Oxlint PASS, whitespace check PASS. Core, core tests, CI, package versions and lockfile unchanged. Real browser/recording not executed; no retry around the prior Computer Use safety stop.

## Manual visual review and short recording (not yet verified)

If the local server is not running, open PowerShell in the project directory:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/` manually. Select the browser area in your screen recorder and keep controls, graph and explanation in the recording. Capture separate short clips rather than a scaled, unreadable whole page.

1. Reload and wait until the graph-building status clears (~1.7s): nodes, edges and weight badges appear in order. Clicking controls before it finishes must cancel it immediately.
2. Kruskal: from step0 after entrance settles, Next to BC. Observe gold streak, B/C rings, then teal draw. Use the dropdown to step3, then Next for AC red rejection; direct dropdown selection itself is intentionally instant.
3. Reverse-Delete: dropdown step4, Next to BE temporary removal (7, two components), then Next to restore (11, blue streak). Wait for each scene before judging the settled result.
4. Kruskal step4 → Next5 and Reverse-Delete step13 → Next14: four MST edges emphasize sequentially; the actual numeric value remains8 throughout the weight highlight. Removed edges must stay subdued.
5. Rapid Next/Previous/dropdown inputs: no old streak, ring, transform or busy label remains. Both panels operate independently. Pointer or keyboard opening of the picker cancels the current scene even without changing value.
6. Repeat at1440/390/320px and200% zoom, with Reduced Motion, keyboard focus and console checks. Confirm no clipping/overlap, readable pale stage labels and unchanged bright controls/descriptions. Recordings/screenshots and perceptual impact remain user verification; DOM tests do not establish these results.
