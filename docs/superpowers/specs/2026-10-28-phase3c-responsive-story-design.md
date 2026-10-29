# Phase 3C Responsive Story Design

## Approved scope / information architecture
One page: Interactive Hero → Visual Concept Story → Algorithm Lab → Theory & Comparison. Preserve current branding, light dashboard/dark SVG palette, immutable algorithms, judgment effects and playback controller. No new packages, input editor, backend, PDF creation or deployment. Work on dev caea535; preserve five local commits and create Gate A–D local commits. No push/rebase/amend/PR/merge.

## Actual structure / state boundaries
App currently creates two runs once at module scope. AlgorithmPanel owns useAlgorithmPlayback and GraphView refs. Keep these owners; AlgorithmLabSection only chooses layout/visibility. Hero gets ASSIGNMENT_GRAPH, draws its own decorative SVG with accessible textual graph description, and never receives panel callbacks. Concept cards explain actual constructive/destructive greedy strategies without another simulator. All snapshots remain available through the existing panels.

## Hero motion
Existing GSAP package includes ScrollTrigger. A section-local context transforms one Hero figure from scale1 to0.65/y−48 during a short top→bottom Hero scroll range; no pin, forced scrolling or global lock. Scope begins at Hero top/top and ends at Hero bottom/top. On small screens (<1200px) or reduced motion, use the complete static figure. Media changes recreate only the section-owned context; invalidateOnRefresh recalculates bounds. Unmount reverts only this scene. No per-scroll React state and no Lab selectors. Concept cards remain ordinary document content following the docking transform.

## Responsive Lab
Use 1200px as initial two-column threshold: existing 1280px page max and 24px gap leave roughly540px per panel near this threshold; below that keep a single wide panel with accessible tabs. At390/320px retain wrapping controls, minimum44px targets, full-width selectors and min-width:0 containers. CSS and JS share the same1200px threshold.

Both AlgorithmPanels stay mounted in stable tabpanel wrappers. Tabs use roving tabIndex, arrows/Home/End, aria-controls/selected and labelled panels. Pass a visible boolean into AlgorithmPanel; a small effect invokes existing pause when it becomes hidden. No jump/cancel/revision or automatic resume. Returning to desktop preserves both owners. If focus would become hidden, move it to the selected tab; desktop hides tab controls without abandoning focus. SVG uses fixed coordinates, so hiding never causes pixel-based endpoint recomputation.

## Theory / print
Reuse docs/mst-core.md directly through Vite raw import. A small controlled Markdown-subset renderer exposes its existing Definition/Procedure/Basic Operation/Time/Space sections as semantic headings/tables/code/lists; no duplicated theory data or raw HTML execution. Expand the existing final comparison with strategy/order/decision/termination/costs, reading final MST/weight from MstRun.

Print hides Hero/Concept/interactive Lab and controls, shows all theory and the independent final comparison for both algorithms regardless of current mobile tab/step. No beforeprint navigation or playback state mutations. White print palette, wrapped code, repeated table headers and safe page breaks. This is printable HTML, not a completed submission PDF.

## Accessibility / requirement mapping / limits
Skip link and Hero navigation reach Lab/Theory directly. One H1, section H2s, descriptive controls, visible focus and readable text. Reduced motion leaves static content visible. Same graph≤8 (currently5), all6/15 steps and What/Why remain in Lab; Definition/Procedure/operations/complexities move from repository-only evidence to visible Theory. Course-pair eligibility, final PDF, public URL and3–5final captures remain submission tasks.

Browser safety restriction is not bypassed. DOM/GSAP/print CSS checks cannot certify1440/1280/1024/768/390/320px,200%, actual keyboard/AT/console/print preview. These remain explicit manual QA if browser automation is unavailable.
