// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from '../App'
import { AlgorithmPanel } from '../components/AlgorithmPanel'
import { kruskal } from '../algorithms/kruskal'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function preference(reduced = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }))
}
function panel(name = 'Kruskal') { return within(screen.getByRole('region', { name })) }
function click(name: string, scope = panel()) { fireEvent.click(scope.getByRole('button', { name })) }
function jump(index: number, scope = panel()) { fireEvent.change(scope.getByRole('combobox'), { target: { value: String(index) } }) }
function scene(scope = panel()) {
  const tweens = [...scope.getByRole('img').querySelectorAll('.edge-effect')].flatMap(el => gsap.getTweensOf(el))
  expect(tweens.length).toBeGreaterThan(0)
  return tweens[0].parent as gsap.core.Timeline
}
function finishEntrance() {
  for (const svg of screen.getAllByRole('img')) {
    const tween = gsap.getTweensOf(svg.querySelector('.vertex')!)[0]
    if (tween) act(() => { (tween.parent as gsap.core.Timeline).progress(1) })
  }
}
function luminance(color: string) {
  const rgb = gsap.utils.splitColor(color).slice(0, 3).map(value => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}
function assertVertexContrast(scope: ReturnType<typeof panel>) {
  for (const vertex of scope.getByRole('img').querySelectorAll('.vertex')) {
    const circle = vertex.querySelector<SVGCircleElement>('.vertex-circle')!
    const text = vertex.querySelector<SVGTextElement>('text')!
    expect(circle.getAttribute('fill')).toBe('#213e53')
    expect(text.getAttribute('fill')).toBe('#eef8ff')
    const dark = luminance(circle.style.fill || circle.getAttribute('fill')!)
    const light = luminance(text.style.fill || text.getAttribute('fill')!)
    expect((light + 0.05) / (dark + 0.05)).toBeGreaterThanOrEqual(4.5)
    expect(circle.getAttribute('r')).toBe('21')
    expect(vertex.querySelector('.vertex-wave')!.getAttribute('fill')).toBe('none')
  }
}

it.each([['Kruskal', 0], ['Reverse-Delete', 0], ['Reverse-Delete', 5]] as const)
  ('keeps %s node interiors dark and labels readable before, during and after step %i', (name, from) => {
    preference(); render(<App />); finishEntrance(); const scope = panel(name); jump(from, scope)
    assertVertexContrast(scope); click('다음', scope); const motion = scene(scope)
    for (const time of [0.25, 0.5, 0.8]) {
      act(() => { motion.pause().time(time) }); assertVertexContrast(scope)
    }
    click('처음으로', scope); expect(motion.parent).toBeNull(); assertVertexContrast(scope)
    expect(scope.getByRole('img').querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
  })

it('retains readable static nodes with unfilled component boundaries under Reduced Motion', () => {
  preference(true); render(<App />); const scope = panel('Reverse-Delete'); jump(5, scope)
  assertVertexContrast(scope)
  for (const boundary of scope.getByRole('img').querySelectorAll('.component-boundary')) expect(boundary.getAttribute('fill')).toBe('none')
  click('다음', scope); assertVertexContrast(scope)
})

it.each([['Kruskal', 4], ['Reverse-Delete', 13]] as const)
  ('finishes %s with MST-only teal Bloom, then its card, and cleans before reading', (name, from) => {
    preference(); render(<App />); finishEntrance(); const scope = panel(name); jump(from, scope); click('재생', scope)
    const motion = scene(scope), svg = scope.getByRole('img')
    act(() => { motion.pause().time(motion.labels.completion + 0.25) })
    assertVertexContrast(scope)
    expect(svg.querySelector('.current-edge-halo')).toBeNull()
    expect(svg.querySelector('.weight-badge.is-current')).toBeNull()
    const card = scope.getByLabelText<HTMLParagraphElement>('MST 완료 안내')
    expect(card.hidden).toBe(true)
    const glowing = [...svg.querySelectorAll<SVGLineElement>('.edge-effect')].filter(el => Number(el.style.opacity) > 0)
    expect(glowing.map(el => el.parentElement!.getAttribute('data-edge-name')).sort()).toEqual(['AB', 'BC', 'BD', 'BE'])
    for (const edge of glowing) expect(gsap.utils.splitColor(edge.style.stroke)).toEqual([52, 228, 184])
    act(() => { motion.time(motion.labels.announcement + 0.1) })
    expect(card.hidden).toBe(false); expect(card.textContent).toBe('MST 구성 완료 · 총 가중치 8')
    expect(Number(card.style.opacity)).toBeGreaterThan(0); expect(Number(card.style.opacity)).toBeLessThan(1)
    act(() => { motion.time(motion.labels.reading + 0.01) })
    expect(svg.querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').getAttribute('style')).toBeNull()
    expect(card.getAttribute('style')).toBeNull()
    expect(card.hidden).toBe(false); expect(motion.parent).not.toBeNull()
    act(() => { motion.progress(1) }); expect(scope.getByText(/^재생 완료/)).toBeDefined()
  })

it.each(['다시 시작', '이전', '직접 선택', '재생'])('pauses/resumes completion and clears the old Bloom/card on %s', action => {
  preference(); render(<App />); finishEntrance(); jump(4); click('재생')
  const motion = scene()
  act(() => { motion.time(motion.labels.completion + 0.2) }); click('일시정지')
  const position = motion.time(); expect(motion.paused()).toBe(true)
  click('계속 재생'); expect(scene()).toBe(motion); expect(motion.time()).toBe(position)
  act(() => { motion.time(motion.labels.announcement + 0.1) })
  if (action === '직접 선택') jump(2)
  else if (action === '재생') { click('처음으로'); jump(4); click('다음'); act(() => { scene().time(scene().labels.announcement + 0.1) }); click('재생') }
  else click(action)
  expect(motion.parent).toBeNull()
  expect(panel().getByLabelText<HTMLParagraphElement>('MST 완료 안내').hidden).toBe(true)
  if (action !== '재생') expect(panel().getByRole('img').querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
})

it.each([false, true])('shows a direct final card immediately without Bloom, reduced motion=%s', reduced => {
  preference(reduced); render(<App />); if (!reduced) finishEntrance()
  jump(5)
  const card = panel().getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  expect(card.hidden).toBe(false); expect(card.style.cssText).toBe('')
  expect(panel().getByRole('img').querySelector('.current-edge-halo')).toBeNull()
  expect(gsap.getTweensOf(card)).toHaveLength(0)
  jump(4); expect(card.hidden).toBe(true)
})

it('reads completion weight from MstRun rather than hardcoding the assignment result', () => {
  preference(true)
  const result = kruskal({ ...ASSIGNMENT_GRAPH, edges: ASSIGNMENT_GRAPH.edges.map(edge => ({ ...edge, weight: edge.weight * 2 })) })
  if (!result.ok) throw new Error(result.error.message)
  render(<AlgorithmPanel run={result.value} />); jump(5)
  const card = panel().getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  expect(card.hidden).toBe(false); expect(card.textContent).toBe('MST 구성 완료 · 총 가중치 16')
})

it.each([5, 9, 11, 13])('applies a brief width-only Restore Snap after Reverse-Delete step %i', from => {
  preference(); render(<App />); finishEntrance(); const scope = panel('Reverse-Delete'); jump(from, scope); click('재생', scope)
  const motion = scene(scope), svg = scope.getByRole('img')
  const group = svg.querySelector('g[aria-current="true"]')!
  const effect = group.querySelector<SVGLineElement>('.edge-effect')!
  const base = group.querySelector('.graph-edge')!
  const coordinates = ['x1', 'y1', 'x2', 'y2'].map(name => base.getAttribute(name))
  expect(motion.labels.restoreSnap).toBeDefined()
  act(() => { motion.pause().time(motion.labels.restoreSnap + 0.06) })
  expect(Number.parseFloat(effect.style.strokeWidth)).toBeCloseTo(4.8)
  expect(['x1', 'y1', 'x2', 'y2'].map(name => effect.getAttribute(name))).toEqual(coordinates)
  expect(effect.style.transform).not.toContain('scale')
  click('일시정지', scope); const position = motion.time(); click('계속 재생', scope)
  expect(scene(scope)).toBe(motion); expect(motion.time()).toBe(position)
  act(() => { motion.time(motion.labels.restoreSnap + 0.16) })
  expect(Number.parseFloat(effect.style.strokeWidth)).toBe(4)
  act(() => { motion.progress(1) })
  // Autoplay may own the following edge, but the restored edge stays canonical.
  expect(base.getAttribute('stroke-width')).toBe('4'); expect(effect.style.cssText).toBe('')
})

it.each([0, 1])('does not apply Restore Snap to removal step %i', from => {
  preference(); render(<App />); finishEntrance(); const scope = panel('Reverse-Delete'); jump(from, scope); click('다음', scope)
  expect(scene(scope).labels.restoreSnap).toBeUndefined()
})

it('cancels a Restore Snap without moving endpoints or cancelling the other panel', () => {
  preference(); render(<App />); finishEntrance(); const scope = panel('Reverse-Delete'); jump(5, scope)
  click('다음'); const left = scene(); click('다음', scope); const right = scene(scope)
  act(() => { right.pause().time(right.labels.restoreSnap + 0.06) })
  jump(2, scope)
  expect(right.parent).toBeNull(); expect(left.parent).not.toBeNull()
  expect(scope.getByRole('img').querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
})

it('Reduced Motion restores the exact kept width without a Snap timeline', () => {
  preference(true); render(<App />); const scope = panel('Reverse-Delete'); jump(5, scope); click('다음', scope)
  const group = scope.getByRole('group', { name: '간선 BE, 가중치 4, 복구·유지' })
  expect(group.querySelector('.graph-edge')!.getAttribute('stroke-width')).toBe('4')
  expect(gsap.getTweensOf(group.querySelector('.edge-effect')!)).toHaveLength(0)
})

it.each([[0.5, 1.4], [1, 0.7], [2, 0.35]] as const)('uses %sx with %ss reading without restarting the active wait on speed changes', (speed, seconds) => {
  preference(); render(<App />); finishEntrance(); click('재생'); const motion = scene()
  expect(motion.labels.reading).toBeCloseTo(1.1)
  expect(motion.duration()).toBeCloseTo(1.8)
  click(`${speed}배속`)
  expect((motion.duration() - motion.labels.reading) / motion.timeScale()).toBeCloseTo(seconds)
  act(() => { motion.time(motion.labels.reading + 0.2) }); click('일시정지')
  const position = motion.time(); click('2배속')
  expect(motion.paused()).toBe(true); expect(scene()).toBe(motion); expect(motion.time()).toBe(position)
  expect((motion.duration() - motion.time()) / motion.timeScale()).toBeCloseTo(0.25)
  click('계속 재생'); expect(scene()).toBe(motion); expect(motion.time()).toBe(position)
  act(() => { motion.progress(1) })
  expect(panel().getByRole<HTMLSelectElement>('combobox').value).toBe('1')
})

it.each(['다시 시작', '직접 선택'])('cancels reading and its late callback on %s', action => {
  preference(); render(<App />); finishEntrance(); click('재생'); const motion = scene()
  act(() => { motion.time(motion.labels.reading + 0.2) })
  const oldComplete = motion.eventCallback('onComplete')!
  if (action === '다시 시작') click('다시 시작')
  else jump(3)
  const index = action === '다시 시작' ? '0' : '3'
  expect(motion.parent).toBeNull()
  act(() => { oldComplete() })
  expect(panel().getByRole<HTMLSelectElement>('combobox').value).toBe(index)
  expect(panel().getByRole('button', { name: '재생' })).toBeDefined()
})

it('keeps a 0.7s Reduced Motion reading interval with position-preserving pause and speed changes', () => {
  preference(true); render(<App />); click('재생')
  const motion = gsap.getTweensOf(panel().getByRole('img'))[0].parent as gsap.core.Timeline
  expect(motion.duration()).toBeCloseTo(0.7)
  act(() => { motion.time(0.2) }); click('일시정지'); click('2배속')
  expect(motion.time()).toBeCloseTo(0.2); expect(motion.paused()).toBe(true)
  click('계속 재생'); expect(motion.time()).toBeCloseTo(0.2)
  act(() => { motion.progress(1) })
  expect(panel().getByRole<HTMLSelectElement>('combobox').value).toBe('2')
})

it('restores the external completion card and weight styles on unmount during the announcement', () => {
  preference(); const view = render(<App />); finishEntrance(); jump(4); click('재생'); const motion = scene()
  act(() => { motion.time(motion.labels.announcement + 0.1) })
  const card = panel().getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  const weight = panel().getByLabelText('현재 활성 간선 가중치 합')
  expect(card.style.cssText).not.toBe('')
  view.unmount()
  expect(motion.parent).toBeNull(); expect(card.getAttribute('style')).toBeNull(); expect(weight.getAttribute('style')).toBeNull()
  expect(gsap.getTweensOf(card)).toHaveLength(0); expect(gsap.getTweensOf(weight)).toHaveLength(0)
})

it.each([['Kruskal', 4], ['Reverse-Delete', 13]] as const)('Reduced Motion final playback shows %s completion immediately without Bloom', (name, from) => {
  preference(true); render(<App />); const scope = panel(name); jump(from, scope); click('재생', scope)
  const card = scope.getByLabelText<HTMLParagraphElement>('MST 완료 안내')
  expect(card.hidden).toBe(false); expect(card.textContent).toBe('MST 구성 완료 · 총 가중치 8')
  expect(gsap.getTweensOf(card)).toHaveLength(0); expect(card.style.cssText).toBe('')
  expect(scope.getByRole('img').querySelector('.current-edge-halo')).toBeNull()
  click('다시 시작', scope); expect(card.hidden).toBe(true)
})
