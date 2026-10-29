export interface Edge {
  readonly source: string
  readonly target: string
  readonly weight: number
}

export interface Graph {
  readonly vertices: readonly string[]
  readonly edges: readonly Edge[]
}

export interface NormalizedEdge extends Edge {
  readonly id: string
  readonly name: string
}

export interface NormalizedGraph {
  readonly vertices: readonly string[]
  readonly edges: readonly NormalizedEdge[]
}

export type GraphErrorCode =
  | 'INVALID_GRAPH'
  | 'INVALID_VERTEX'
  | 'DUPLICATE_VERTEX'
  | 'INVALID_EDGE'
  | 'UNKNOWN_VERTEX'
  | 'SELF_LOOP'
  | 'DUPLICATE_EDGE'
  | 'INVALID_WEIGHT'
  | 'WEIGHT_OVERFLOW'
  | 'DISCONNECTED_GRAPH'

export interface GraphError {
  readonly code: GraphErrorCode
  readonly message: string
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: GraphError }

export type Algorithm = 'kruskal' | 'reverse-delete'
export type Action = 'initialize' | 'accept' | 'reject' | 'try-remove' | 'remove' | 'restore'
export type Reason =
  | 'initial'
  | 'different-components'
  | 'cycle'
  | 'connectivity-check'
  | 'still-connected'
  | 'disconnects'

export type EdgeStatus =
  | 'pending'
  | 'selected'
  | 'rejected'
  | 'present'
  | 'temporarily-removed'
  | 'removed'
  | 'kept'

export interface EdgeSnapshot extends NormalizedEdge {
  readonly status: EdgeStatus
}

export interface Snapshot {
  readonly index: number
  readonly algorithm: Algorithm
  readonly action: Action
  readonly reason: Reason
  readonly edgeId: string | null
  readonly edges: readonly EdgeSnapshot[]
  readonly activeEdgeIds: readonly string[]
  readonly totalWeight: number
  /** BFS discovery order, deterministic for a normalized graph. */
  readonly components: readonly (readonly string[])[]
  readonly what: string
  readonly why: string
}

export interface MstRun {
  readonly algorithm: Algorithm
  /** Normalized-name order, independent of the algorithm's processing order. */
  readonly mst: readonly NormalizedEdge[]
  readonly totalWeight: number
  readonly snapshots: readonly Snapshot[]
}
