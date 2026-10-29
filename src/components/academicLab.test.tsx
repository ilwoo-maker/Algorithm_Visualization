// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { AlgorithmPanel } from './AlgorithmPanel'
import { AlgorithmConceptSection } from './AlgorithmConceptSection'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'

const runs = [kruskal(ASSIGNMENT_GRAPH), reverseDelete(ASSIGNMENT_GRAPH)].flatMap(result => result.ok ? [result.value] : [])
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('keeps terminal captions tied to the same read-only example snapshots', () => {
  const before = JSON.stringify(runs); render(<AlgorithmConceptSection runs={runs} />)
  for (const run of runs) {
    const name = run.algorithm === 'kruskal' ? 'Kruskal' : 'Reverse-Delete'
    const log = screen.getByRole('group', { name: `${name} 개념 로그` })
    const example = run.snapshots.find(step => run.algorithm === 'kruskal' ? step.action === 'accept' : step.action === 'try-remove' && step.components.length > 1)!
    expect(log.textContent).toContain(example.what); expect(log.textContent).toContain(example.why)
    expect(log.textContent).toContain(`현재 활성 합 ${example.totalWeight}`)
  }
  expect(screen.queryByRole('button')).toBeNull(); expect(JSON.stringify(runs)).toBe(before)
})
it('keeps inspector reasons and all three HUD values correct through temporary removal, restore and final', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
  const run = runs[1]; render(<AlgorithmPanel run={run} />)
  for (const index of [5, 6, 14]) {
    fireEvent.change(screen.getByRole('combobox', { name: '단계 선택' }), { target: { value: String(index) } })
    const step = run.snapshots[index], inspector = within(screen.getByRole('group', { name: '단계별 동작과 판단 근거' }))
    expect(inspector.getByText(step.what)).toBeDefined()
    expect(inspector.getByRole('list').textContent).toBe(step.why)
    expect(screen.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe(String(step.totalWeight))
    expect(screen.getByLabelText('현재 활성 간선 수').textContent).toBe(String(step.activeEdgeIds.length))
    expect(screen.getByLabelText('연결 요소 수').textContent).toBe(String(step.components.length))
  }
  expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(true)
})
