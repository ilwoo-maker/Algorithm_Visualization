// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { ASSIGNMENT_GRAPH } from './algorithms/fixtures'
import { kruskal } from './algorithms/kruskal'
import { reverseDelete } from './algorithms/reverseDelete'
import type { EdgeStatus } from './algorithms/types'

afterEach(cleanup)

const statusNames: Record<EdgeStatus, string> = {
  pending: '미검사', selected: '선택', rejected: '사이클 기각',
  present: '남아 있음', 'temporarily-removed': '임시 제거',
  removed: '삭제 확정', kept: '복구·유지',
}

describe('independent snapshot playback', () => {
  it('starts both panels at initialization with all vertices and weighted edges', () => {
    render(<App />)
    for (const [name, count, weight] of [['Kruskal', 6, 0], ['Reverse-Delete', 15, 23]] as const) {
      const panel = within(screen.getByRole('region', { name }))
      expect(panel.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' }).value).toBe('0')
      expect(panel.getAllByRole('option')).toHaveLength(count)
      expect(panel.getByRole<HTMLButtonElement>('button', { name: '이전' }).disabled).toBe(true)
      expect(panel.getByRole<HTMLButtonElement>('button', { name: '처음으로' }).disabled).toBe(true)
      expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe(String(weight))
      const graph = within(panel.getByRole('img', { name: `${name} 그래프` }))
      for (const vertex of ['A', 'B', 'C', 'D', 'E']) expect(graph.getByText(vertex)).toBeDefined()
      expect(graph.getAllByRole('group', { name: /^간선 / })).toHaveLength(7)
    }
  })

  it('moves each panel independently, enforces boundaries and resets only its own panel', async () => {
    const user = userEvent.setup()
    render(<App />)
    const k = within(screen.getByRole('region', { name: 'Kruskal' }))
    const r = within(screen.getByRole('region', { name: 'Reverse-Delete' }))
    const kSelect = k.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' })
    const rSelect = r.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' })
    await user.click(k.getByRole('button', { name: '다음' }))
    expect(kSelect.value).toBe('1')
    expect(rSelect.value).toBe('0')
    await user.click(k.getByRole('button', { name: '이전' }))
    expect(kSelect.value).toBe('0')
    await user.selectOptions(rSelect, '5')
    await user.selectOptions(kSelect, '5')
    expect(k.getByRole<HTMLButtonElement>('button', { name: '다음' }).disabled).toBe(true)
    await user.click(k.getByRole('button', { name: '처음으로' }))
    expect(kSelect.value).toBe('0')
    expect(rSelect.value).toBe('5')
    await user.selectOptions(rSelect, '14')
    expect(r.getByRole<HTMLButtonElement>('button', { name: '다음' }).disabled).toBe(true)
    await user.click(r.getByRole('button', { name: '처음으로' }))
    expect(rSelect.value).toBe('0')
  })

  it.each([
    ['Kruskal', kruskal], ['Reverse-Delete', reverseDelete],
  ] as const)('renders every %s snapshot faithfully without recomputing algorithm state', async (name, algorithm) => {
    const user = userEvent.setup()
    const result = algorithm(ASSIGNMENT_GRAPH)
    if (!result.ok) throw new Error(result.error.message)
    render(<App />)
    const panel = within(screen.getByRole('region', { name }))
    const select = panel.getByRole('combobox', { name: '단계 선택' })
    for (const step of result.value.snapshots) {
      await user.selectOptions(select, String(step.index))
      expect(panel.getByText(step.what)).toBeDefined()
      expect(panel.getByText(step.why)).toBeDefined()
      expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe(String(step.totalWeight))
      expect(panel.getByLabelText('현재 활성 간선 수').textContent).toBe(String(step.activeEdgeIds.length))
      const groups = within(panel.getByRole('list', { name: '연결 요소' })).getAllByRole('listitem')
      expect(groups.map((group) => group.textContent)).toEqual(step.components.map((group) => group.join(', ')))
      const graph = within(panel.getByRole('img', { name: `${name} 그래프` }))
      for (const edge of step.edges) {
        const edgeView = graph.getByRole('group', {
          name: `간선 ${edge.name}, 가중치 ${edge.weight}, ${statusNames[edge.status]}`,
        })
        expect(edgeView.getAttribute('aria-current')).toBe(edge.id === step.edgeId ? 'true' : null)
        const row = panel.getByRole('row', { name: new RegExp(`^${edge.name} ${edge.weight} ${statusNames[edge.status]}`) })
        expect(row).toBeDefined()
      }
      expect(panel.queryByText('최종 MST 완성') !== null).toBe(step.index === result.value.snapshots.length - 1)
      expect(panel.queryByRole('note', { name: '임시 단절 안내' }) !== null)
        .toBe(name === 'Reverse-Delete' && step.components.length > 1)
    }
  })

  it('labels temporary disconnection as an intermediate weight and restores BE', async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = within(screen.getByRole('region', { name: 'Reverse-Delete' }))
    await user.selectOptions(panel.getByRole('combobox', { name: '단계 선택' }), '5')
    expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('7')
    expect(panel.getByRole('note', { name: '임시 단절 안내' }).textContent).toContain('최종 MST')
    expect(panel.queryByText('최종 MST 완성')).toBeNull()
    await user.click(panel.getByRole('button', { name: '다음' }))
    expect(panel.queryByRole('note', { name: '임시 단절 안내' })).toBeNull()
    expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('11')
    expect(panel.getByRole('row', { name: /^BE 4 복구·유지/ })).toBeDefined()
  })

  it('supports keyboard button navigation and preserves unexamined edges at the Kruskal finish', async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = within(screen.getByRole('region', { name: 'Kruskal' }))
    await user.tab()
    expect(document.activeElement?.tagName).toBe('A')
    await user.tab()
    expect(document.activeElement).toBe(panel.getByRole('button', { name: '다음' }))
    await user.keyboard('{Enter}')
    const select = panel.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' })
    expect(select.value).toBe('1')
    select.focus()
    await user.selectOptions(select, '5')
    expect(document.activeElement).toBe(select)
    expect(panel.getByText('최종 MST 완성')).toBeDefined()
    expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('8')
    for (const name of ['CD', 'DE']) expect(panel.getByRole('row', { name: new RegExp(`^${name} [57] 미검사`) })).toBeDefined()
  })
})
