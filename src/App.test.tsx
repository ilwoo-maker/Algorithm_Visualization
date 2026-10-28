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

  it('explains Kruskal termination only at the final snapshot and removes the note when going back', async () => {
    const user = userEvent.setup()
    render(<App />)
    const panel = within(screen.getByRole('region', { name: 'Kruskal' }))
    const select = panel.getByRole('combobox', { name: '단계 선택' })
    for (let step = 0; step < 5; step++) {
      await user.selectOptions(select, String(step))
      expect(panel.queryByRole('note', { name: '종료 조건 안내' })).toBeNull()
    }
    await user.selectOptions(select, '5')
    const note = panel.getByRole('note', { name: '종료 조건 안내' }).textContent
    expect(note).toContain('정점 5개')
    expect(note).toContain('간선 4개')
    expect(note).toContain('CD, DE')
    expect(note).toContain('검사하지 않습니다')
    for (const name of ['CD', 'DE']) expect(panel.getByRole('row', { name: new RegExp(`^${name} [57] 미검사`) })).toBeDefined()
    await user.click(panel.getByRole('button', { name: '이전' }))
    expect(panel.queryByRole('note', { name: '종료 조건 안내' })).toBeNull()
    expect(within(screen.getByRole('region', { name: 'Reverse-Delete' })).queryByRole('note', { name: '종료 조건 안내' })).toBeNull()
  })

  it('keeps the sample final-result comparison independent of either current panel step', async () => {
    const user = userEvent.setup()
    render(<App />)
    const summary = within(screen.getByRole('region', { name: '샘플 그래프의 최종 실행 결과' }))
    const verifySummary = () => {
      const table = within(summary.getByRole('table'))
      expect(table.getByRole('row', { name: '최종 MST AB, BC, BD, BE AB, BC, BD, BE' })).toBeDefined()
      expect(table.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
      expect(table.getByRole('row', { name: '접근 방식 작은 가중치부터 선택 큰 가중치부터 삭제 시도' })).toBeDefined()
      expect(table.getByRole('row', { name: '핵심 판단 사이클 발생 여부 연결성 유지 여부' })).toBeDefined()
      expect(summary.getByText(/간선 집합이 달라질 수/)).toBeDefined()
    }
    verifySummary()
    const k = within(screen.getByRole('region', { name: 'Kruskal' }))
    const r = within(screen.getByRole('region', { name: 'Reverse-Delete' }))
    await user.selectOptions(k.getByRole('combobox', { name: '단계 선택' }), '5')
    expect(r.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' }).value).toBe('0')
    verifySummary()
    await user.selectOptions(r.getByRole('combobox', { name: '단계 선택' }), '5')
    expect(r.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('7')
    verifySummary()
    await user.click(k.getByRole('button', { name: '처음으로' }))
    expect(r.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' }).value).toBe('5')
    verifySummary()
  })

  it('places step controls before the SVG and explanations after it in reading order', () => {
    render(<App />)
    for (const name of ['Kruskal', 'Reverse-Delete']) {
      const panel = within(screen.getByRole('region', { name }))
      const graph = panel.getByRole('img', { name: `${name} 그래프` })
      const next = panel.getByRole('button', { name: '다음' })
      const select = panel.getByRole('combobox', { name: '단계 선택' })
      expect(next.compareDocumentPosition(graph) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(select.compareDocumentPosition(graph) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(graph.compareDocumentPosition(panel.getByRole('heading', { name: '무엇을 했나요?' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })

  it('distinguishes all seven SVG edge states with the expected strokes and dash patterns', async () => {
    const user = userEvent.setup()
    render(<App />)
    const cases = [
      ['Kruskal', '0', 'BE', '미검사', '#758398', '7 5', '2'],
      ['Kruskal', '4', 'AB', '선택', '#087f70', null, '4'],
      ['Kruskal', '4', 'AC', '사이클 기각', '#b04460', '7 4', '2.5'],
      ['Reverse-Delete', '0', 'BE', '남아 있음', '#65758b', null, '2.5'],
      ['Reverse-Delete', '5', 'BE', '임시 제거', '#a35b06', '10 4 2 4', '3'],
      ['Reverse-Delete', '5', 'DE', '삭제 확정', '#8390a1', '2 6', '2'],
      ['Reverse-Delete', '6', 'BE', '복구·유지', '#315bb5', null, '4'],
    ] as const
    for (const [algorithm, step, edge, status, color, dash, width] of cases) {
      const panel = within(screen.getByRole('region', { name: algorithm }))
      await user.selectOptions(panel.getByRole('combobox', { name: '단계 선택' }), step)
      const group = within(panel.getByRole('img', { name: `${algorithm} 그래프` }))
        .getByRole('group', { name: new RegExp(`^간선 ${edge}, 가중치 \\d, ${status}$`) })
      // The halo is a separate line; inspect the semantic edge's explicit stroke.
      const line = group.querySelector('line[stroke]')
      expect(line?.getAttribute('stroke')).toBe(color)
      expect(line?.getAttribute('stroke-dasharray')).toBe(dash)
      expect(line?.getAttribute('stroke-width')).toBe(width)
    }
  })
})
