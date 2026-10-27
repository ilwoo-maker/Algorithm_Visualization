import { connectedComponents } from './graph'
import type { Algorithm, EdgeStatus, MstRun, NormalizedGraph, Result, Snapshot } from './types'

type Metadata = Pick<Snapshot, 'index' | 'algorithm' | 'action' | 'reason' | 'edgeId' | 'what' | 'why'>

/** Copy all mutable working state; shared primitive fields cannot alias caller data. */
export function captureSnapshot(
  graph: NormalizedGraph,
  states: ReadonlyMap<string, EdgeStatus>,
  metadata: Metadata,
): Snapshot {
  const edges = graph.edges.map((edge) => Object.freeze({ ...edge, status: states.get(edge.id)! }))
  const activeEdges = edges.filter(({ status }) =>
    status === 'selected' || status === 'present' || status === 'kept')
  const components = connectedComponents(graph.vertices, activeEdges)
    .map((component) => Object.freeze(component))
  return Object.freeze({
    ...metadata,
    edges: Object.freeze(edges),
    activeEdgeIds: Object.freeze(activeEdges.map(({ id }) => id)),
    totalWeight: activeEdges.reduce((sum, edge) => sum + edge.weight, 0),
    components: Object.freeze(components),
  })
}

export function finishRun(
  algorithm: Algorithm,
  graph: NormalizedGraph,
  snapshots: readonly Snapshot[],
): Result<MstRun> {
  const last = snapshots[snapshots.length - 1]
  const activeIds = new Set(last.activeEdgeIds)
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      algorithm,
      mst: Object.freeze(graph.edges.filter(({ id }) => activeIds.has(id))),
      totalWeight: last.totalWeight,
      snapshots: Object.freeze([...snapshots]),
    }),
  })
}
