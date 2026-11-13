// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { AlgorithmPanel } from './AlgorithmPanel'
import { AlgorithmConceptSection } from './AlgorithmConceptSection'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import { stepExplanation } from './stepExplanation'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function setup(algorithm: 'kruskal' | 'reverse-delete', changed = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  const input = changed ? { ...ASSIGNMENT_GRAPH, edges: ASSIGNMENT_GRAPH.edges.map(edge => ({ ...edge, weight: edge.weight + 1 })) } : ASSIGNMENT_GRAPH
  const result = (algorithm === 'kruskal' ? kruskal : reverseDelete)(input)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
function jump(index: number) {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: String(index) } })
}
it('explains the existing A–B–C path at AC rejection without changing snapshots', () => {
  const run = setup('kruskal'), before = JSON.stringify(run)
  render(<AlgorithmPanel run={run} />); jump(4)
  const inspector = within(screen.getByRole('group', { name: '단계별 동작과 판단 근거' }))
  expect(inspector.getByText(/A–B–C–A/).textContent).toContain('BE보다 가중치가 작더라도')
  expect(inspector.getByText(/A–B–C–A/).textContent).toContain('AB와 BC')
  expect(screen.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('4')
  jump(3); expect(screen.queryByText(/A–B–C–A/)).toBeNull()
  expect(JSON.stringify(run)).toBe(before)
})
it('distinguishes the disconnected BE attempt from its connected restoration', () => {
  const run = setup('reverse-delete'), before = JSON.stringify(run)
  render(<AlgorithmPanel run={run} />); jump(5)
  expect(screen.getByText(/BE\(가중치 4\)를 임시로/).textContent).toContain('7')
  expect(screen.getByText(/앞서 DE를 삭제했으므로/).textContent).toContain('연결 요소는 A·B·C·D와 E')
  expect(screen.getByLabelText('연결 요소 수').textContent).toBe('2')
  jump(6)
  expect(screen.getByText(/가중치 합은 7에서 11/)).toBeDefined()
  expect(screen.getByText(/11은 최종 MST 가중치가 아니다/)).toBeDefined()
  expect(screen.getByLabelText('연결 요소 수').textContent).toBe('1')
  jump(14); expect(screen.queryByText(/가중치 합은 7에서 11/)).toBeNull()
  expect(JSON.stringify(run)).toBe(before)
})
it('uses the same BE explanation in the concept example', () => {
  const run = setup('reverse-delete')
  render(<AlgorithmConceptSection runs={[run]} />)
  const log = within(screen.getByRole('group', { name: 'Reverse-Delete 개념 로그' }))
  expect(log.getByText(/DE를 삭제한 상태/)).toBeDefined()
})
it('does not apply assignment-specific explanations to a different weighted graph', () => {
  const run = setup('reverse-delete', true)
  render(<AlgorithmPanel run={run} />); jump(5)
  expect(screen.getByText(run.snapshots[5].why)).toBeDefined()
  expect(screen.queryByText(/DE를 삭제한 상태/)).toBeNull()
})
it.each([
  ['kruskal', 1, 'BC와 BD'], ['kruskal', 2, 'B·C·D'], ['kruskal', 3, 'A도'],
  ['reverse-delete', 2, 'D–B–E'], ['reverse-delete', 4, 'C–B–D'], ['reverse-delete', 8, 'A–B–C'],
  ['reverse-delete', 10, 'A가 고립'], ['reverse-delete', 12, 'C가 고립'], ['reverse-delete', 14, 'D가 고립'],
] as const)('grounds the %s step %i explanation in the recorded example', (algorithm, index, evidence) => {
  const run = setup(algorithm), before = JSON.stringify(run)
  expect(stepExplanation(run, run.snapshots[index])).toContain(evidence)
  expect(JSON.stringify(run)).toBe(before)
  const other = setup(algorithm, true)
  expect(stepExplanation(other, other.snapshots[index])).toBeUndefined()
})
it('provides read-only commentary for every assignment snapshot', () => {
  for (const algorithm of ['kruskal', 'reverse-delete'] as const) {
    const run = setup(algorithm), before = JSON.stringify(run)
    for (const snapshot of run.snapshots) expect(stepExplanation(run, snapshot)?.length).toBeGreaterThan(0)
    expect(JSON.stringify(run)).toBe(before)
  }
})
it('keeps the general reason and graph evidence in one WHY card', () => {
  const run = setup('kruskal')
  render(<AlgorithmPanel run={run} />); jump(4)
  const inspector = screen.getByRole('group', { name: '단계별 동작과 판단 근거' })
  const cards = inspector.querySelectorAll('.why-block')
  expect(cards).toHaveLength(1)
  expect(cards[0].textContent).toContain('가중치 합은 4로 유지된다')
  expect(cards[0].textContent).toContain('A–B–C–A')
})
