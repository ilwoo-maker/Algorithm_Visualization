# Phase 3C Responsive Story Implementation Plan

**Goal:** Add independent scroll storytelling, a state-preserving responsive Lab, visible theory and printable final results.
**Architecture:** Keep App's module-scope runs and existing panels/controllers. Add section components and a local Hero scroll owner. Reuse authoritative Markdown and final MstRun data.
**Tech Stack:** React/TS/Vite/CSS/SVG/GSAP ScrollTrigger/Vitest/jsdom; no new dependency.
**Spec:** ../specs/2026-10-28-phase3c-responsive-story-design.md

## Global Constraints
- dev caea535, clean/ahead5,223baseline tests. Preserve core/snapshots/effects/playback; no new simulator.
- No new packages, push/PR/merge/deploy/rebase/amend/PDF. Gate A–D local commits.
- Hero cannot control Lab. Hidden panels pause without unmount/reset; only explicit Resume.
- Authoritative theory from docs/mst-core.md. Print both final results independent of current step.

## Review Focus
1. Hero scroll mutates Lab step/playback → Gate B isolation test.
2. Hidden mobile panel keeps playing → Gate C pause/resume same owner test.
3. Resize/unmount duplicates ScrollTrigger → Gate B StrictMode/media cleanup test.
4. Narrow/200% controls clipped → Gate C wrapping/DOM accessibility; manual viewport QA remains required.
5. Print drops hidden algorithm/theory → Gate D independent two-result summary and print rules; manual preview remains required.

## Gate A — Skeleton
Files: App.tsx, MstHeroSection.tsx, AlgorithmConceptSection.tsx, AlgorithmLabSection.tsx, TheorySection.tsx, pageStructure.test.tsx.
- [ ] RED tests four regions, direct Lab/Theory links, existing controls and final results.
- [ ] Minimal extraction; no panel ownership change. Preserve existing accessible names.
- [ ] Full tests/build/lint and local commit.

## Gate B — Hero / Story
Files: MstHeroSection.tsx, animation/useHeroScroll.ts, index.css, heroScroll.test.tsx.
- [ ] RED for independent graph/readable static content and owned scroll cleanup/isolation.
- [ ] One figure transform using existing ScrollTrigger; media/reduced fallback, no pin.
- [ ] Full regression/cleanup review and local commit.

## Gate C — Responsive Lab
Files: AlgorithmLabSection.tsx, AlgorithmPanel.tsx, index.css, responsiveLab.test.tsx.
- [ ] RED tabs/keyboard, hidden panel pause/same timeline Resume/speed preservation, resizing owners/focus.
- [ ] Stable tabpanel wrappers,1200px query, visibility→existing pause only, wrapping controls.
- [ ] Full regression and local commit. Existing keyboard test adapts new navigation order without removing intent.

## Gate D — Theory / Print
Files: TheorySection.tsx, theoryContent.tsx, index.css, theoryPrint.test.tsx.
- [ ] RED Definition/Procedure/operations/costs/raw document reuse and both final results independent of current selection.
- [ ] Controlled Markdown rendering and expanded comparison. Print CSS hides interactive views, exposes theory/final summary.
- [ ] Full tests/build/lint/diff/core boundary verification, local commit.

## Gate E — Integration
- [ ] Read-only final reviewer; regressions fixed with failing tests.
- [ ] Record actual CLI results, Gate SHAs, scope and manual viewport/print/keyboard/AT instructions.
- [ ] Clean local worktree; no remote operations.

## Execution ledger
Baseline verified: dev caea53518bfc5d6f2dfe73f3089ffa103a50392d, clean,0 behind/5ahead;223tests/10files PASS. Existing GSAP ScrollTrigger.js present, Lucide absent. User explicitly specifies current dev and progressive Gate commits, so no separate worktree or approval pause.

Gate A: four sections extracted with stable existing panel owners; new2tests RED→GREEN,225total PASS,build/lint PASS. Keyboard regression test now explicitly focuses Next after the new Hero navigation links; activation/state assertions retained.

Gate B: one Hero-local real ScrollTrigger, no pin/scroll lock; small/reduced static fallback and read-only snapshot concept scenes.4new tests RED→GREEN including real trigger StrictMode/media cleanup and Lab isolation.229total PASS,build/lint/diff PASS.

Gate C:1200px content-width threshold, stable mounted tabpanels, existing pause callback on hidden panels, roving focus and resize preservation.4new RED→GREEN tests;233total PASS,build/lint/diff PASS. Five existing motion matchMedia stubs now distinguish reduced-motion from viewport queries; their verification assertions remain unchanged.

Gate D: authoritative raw Markdown rendered as semantic theory, source-derived cost rows, expanded final comparison and print CSS independent of current Lab/tab.3new tests RED→GREEN;236total PASS,build/lint/diff PASS. Resolved Gate C's effect dependency lint warning by destructuring stable pause/status, and separated pure document helpers from JSX for Fast Refresh. Print preview remains unverified.
