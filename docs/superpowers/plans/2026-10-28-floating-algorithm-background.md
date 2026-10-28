# Floating Algorithm Background Implementation Plan

**Goal:** Add four large decorative graph artworks behind existing sections with isolated responsive motion.
**Architecture:** One fixed SVG background component and background-only GSAP context; direct RAF-controlled scroll/mouse layers; existing content above an isolated stacking root.
**Tech Stack:** Existing React/TS/SVG/CSS/GSAP/Vitest/jsdom; no new dependency.
**Spec:** ../specs/2026-10-28-floating-algorithm-background-design.md

## Constraints / Review Focus
- dev8956e96, clean, baseline237. Preserve algorithms/snapshots/playback/Lab events/Hero ScrollTrigger/theory.
- Check one aria-hidden noninteractive background; finite K5 ten pairs and directed arrows; clipped fixed layer, readable content surfaces; no React scroll state.
- Check media/resize/visibility/unmount ownership, no global timeline/trigger kills, Reduced Motion/static and print hiding.
- Actual visual quality/FPS/viewport/AT/print preview remain unverified without browser; no safety bypass.

## Task1 — Static artwork / integration
- [x] RED tests single mount, graph structures, pointer-events/stacking/clipping and unchanged Lab navigation.
- [x] Minimal AlgorithmFloatingBackground.tsx + floatingBackground.css + App mount.
- [x] Verify tests and review SVG counts/paths/weights separately from the assignment graph.

## Task2 — Motion / lifecycle
- [x] RED tests float/packet scope, magnetic and scroll without Lab updates, Reduced Motion, mobile simplification, resize/unmount/visibility/print.
- [x] Background-only animation helper using one context, bounded tweens and one pending RAF; scoped cleanup.
- [x] Full regression and readonly final review.

## Task3 — Verify / commit
- [x] npm test/build/lint/diff check; protected-source diff empty.
- [x] Record code/DOM evidence separately from actual rendering and performance. Manual QA at1440/1280/1024/768/390/320px and200%.
- [x] Local commit only, preserve previous commits; no remote work.

## Ledger
Initial state verified: dev8956e96a405eea78a5de8e1ff08afd4002530a1e, clean/ahead10. Current page has4sections, one Hero-only ScrollTrigger, independent Lab owners and print CSS. Current dev and narrow scope are explicitly authorized, so no additional worktree or approval pause.

## Verification / final review
- Baseline237tests PASS. Static integration3tests first failed with no background, then passed with real SVG counts and isolated stacking layers.
- Motion5tests first failed for missing owned floats/media/print/section behavior, then passed with real GSAP lifecycle tests. The tests await a render frame rather than arbitrary sleeps for RAF behavior.
- Read-only reviewer identified directed arrow tips covered by opaque destination discs. Regression failed at gap5 versus required>disc+1; marker refX23 gives gap14, beyond every9–12unit disc, and passed.
- Final review ruling: the reviewer's minor parallax saturation was treated as important for the user's page-wide scroll requirement. At3→4viewports the previous tanh motion changed only0.18px. A failing regression now verifies continued bounded travel; a smooth sine travel retains depth through long Theory pages without unbounded movement or wrapping jumps. Both fixes RED→GREEN, complete suite green. No deferred review findings.
- Final CLI: **15files247tests PASS =237existing +10new**. No existing tests changed/deleted/disabled. Build/lint/diff check PASS. Initial GSAP declaration typing errors were corrected with typed callbacks/wrappers; no final lint warnings.
- Protected-source diff empty: algorithms/snapshots, existing controllers/panels/GraphView/Hero hook/theory content, index.css, dependencies/lockfile and CI are unchanged. App has only background mount and stacking wrappers. No algorithm data or events are supplied to the background.
- Exact requested document filenames retain2026-10-28 even though final verification continued after midnight on2026-10-29.

## Changed files
- src/components/AlgorithmFloatingBackground.tsx
- src/components/floatingBackground.css
- src/animation/useFloatingBackground.ts
- src/components/AlgorithmFloatingBackground.test.tsx
- src/App.tsx
- docs/superpowers/specs/2026-10-28-floating-algorithm-background-design.md
- docs/superpowers/plans/2026-10-28-floating-algorithm-background.md

## Evidence boundaries / manual visual approval
Code and DOM tests establish graph topology, SVG arrow clearance, inert/pointer-free fixed containment, limited owned tweens, media/visibility/print cleanup, and unchanged Lab selection. They do not establish perceived depth, sufficient light, unobscured four-cluster visibility, viewport overflow in a real renderer, actual print painting, or GPU/FPS quality. Performance is bounded by design, not benchmark-certified.

Prior Computer Use safety stop is not retried or bypassed. Actual browser review is unverified. Hero four-cluster visibility is specifically an acceptance item requiring the user's visual review; high-opacity reading surfaces may occlude parts of the art intentionally, and only viewing the page can settle the balance.

Manual QA:
1. Open existing http://127.0.0.1:5173/; if absent start `npm.cmd run dev` with process PATH containing C:\Program Files\nodejs.
2. At1440/1280px inspect all four350–500px unframed structures behind Hero: tree hierarchy, K5ten pairs, intact directed arrows, weighted mesh. Inspect node depth, halos and reading-surface contrast.
3. Stay idle to inspect distinct float periods and sparse packets; move the pointer near each cluster, then scroll past Hero/Concept/Lab/Theory and3–4+viewport heights. Check bounded smooth parallax and strengths1/.62/.16/.06. Verify no Hero docking conflicts, no rapid flashing and no Lab interference.
4. Play/step both algorithms, confirm K final8 and RD7→11→8, buttons/tabs/speed unaffected, and Theory/cost tables legible. Background must remain secondary at Lab/Theory.
5. At1024/768/390/320px and200% inspect clipped containment/no horizontal scrollbar and readable controls. At≤768px expect only tree/directed art with smaller float amplitude, no packets/magnetic work.
6. Enable OS Reduced Motion: static illustrations and correct content. Hide/return to tab; background running motion may resume, while existing Lab visibility rules remain unchanged. Open print preview: no navy art/background, intact theory and both final results.
7. Inspect console and a browser performance trace before asserting FPS/performance quality. Actual screenreader behavior, painting, print pagination and visual completion remain unverified.

No push/PR/merge/deployment or new library. Final local commit SHA and clean working tree are reported after commit.
