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
- [x] RED tests four regions, direct Lab/Theory links, existing controls and final results.
- [x] Minimal extraction; no panel ownership change. Preserve existing accessible names.
- [x] Full tests/build/lint and local commit.

## Gate B — Hero / Story
Files: MstHeroSection.tsx, animation/useHeroScroll.ts, index.css, heroScroll.test.tsx.
- [x] RED for independent graph/readable static content and owned scroll cleanup/isolation.
- [x] One figure transform using existing ScrollTrigger; media/reduced fallback, no pin.
- [x] Full regression/cleanup review and local commit.

## Gate C — Responsive Lab
Files: AlgorithmLabSection.tsx, AlgorithmPanel.tsx, index.css, responsiveLab.test.tsx.
- [x] RED tabs/keyboard, hidden panel pause/same timeline Resume/speed preservation, resizing owners/focus.
- [x] Stable tabpanel wrappers,1200px query, visibility→existing pause only, wrapping controls.
- [x] Full regression and local commit. Existing keyboard test adapts new navigation order without removing intent.

## Gate D — Theory / Print
Files: TheorySection.tsx, theoryContent.tsx, index.css, theoryPrint.test.tsx.
- [x] RED Definition/Procedure/operations/costs/raw document reuse and both final results independent of current selection.
- [x] Controlled Markdown rendering and expanded comparison. Print CSS hides interactive views, exposes theory/final summary.
- [x] Full tests/build/lint/diff/core boundary verification, local commit.

## Gate E — Integration
- [x] Read-only final reviewer; regressions fixed with failing tests.
- [x] Record actual CLI results, Gate SHAs, scope and manual viewport/print/keyboard/AT instructions.
- [x] Clean local worktree; no remote operations.

## Execution ledger
Baseline verified: dev caea53518bfc5d6f2dfe73f3089ffa103a50392d, clean,0 behind/5ahead;223tests/10files PASS. Existing GSAP ScrollTrigger.js present, Lucide absent. User explicitly specifies current dev and progressive Gate commits, so no separate worktree or approval pause.

Gate A: four sections extracted with stable existing panel owners; new2tests RED→GREEN,225total PASS,build/lint PASS. Keyboard regression test now explicitly focuses Next after the new Hero navigation links; activation/state assertions retained.

Gate B: one Hero-local real ScrollTrigger, no pin/scroll lock; small/reduced static fallback and read-only snapshot concept scenes.4new tests RED→GREEN including real trigger StrictMode/media cleanup and Lab isolation.229total PASS,build/lint/diff PASS.

Gate C:1200px content-width threshold, stable mounted tabpanels, existing pause callback on hidden panels, roving focus and resize preservation.4new RED→GREEN tests;233total PASS,build/lint/diff PASS. Five existing motion matchMedia stubs now distinguish reduced-motion from viewport queries; their verification assertions remain unchanged.

Gate D: authoritative raw Markdown rendered as semantic theory, source-derived cost rows, expanded final comparison and print CSS independent of current Lab/tab.3new tests RED→GREEN;236total PASS,build/lint/diff PASS. Resolved Gate C's effect dependency lint warning by destructuring stable pause/status, and separated pure document helpers from JSX for Fast Refresh. Print preview remains unverified.

Gate E: independent read-only whole-branch reviewer found no critical/important issue. Author additionally reproduced a print page-width media event pausing a desktop panel (RED). The Lab now ignores width changes while matchMedia('print') matches, then reevaluates screen layout after printing; existing playback is not navigated or rebuilt (GREEN). Final suite237/14files = baseline223 +14new. Build/lint/diff PASS, no warnings in final lint. No changes to core, snapshot, original algorithm tests, judgment/edge effects, playback hook, dependency/lockfile, CI or authoritative Markdown.

## Local Gate commits
- A: 3345cb204905426e619218a5fa2e96baa9145388
- B: adc90944075a0f99b2777656b4607bcdda4ab879
- C: 9568fa3ab125624063b9ddf059a4b0f3a48eaee7
- D: 653854f569f67b40425868e8c7198966b3002192
- E: print-width guard + final validation record; exact SHA is reported after committing.

## Scope manifest
App.tsx / App.test.tsx; index.css; components/MstHeroSection.tsx, StoryGraph.tsx, AlgorithmConceptSection.tsx, AlgorithmLabSection.tsx, AlgorithmPanel.tsx, TheorySection.tsx, theoryContent.tsx, theoryDocument.ts; animation/useHeroScroll.ts, heroScroll.test.tsx; pageStructure.test.tsx, responsiveLab.test.tsx, theoryPrint.test.tsx; five existing animation test media stubs (edgeTransition, visualPolish, cinematicPlayback, finalMotionPolish, finishVisualAudit); this plan and its design. All source paths are under src/ unless explicitly docs/.

## Assignment mapping / evidence boundaries
- Same graph,5vertices≤8, six/fifteen snapshots, What/Why and final MST8 remain in Lab; baseline correctness tests retained.
- Existing Definition/Procedure/BFS/UF/tie/termination and Basic Operation/time/space/snapshot storage explanations now appear in Theory directly from docs/mst-core.md; final comparison reads run.mst/run.totalWeight.
- Both final results print independently of mobile selection and current step. Interactive panels are hidden in print; they are never moved to a final snapshot for printing. This is HTML print support, not a finished assignment PDF.
- Course-pair eligibility, final submission PDF, public deployment URL and3–5final captures still require separate confirmation/work. Prior Phase3B audit is a historical baseline, not a claim that these submission items are now complete.

## Manual QA — not performed by browser automation
Computer Use previously safety-stopped when Windows browser URL could not be established confidently. It was not retried or bypassed. Actual painting, keyboard/AT, console and print preview are unverified; CLI/DOM/GSAP and CSS inspection are narrower evidence.

1. Open http://127.0.0.1:5173/. If no existing server: PowerShell `$env:Path = 'C:\Program Files\nodejs;' + $env:Path; npm.cmd run dev`.
2. At1440/1280px, inspect Hero entry→short scroll docking→Concept, then jump directly to Lab/Theory and reload at an anchor. Hero must not change either Lab owner. No pin or forced scrolling is expected.
3. At1024/768/390/320px and200% zoom, use both tabs and all controls; inspect edge labels, text, button wrapping, and no horizontal clipping. The1200px threshold allocates about548px per desktop panel at its lower boundary.
4. Play both panels on desktop; narrow the viewport and switch tabs during a transition, return, Resume, change speed and widen again. Steps/speed/pause position must persist and hidden panels must not advance. Test ArrowLeft/Right/Home/End and resize while focused on a tab/control.
5. Enable actual Reduced Motion: static Hero/Concept, reachable anchors and functional Lab. Check K0→1→2→4→4→8 and RD BE7→11→final8, independent controls and console.
6. From compact layout with different intermediate steps, open print preview. Hero/Lab controls must be omitted, both final MSTs8 and all Definition/Procedure/Complexity must remain. Inspect page breaks, repeated headers and wrapped pseudocode; close preview and confirm Lab state preservation. Check actual screenreader completion announcement.

Known limitation: controlled Markdown renderer supports this document's headings, tables, bullet lists and fenced code; it is not a general Markdown editor. No known unresolved functional regression was found. Physical layout/print/AT quality awaits manual review. No remote operations performed.
