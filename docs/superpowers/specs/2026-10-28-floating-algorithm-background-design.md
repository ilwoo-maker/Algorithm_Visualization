# Floating Algorithm Background Design

## Scope / layer architecture
Add AlgorithmFloatingBackground once inside an isolated algorithm-site stacking context. Fixed/inset0/clipped decorative layer at z0, pointer-events:none/aria-hidden; existing content wrapper at z1. No DOM relocation or Lab ownership changes. SVG is appropriate for four small structured graphs and avoids Canvas redraw/accessibility/runtime complexity. Keep existing opaque Lab graphs/cards; add high-opacity reading surfaces around introductory/document content without bulk recoloring Lab/Theory cards or backdrop blur.

## Artwork
Four independent350–500px unframed illustrations: emerald7-node binary tree/6parent-child edges; cyan K5/10pairs; amber directed cycle with arrowheads; blue-green weighted3×3mesh. Use node size/depth, shared per-SVG glow filter, radial halos, glow+crisp edge strokes, sparse normalized-dash packet paths. IDs are component-local. These graphs are decoration, not the assignment input or a simulator.

## Motion and sections
One background-only GSAP context owns four independent float tweens and at most four packet tweens; fine-pointer desktop adds bounded magnetic quickTo tweens. Float periods/phases differ, rotations are gentle. Nested float/scroll/mouse layers prevent competing transforms. Passive scroll/resize/pointer listeners feed one requestAnimationFrame with direct DOM writes; no scroll React state. Scroll moves foreground layers more than rear layers. Hero/Concept/Lab/Theory strengths1/.62/.16/.06 are applied only to the art layer, with no Lab animation callbacks. No background ScrollTrigger is needed; existing Hero context remains unchanged.

## Accessibility / performance / responsive / print
Reduced Motion keeps static art and stops float/packet/parallax/magnetic motion. At≤768px show two smaller240–310px clusters, omit packet/magnetic work, shorten float amplitudes. Overflow is clipped within the fixed layer and graphics never receive focus. Visibility pauses only background tweens that were running and resumes only those; media changes revert the old context before rebuilding. Cleanup removes listeners, RAF, tweens and temporary root styles. Print hides the entire background and restores white site surfaces without changing existing printable results.

## Boundaries / acceptance
Only new component/artwork/styles/motion helper/tests/docs plus minimal App mounting. Core/snapshots/controller/GraphView/WhatWhy/theory/current Hero hook remain unchanged. No packages/push/PR/merge/deployment. Baseline dev8956e96 is preserved and one reviewed local commit added. Structural and GSAP lifecycle tests cannot certify actual artwork depth, GPU frame rate, mobile painting or print preview. Prior browser safety restriction is not bypassed; manual visual approval remains required.
