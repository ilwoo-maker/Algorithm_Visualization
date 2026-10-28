# Single Giant MST Orbit Implementation Plan

**Goal:** Replace corner artwork with one accurate centered MST orbit.
**Architecture:** New SVG component + isolated GSAP hook/CSS, existing App final-run IDs passed as readonly props. Remove former Canvas/cluster modules and their exclusive setup/tests.
**Tech Stack:** Existing React/TS/SVG/GSAP/Vitest; no new package.
**Spec:** ../specs/2026-10-29-single-mst-orbit-design.md

## Constraints / Review Focus
- Baseline d848284, dev clean/ahead12,252tests. Keep all237 unrelated tests, core/controllers/Hero/theory unchanged.
- Rings must rotate around B only, without graph/label movement. Centering transform cannot be overwritten by scrolling.
- Exact seven edges/weights, four MST packets; candidate states are decoration, not a Lab snapshot.
- Reduced Motion/print/hidden/unmount must remove or pause only owned work. Mobile clips decoration without losing diagram nodes or changing document width.
- Keep previous commits, local commit only; no browser safety bypass or unverified visual claims.

## Steps
- [x] Write orbit structure/geometry/graph/centering tests and observe missing implementation failure.
- [x] Implement SVG and new CSS, wire App final MST IDs, remove old corner painters/clocks/styles and obsolete tests/setup.
- [x] Add failing motion/lifecycle/isolation tests, implement bounded owned rotation/breath/packet/scroll behavior.
- [x] Run full tests/build/lint/diff, confirm protected-source diff empty and no old cluster runtime references.
- [x] Read-only final review and record actual evidence/limitations.

## Ledger
252baseline tests PASS. Video reference extracted outside repository and viewed; original unmodified. Existing newer Canvas commit retained as baseline. SVG chosen for precise circles, textPath labels and scalable edge badges without a Canvas redraw clock.

## Final verification

- All 237 unrelated tests retained. Replaced 15 obsolete corner/Canvas tests with 9 orbit tests: 15 files / 246 tests PASS. This is a replacement, not a regression in existing algorithm coverage.
- `npm test`, `npm run build`, `npm run lint`, `git diff --check`: exit 0 on the final run. No packages added or versions changed.
- Actual GSAP scroll testing exposed unsupported `quickTo('scale')`; separate scaleX/scaleY quickTo setters now reach 0.75. At most 12 owned tweens; center anchor translation is separate.
- Protected algorithm/controller/theory/Hero source, original tests, package files and CI have no diff. No former cluster runtime references remain.
- Read-only review found no actionable correctness issue. Original reference video and an offline static SVG preview were inspected. The preview is not a browser screenshot and does not verify textPath rendering, animation smoothness or foreground legibility.
- Manual follow-up: actual desktop/mobile centering and card overlap; arc label rendering; scroll/motion smoothness; Reduced Motion and print in a real browser. Prior browser safety restriction was respected.
