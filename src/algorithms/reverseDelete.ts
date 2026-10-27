import { prepareGraph, sortEdges } from './graph'
import { captureSnapshot, finishRun } from './snapshot'
import type { EdgeStatus, MstRun, Result, Snapshot } from './types'

export function reverseDelete(input: unknown): Result<MstRun> {
  const prepared = prepareGraph(input)
  if (prepared.ok === false) return prepared
  const graph = prepared.value
  const states = new Map<string, EdgeStatus>(graph.edges.map(({ id }) => [id, 'present']))
  const snapshots: Snapshot[] = [captureSnapshot(graph, states, {
    index: 0, algorithm: 'reverse-delete', action: 'initialize', reason: 'initial', edgeId: null,
    what: '모든 간선이 남아 있는 연결 그래프에서 시작합니다.',
    why: '가중치 내림차순으로 검사하고, 같은 가중치는 정규화된 간선 이름의 사전순으로 처리합니다.',
  })]

  for (const edge of sortEdges(graph.edges, 'descending')) {
    states.set(edge.id, 'temporarily-removed')
    const attempt = captureSnapshot(graph, states, {
      index: snapshots.length, algorithm: 'reverse-delete', action: 'try-remove',
      reason: 'connectivity-check', edgeId: edge.id,
      what: `간선 ${edge.name}(가중치 ${edge.weight})을 임시 제거합니다.`,
      why: '간선을 삭제해도 모든 정점이 연결되는지 BFS로 검사합니다.',
    })
    snapshots.push(attempt)
    // The snapshot's partition is the shared BFS result, not a second connectivity implementation.
    const canRemove = attempt.components.length === 1
    states.set(edge.id, canRemove ? 'removed' : 'kept')
    snapshots.push(captureSnapshot(graph, states, {
      index: snapshots.length, algorithm: 'reverse-delete',
      action: canRemove ? 'remove' : 'restore',
      reason: canRemove ? 'still-connected' : 'disconnects', edgeId: edge.id,
      what: canRemove
        ? `간선 ${edge.name}의 삭제를 확정합니다.`
        : `간선 ${edge.name}의 삭제를 취소하고 복구하여 유지합니다.`,
      why: canRemove
        ? '임시 제거 후에도 연결 요소가 하나여서 모든 정점이 연결되므로 이 간선은 필요하지 않습니다.'
        : `임시 제거 상태에서 연결 요소가 ${attempt.components.length}개로 나뉩니다: ${attempt.components.map((group) => `[${group.join(', ')}]`).join(' / ')}. 모든 정점을 연결하려면 이 간선이 필요합니다.`,
    }))
  }
  return finishRun('reverse-delete', graph, snapshots)
}
