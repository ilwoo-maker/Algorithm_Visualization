import type { Graph } from './types'

/** Assignment input. Frozen so demos/tests cannot silently change the graph. */
export const ASSIGNMENT_GRAPH: Graph = Object.freeze({
  vertices: Object.freeze(['A', 'B', 'C', 'D', 'E']),
  edges: Object.freeze([
    { source: 'B', target: 'C', weight: 1 },
    { source: 'B', target: 'D', weight: 1 },
    { source: 'A', target: 'B', weight: 2 },
    { source: 'A', target: 'C', weight: 3 },
    { source: 'B', target: 'E', weight: 4 },
    { source: 'C', target: 'D', weight: 5 },
    { source: 'D', target: 'E', weight: 7 },
  ].map((edge) => Object.freeze(edge))),
})
