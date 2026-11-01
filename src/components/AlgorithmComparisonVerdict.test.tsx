// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { AlgorithmComparisonVerdict } from './AlgorithmComparisonVerdict'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'
import type { Graph } from '../algorithms/types'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const execute = (graph: Graph) => [kruskal(graph), reverseDelete(graph)].flatMap(result => result.ok ? [result.value] : [])
it('keeps six essential rows visible and restores the disclosure after printing', () => {
  render(<App />)
  const verdict = within(screen.getByRole('region', { name: '두 알고리즘 핵심 비교 및 효율성 평가' }))
  const table = verdict.getByRole('table', { name: '같은 문제를 해결하는 두 알고리즘의 실행 결과와 핵심 비용' })
  expect(within(table).getAllByRole('rowheader').map(cell => cell.textContent)).toEqual(['접근 방식', '최종 결과', '이번 입력의 검사 횟수', '최악 시간복잡도', '작업 공간', '단위연산 / 핵심 비용'])
  const detail = verdict.getByText('상세 비교').closest('details')!
  expect(detail.open).toBe(false)
  expect(within(table).queryByRole('rowheader', { name: '전체 기록 공간' })).toBeNull()
  fireEvent(window, new Event('beforeprint'))
  expect(detail.open).toBe(true)
  expect(verdict.getByRole('rowheader', { name: '전체 기록 공간' })).toBeDefined()
  fireEvent(window, new Event('afterprint')); expect(detail.open).toBe(false)
  fireEvent.click(verdict.getByText('상세 비교')); expect(detail.open).toBe(true)
  fireEvent(window, new Event('beforeprint')); fireEvent(window, new Event('beforeprint'))
  fireEvent(window, new Event('afterprint')); expect(detail.open).toBe(true)
})
it('shows the final comparison between Lab and Theory without opening any tab', () => {
  render(<App />)
  const lab = screen.getByRole('region', { name: 'Algorithm Lab' })
  const verdict = screen.getByRole('region', { name: '두 알고리즘 핵심 비교 및 효율성 평가' })
  const theory = screen.getByRole('region', { name: '이론과 비교' })
  expect(lab.compareDocumentPosition(verdict) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(verdict.compareDocumentPosition(theory) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const scope = within(verdict)
  expect(scope.getByRole('row', { name: /^최종 결과 가중치 8.*AB, BC, BD, BE.*가중치 8.*AB, BC, BD, BE/ })).toBeDefined()
  expect(scope.getByRole('row', { name: /이번 입력의 검사 횟수.*5회.*7회/ })).toBeDefined()
  expect(scope.getByRole('rowheader', { name: '작업 공간' })).toBeDefined()
  expect(scope.getByRole('heading', { name: '왜 Kruskal이 시간 효율 면에서 유리한가?' })).toBeDefined()
  expect(screen.queryByRole('tab', { name: '최종 실행 결과 비교' })).toBeNull()
})
it('uses supplied runs in algorithm order, including a different weight and inspection count', () => {
  const results = execute({ vertices: ['A', 'B', 'C'], edges: [{ source: 'A', target: 'B', weight: 3 }, { source: 'B', target: 'C', weight: 6 }] })
  const before = JSON.stringify(results)
  render(<AlgorithmComparisonVerdict results={[...results].reverse()} />)
  expect(screen.getByRole('row', { name: /^최종 결과 가중치 9.*AB, BC.*가중치 9.*AB, BC/ })).toBeDefined()
  expect(screen.getByRole('row', { name: /이번 입력의 검사 횟수.*2회.*2회/ })).toBeDefined()
  expect(screen.queryByText(/2회 검사 · 2개 선택 후 조기 종료/)).toBeNull()
  expect(screen.getByRole('region', { name: '두 알고리즘 핵심 비교 및 효율성 평가' }).textContent).toContain('정점 n = 3, 이음선 m = 2')
  expect(JSON.stringify(results)).toBe(before)
})
it('distinguishes equal optimal cost from equal trees and handles unavailable results', () => {
  const results = execute({ vertices: ['A', 'B', 'C'], edges: [{ source: 'A', target: 'B', weight: 1 }, { source: 'A', target: 'C', weight: 1 }, { source: 'B', target: 'C', weight: 1 }] })
  const view = render(<AlgorithmComparisonVerdict results={results} />)
  expect(screen.getByRole('row', { name: /^최종 결과 가중치 2.*AB, AC.*가중치 2.*AC, BC/ })).toBeDefined()
  expect(screen.queryByText(/이 입력에서는 최종 이음선 집합도 같습니다/)).toBeNull()
  view.rerender(<AlgorithmComparisonVerdict results={[]} />)
  expect(screen.queryByText(/두 알고리즘 모두 최소 비용/)).toBeNull()
  expect(screen.getByRole('row', { name: '최종 결과 미확인 미확인' })).toBeDefined()
})
it('focuses the detail anchor and respects reduced motion without changing a Lab snapshot', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  render(<App />)
  const anchor = document.getElementById('theory-section')!
  const scroll = vi.fn(); anchor.scrollIntoView = scroll
  fireEvent.click(screen.getByRole('link', { name: /상세 의사코드 및 복잡도 유도 보기/ }))
  expect(document.activeElement).toBe(anchor)
  expect(scroll).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
  expect(within(screen.getByRole('region', { name: 'Kruskal' })).getByRole<HTMLSelectElement>('combobox').value).toBe('0')
})
it('keeps the comparison unchanged during navigation and keeps it available for printing', () => {
  render(<App />)
  const verdict = screen.getByRole('region', { name: '두 알고리즘 핵심 비교 및 효율성 평가' })
  const original = verdict.textContent
  const lab = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(lab.getByRole('combobox'), { target: { value: '4' } })
  fireEvent.click(screen.getByRole('tab', { name: '복잡도 분석' }))
  expect(verdict.textContent).toBe(original)
  expect(within(screen.getByRole('region', { name: '이론과 비교' })).queryByRole('heading', { name: '효율성 비교 요약' })).toBeNull()
  fireEvent(window, new Event('beforeprint'))
  expect(screen.getAllByRole('tabpanel')).toHaveLength(3)
  expect(verdict.textContent).toBe(original)
  expect(lab.getByRole<HTMLSelectElement>('combobox').value).toBe('4')
  fireEvent(window, new Event('afterprint'))
  const link = within(verdict).getByRole('link', { name: /상세 의사코드 및 복잡도 유도 보기/ })
  expect(link.getAttribute('href')).toBe('#theory-section')
  expect(document.getElementById('theory-section')).not.toBeNull()
})
