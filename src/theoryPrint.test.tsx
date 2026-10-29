// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('shows authoritative Definition, actual procedures and operation-based complexity', () => {
  render(<App />); const theory = within(screen.getByRole('region', { name: '이론과 비교' }))
  for (const name of ['Definition part — Kruskal', 'Definition part — Reverse-Delete']) {
    const specification = theory.getByRole('region', { name })
    for (const term of ['Problem', 'Parameter', 'Inputs', 'Outputs']) expect(specification.textContent).toContain(term)
  }
  fireEvent.click(theory.getByRole('tab', { name: '알고리즘 의사코드' }))
  expect(theory.getByLabelText('Procedure part — Kruskal 의사코드').textContent).toContain('KRUSKAL(input):')
  expect(theory.getByLabelText('Procedure part — Reverse-Delete 의사코드').textContent).toContain('REVERSE_DELETE(input):')
  expect(theory.getByLabelText('Procedure part — 공통 검증과 BFS 의사코드').textContent).toContain('BFS_COMPONENTS(vertices, activeEdges):')
  fireEvent.click(theory.getByRole('tab', { name: '복잡도 분석' }))
  expect(theory.getByRole('tabpanel').textContent).toContain('Θ(Sₖ(n+m))')
  expect(theory.getByRole('heading', { name: '기본 연산' })).toBeDefined()
})
it('provides the complete comparison including termination and recording costs', () => {
  render(<App />); fireEvent.click(screen.getByRole('tab', { name: '최종 실행 결과 비교' })); const summary = within(screen.getByRole('region', { name: '샘플 그래프의 최종 실행 결과' }))
  for (const name of ['검사 순서', '이음선 처리', '종료 조건', '최악 시간복잡도', '작업 공간', '전체 기록 공간']) expect(summary.getByRole('rowheader', { name })).toBeDefined()
  expect(summary.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
})
it('keeps both print results available with a hidden mobile panel and never changes Lab selection on print', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('max-width'), addEventListener() {}, removeEventListener() {} }))
  render(<App />); fireEvent.click(screen.getByRole('tab', { name: 'Reverse-Delete' }))
  const right = within(screen.getByRole('region', { name: 'Reverse-Delete' }))
  fireEvent.change(right.getByRole('combobox'), { target: { value: '5' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Kruskal' }))
  fireEvent(window, new Event('beforeprint'))
  const table = within(screen.getByRole('region', { name: '샘플 그래프의 최종 실행 결과' }))
  expect(table.getByRole('row', { name: '최종 MST AB, BC, BD, BE AB, BC, BD, BE' })).toBeDefined()
  expect(table.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
  fireEvent.click(screen.getByRole('tab', { name: 'Reverse-Delete' }))
  expect(right.getByRole<HTMLSelectElement>('combobox').value).toBe('5')
  expect(screen.getByRole('region', { name: '이론과 비교' }).querySelectorAll('pre').length).toBeGreaterThanOrEqual(4)
  fireEvent(window, new Event('afterprint'))
})
