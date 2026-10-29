# Modular theory comparison tabs

Scope: only lower Theory UI, its renderer/styles/tests. Preserve existing uncommitted work and all authoritative docs/mst-core.md content, core calculations, Hero, Lab, playback and background. Existing TheorySection import remains a compatibility entry; no App/Hero edit. No dependency, commit or push.

1. Partition the existing authoritative document into intact heading groups; retain original text for all definitions/procedures/complexity and print. Test lossless grouping and sample data from supplied MstRun.
2. Add TheoryComparisonSection.tsx: four accessible tabs with roving keyboard focus; definition/I/O cards, two algorithm editors plus expandable helpers, complexity metric cards and detailed costs, final-result banner/table from existing results. Syntax highlighting via safe React tokens, no HTML injection/packages.
3. Correctness caveat: label Kruskal O(V) as Union-Find only, explicitly show actual full working-space O(V+E). Keep recording overhead and limits of timing claims, tied-MST note and full operation-based costs.
4. Scoped dark CSS only. Responsive grids, wrapped code with decorative line numbers, keyboard-visible focus, horizontally scrollable tables. Print all panels, expand all native details beforeprint and restore their prior state/selected tab afterprint; CSS fallback for all panels.
5. Red/green tab, keyboard, content, dynamic result, print/restoration and Lab-isolation tests. Update old Theory/UI assertions for hidden tabs; no original algorithm test changes. Run full tests/build/lint/diff. Browser visual/physical print QA remains unverified due previous safety restriction.

## Completion evidence

- Added TheoryComparisonSection.tsx and scoped theoryComparison.css; TheorySection.tsx is a compatibility re-export. App, Hero, Lab, controllers, background and the authoritative document were not edited by this task; prior uncommitted changes remain.
- Source grouping is lossless. Complete definitions are in expandable contracts; primary algorithms are side by side, helpers expandable; detailed cost/recording analysis is retained. Final banner and sample output read supplied MstRun values rather than fixed 8/edge literals.
- Eight new tests verify document slices, accessible tabs, roving keyboard focus, exact pseudocode text (normalizing CRLF only), explicit space-cost scope, supplied result values, print expansion/restoration, and Lab independence. Existing UI tests now navigate the appropriate Theory tab and scope Lab tabpanel queries to Lab; no algorithm tests were changed.
- Final verification: 17 test files / 270 tests PASS, build/lint/diff checks exit 0. No lint diagnostics beyond Git's existing CRLF conversion notices. Read-only independent review found no important actionable issue; reviewer did not run tests because npm was unavailable in its shell, while the main process ran the full suite successfully.
- No browser automation was attempted. Actual desktop/mobile layout, 200% zoom, print pagination, colors and physical/PDF output remain unverified. Print CSS exposes all panels, beforeprint opens every disclosure, and afterprint restores the selection/disclosure state without touching Lab.
- No dependency changes, commits, pushes, PRs, merges or deployment.
