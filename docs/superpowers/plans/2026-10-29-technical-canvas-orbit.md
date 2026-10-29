# Technical Canvas orbit and compact Hero

Implement the user's explicit five-ring Canvas specification, superseding the previous SVG artwork. Retain all existing uncommitted work except the superseded background implementation/tests. No core, snapshot, playback, tables, theory, package or CI changes. No new dependencies, commit or push.

1. Add pure Canvas geometry/painting tests for five solid rings (16/28/52/40/64 ticks), eight satellites, exact fixture weights, four final-run MST highlights/packets, straight candidate edges and desktop B/C clearance from the 440px Hero.
2. Replace SVG with one inert fixed DPR-aware Canvas. Put pure read-only geometry/painting in a dedicated module; no algorithm execution. Add a component-owned animation loop with eased pointer parallax, scroll, resize, hidden-tab pause, Reduced Motion, print and StrictMode cleanup. Replace obsolete SVG ownership tests with Canvas lifecycle tests; retain unrelated tests.
3. Set Hero width <=440px and match supplied dark glass/CTA styles. Pass the existing completed MstRun from App, without recomputation. Mobile places the card below the diagram. Geometry guards node/glow space on desktop; actual visual clearance remains a manual browser check.
4. Run test/build/lint/diff checks. Check protected files. Record actual limitations: mock Canvas operation tests prove draw commands/lifecycle, not real pixel rendering or FPS. Prior browser safety restriction remains respected.

## Completion evidence

- Replaced 9 obsolete SVG tests with 22 Canvas geometry/painting/lifecycle cases. Retained the other 238 cases; navigation assertions use the requested new button labels. Final: 16 files / 260 tests PASS. Test, build, lint and whitespace commands all exited 0.
- Protected-source diff is empty for algorithms/original algorithm tests, playback controllers, GraphView/panels, tables/theory, package/lockfile and CI. Existing App completed-run records remain the only source of MST IDs and final-weight statistics.
- Actual painter was rendered offline through the already-bundled @napi-rs/canvas runtime at 1440x900 and 390x844. No dependency was added. PNGs are outside the repository in the task visualization directory, named technical-canvas-desktop.png and technical-canvas-mobile.png.
- Visual inspection caught the original wide B tag covering two mobile weight badges. Regression cases reproduced overlap at 320x844, 390x844 and 844x390, then passed with a compact two-line mobile tag. Lightning is a vector shape to avoid missing emoji fonts. Updated PNGs were inspected; all seven mobile weights are visible.
- Independent review agent could not run because of a credit-limit error. Self-review covered geometry, Canvas save/restore, DPR, StrictMode ownership, media/visibility/unmount cleanup, button styles and scope. No independent-review signoff is claimed.
- Browser layout, actual Hero/card clearance, animation smoothness/FPS, keyboard/200% zoom and physical print remain manual checks. Offline PNGs contain the background alone, not a screenshot of the composed website. No browser safety bypass was attempted.
- Branch dev, HEAD 5feda4126a942ac2bf8ac0cdbbfc46ad2246a7da unchanged. Work is uncommitted; no push/PR/merge/deploy.

## Reference speed adjustment

The user's 20261029-0257-46.5662991.mp4 was sampled during continuous playback (about 1.59/2.76/3.93 seconds). Increased decorative motion with distinct rates: satellite periods approximately 7–35 seconds, packets 1.25 seconds, ring/text angular speeds .035–.14 rad/s; B breathing 1.8 rad/s. Parallax easing, draw cadence, Reduced Motion, visibility cleanup and all Lab playback are unchanged. Approximate visual pacing, not an exact timing match claim. Fresh verification: 260 tests / 16 files, build/lint/diff checks passed; composed browser animation remains unverified. No new commit or push.

## All-node breathing and interpolation refinement

Added the requested sinusoidal radius/glow/rim pulse to all five nodes: B phase 0 and amplitude 2.4px, outer phase 1.5 and amplitude 1.4px; shadowBlur 28/18 plus pulse*4, rim always radius+5. Expressed time+=.02 at 60Hz as seconds*1.2 so refresh rate does not alter pulse speed. Removed the former 30fps draw cap; one requestAnimationFrame owner draws each frame, with lerp coefficient 1-.96^(delta/(1000/60)), exactly .04 at 60Hz. Existing ring/satellite/packet speeds, positions, Reduced Motion and hidden/print/unmount behavior remain unchanged. New tests reproduced missing breathing and throttled drawing before implementation, then verified radius/glow/rim values and identical 60/120Hz interpolation over equal time. Final 262 tests / 16 files, build/lint/diff checks PASS. Core/Lab/playback/theory/package/CI diff remains empty. Actual browser FPS and motion quality are not verified. Work remains uncommitted.
