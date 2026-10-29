// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { TheoryComparisonSection } from './TheoryComparisonSection'
import { theoryContent, theoryGroups } from './theoryDocument'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import App from '../App'

const results = [kruskal(ASSIGNMENT_GRAPH), reverseDelete(ASSIGNMENT_GRAPH)].flatMap(result => result.ok ? [result.value] : [])
afterEach(cleanup)
it('partitions the authoritative document without dropping or rewriting any source content', () => {
  expect(theoryGroups.map(group => group.raw).join('')).toBe(theoryContent)
  expect(theoryGroups.filter(group => group.title.startsWith('Definition part'))).toHaveLength(3)
  expect(theoryGroups.filter(group => group.title.startsWith('Procedure part'))).toHaveLength(4)
})
it('provides four labelled tabs with one visible panel and complete definition contracts', () => {
  render(<TheoryComparisonSection results={results} />)
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map(tab => tab.textContent)).toEqual(['문제 정의 및 스펙', '알고리즘 의사코드', '복잡도 분석', '최종 실행 결과 비교'])
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  for (const tab of tabs) expect(document.getElementById(tab.getAttribute('aria-controls')!)).not.toBeNull()
  const panel = screen.getByRole('tabpanel')
  for (const title of ['Definition part — Kruskal', 'Definition part — Reverse-Delete']) {
    const card = within(panel).getByRole('region', { name: title })
    expect(card.textContent).toContain('Problem'); expect(card.textContent).toContain('Parameter'); expect(card.textContent).toContain('Inputs'); expect(card.textContent).toContain('Outputs')
  }
})
it('supports arrow/Home/End keyboard navigation with roving focus and restores panel focus targets', () => {
  render(<TheoryComparisonSection results={results} />)
  const tabs = screen.getAllByRole('tab'); tabs[0].focus()
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight' }); expect(document.activeElement).toBe(tabs[1]); expect(tabs[1].getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(tabs[1].id)
  fireEvent.keyDown(tabs[1], { key: 'End' }); expect(document.activeElement).toBe(tabs[3])
  fireEvent.keyDown(tabs[3], { key: 'ArrowRight' }); expect(document.activeElement).toBe(tabs[0])
  fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' }); expect(document.activeElement).toBe(tabs[3])
  fireEvent.keyDown(tabs[3], { key: 'Home' }); expect(document.activeElement).toBe(tabs[0])
  expect(tabs.filter(tab => tab.tabIndex === 0)).toHaveLength(1)
})
it('keeps pseudocode text intact while showing decorative line numbers and syntax tokens', () => {
  render(<TheoryComparisonSection results={results} />); fireEvent.click(screen.getByRole('tab', { name: '알고리즘 의사코드' }))
  const panel = screen.getByRole('tabpanel')
  for (const title of ['Procedure part — Kruskal', 'Procedure part — Reverse-Delete']) {
    const group = theoryGroups.find(group => group.title === title)!
    const expected = /```[^\n]*\n([\s\S]*?)```/.exec(group.body)![1].trimEnd().replace(/\r\n/g, '\n')
    const editor = within(panel).getByLabelText(`${title} 의사코드`)
    expect([...editor.querySelectorAll('.code-text')].map(line => line.textContent).join('\n')).toBe(expected)
    expect(editor.querySelector('.code-keyword')).not.toBeNull()
    expect(editor.querySelector('.code-line-number')!.getAttribute('aria-hidden')).toBe('true')
  }
})
it('uses lecture notation while distinguishing the lecture model, implementation space and recording costs', () => {
  render(<TheoryComparisonSection results={results} />); fireEvent.click(screen.getByRole('tab', { name: '복잡도 분석' }))
  const panel = screen.getByRole('tabpanel')
  expect(panel.textContent).toContain('서로소인 집합 자료구조'); expect(panel.textContent).toContain('현재 구현 전체의 추가 공간: Θ(n+m)')
  expect(panel.textContent).toContain('Kruskal이 시간 효율 면에서 유리하다')
  expect(panel.textContent).toContain('Θ(Sₖ(n+m))'); expect(panel.textContent).toContain('몇 배 빠르다')
  for (const formula of ['W(m, n) = Θ(m lg m)', 'W(m, n) = Θ(m n + m²)', 'Θ(n² lg n)', 'Θ(n⁴)', 'm ≥ n − 1']) expect(panel.textContent).toContain(formula)
  expect(panel.textContent).toContain('단위연산: 비교문'); expect(panel.textContent).toContain('교안 분석 모형')
  expect(panel.textContent).toContain('실제 최적화 구현')
  const theory = screen.getByRole('region', { name: '이론과 비교' })
  const text = theory.textContent ?? ''
  expect([...text.matchAll(/\bO\s*\(|Union-Find|(?<![A-Za-z])[VE](?![A-Za-z])/g)].map(match => text.slice(Math.max(0, match.index - 20), match.index + 20))).toEqual([])
  expect(within(panel).getAllByRole('math')).toHaveLength(4)
  for (const block of within(panel).getAllByRole('math')) expect(block.querySelector('.code-line-number')).toBeNull()
})
it('reads sample outputs and the final evaluation from supplied results instead of hardcoding weight 8', () => {
  const changed = [{ ...results[0], totalWeight: 99, mst: results[0].mst.slice(0, 1) }]
  render(<TheoryComparisonSection results={changed} />)
  expect(screen.getByLabelText('최종 MST 가중치').textContent).toContain('99')
  fireEvent.click(screen.getByRole('tab', { name: '최종 실행 결과 비교' }))
  expect(screen.getByRole('row', { name: '최종 가중치 99' })).toBeDefined()
  expect(screen.queryByText('상반된 두 접근, 같은 MST')).toBeNull()
})
it('prints all panels and details, then restores the selected tab and prior disclosure state', () => {
  render(<TheoryComparisonSection results={results} />)
  const details = [...document.querySelectorAll('details')]; details[0].open = true
  fireEvent.click(screen.getByRole('tab', { name: '알고리즘 의사코드' }))
  fireEvent(window, new Event('beforeprint')); expect(screen.getAllByRole('tabpanel')).toHaveLength(4)
  expect(details.every(detail => detail.open)).toBe(true)
  expect(screen.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
  fireEvent(window, new Event('afterprint')); expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  expect(screen.getByRole('tab', { selected: true }).textContent).toBe('알고리즘 의사코드')
  expect(details[0].open).toBe(true); expect(details.slice(1).every(detail => !detail.open)).toBe(true)
})
it('switching Theory tabs never changes either Lab snapshot', () => {
  render(<App />); const lab = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(lab.getByRole('combobox'), { target: { value: '3' } })
  for (const name of ['알고리즘 의사코드', '복잡도 분석', '최종 실행 결과 비교']) fireEvent.click(screen.getByRole('tab', { name }))
  expect(lab.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  expect(lab.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('4')
})
