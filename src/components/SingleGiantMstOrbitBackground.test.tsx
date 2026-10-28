// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { StrictMode } from 'react'
import { act } from '@testing-library/react'
import { gsap } from 'gsap'
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function orbit() { const root = document.querySelector<HTMLElement>('[data-mst-orbit]'); expect(root).not.toBeNull(); return root! }
it('replaces every corner cluster/canvas with one centered noninteractive orbit', () => {
  render(<App />); const root = orbit(), anchor = root.querySelector<HTMLElement>('.mst-orbit-anchor')!
  expect(document.querySelectorAll('[data-mst-orbit]')).toHaveLength(1)
  expect(document.querySelectorAll('[data-art-cluster], canvas')).toHaveLength(0)
  expect(root.querySelectorAll('svg')).toHaveLength(1)
  expect(root.style.position).toBe('fixed'); expect(root.style.pointerEvents).toBe('none'); expect(root.style.zIndex).toBe('0')
  expect(root.getAttribute('aria-hidden')).toBe('true'); expect(root.hasAttribute('inert')).toBe(true)
  expect(anchor.style.top).toBe('50%'); expect(anchor.style.left).toBe('50%'); expect(anchor.style.transform).toBe('translate(-50%, -50%)')
  expect(root.querySelectorAll('button, input, a, [tabindex]')).toHaveLength(0)
})
it('places B at the center with A/C on the left and E/D on the right', () => {
  render(<App />); const root = orbit()
  expect(root.querySelectorAll('[data-orbit-node]')).toHaveLength(5)
  const point = (name: string) => { const circle = root.querySelector(`[data-orbit-node="${name}"] .orbit-node-disc`)!; return [Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))] }
  expect(point('B')).toEqual([500, 500]); expect(point('A')).toEqual([260, 290]); expect(point('C')).toEqual([260, 710]); expect(point('E')).toEqual([740, 290]); expect(point('D')).toEqual([740, 710])
  expect(root.querySelectorAll('.orbit-ring')).toHaveLength(4)
  expect(root.querySelectorAll('textPath').length).toBeGreaterThanOrEqual(2)
})
it('uses all actual weights and only the four final MST edges for glow and packets', () => {
  render(<App />); const root = orbit()
  const weights: Record<string, string> = { AB: '2', BC: '1', BD: '1', BE: '4', AC: '3', CD: '5', DE: '7' }
  expect(root.querySelectorAll('[data-orbit-edge]')).toHaveLength(7)
  for (const [name, weight] of Object.entries(weights)) {
    const group = root.querySelector(`[data-orbit-edge="${name}"]`)!
    expect(group.querySelector('.orbit-weight')!.textContent).toBe(weight)
    const mst = ['AB', 'BC', 'BD', 'BE'].includes(name)
    expect(group.querySelector('.orbit-packet') !== null).toBe(mst)
    expect(group.querySelector('.orbit-edge')!.getAttribute('stroke-dasharray')).toBe(mst ? null : '6 8')
  }
})
it('keeps Lab steps and controls independent of the decorative final result', () => {
  render(<App />); orbit(); const panel = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } }); fireEvent.scroll(window)
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('4')
  fireEvent.click(panel.getByRole('button', { name: '이전' })); expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('2')
})
function preferences(initialReduced = false) {
  const entries = new Map<string, { matches: boolean; addEventListener: EventTarget['addEventListener']; removeEventListener: EventTarget['removeEventListener']; dispatchEvent: EventTarget['dispatchEvent'] }>()
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!entries.has(query)) { const events = new EventTarget(); entries.set(query, { matches: query.includes('reduce') && initialReduced, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) }) }
    return entries.get(query)
  })
  return (query: string, value: boolean) => { const entry = entries.get(query)!; entry.matches = value; act(() => { entry.dispatchEvent(new Event('change')) }) }
}
function tweens() { return [...orbit().querySelectorAll('*')].flatMap(element => gsap.getTweensOf(element)) }
it('owns four slow opposite ring rotations without rotating graph coordinates and cleans StrictMode owners', () => {
  preferences(); const view = render(<StrictMode><App /></StrictMode>), root = orbit()
  const positions = [...root.querySelectorAll('.orbit-node-disc')].map(node => [node.getAttribute('cx'), node.getAttribute('cy')])
  const rings = [...root.querySelectorAll('.orbit-ring')]
  rings.forEach((ring, i) => {
    const animations = gsap.getTweensOf(ring); expect(animations).toHaveLength(1)
    expect(animations[0].duration()).toBeGreaterThanOrEqual(200); expect(animations[0].repeat()).toBe(-1)
    expect(animations[0].vars.rotation).toBe(i % 2 ? -360 : 360)
    act(() => { animations[0].progress(0.25) })
  })
  expect([...root.querySelectorAll('.orbit-node-disc')].map(node => [node.getAttribute('cx'), node.getAttribute('cy')])).toEqual(positions)
  const owned = tweens(); expect(owned.length).toBeLessThanOrEqual(12)
  view.unmount(); for (const animation of owned) expect(animation.parent).toBeNull()
  for (const element of root.querySelectorAll<SVGElement>('.orbit-ring,.orbit-packet,.orbit-breath,.mst-orbit-scroll')) expect(element.style.cssText).toBe('')
})
it('scales to 0.75 on scroll while keeping the center anchor and Lab selection intact', async () => {
  preferences(); render(<App />); const root = orbit(), scroll = root.querySelector('.mst-orbit-scroll')!
  const panel = within(screen.getByRole('region', { name: 'Kruskal' })); fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } })
  vi.stubGlobal('scrollY', window.innerHeight * 4)
  await act(async () => { fireEvent.scroll(window); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())) })
  act(() => { gsap.getTweensOf(scroll).forEach(animation => { animation.progress(1) }) })
  expect([Number(gsap.getProperty(scroll, 'scaleX')), Number(gsap.getProperty(scroll, 'scaleY')), Number(gsap.getProperty(scroll, 'y'))]).toEqual([0.75, 0.75, -48])
  expect(root.querySelector<HTMLElement>('.mst-orbit-anchor')!.style.transform).toBe('translate(-50%, -50%)')
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
})
it('switches to a static full orbit on Reduced Motion and restores no stale transforms', () => {
  const change = preferences(); render(<App />); expect(tweens().length).toBeGreaterThan(0)
  change('(prefers-reduced-motion: reduce)', true); expect(tweens()).toHaveLength(0)
  expect(orbit().querySelectorAll('[data-orbit-node]')).toHaveLength(5)
  expect((orbit().querySelector('.mst-orbit-scroll') as HTMLElement).style.cssText).toBe('')
  change('(prefers-reduced-motion: reduce)', false); expect(tweens().length).toBeGreaterThan(0)
})
it('pauses only running decorative work while the tab is hidden and hides everything for print', () => {
  const change = preferences(); render(<App />); const ring = gsap.getTweensOf(orbit().querySelector('.orbit-ring')!)[0]
  expect(ring).toBeDefined()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true); act(() => { document.dispatchEvent(new Event('visibilitychange')) }); expect(ring.paused()).toBe(true)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false); act(() => { document.dispatchEvent(new Event('visibilitychange')) }); expect(ring.paused()).toBe(false)
  change('print', true); expect(orbit().hidden).toBe(true); expect(tweens()).toHaveLength(0)
  expect(screen.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
  change('print', false); expect(orbit().hidden).toBe(false)
})
it('leaves Reduced Motion static from first mount and preserves the 0.26 global art opacity', () => {
  preferences(true); render(<App />)
  expect(tweens()).toHaveLength(0); expect(orbit().querySelector<SVGElement>('svg')!.style.opacity).toBe('0.26')
  expect(orbit().querySelectorAll('.orbit-packet')).toHaveLength(4)
})
