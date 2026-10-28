# Canvas Algorithm Art Implementation Plan

Goal: identifiable neon algorithm art with no Lab or algorithm changes.

Architecture: retain existing isolated GSAP transform owner and replace SVG art with cached Canvas layers; one capped packet RAF. No dependencies.

Approaches: SVG revision is smaller but does not satisfy the explicit Canvas request; a full-screen Canvas rewrite would duplicate layout/motion ownership. Four Canvas surfaces inside existing wrappers keep the change isolated.

- [x] Replace SVG-specific tests with Canvas rendering/inertness tests and confirm failures.
- [x] Draw labelled tree, four-node directed cycle, weighted network and K5; clip edges outside discs.
- [x] Cache glow; omit packets on mobile/reduced motion; stop hidden/print work and clean all listeners/RAF.
- [x] Retain section attenuation and bounded GSAP scroll/pointer motion; apply glass only to Hero copy.
- [x] Run full tests, build, lint, browser/responsive checks and diff review.
- [x] Commit locally; no push, PR, merge or deployment.

Review focus: print/visibility transitions; dynamic reduced motion; StrictMode cleanup; high DPI memory; readability/overflow at narrow widths.

Validation: 252 tests in 17 files pass; TypeScript, Vite production build, oxlint and git diff --check pass. Browser: 1440×1000 desktop, 390×844 and 320×740 mobile; no horizontal overflow; Canvas labels/glow, Hero readability, Lab select 3 → previous 2, and Lab attenuation confirmed. Browser console contained no warnings/errors.

Print, reduced motion, dynamic media changes, visibility, StrictMode and unmount are covered by automated tests; native print preview and hardware GPU/FPS were not measured. Packet drawing is capped at 30fps; eight backing surfaces use at most about 13 MiB at the 1.5 DPR cap.

Review: independent reviewer found no Critical, Important or confirmed Minor defects. Arrowhead coordinate/direction assertions remain less detailed than the browser inspection.

Implementation decisions: desktop Hero top padding exposes the full tree and cycle; mobile keeps compact content with smaller peripheral art. This changes decorative spacing, not Hero motion code. Hero copy alone receives 90% white glass and 14px blur; Lab/Theory readable surfaces are preserved. Vite config is unchanged; a separate Vitest config supplies a null Canvas backend for jsdom integration tests, while renderer/lifecycle tests record actual Canvas boundary commands.

Scope: no changes to algorithms, snapshots, playback, Lab, theory, GraphView or Hero animation source. No push, PR, merge or deployment.
