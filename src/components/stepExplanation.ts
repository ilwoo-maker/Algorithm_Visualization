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
      ? '아직 선택한 간선이 없어 연결 요소는 5개입니다. 가중치가 가장 작은 BC와 BD 중 이름순으로 BC부터 검사합니다.'
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

/** Presentation copy for the verified assignment snapshots; never changes the run. */
export function kruskalStepCopy(run: MstRun, snapshot: Snapshot): { what: string; why: string } | undefined {
  if (run.algorithm !== 'kruskal' || !stepExplanation(run, snapshot)) return undefined
  const copy = [
    { what: '선택한 간선 없이 시작한다. 각 정점은 따로 떨어져 있어 연결 요소는 5개이다.', why: '사이클 없이 모든 정점을 연결해야 한다. 가중치가 작은 간선부터 검사하고, 서로 다른 연결 요소를 잇는 간선만 선택한다. BC와 BD의 가중치는 모두 1이므로 이름순으로 BC부터 검사한다.' },
    { what: 'BC(가중치 1)를 선택한다.', why: 'B와 C는 아직 연결되어 있지 않다. BC를 추가해도 사이클이 생기지 않으므로 선택한다. B와 C가 하나의 연결 요소가 되고, 가중치 합은 1이 된다.' },
    { what: 'BD(가중치 1)를 선택한다.', why: 'B는 C와 연결되어 있지만 D는 따로 남아 있다. BD를 추가하면 D를 기존 B·C 집합에 연결할 수 있고, 사이클도 생기지 않는다. 가중치 합은 2가 된다.' },
    { what: 'AB(가중치 2)를 선택한다.', why: 'A는 아직 B·C·D와 연결되어 있지 않다. AB를 선택하면 네 정점이 하나로 연결되고, 가중치 합은 4가 된다. E가 따로 남아 있으므로 검사를 계속한다.' },
    { what: 'AC(가중치 3)는 선택하지 않는다.', why: '이미 AB와 BC를 선택했으므로 A에서 C까지 A–B–C 경로가 있다. AC까지 추가하면 A–B–C–A 사이클이 생긴다. BE보다 가중치가 작더라도 선택할 수 없으며, 가중치 합은 4로 유지된다.' },
    { what: 'BE(가중치 4)를 선택한다. 가중치 합은 8이 된다.', why: 'E만 따로 남아 있으므로 BE를 추가해도 사이클이 생기지 않는다. 이 간선을 선택하면 모든 정점이 연결되고, 선택한 간선 수도 n−1=4개가 된다. 따라서 MST가 완성되어 종료한다.' },
  ]
  return copy[snapshot.index]
}

/** Read-only captions for the assignment's existing Reverse-Delete snapshots. */
export function reverseDeleteStepCopy(run: MstRun, snapshot: Snapshot): { what: string; why: string } | undefined {
  if (run.algorithm !== 'reverse-delete' || !stepExplanation(run, snapshot)) return undefined
  const copy = [
    { what: '간선 7개가 모두 있는 상태에서 시작한다. 가중치 합은 23이다.', why: '모든 정점이 연결되어 있지만 사이클도 남아 있다. 가중치가 큰 간선부터 제거를 시도하고, 제거한 뒤에도 연결이 유지되는지 BFS로 확인한다.' },
    { what: 'DE(가중치 7)를 임시로 제거한다. 가중치 합은 16이 된다.', why: 'DE를 빼도 D–B–E 경로가 남아 있다. BFS 결과에서도 모든 정점이 하나로 연결되어 있으므로, 다음 단계에서 삭제를 확정할 수 있다.' },
    { what: 'DE의 삭제를 확정한다.', why: '직전 검사에서 DE 없이도 연결이 유지되는 것을 확인했다. 임시 제거한 상태를 그대로 유지하므로 가중치 합은 16이다.' },
    { what: 'CD(가중치 5)를 임시로 제거한다. 가중치 합은 11이 된다.', why: 'C와 D 사이에는 C–B–D 경로가 남아 있다. CD를 제거해도 모든 정점이 연결되어 있으므로 삭제할 수 있다.' },
    { what: 'CD의 삭제를 확정한다.', why: 'CD 없이도 모든 정점이 연결된다. 따라서 CD를 다시 넣을 필요가 없으며, 가중치 합은 11로 유지된다.' },
    { what: 'BE(가중치 4)를 임시로 제거한다. 가중치 합은 7이 된다.', why: '앞서 DE를 삭제했으므로 BE까지 제거하면 E에 연결된 간선이 없어진다. 연결 요소는 A·B·C·D와 E로 나뉜다. 비용은 줄었지만 모든 정점을 연결하지 못하므로 이 상태는 답이 될 수 없다.' },
    { what: 'BE를 복구한다. 가중치 합은 7에서 11로 돌아온다.', why: 'E를 나머지 정점과 연결하려면 BE가 필요하다. 가중치 합이 늘더라도 연결 조건을 지켜야 하므로 복구한다. 아직 검사하지 않은 간선이 있어 11은 최종 MST 가중치가 아니다.' },
    { what: 'AC(가중치 3)를 임시로 제거한다. 가중치 합은 8이 된다.', why: 'AC를 빼도 A–B–C 경로가 남는다. BFS 결과에서도 연결 요소가 하나이므로 모든 정점의 연결이 유지된다.' },
    { what: 'AC의 삭제를 확정한다.', why: 'AC 없이도 모든 정점이 연결되므로 삭제 상태를 유지한다. 남은 간선은 AB·BC·BD·BE이고, 가중치 합은 8이다. 현재 구현은 남은 간선도 계속 검사한다.' },
    { what: 'AB(가중치 2)를 임시로 제거한다. 가중치 합은 6이 된다.', why: 'AC는 이미 삭제되어 있다. AB까지 제거하면 A가 고립되어 연결 요소가 2개로 나뉜다. 따라서 AB는 삭제할 수 없다.' },
    { what: 'AB를 복구한다. 가중치 합은 8로 돌아온다.', why: '고립된 A를 다시 연결하기 위해 AB를 유지한다. 모든 정점이 다시 하나의 연결 요소가 된다.' },
    { what: 'BC(가중치 1)를 임시로 제거한다.', why: 'C에 연결되었던 AC와 CD는 이미 삭제된 상태이다. BC까지 제거하면 C가 고립된다. 가중치 합은 7로 줄지만 연결 조건을 만족하지 못한다.' },
    { what: 'BC를 복구한다. 가중치 합은 8로 돌아온다.', why: 'C를 다른 정점과 연결하려면 BC가 필요하다. 연결을 유지한 상태에서 마지막 간선인 BD를 검사한다.' },
    { what: 'BD(가중치 1)를 임시로 제거한다.', why: 'D에 연결되었던 CD와 DE는 이미 삭제되어 있다. BD까지 제거하면 D가 고립되므로 삭제할 수 없다. 이때 가중치 합 7은 비연결 상태의 값이다.' },
    { what: 'BD를 복구한다. 가중치 합은 8로 돌아온다.', why: 'D를 다시 연결하고 모든 간선의 검사를 마쳤다. 남은 AB·BC·BD·BE는 모든 정점을 사이클 없이 연결하므로 최종 MST가 된다.' },
  ]
  return copy[snapshot.index]
}

export function snapshotStepCopy(run: MstRun, snapshot: Snapshot) {
  return kruskalStepCopy(run, snapshot) ?? reverseDeleteStepCopy(run, snapshot)
}
