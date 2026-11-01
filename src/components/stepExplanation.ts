import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { MstRun, Snapshot } from '../algorithms/types'

/** Read-only commentary for the assignment example, not a second graph algorithm. */
export function stepExplanation(run: MstRun, snapshot: Snapshot): string | undefined {
  const vertices = snapshot.components.flat()
  const isAssignment = vertices.length === ASSIGNMENT_GRAPH.vertices.length
    && ASSIGNMENT_GRAPH.vertices.every(vertex => vertices.includes(vertex))
    && snapshot.edges.length === ASSIGNMENT_GRAPH.edges.length
    && ASSIGNMENT_GRAPH.edges.every(expected => snapshot.edges.some(edge =>
      edge.source === expected.source && edge.target === expected.target && edge.weight === expected.weight))
  if (!isAssignment) return undefined

  const edge = snapshot.edges.find(candidate => candidate.id === snapshot.edgeId)
  const status = (name: string) => snapshot.edges.find(candidate => candidate.name === name)?.status
  const previous = run.snapshots[snapshot.index - 1]
  if (snapshot.action === 'initialize') {
    return run.algorithm === 'kruskal'
      ? '처음에는 선택한 간선이 없으므로 각 정점이 따로 떨어져 있습니다. 작은 가중치부터 검사하되, 이미 연결된 두 정점을 다시 잇는 간선은 제외하는 과정을 기록했습니다.'
      : '처음에는 모든 간선이 있어 연결은 확보되어 있지만 사이클도 남아 있습니다. 큰 가중치부터 제거를 시도하며, 연결을 끊지 않고 줄일 수 있는 비용을 확인합니다.'
  }
  if (run.algorithm === 'kruskal' && snapshot.action === 'accept') {
    if (edge?.name === 'BC' && status('BC') === 'selected' && snapshot.activeEdgeIds.length === 1) {
      return 'BC와 BD의 가중치는 모두 1입니다. 동률은 이름순으로 처리하므로 BC를 먼저 검사합니다. 아직 분리된 B와 C를 이으면 사이클 없이 첫 연결을 만들 수 있습니다.'
    }
    if (edge?.name === 'BD' && status('BC') === 'selected') {
      return '앞서 연결한 B·C에 D가 합류해 B·C·D가 하나의 연결 요소가 됩니다. D는 아직 이 집합과 연결되지 않았으므로 BD를 추가해도 사이클이 생기지 않습니다.'
    }
    if (edge?.name === 'AB' && status('BC') === 'selected' && status('BD') === 'selected') {
      return 'B·C·D는 이미 연결되어 있고 A는 따로 남아 있습니다. AB를 선택하면 A도 이 집합에 합류하므로 연결 요소가 하나 줄어듭니다. E는 아직 연결되지 않아 검사를 계속합니다.'
    }
    if (edge?.name === 'BE' && status('AB') === 'selected' && status('BC') === 'selected' && status('BD') === 'selected') {
      return '마지막으로 따로 남아 있던 E를 BE로 연결합니다. 모든 정점이 연결되고 선택한 간선이 4개가 되었으므로, 더 무거운 CD와 DE는 검사할 필요 없이 종료합니다.'
    }
  }
  if (run.algorithm === 'kruskal' && snapshot.action === 'reject' && edge?.name === 'AC'
    && status('AC') === 'rejected' && status('AB') === 'selected' && status('BC') === 'selected') {
    return 'AB와 BC를 이미 선택했으므로 A와 C 사이에는 A–B–C 경로가 있습니다. 여기에 AC를 더하면 A–B–C–A 사이클이 생깁니다. 새로운 정점을 연결하지 못하므로 AC는 제외합니다.'
  }
  if (run.algorithm !== 'reverse-delete') return undefined
  const active = (name: string) => snapshot.edges.some(candidate => candidate.name === name && snapshot.activeEdgeIds.includes(candidate.id))
  if (snapshot.action === 'try-remove' || snapshot.action === 'remove') {
    const path = edge?.name === 'DE' && active('BD') && active('BE') ? 'D–B–E'
      : edge?.name === 'CD' && active('BC') && active('BD') ? 'C–B–D'
      : edge?.name === 'AC' && active('AB') && active('BC') ? 'A–B–C' : undefined
    if (path && snapshot.components.length === 1) {
      return `${edge?.name}를 빼도 ${path} 경로가 남아 양 끝 정점을 연결합니다. 현재 연결 요소도 하나이므로 모든 정점의 연결이 유지됩니다. ${snapshot.action === 'remove' ? `이 간선 없이도 연결할 수 있어 삭제를 확정했고, 가중치 합은 ${snapshot.totalWeight}입니다.` : '다음 단계에서 이 연결성 검사 결과를 근거로 삭제 여부를 확정합니다.'}`
    }
  }
  const isolatedVertex = edge?.name === 'AB' ? 'A' : edge?.name === 'BC' ? 'C' : edge?.name === 'BD' ? 'D' : undefined
  const attempt = snapshot.action === 'try-remove' ? snapshot : previous
  if (isolatedVertex && attempt?.action === 'try-remove' && attempt.edgeId === snapshot.edgeId
    && attempt.components.some(group => group.length === 1 && group[0] === isolatedVertex)) {
    if (snapshot.action === 'try-remove') return `${edge?.name}를 빼면 ${isolatedVertex}가 고립됩니다. 비용은 ${snapshot.totalWeight}로 줄지만, 모든 정점을 연결해야 하는 조건을 만족하지 못합니다.`
    if (snapshot.action === 'restore' && snapshot.components.length === 1) {
      return `직전 단계에서는 ${isolatedVertex}가 고립되었습니다. ${edge?.name}를 복구해 모든 정점을 다시 연결했고, 가중치 합은 ${previous?.totalWeight}에서 ${snapshot.totalWeight}로 돌아왔습니다.${snapshot.index === run.snapshots.length - 1 ? ' 모든 간선의 검사를 마쳤으므로 이 상태가 최종 MST입니다.' : ' 연결을 유지하면서 다음 간선을 검사합니다.'}`
    }
  }
  if (edge?.name !== 'BE' || status('DE') !== 'removed') return undefined
  const isolatedE = (step: Snapshot) => step.components.length === 2
    && step.components.some(group => group.length === 1 && group[0] === 'E')
  if (snapshot.action === 'try-remove' && status('BE') === 'temporarily-removed' && isolatedE(snapshot)) {
    return `앞서 DE를 삭제한 상태에서 BE까지 제거하면 E가 고립됩니다. 가중치 합은 ${snapshot.totalWeight}로 줄었지만, 모든 정점을 연결하지 못하므로 이 상태를 MST로 확정할 수 없습니다.`
  }
  if (snapshot.action === 'restore' && status('BE') === 'kept' && snapshot.components.length === 1
    && previous?.action === 'try-remove' && previous.edgeId === snapshot.edgeId && isolatedE(previous)) {
    return `BE를 복구하면 고립되었던 E가 다시 연결되고 가중치 합이 ${previous.totalWeight}에서 ${snapshot.totalWeight}로 돌아옵니다. 비용이 늘어도 모든 정점을 연결하는 조건을 지켜야 합니다. 아직 다른 간선의 검사가 남아 있으므로, 이 값은 최종 MST 가중치가 아닙니다.`
  }
  return undefined
}
