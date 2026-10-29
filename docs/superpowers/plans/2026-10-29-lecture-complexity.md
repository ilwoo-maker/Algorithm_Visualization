# Lecture notation for lower Theory UI

Use the user's supplied Chap.4 expressions, not an independently verified transcription of the original handout. Scope only Theory source/renderer/styles/UI tests. Preserve prior uncommitted work and all executable algorithm, Hero/Lab/background/controller code.

1. Preserve docs/mst-core.md as the detailed implementation reference. Build docs/mst-lecture.md as the website's authoritative lecture-facing source: n/m, 이음선, 비교문, W(m,n), Θ/lg, 서로소인 집합 자료구조 and abstract find/equal/merge. Preserve Definition/I/O, snapshot contracts and procedure content with notation updates.
2. Present the supplied lecture-loop Θ(m lg m) explicitly as the lecture analysis model, not the exact cost of the current path-compressed implementation. Likewise describe repeated BFS as a worst-case aggregate, accounting for the changing active graph. No blind replacement of every implementation upper bound by Θ.
3. Complexity metrics show the requested W formulas, step derivations and complete-graph formulas. Distinguish connected m≥n−1 from complete m=n(n−1)/2, current working memory Θ(n+m), disjoint-set-only memory Θ(n), and full recording space Θ(S(n+m)). Keep no unsupported measured-speed claim.
4. Add math-block rendering without dependencies, update all lower Theory labels and final comparison (n−1/m), retain tabs/print/keyboard behavior. Test expected formulas/terminology and absence of old size notation/Big-O/Union-Find in the full Theory DOM; adjust prior content expectations. Run full tests/build/lint/diff checks. No commit/push/browser automation.

## Verification

Implemented the lecture source, Theory labels/metrics and four dedicated math blocks. Existing content tests now inspect the lecture source; full Theory DOM (including inactive tabs and disclosures) is checked for remaining old size symbols, Big-O and Union-Find terminology. Snapshot-count notation also uses m/t, and final tables use n−1/m. Formula/space/recording and beforeprint/restoration checks remain intact.

Final result: 17 files / 270 tests PASS; build, lint and git diff --check exit 0. Core algorithm/original algorithm tests, controllers/Lab/GraphView, dependencies and CI have no diff. Original implementation reference is retained. Independent read-only review found no important accuracy/scope findings and did not run tests; the main process ran the full suite.

The original lecture file was not supplied or independently inspected; the user's provided expressions are the basis. Website/PDF pixel layout remains unverified, and no browser automation was attempted. No commit/push/PR/merge/deployment; prior uncommitted work is preserved.
