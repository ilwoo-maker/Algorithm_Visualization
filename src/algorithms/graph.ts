import type { Edge, GraphErrorCode, NormalizedEdge, NormalizedGraph, Result } from './types'

/** Locale-independent UTF-16 lexicographic ordering. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function compareNames(a: NormalizedEdge, b: NormalizedEdge): number {
  return compareText(a.name, b.name) || compareText(a.id, b.id)
}

function failure(code: GraphErrorCode, message: string): Result<never> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** All runtime validation and normalization goes through this entry point. */
export function prepareGraph(input: unknown): Result<NormalizedGraph> {
  if (!isRecord(input) || !Array.isArray(input.vertices) || !Array.isArray(input.edges)
    || input.vertices.length === 0) {
    return failure('INVALID_GRAPH', '그래프에는 하나 이상의 정점 배열과 간선 배열이 필요합니다.')
  }

  const vertices: string[] = []
  const vertexSet = new Set<string>()
  for (const vertex of input.vertices) {
    if (typeof vertex !== 'string' || vertex.trim().length === 0) {
      return failure('INVALID_VERTEX', '정점 이름은 비어 있지 않은 문자열이어야 합니다.')
    }
    if (vertexSet.has(vertex)) {
      return failure('DUPLICATE_VERTEX', `정점 ${vertex}이(가) 중복되었습니다.`)
    }
    vertexSet.add(vertex)
    vertices.push(vertex)
  }
  vertices.sort(compareText)

  const edges: NormalizedEdge[] = []
  const edgeIds = new Set<string>()
  let absoluteWeightSum = 0
  for (const edge of input.edges) {
    if (!isRecord(edge) || typeof edge.source !== 'string' || typeof edge.target !== 'string') {
      return failure('INVALID_EDGE', '각 간선에는 문자열 source와 target이 필요합니다.')
    }
    if (!vertexSet.has(edge.source) || !vertexSet.has(edge.target)) {
      return failure('UNKNOWN_VERTEX', `간선 ${edge.source}–${edge.target}의 끝점이 정점 목록에 없습니다.`)
    }
    if (edge.source === edge.target) {
      return failure('SELF_LOOP', `자기 자신을 잇는 간선 ${edge.source}은(는) 허용하지 않습니다.`)
    }
    if (typeof edge.weight !== 'number' || !Number.isFinite(edge.weight)) {
      return failure('INVALID_WEIGHT', '간선 가중치는 유한한 숫자여야 합니다.')
    }
    const [source, target] = compareText(edge.source, edge.target) < 0
      ? [edge.source, edge.target] : [edge.target, edge.source]
    const id = JSON.stringify([source, target])
    if (edgeIds.has(id)) {
      return failure('DUPLICATE_EDGE', `무방향 간선 ${source}–${target}이(가) 중복되었습니다.`)
    }
    edgeIds.add(id)
    absoluteWeightSum += Math.abs(edge.weight)
    if (!Number.isFinite(absoluteWeightSum)) {
      return failure('WEIGHT_OVERFLOW', '가중치 절댓값의 합이 숫자 표현 범위를 초과합니다.')
    }
    // Single-character labels retain assignment names such as BC; JSON handles arbitrary labels.
    const name = source.length === 1 && target.length === 1 ? source + target : id
    edges.push(Object.freeze({ id, name, source, target, weight: edge.weight }))
  }
  edges.sort(compareNames)
  if (connectedComponents(vertices, edges).length !== 1) {
    return failure('DISCONNECTED_GRAPH', '그래프가 연결되어 있지 않아 최소 신장 트리를 만들 수 없습니다.')
  }
  return Object.freeze({
    ok: true,
    value: Object.freeze({ vertices: Object.freeze(vertices), edges: Object.freeze(edges) }),
  })
}

export function sortEdges(
  edges: readonly NormalizedEdge[],
  direction: 'ascending' | 'descending',
): NormalizedEdge[] {
  const sign = direction === 'ascending' ? 1 : -1
  return [...edges].sort((a, b) =>
    sign * (a.weight < b.weight ? -1 : a.weight > b.weight ? 1 : 0) || compareNames(a, b))
}

/** BFS on validated endpoints; an indexed queue avoids Array.shift's linear cost. */
export function connectedComponents(
  vertices: readonly string[],
  edges: readonly Edge[],
): string[][] {
  const adjacency = new Map(vertices.map((vertex) => [vertex, [] as string[]]))
  for (const { source, target } of edges) {
    adjacency.get(source)!.push(target)
    adjacency.get(target)!.push(source)
  }
  const visited = new Set<string>()
  const components: string[][] = []
  for (const start of vertices) {
    if (visited.has(start)) continue
    const queue = [start]
    visited.add(start)
    for (let head = 0; head < queue.length; head++) {
      for (const neighbor of adjacency.get(queue[head])!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }
    components.push(queue)
  }
  return components
}
