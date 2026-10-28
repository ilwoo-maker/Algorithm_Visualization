// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from '../App'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function preference(initial = false) {
  const events = new EventTarget()
  const media = { matches: initial, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) }
  vi.stubGlobal('matchMedia', () => media)
  return (matches: boolean) => { media.matches = matches; act(() => { events.dispatchEvent(new Event('change')) }) }
}
function scope(name = 'Kruskal') { return within(screen.getByRole('region', { name })) }
function timelineFor(target: Element) {
  const tween = gsap.getTweensOf(target)[0]
  expect(tween).toBeDefined()
  return tween.parent as gsap.core.Timeline
}
function finishEntrance() {
  for (const svg of screen.getAllByRole('img')) {
    const vertex = svg.querySelector('.vertex')!
    act(() => { timelineFor(vertex).progress(1) })
  }
}
function next(panel: ReturnType<typeof scope>) { fireEvent.click(panel.getByRole('button', { name: '다음' })) }
function current(panel: ReturnType<typeof scope>) { return panel.getByRole('img').querySelector('g[aria-current="true"] .edge-effect')! }

it('builds the graph once with staggered vertices, edges and weight badges, then restores all canonical state', () => {
  preference()
  render(<App />)
  const svg = scope().getByRole('img')
  expect(svg.getAttribute('aria-busy')).toBe('true')
  const intro = timelineFor(svg.querySelector('.vertex')!)
  intro.pause().progress(0.02)
  expect(svg.querySelectorAll('.weight-label')).toHaveLength(7)
  expect(svg.querySelectorAll('.vertex')).toHaveLength(5)
  expect(Number(svg.querySelector('.vertex-circle')!.getAttribute('r'))).toBeLessThan(21)
  expect(intro.duration()).toBeGreaterThanOrEqual(1.2)
  expect(intro.duration()).toBeLessThanOrEqual(2)
  act(() => { intro.progress(1) })
  expect(svg.getAttribute('aria-busy')).toBe('false')
  expect(svg.querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
  for (const circle of svg.querySelectorAll('.vertex-circle')) expect(circle.getAttribute('r')).toBe('21')
  fireEvent.change(scope().getByRole('combobox'), { target: { value: '3' } })
  expect(gsap.getTweensOf(svg.querySelector('.vertex')!)).toHaveLength(0)
})

it('cancels entrance on navigation and displays the requested snapshot without a second scene', () => {
  preference()
  render(<App />)
  const panel = scope()
  const intro = timelineFor(panel.getByRole('img').querySelector('.vertex')!)
  next(panel)
  expect(intro.parent).toBeNull()
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('1')
  expect(panel.getByRole('img').getAttribute('aria-busy')).toBe('false')
  expect(gsap.getTweensOf(current(panel))).toHaveLength(0)
  expect(panel.getByRole('row', { name: /^BC 1 선택/ })).toBeDefined()
})

it.each(['pointer', 'keyboard'])('cancels entrance on %s opening the step picker without changing its value', (input) => {
  preference()
  render(<App />)
  const panel = scope()
  const intro = timelineFor(panel.getByRole('img').querySelector('.vertex')!)
  if (input === 'pointer') fireEvent.pointerDown(panel.getByRole('combobox'))
  else fireEvent.keyDown(panel.getByRole('combobox'), { key: ' ' })
  expect(intro.parent).toBeNull()
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('0')
  expect(panel.getByRole('img').getAttribute('aria-busy')).toBe('false')
})

it('moves a light along only the current BC edge and pulses exactly B and C', () => {
  preference()
  render(<App />)
  finishEntrance()
  const panel = scope()
  next(panel)
  const svg = panel.getByRole('img')
  const motion = timelineFor(current(panel))
  motion.pause().time(0.15)
  const head = svg.querySelector('.light-head')!
  const cx = Number(head.getAttribute('cx')), cy = Number(head.getAttribute('cy'))
  expect(cx).toBeGreaterThan(78)
  expect(cx).toBeLessThan(250)
  expect(cy).toBeGreaterThan(165)
  expect(cy).toBeLessThan(275)
  expect(Number((head as SVGElement).style.opacity)).toBeGreaterThan(0)
  const pulsing = svg.querySelectorAll('.vertex-wave')
  expect([...pulsing].filter(el => gsap.getTweensOf(el).length > 0).map(el => el.parentElement!.getAttribute('data-vertex'))).toEqual(['B', 'C'])
  expect(head.closest('[role="group"]')!.getAttribute('aria-label')).toContain('간선 BC')
  act(() => { motion.progress(1) })
  expect(svg.querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
})

it('runs final MST emphasis only after an adjacent final Next and keeps the confirmed number unchanged', () => {
  preference()
  render(<App />)
  finishEntrance()
  const panel = scope()
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '4' } })
  next(panel)
  const motion = timelineFor(current(panel))
  expect(motion.labels.completion).toBeDefined()
  const svg = panel.getByRole('img')
  for (const vertex of svg.querySelectorAll('.vertex')) {
    if (['B', 'E'].includes(vertex.getAttribute('data-vertex')!)) continue
    const wave = vertex.querySelector<SVGCircleElement>('.vertex-wave')!
    expect(Number(wave.style.opacity || wave.getAttribute('opacity'))).toBe(0)
  }
  const effects = [...svg.querySelectorAll('.edge-effect')].filter(el => gsap.getTweensOf(el).some(t => t.startTime() >= motion.labels.completion))
  expect(effects.map(el => el.parentElement!.getAttribute('data-edge-name')).sort()).toEqual(['AB', 'BC', 'BD', 'BE'])
  act(() => { motion.time(motion.labels.completion + 0.45) })
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('8')
  expect((panel.getByLabelText('현재 활성 간선 가중치 합') as HTMLOutputElement).style.transform).toContain('scale')
  act(() => { motion.progress(1) })
  expect(panel.getByRole('img').getAttribute('aria-busy')).toBe('false')
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').getAttribute('style') ?? '').toBe('')
  fireEvent.click(panel.getByRole('button', { name: '이전' }))
  next(panel)
  const cancelled = timelineFor(current(panel))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '5' } })
  expect(cancelled.parent).toBeNull()
  expect(panel.getByRole('img').getAttribute('aria-busy')).toBe('false')
})

it('does not run completion on a direct final selection or a non-final judgment', () => {
  preference()
  render(<App />)
  finishEntrance()
  const panel = scope()
  next(panel)
  const motion = timelineFor(current(panel))
  expect(motion.labels.completion).toBeUndefined()
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '5' } })
  expect(gsap.getTweensOf(current(panel))).toHaveLength(0)
  expect(panel.getByRole('img').getAttribute('aria-busy')).toBe('false')
})

it('uses snapshot component groups for temporary disconnection and retains restoration and final weights', () => {
  preference()
  render(<App />)
  finishEntrance()
  const panel = scope('Reverse-Delete')
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '4' } })
  next(panel)
  const svg = panel.getByRole('img')
  act(() => { timelineFor(current(panel)).progress(1) })
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('7')
  expect([...svg.querySelectorAll('.vertex')].map(el => [el.getAttribute('data-vertex'), el.getAttribute('data-component')]))
    .toEqual([['A', '0'], ['B', '0'], ['C', '0'], ['D', '0'], ['E', '1']])
  expect(svg.querySelectorAll('.component-boundary')).toHaveLength(5)
  next(panel)
  act(() => { timelineFor(current(panel)).progress(1) })
  expect(svg.querySelectorAll('.component-boundary')).toHaveLength(0)
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('11')
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '13' } })
  next(panel)
  expect(timelineFor(current(panel)).labels.completion).toBeDefined()
  act(() => { timelineFor(current(panel)).progress(1) })
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('8')
})

it('skips entrance and effects under Reduced Motion and cancels an intro when it is enabled', () => {
  const change = preference()
  const view = render(<App />)
  const panel = scope()
  const intro = timelineFor(panel.getByRole('img').querySelector('.vertex')!)
  change(true)
  expect(intro.parent).toBeNull()
  expect(panel.getByRole('img').getAttribute('aria-busy')).toBe('false')
  expect(panel.getByRole('img').querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
  view.unmount()
  preference(true)
  render(<App />)
  for (const svg of screen.getAllByRole('img')) {
    expect(svg.getAttribute('aria-busy')).toBe('false')
    expect(gsap.getTweensOf(svg.querySelector('.vertex')!)).toHaveLength(0)
  }
})

it('isolates entrance owners and leaves no live scene after StrictMode unmount', () => {
  preference()
  const view = render(<StrictMode><App /></StrictMode>)
  const vertices = screen.getAllByRole('img').map(svg => svg.querySelector('.vertex')!)
  const owners = vertices.map(vertex => timelineFor(vertex))
  expect(new Set(owners).size).toBe(2)
  for (const vertex of vertices) expect(new Set(gsap.getTweensOf(vertex).map(t => t.parent)).size).toBe(1)
  act(() => { owners[0].progress(1) })
  expect(owners[1].parent).not.toBeNull()
  view.unmount()
  for (const owner of owners) expect(owner.parent).toBeNull()
  for (const vertex of vertices) expect(gsap.getTweensOf(vertex)).toHaveLength(0)
})

it('hides all decoration from assistive technology and explains that the light is not graph direction', () => {
  preference(true)
  render(<App />)
  const panel = scope()
  next(panel)
  const svg = panel.getByRole('img')
  const decorations = svg.querySelectorAll('.edge-effect, .edge-streak, .edge-streak-glow, .light-head, .vertex-wave, .stage-flash')
  expect(decorations.length).toBeGreaterThan(0)
  for (const decoration of decorations) expect(decoration.getAttribute('aria-hidden')).toBe('true')
  expect(panel.getByText(/간선의 방향을 뜻하지 않습니다/)).toBeDefined()
  expect(within(svg).getAllByRole('group', { name: /^간선 / })).toHaveLength(7)
})

it('does not leave a bright solid inspection halo on a confirmed removed edge', () => {
  preference(true)
  render(<App />)
  const panel = scope('Reverse-Delete')
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '2' } })
  const removed = within(panel.getByRole('img')).getByRole('group', { name: '간선 DE, 가중치 7, 삭제 확정' })
  expect(removed.querySelector('.current-edge-halo')).toBeNull()
  expect(removed.querySelector('.graph-edge')?.getAttribute('stroke-dasharray')).toBe('2 6')
})
