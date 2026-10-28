// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from '../App'
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function background() { const root = document.querySelector<HTMLElement>('[data-algorithm-background]'); expect(root).not.toBeNull(); return root! }
it('mounts one inert fixed background behind the interactive content without pointer capture', () => {
  render(<App />); const root = background()
  expect(document.querySelectorAll('[data-algorithm-background]')).toHaveLength(1)
  expect(root.getAttribute('aria-hidden')).toBe('true'); expect(root.hasAttribute('inert')).toBe(true)
  expect(root.style.position).toBe('fixed'); expect(root.style.pointerEvents).toBe('none'); expect(root.style.overflow).toBe('hidden')
  expect(root.parentElement!.style.isolation).toBe('isolate')
  expect(document.querySelector<HTMLElement>('.algorithm-content')!.style.zIndex).toBe('1')
  expect(root.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(0)
})
it('mounts four noninteractive Canvas illustrations', () => {
  render(<App />)
  expect(background().querySelectorAll('canvas')).toHaveLength(4)
  for (const canvas of background().querySelectorAll('canvas')) expect(canvas.getAttribute('tabindex')).toBeNull()
})
it('does not own or alter Lab state and leaves existing controls usable', () => {
  render(<App />); const root = background(), panel = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } })
  fireEvent.pointerMove(window, { clientX: 100, clientY: 100 }); fireEvent.scroll(window)
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  expect(root.querySelector('.graph-svg')).toBeNull()
  fireEvent.click(panel.getByRole('button', { name: '이전' }))
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('2')
})

function preferences(initialReduced = false, initialMobile = false) {
  const entries = new Map<string, { matches: boolean; addEventListener: EventTarget['addEventListener']; removeEventListener: EventTarget['removeEventListener']; dispatchEvent: EventTarget['dispatchEvent'] }>()
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!entries.has(query)) { const events = new EventTarget(); entries.set(query, { matches: query.includes('reduce') ? initialReduced : query === '(max-width: 768px)' ? initialMobile : query.includes('pointer: fine'), addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) }) }
    return entries.get(query)
  })
  return (query: string, value: boolean) => { const entry = entries.get(query)!; entry.matches = value; act(() => { entry.dispatchEvent(new Event('change')) }) }
}
function artTweens() { return [...background().querySelectorAll('*')].flatMap(element => gsap.getTweensOf(element)) }
it('owns bounded independent floats and packets and reverts everything under StrictMode', () => {
  preferences(); const view = render(<StrictMode><App /></StrictMode>), root = background()
  const floats = [...root.querySelectorAll('.art-float')]
  const owners = floats.map(element => gsap.getTweensOf(element))
  for (const tweens of owners) { expect(tweens).toHaveLength(1); expect(tweens[0].repeat()).toBe(-1) }
  expect(new Set(owners.map(tweens => tweens[0].duration())).size).toBe(4)
  expect(root.querySelectorAll('canvas')).toHaveLength(4)
  const all = artTweens(); expect(all.length).toBeLessThanOrEqual(16)
  view.unmount()
  for (const animation of all) expect(animation.parent).toBeNull()
  for (const element of root.querySelectorAll('[style]')) expect(element.getAttribute('style')).toBe('')
})
it('Reduced Motion leaves static artwork and mobile rebuild omits hidden clusters and packets', () => {
  const change = preferences(); render(<App />); const root = background()
  change('(prefers-reduced-motion: reduce)', true); expect(artTweens()).toHaveLength(0)
  expect(root.querySelectorAll('canvas')).toHaveLength(4)
  change('(max-width: 768px)', true); change('(prefers-reduced-motion: reduce)', false)
  expect(gsap.getTweensOf(root.querySelector('[data-art-cluster="k5"] .art-float')!)).toHaveLength(0)
  expect(gsap.getTweensOf(root.querySelector('[data-art-cluster="tree"] .art-float')!)).toHaveLength(1)
  for (const packet of root.querySelectorAll('.art-packet')) expect(gsap.getTweensOf(packet)).toHaveLength(0)
})
it('pauses background work while hidden and resumes its own running floats only', () => {
  preferences(); render(<App />); const float = gsap.getTweensOf(background().querySelector('.art-float')!)[0]
  expect(float).toBeDefined()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) }); expect(float.paused()).toBe(true)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) }); expect(float.paused()).toBe(false)
})
it('hides and stops the decoration for print while preserving the independent final results', () => {
  const change = preferences(); render(<App />); const root = background()
  change('print', true); expect(root.hidden).toBe(true); expect(artTweens()).toHaveLength(0)
  expect(screen.getByRole('row', { name: '최종 가중치 8 8' })).toBeDefined()
  change('print', false); expect(root.hidden).toBe(false); expect(artTweens().length).toBeGreaterThan(0)
})
it('updates section intensity and bounded pointer parallax without navigating the Lab', async () => {
  preferences(); render(<App />); const root = background(), panel = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } })
  vi.spyOn(screen.getByRole('region', { name: '이론과 비교' }), 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 1000, left: 0, right: 1000, width: 1000, height: 1000, x: 0, y: 0, toJSON() {} })
  await act(async () => { fireEvent.scroll(window); fireEvent.pointerMove(window, { clientX: 100, clientY: 100 }); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())) })
  expect(root.dataset.zone).toBe('theory'); expect(Number(root.style.getPropertyValue('--art-intensity'))).toBe(0.06)
  const pointer = gsap.getTweensOf(root.querySelector('.art-mouse')!)
  expect(pointer).toHaveLength(2)
  act(() => { pointer.forEach(tween => { tween.progress(1) }) })
  expect(Math.abs(Number(gsap.getProperty(root.querySelector('.art-mouse')!, 'x')))).toBeLessThanOrEqual(12)
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  const before = gsap.getTweensOf(root.querySelector('.art-float')!)[0]
  fireEvent.resize(window); expect(gsap.getTweensOf(root.querySelector('.art-float')!)[0]).toBe(before)
})
it('retains bounded scroll parallax beyond the introductory viewport range', async () => {
  preferences(); render(<App />)
  const layer = background().querySelector('[data-art-cluster="directed"] .art-scroll')!
  vi.stubGlobal('scrollY', window.innerHeight * 3)
  await act(async () => { fireEvent.scroll(window); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())) })
  const from = Number(gsap.getProperty(layer, 'y'))
  vi.stubGlobal('scrollY', window.innerHeight * 4)
  await act(async () => { fireEvent.scroll(window); await new Promise<void>(resolve => requestAnimationFrame(() => resolve())) })
  const to = Number(gsap.getProperty(layer, 'y'))
  expect(Math.abs(to - from)).toBeGreaterThan(1)
  expect(Math.abs(from)).toBeLessThanOrEqual(42); expect(Math.abs(to)).toBeLessThanOrEqual(42)
})
