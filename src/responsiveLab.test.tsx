// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from './App'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function viewport(initial = true) {
  let compact = initial
  const entries = new Map<string, { matches: boolean; addEventListener: EventTarget['addEventListener']; removeEventListener: EventTarget['removeEventListener']; dispatchEvent: EventTarget['dispatchEvent'] }>()
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!entries.has(query)) { const events = new EventTarget(); entries.set(query, { matches: query.includes('max-width') ? compact : false, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) }) }
    return entries.get(query)
  })
  return (value: boolean, printing = false) => { compact = value; const print = entries.get('print'); if (print) print.matches = printing; const media = entries.get('(max-width: 1199px)')!; media.matches = value; act(() => { media.dispatchEvent(new Event('change')) }) }
}
function scope(name = 'Kruskal') { return within(screen.getByRole('region', { name })) }
function click(name: string, area = scope()) { fireEvent.click(area.getByRole('button', { name })) }
function finishIntro() { for (const svg of screen.getAllByRole('img', { hidden: true })) { const tween = gsap.getTweensOf(svg.querySelector('.vertex')!)[0]; if (tween) act(() => { (tween.parent as gsap.core.Timeline).progress(1) }) } }
function clock(area = scope()) { return gsap.getTweensOf(area.getByRole('img').querySelector('g[aria-current="true"] .edge-effect')!)[0].parent as gsap.core.Timeline }
it('keeps both mobile panels mounted and pauses a hidden panel until explicit Resume', () => {
  viewport(); render(<App />); finishIntro(); const left = scope(), node = screen.getByRole('region', { name: 'Kruskal' })
  fireEvent.change(left.getByRole('combobox'), { target: { value: '3' } }); click('2배속'); click('재생'); const motion = clock()
  act(() => { motion.time(0.2) }); fireEvent.click(screen.getByRole('tab', { name: 'Reverse-Delete' }))
  expect(motion.paused()).toBe(true); expect(motion.parent).not.toBeNull()
  expect(node.isConnected).toBe(true); expect(screen.queryByRole('region', { name: 'Kruskal' })).toBeNull()
  fireEvent.click(screen.getByRole('tab', { name: 'Kruskal' }))
  expect(screen.getByRole('region', { name: 'Kruskal' })).toBe(node)
  expect(left.getByRole<HTMLSelectElement>('combobox').value).toBe('3'); expect(motion.timeScale()).toBe(2)
  expect(motion.paused()).toBe(true); click('계속 재생'); expect(clock()).toBe(motion); expect(motion.paused()).toBe(false)
})
it('preserves both owners across desktop/mobile resize and never auto-resumes the hidden one', () => {
  const resize = viewport(false); render(<App />); finishIntro(); const right = scope('Reverse-Delete')
  click('재생'); click('재생', right); const leftClock = clock(), rightClock = clock(right)
  resize(true); expect(rightClock.paused()).toBe(true); expect(leftClock.paused()).toBe(false)
  resize(false); expect(scope('Reverse-Delete').getByRole('button', { name: '계속 재생' })).toBeDefined()
  expect(clock(right)).toBe(rightClock); expect(rightClock.paused()).toBe(true)
})
it('supports roving tab focus and controls the correct persistent tabpanel', () => {
  viewport(); render(<App />); const left = screen.getByRole('tab', { name: 'Kruskal' }); left.focus()
  const lab = within(screen.getByRole('region', { name: 'Algorithm Lab' }))
  fireEvent.keyDown(left, { key: 'ArrowRight' }); const right = screen.getByRole('tab', { name: 'Reverse-Delete' })
  expect(document.activeElement).toBe(right); expect(right.getAttribute('aria-selected')).toBe('true')
  expect(lab.getByRole('tabpanel').id).toBe(right.getAttribute('aria-controls'))
  fireEvent.keyDown(right, { key: 'Home' }); expect(document.activeElement).toBe(left)
  expect(lab.getByRole('tabpanel').id).toBe(left.getAttribute('aria-controls'))
})
it('keeps focused desktop content visible on compact resize and moves focus off disappearing tabs', () => {
  const resize = viewport(false); render(<App />); const right = scope('Reverse-Delete'); const next = right.getByRole<HTMLButtonElement>('button', { name: '다음' }); next.focus()
  resize(true); expect(screen.getByRole('tab', { name: 'Reverse-Delete' }).getAttribute('aria-selected')).toBe('true')
  screen.getByRole('tab', { name: 'Reverse-Delete' }).focus(); resize(false)
  expect(screen.getByRole('region', { name: 'Reverse-Delete' }).contains(document.activeElement)).toBe(true)
})
it('ignores print page-width media changes so printing cannot pause either desktop owner', () => {
  const resize = viewport(false); render(<App />); finishIntro(); const right = scope('Reverse-Delete')
  click('재생'); click('재생', right); const leftClock = clock(), rightClock = clock(right)
  resize(true, true)
  expect(leftClock.paused()).toBe(false); expect(rightClock.paused()).toBe(false)
  expect(screen.getByRole('region', { name: 'Reverse-Delete' })).toBeDefined()
  resize(false, false); window.dispatchEvent(new Event('afterprint'))
  expect(clock(right)).toBe(rightClock); expect(rightClock.paused()).toBe(false)
})
