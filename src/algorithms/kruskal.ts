import { prepareGraph, sortEdges } from './graph'
import { captureSnapshot, finishRun } from './snapshot'
import { UnionFind } from './unionFind'
import type { EdgeStatus, MstRun, Result, Snapshot } from './types'

export function kruskal(input: unknown): Result<MstRun> {
  const prepared = prepareGraph(input)
  if (prepared.ok === false) return prepared
  const graph = prepared.value
  const sets = new UnionFind(graph.vertices)
  const states = new Map<string, EdgeStatus>(graph.edges.map(({ id }) => [id, 'pending']))
  const snapshots: Snapshot[] = [captureSnapshot(graph, states, {
    index: 0, algorithm: 'kruskal', action: 'initialize', reason: 'initial', edgeId: null,
    what: '모든 정점을 독립된 연결 요소로 두고 빈 선택 간선 집합에서 시작합니다.',
    why: '가중치 오름차순으로 검사하고, 같은 가중치는 정규화된 간선 이름의 사전순으로 처리합니다.',
  })]

  let selectedCount = 0
  for (const edge of sortEdges(graph.edges, 'ascending')) {
    if (selectedCount === graph.vertices.length - 1) break
    const accepted = sets.union(edge.source, edge.target)
    states.set(edge.id, accepted ? 'selected' : 'rejected')
    if (accepted) selectedCount++
    snapshots.push(captureSnapshot(graph, states, {
      index: snapshots.length, algorithm: 'kruskal',
      action: accepted ? 'accept' : 'reject',
      reason: accepted ? 'different-components' : 'cycle',
      edgeId: edge.id,
      what: `간선 ${edge.name}(가중치 ${edge.weight})을 ${accepted ? '선택' : '기각'}합니다.`,
      why: accepted
        ? `${edge.source}와 ${edge.target}는 서로 다른 연결 요소에 있으므로 사이클 없이 합칠 수 있습니다.`
        : `${edge.source}와 ${edge.target}는 같은 연결 요소에 있으므로 이 간선을 추가하면 사이클이 생깁니다.`,
    }))
  }
  return finishRun('kruskal', graph, snapshots)
}
