# Phase 3B-1.5 — Visual polish design

Base: local `dev` at `fffdb755af26a1a820cd1fbd57521e9def743315`, preserving the unpushed 3B-1 commit. User approved Light Dashboard + Dark Graph Stage + High-Impact GSAP Motion.

## Scope and reuse

Keep the page, cards, controls, descriptions, comparison table and graph coordinates. Only the graph stage becomes navy, with legible pale labels, teal selection, rose rejection, gold removal and blue restoration. Pending long dashes and removed dots stay distinct without relying on color. No dependency, lockfile, core, core-test or CI changes; no autoplay controls, branch rewriting, push, PR, merge or deploy.

Extend the existing local owner/context/revert lifecycle rather than introduce a second animation system. A small shared scoped-timeline helper supports entrance and edge scenes. All scene data comes from `Snapshot` and the final `MstRun`; no connectivity or MST calculation is added.

## Motion scenes

- **Entrance:** once per mount, nodes A–E appear with opacity and small-to-normal circle radii; seven edges draw in sequence and their weight groups appear with them; a brief stage highlight settles. Target duration about 1.6 seconds. StrictMode may recreate a cancelled setup but only one live scene per SVG survives. Any navigation cancels entrance and immediately shows the requested snapshot; it does not also start a judgment effect.
- **Inspection:** one owned timeline highlights the current edge, sends a short luminous streak/head along its SVG coordinates, pulses only its two endpoints, then performs the existing status-specific result. The light is explicitly labeled as inspection emphasis, not graph direction. One ring per vertex, no infinite effects or particles.
- **Decision:** accept draws teal; reject flashes rose and settles dashed; temporary removal fades the previous line into the canonical ghost representation; remove dims the emphasis into inactive dots; restore rebuilds blue. Deleted edges never remain bright after settlement. Snapshot component indices provide a static boundary-color cue during disconnection, without recalculating connectivity.
- **Completion:** only an adjacent Next into the final snapshot appends a completion scene. Decorate the `MstRun.mst` edges sequentially, pulse the existing confirmed weight value (no numeric count-up), and give all vertices one short completion response. Direct final selection remains instant, honoring the navigation rule.

## Ownership and accessibility

Reuse the canonical SVG lines plus a hidden overlay per edge (needed for completion), a current-edge streak/head and one hidden ring per vertex. Decorations have `aria-hidden`, opacity zero when idle and no pointer events. The static accessible graph, state table, weights and explanations always reflect the selected snapshot.

Each SVG owns at most one entrance/inspection/completion timeline and media listener. Each navigation carries a revision so even selecting the current step cancels an entrance/effect. Cleanup invalidates old completion callbacks and reverts temporary opacity, radius, transform and stroke changes. Completion receives only its panel's weight ref. Reduced Motion skips all scenes; enabling it mid-scene cancels/reverts immediately, with CSS also hiding decorations. No global kill or selectors.

## Verification boundary

Retain 137 test cases; update only intentional palette/timing and entrance assumptions in UI/motion tests. Add real GSAP tests for entrance, streak/head movement, endpoint-only waves, final-only/data-derived completion, interrupted entrance, isolated owners, StrictMode/unmount and decorative accessibility. CLI success does not establish browser painting or perceived impact. Browser automation will not be retried around the earlier Computer Use safety stop. Provide manual scene/recording instructions and clearly mark desktop/mobile/200%/console/keyboard/actual Reduced Motion rendering unverified.
