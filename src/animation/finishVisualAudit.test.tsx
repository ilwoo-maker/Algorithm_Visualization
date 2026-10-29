// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from '../App'
import { AlgorithmPanel } from '../components/AlgorithmPanel'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'
import type { EdgeStatus } from '../algorithms/types'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function preference(reduced = false) { vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') && reduced, addEventListener() {}, removeEventListener() {} })) }
function panel(name = 'Kruskal') { return within(screen.getByRole('region', { name })) }
function click(name: string, scope = panel()) { fireEvent.click(scope.getByRole('button', { name })) }
function jump(index: number, scope = panel()) { fireEvent.change(scope.getByRole('combobox'), { target: { value: String(index) } }) }
function scene(scope = panel()) {
  const tween = [...scope.getByRole('img').querySelectorAll('.edge-effect')].flatMap(el => gsap.getTweensOf(el))[0]
  expect(tween).toBeDefined()
  return tween.parent as gsap.core.Timeline
}
function finishEntrance() {
  for (const svg of screen.getAllByRole('img')) {
    const tween = gsap.getTweensOf(svg.querySelector('.vertex')!)[0]
    if (tween) act(() => { (tween.parent as gsap.core.Timeline).progress(1) })
  }
}

it.each([['Kruskal', 4], ['Reverse-Delete', 13]] as const)('slides the %s banner up from 8px after Bloom and preserves pause/resume', (name, from) => {
  preference(); render(<App />); finishEntrance(); const scope = panel(name); jump(from, scope); click('재생', scope)
  const motion = scene(scope), card = scope.getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  act(() => { motion.time(motion.labels.announcement + 0.001) })
  expect(card.hidden).toBe(false)
  expect(Number(gsap.getProperty(card, 'y'))).toBeGreaterThan(7)
  expect(Number(gsap.getProperty(card, 'y'))).toBeLessThanOrEqual(8)
  act(() => { motion.time(motion.labels.announcement + 0.175) })
  expect(Number(gsap.getProperty(card, 'y'))).toBeGreaterThan(0)
  expect(Number(gsap.getProperty(card, 'y'))).toBeLessThan(8)
  expect(Number(card.style.opacity)).toBeGreaterThan(0); expect(Number(card.style.opacity)).toBeLessThan(1)
  expect(Number(gsap.getProperty(card, 'scaleX'))).toBe(1)
  expect(motion.labels.visualComplete - motion.labels.announcement).toBeCloseTo(0.35)
  click('일시정지', scope); const time = motion.time(), transform = card.style.transform
  click('계속 재생', scope); expect(scene(scope)).toBe(motion); expect(motion.time()).toBe(time); expect(card.style.transform).toBe(transform)
  act(() => { motion.time(motion.labels.reading + 0.01) })
  expect(card.style.cssText).toBe(''); expect(card.hidden).toBe(false)
})

it.each(['다시 시작', '이전', '직접 선택'])('clears an unfinished banner slide on %s', action => {
  preference(); render(<App />); finishEntrance(); jump(4); click('재생'); const motion = scene()
  act(() => { motion.time(motion.labels.announcement + 0.1) })
  const card = panel().getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  expect(Number(gsap.getProperty(card, 'y'))).toBeGreaterThan(0)
  if (action === '직접 선택') jump(2)
  else click(action)
  expect(motion.parent).toBeNull(); expect(card.hidden).toBe(true); expect(card.style.cssText).toBe('')
  jump(5); expect(card.hidden).toBe(false); expect(card.style.cssText).toBe(''); expect(gsap.getTweensOf(card)).toHaveLength(0)
})

it('shows a Reduced Motion final banner statically and never slides on intermediate steps', () => {
  preference(true); render(<App />); jump(4); const card = panel().getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  expect(card.hidden).toBe(true); click('다음')
  expect(card.hidden).toBe(false); expect(card.style.cssText).toBe(''); expect(gsap.getTweensOf(card)).toHaveLength(0)
})

it.each([['Kruskal', 5], ['Reverse-Delete', 14]] as const)('dims only final non-MST lines in %s while retaining states and readable weights', (name, last) => {
  preference(true); render(<App />); const scope = panel(name); jump(last, scope)
  const graph = scope.getByRole('img')
  for (const group of graph.querySelectorAll<SVGGElement>('g[data-edge-name]')) {
    const edge = group.getAttribute('data-edge-name')!
    const mst = ['AB', 'BC', 'BD', 'BE'].includes(edge)
    expect(group.querySelector('.graph-edge')!.getAttribute('opacity')).toBe(mst ? '1' : '0.35')
    expect(group.getAttribute('opacity')).toBeNull(); expect(group.style.opacity).toBe('')
    expect(group.querySelector('.weight-label')!.getAttribute('opacity')).toBeNull()
    expect((group.querySelector('.weight-label') as SVGGElement).style.opacity).toBe('')
    if (!mst) expect(group.querySelector('.graph-edge')!.getAttribute('stroke-dasharray')).not.toBeNull()
    expect(group.querySelector('.weight-text')!.textContent).toMatch(/^\d$/)
  }
  for (const edge of ['CD', 'DE']) expect(scope.getByRole('row', { name: new RegExp(`^${edge} [57] ${name === 'Kruskal' ? '미검사' : '삭제 확정'}`) })).toBeDefined()
  expect(scope.getByRole('row', { name: new RegExp(`^AC 3 ${name === 'Kruskal' ? '사이클 기각' : '삭제 확정'}`) })).toBeDefined()
  click('이전', scope)
  for (const line of graph.querySelectorAll('.graph-edge')) expect(line.getAttribute('opacity')).toBe('1')
})

it.each([['Kruskal', 4], ['Reverse-Delete', 13]] as const)('keeps final opacity through %s Bloom cleanup and clears it on Restart', (name, from) => {
  preference(); render(<App />); finishEntrance(); const scope = panel(name); jump(from, scope)
  for (const line of scope.getByRole('img').querySelectorAll('.graph-edge')) expect(line.getAttribute('opacity')).toBe('1')
  click('재생', scope); const motion = scene(scope)
  act(() => { motion.time(motion.labels.completion + 0.2) })
  const ac = scope.getByRole('img').querySelector('g[data-edge-name="AC"] .graph-edge')!
  expect(ac.getAttribute('opacity')).toBe('0.35')
  act(() => { motion.progress(1) }); expect(ac.getAttribute('opacity')).toBe('0.35'); expect((ac as SVGLineElement).style.cssText).toBe('')
  click('다시 시작', scope); expect(ac.getAttribute('opacity')).toBe('1')
})

it('takes final MST membership from the run rather than fixed names or a color assumption', () => {
  preference(true)
  const weights: Record<string, number> = { AB: 2, AC: 3, BC: 10, BD: 10, BE: 10, CD: 1, DE: 1 }
  const result = kruskal({ ...ASSIGNMENT_GRAPH, edges: ASSIGNMENT_GRAPH.edges.map(edge => ({ ...edge, weight: weights[edge.source + edge.target] })) })
  if (!result.ok) throw new Error(result.error.message)
  expect(result.value.mst.map(edge => edge.name)).toEqual(['AB', 'AC', 'CD', 'DE'])
  render(<AlgorithmPanel run={result.value} />); jump(result.value.snapshots.length - 1)
  for (const group of panel().getByRole('img').querySelectorAll('g[data-edge-name]')) {
    expect(group.querySelector('.graph-edge')!.getAttribute('opacity')).toBe(['AB', 'AC', 'CD', 'DE'].includes(group.getAttribute('data-edge-name')!) ? '1' : '0.35')
  }
})

// Hand-checked event/weight/partition fixtures, independent of the implementation's
// BFS, Union-Find and sorting helpers. State names accumulate only these events.
const kruskalSteps = [
  [null, null, 0, 'A|B|C|D|E'], ['BC', 'selected', 1, 'A|BC|D|E'],
  ['BD', 'selected', 2, 'A|BCD|E'], ['AB', 'selected', 4, 'ABCD|E'],
  ['AC', 'rejected', 4, 'ABCD|E'], ['BE', 'selected', 8, 'ABCDE'],
] as const
const reverseSteps = [
  [null, null, 23, 'ABCDE'], ['DE', 'temporarily-removed', 16, 'ABCDE'], ['DE', 'removed', 16, 'ABCDE'],
  ['CD', 'temporarily-removed', 11, 'ABCDE'], ['CD', 'removed', 11, 'ABCDE'],
  ['BE', 'temporarily-removed', 7, 'ABCD|E'], ['BE', 'kept', 11, 'ABCDE'],
  ['AC', 'temporarily-removed', 8, 'ABCDE'], ['AC', 'removed', 8, 'ABCDE'],
  ['AB', 'temporarily-removed', 6, 'A|BCDE'], ['AB', 'kept', 8, 'ABCDE'],
  ['BC', 'temporarily-removed', 7, 'ABDE|C'], ['BC', 'kept', 8, 'ABCDE'],
  ['BD', 'temporarily-removed', 7, 'ABCE|D'], ['BD', 'kept', 8, 'ABCDE'],
] as const
const labels: Record<EdgeStatus, string> = { pending: '미검사', selected: '선택', rejected: '사이클 기각', present: '남아 있음', 'temporarily-removed': '임시 제거', removed: '삭제 확정', kept: '복구·유지' }
const dashes: Record<EdgeStatus, string | null> = { pending: '7 5', selected: null, rejected: '7 4', present: null, 'temporarily-removed': '10 4 2 4', removed: '2 6', kept: null }

it.each([
  ['Kruskal', 'direct'], ['Kruskal', 'next'], ['Kruskal', 'auto'],
  ['Reverse-Delete', 'direct'], ['Reverse-Delete', 'next'], ['Reverse-Delete', 'auto'],
] as const)('matches all %s snapshots, graph states and explanations under %s navigation', (name, mode) => {
  preference(); render(<App />); finishEntrance(); const scope = panel(name)
  const result = (name === 'Kruskal' ? kruskal : reverseDelete)(ASSIGNMENT_GRAPH)
  if (!result.ok) throw new Error(result.error.message)
  const run = result.value, expected = name === 'Kruskal' ? kruskalSteps : reverseSteps
  const expectedStates: Record<string, EdgeStatus> = Object.fromEntries(['AB', 'AC', 'BC', 'BD', 'BE', 'CD', 'DE'].map(edge => [edge, name === 'Kruskal' ? 'pending' : 'present']))
  expect(run.snapshots).toHaveLength(name === 'Kruskal' ? 6 : 15)
  for (let index = 0; index < expected.length; index++) {
    if (index > 0) {
      if (mode === 'direct') jump(index, scope)
      else {
        if (mode === 'next') click('다음', scope)
        act(() => { scene(scope).progress(1) })
      }
    }
    const [edgeName, state, weight, components] = expected[index]
    if (edgeName && state) expectedStates[edgeName] = state
    const snapshot = run.snapshots[index]
    expect(snapshot.totalWeight).toBe(weight)
    expect(snapshot.components.map(group => [...group].sort().join('')).sort().join('|')).toBe(components)
    expect(scope.getByRole<HTMLSelectElement>('combobox').value).toBe(String(index))
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe(String(weight))
    expect(scope.getByRole('list', { name: '연결 요소' }).textContent!.replace(/[,\s]/g, '').length).toBe(5)
    expect(within(scope.getByRole('list', { name: '연결 요소' })).getAllByRole('listitem').map(el => el.textContent!.replace(/[,\s]/g, '').split('').sort().join('')).sort().join('|')).toBe(components)
    expect(scope.getByText(snapshot.what)).toBeDefined(); expect(scope.getByText(snapshot.why)).toBeDefined()
    expect(snapshot.what.length).toBeGreaterThan(0); expect(snapshot.why.length).toBeGreaterThan(0)
    for (const edge of snapshot.edges) {
      expect(edge.status).toBe(expectedStates[edge.name])
      const group = scope.getByRole('group', { name: `간선 ${edge.name}, 가중치 ${edge.weight}, ${labels[expectedStates[edge.name]]}` })
      const line = group.querySelector('.graph-edge')!
      expect(line.getAttribute('stroke-dasharray')).toBe(dashes[expectedStates[edge.name]])
      expect(scope.getByRole('row', { name: new RegExp(`^${edge.name} ${edge.weight} ${labels[expectedStates[edge.name]]}`) })).toBeDefined()
      expect(line.getAttribute('opacity')).toBe(index === expected.length - 1 && ['AC', 'CD', 'DE'].includes(edge.name) ? '0.35' : '1')
    }
    const expectedActive = Object.entries(expectedStates).filter(([, value]) => ['selected', 'present', 'kept'].includes(value)).map(([key]) => key)
    expect(snapshot.edges.filter(edge => snapshot.activeEdgeIds.includes(edge.id)).map(edge => edge.name)).toEqual(expectedActive)
    expect(scope.getByLabelText('현재 활성 간선 수').textContent).toBe(String(expectedActive.length))
    if (index === 0 && mode === 'auto') click('재생', scope)
  }
  expect(run.mst.map(edge => edge.name)).toEqual(['AB', 'BC', 'BD', 'BE']); expect(run.totalWeight).toBe(8)
  expect(scope.getByLabelText<HTMLParagraphElement>('MST 완료 안내').hidden).toBe(false)
})
