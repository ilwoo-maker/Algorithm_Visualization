# Phase 3A.1 UI Polish Implementation Plan

**Goal:** Preserve the MST core and existing visual design while improving controls, narrow-screen readability, assignment explanations, final comparison and Node compatibility.
**Spec:** User-approved Phase 3A.1 request, 2026-10-28.
**Base:** `dev` at `1d91e9914f78c803a61849776873580e80fdc49e`, clean; baseline 120 tests pass.
**Scope:** `AlgorithmPanel.tsx`, `GraphView.tsx` if needed, `App.tsx`, `index.css`, `App.test.tsx`, package engines and root lockfile metadata. No core/test changes under `src/algorithms`, package upgrades, new dependencies, push, PR, merge or deployment. One local commit on existing `dev`.
**Approach:** Move existing controls above the graph without changing their state/event logic. Add presentation-only explanations and a small final-result table inside App; no algorithm recomputation or component restructuring.

## Steps

- [ ] Add behavior tests first: final-only Kruskal termination note with unexamined CD/DE; final run summary independent of navigation; controls before graph in reading order; SVG stroke/dash states using literal expectations. Observe expected failures.
- [ ] Move current step/progress/controls between panel header and graph. Keep what/why immediately below graph. Preserve independent indices, disabled boundaries, labels and focus.
- [ ] Prevent button wrapping with no-wrap and compact padding; keep at least 44px control height. Increase mobile supporting text contrast/size and weight badges together, preserving existing coordinates and graph edges.
- [ ] Derive Kruskal termination-note counts and pending names from the final snapshot only. Preserve original what/why. Add an always-visible, clearly labeled final-run comparison from `MstRun.mst/totalWeight`, plus the equal-weight caveat. Stack summary columns within available mobile width.
- [ ] Match root Node engines and lockfile metadata to installed dependency requirements (`^22.22.2 || ^24.15.0 || >=26.0.0`); preserve every locked dependency version/integrity. Run `npm ci`. Runtime verification uses installed Node 24.22.1, not all declared versions.
- [ ] Run all tests, build, lint and diff whitespace checks. Verify algorithm sources/tests unchanged. Read-only independent review before commit.
- [ ] Verify real browser at 1440px, 390px, 320px, and actual desktop 200% zoom if supported. Check overflow, no-wrap controls, SVG collisions/clipping, explanations, summary, BE removal/restore, keyboard focus and console. Save before/after screenshots outside repo; clearly distinguish DOM tests from visual checks.
- [ ] Create one local dev commit, verify clean working tree and unchanged main. Report any unverified browser capability honestly, then stop.

## Review focus

- Intermediate active weights and the static final-result summary must remain clearly distinct.
- Final-only notes must disappear when navigating backward; independent panel navigation must survive markup movement.
- Narrow or zoomed screens must not clip badges, wrap button labels or introduce horizontal scrolling.
- Support declaration reflects dependency engines; runtime PASS does not imply all Node versions were tested.

## Verification ledger

- Pre-flight: shared interfaces unchanged; baseline 5 files / 120 tests PASS. Installed jsdom 30.1.3 and its selector dependencies require the stricter Node range above. Existing Node 24.22.1 satisfies it.
