// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('shows authoritative Definition, actual procedures and operation-based complexity', () => {
  render(<App />); const theory = within(screen.getByRole('region', { name: '이론과 비교' }))
  for (const name of ['Definition part — Kruskal', 'Definition part — Reverse-Delete']) {
    const table = theory.getByRole('table', { name })
    for (const term of ['Problem', 'Parameter', 'Inputs', 'Outputs']) expect(table.textContent).toContain(term)
  }
  expect(theory.getByText(/KRUSKAL\(input\):/)).toBeDefined()
  expect(theory.getByText(/REVERSE_DELETE\(input\):/)).toBeDefined()
  expect(theory.getByText(/BFS_COMPONENTS\(vertices, activeEdges\):/)).toBeDefined()
  expect(theory.getAllByText(/O\(Sₖ\(V\+E\)\)/).length).toBeGreaterThan(0)
  expect(theory.getByRole('heading', { name: '기본 연산' })).toBeDefined()
})
it('provides the complete comparison including termination and recording costs', () => {
  render(<App />); const summary = within(screen.getByRole('region', { name: '샘플 그래프의 최종 실행 결과' }))
  for (const name of ['검사 순서', '간선 처리', '종료 조건', '핵심 시간', '작업 공간', '전체 기록 공간']) expect(summary.getByRole('rowheader', { name })).toBeDefined()
  expect(summary.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
})
it('keeps both print results available with a hidden mobile panel and never changes Lab selection on print', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('max-width'), addEventListener() {}, removeEventListener() {} }))
  render(<App />); fireEvent.click(screen.getByRole('tab', { name: 'Reverse-Delete' }))
  const right = within(screen.getByRole('region', { name: 'Reverse-Delete' }))
  fireEvent.change(right.getByRole('combobox'), { target: { value: '5' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Kruskal' }))
  window.dispatchEvent(new Event('beforeprint'))
  const table = within(screen.getByRole('region', { name: '샘플 그래프의 최종 실행 결과' }))
  expect(table.getByRole('row', { name: '최종 MST AB, BC, BD, BE AB, BC, BD, BE' })).toBeDefined()
  expect(table.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
  fireEvent.click(screen.getByRole('tab', { name: 'Reverse-Delete' }))
  expect(right.getByRole<HTMLSelectElement>('combobox').value).toBe('5')
  expect(screen.getByRole('region', { name: '이론과 비교' }).querySelectorAll('pre').length).toBeGreaterThanOrEqual(4)
})
