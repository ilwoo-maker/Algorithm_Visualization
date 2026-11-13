// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import { AlgorithmPanel } from './AlgorithmPanel'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function run(algorithm: typeof kruskal, graph = ASSIGNMENT_GRAPH) {
  const result = algorithm(graph)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
function reduced() {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
}
function jump(scope: ReturnType<typeof within>, index: number) {
  fireEvent.change(scope.getByRole('combobox'), { target: { value: String(index) } })
}
it('marks only the completed panel and resets the achievement on back/restart', () => {
  reduced(); const left = run(kruskal), right = run(reverseDelete), before = JSON.stringify([left, right])
  render(<><AlgorithmPanel run={left} /><AlgorithmPanel run={right} /></>)
  const panel = screen.getByRole('region', { name: 'Kruskal' }), scope = within(panel)
  expect(scope.queryByLabelText('완료 성취')).toBeNull()
  jump(scope, 4); expect(scope.queryByLabelText('완료 성취')).toBeNull()
  jump(scope, 5)
  expect(panel.classList.contains('is-completed')).toBe(true)
  expect(scope.getByLabelText('완료 성취').textContent).toContain('조기 종료 · 5회 검사로 MST 완성')
  expect(scope.getByLabelText('완료 결과 요약').textContent).toContain('최소 비용 8')
  expect(scope.getByLabelText('완료 결과 요약').textContent).toContain('4개')
  expect(within(screen.getByRole('region', { name: 'Reverse-Delete' })).queryByLabelText('완료 성취')).toBeNull()
  const ornament = panel.querySelector('.completion-border')!
  expect(ornament.getAttribute('aria-hidden')).toBe('true')
  fireEvent.click(scope.getByRole('button', { name: '이전' }))
  expect(panel.classList.contains('is-completed')).toBe(false)
  expect(panel.querySelector('.completion-border')).toBeNull()
  jump(scope, 5); expect(panel.querySelector('.completion-border')).not.toBe(ornament)
  fireEvent.click(scope.getByRole('button', { name: '다시 시작' }))
  expect(scope.queryByLabelText('완료 성취')).toBeNull()
  expect(JSON.stringify([left, right])).toBe(before)
})
it('shows all seven inspections for Reverse-Delete rather than fourteen snapshots', () => {
  reduced(); render(<AlgorithmPanel run={run(reverseDelete)} />)
  const scope = within(screen.getByRole('region', { name: 'Reverse-Delete' }))
  jump(scope, 13); expect(scope.queryByLabelText('완료 성취')).toBeNull()
  jump(scope, 14)
  expect(scope.getByLabelText('완료 성취').textContent).toContain('탐색 완료 · 전체 7개 이음선 검사')
  expect(scope.getByLabelText('완료 결과 요약').textContent).toContain('제거하면 연결이 끊어져 복구했다')
})
it('does not claim early termination when Kruskal inspects every edge', () => {
  reduced()
  const graph = { vertices: ['A', 'B', 'C'], edges: [{ source: 'A', target: 'B', weight: 2 }, { source: 'B', target: 'C', weight: 3 }] }
  const result = run(kruskal, graph)
  render(<AlgorithmPanel run={result} />)
  const scope = within(screen.getByRole('region', { name: 'Kruskal' }))
  jump(scope, result.snapshots.length - 1)
  expect(scope.getByLabelText('완료 성취').textContent).toContain('2회 검사')
  expect(scope.getByLabelText('완료 성취').textContent).not.toContain('조기 종료')
  expect(scope.getByLabelText('완료 결과 요약').textContent).toContain('최소 비용 5')
})
it('waits for the final snapshot commit rather than highlighting the requested target', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  const view = render(<AlgorithmPanel run={run(kruskal)} />)
  const panel = screen.getByRole('region', { name: 'Kruskal' }), scope = within(panel)
  jump(scope, 4)
  fireEvent.click(scope.getByRole('button', { name: '다음' }))
  expect(scope.queryByLabelText('완료 성취')).toBeNull()
  const effect = [...panel.querySelectorAll('.edge-effect')].flatMap(edge => gsap.getTweensOf(edge))[0]
  expect(effect).toBeDefined()
  const timeline = effect.parent as gsap.core.Timeline
  act(() => { timeline.time(timeline.labels.commit + .01) })
  expect(scope.getByLabelText('완료 성취').textContent).toContain('조기 종료')
  fireEvent.click(scope.getByRole('button', { name: '이전' }))
  expect(scope.queryByLabelText('완료 성취')).toBeNull()
  expect(timeline.parent).toBeNull()
  view.unmount()
  expect(panel.isConnected).toBe(false)
})
it('groups the final result and termination reason without a repeated complexity explanation', () => {
  reduced(); render(<AlgorithmPanel run={run(kruskal)} />)
  const scope = within(screen.getByRole('region', { name: 'Kruskal' }))
  jump(scope, 5)
  const summary = scope.getByLabelText('완료 결과 요약')
  expect(summary.contains(scope.getByRole('note', { name: '종료 조건 안내' }))).toBe(true)
  expect(summary.contains(scope.getByText('최종 MST 완성'))).toBe(true)
  expect(summary.textContent).toContain('CD, DE는 검사하지 않았으며')
  expect(summary.textContent).not.toContain('W(m, n)')
})
