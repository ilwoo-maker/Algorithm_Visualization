// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import App from '../App'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function media(wide = true, reduced = false) {
  const entries = new Map<string, MediaQueryList>()
  vi.stubGlobal('scrollTo', () => {})
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!entries.has(query)) {
      const events = new EventTarget()
      entries.set(query, { media: query, matches: query.includes('min-width') ? wide : query.includes('reduce') ? reduced : false,
        addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
        addListener() {}, removeListener() {}, dispatchEvent: events.dispatchEvent.bind(events) } as unknown as MediaQueryList)
    }
    return entries.get(query)!
  })
  return (query: string, value: boolean) => { const entry = entries.get(query)!; Object.defineProperty(entry, 'matches', { value, configurable: true }); act(() => { entry.dispatchEvent(new Event('change')) }) }
}
function owned() { const root = screen.getByRole('region', { name: 'MST 도입' }); return ScrollTrigger.getAll().filter(trigger => trigger.vars.trigger === root) }
it('draws the original graph separately and scrolling never changes Lab snapshots', () => {
  media(); render(<App />)
  const hero = screen.getByRole('region', { name: 'MST 도입' })
  expect(hero.querySelectorAll('svg line')).toHaveLength(7)
  expect(hero.querySelectorAll('.story-vertex')).toHaveLength(5)
  const panel = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } })
  expect(owned()).toHaveLength(1)
  act(() => { owned()[0].animation!.progress(0.8) })
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('4')
})
it('cleans only its owned trigger on media changes and StrictMode unmount', () => {
  const change = media(); const view = render(<StrictMode><App /></StrictMode>)
  expect(owned()).toHaveLength(1); const first = owned()[0]
  change('(prefers-reduced-motion: reduce)', true); expect(owned()).toHaveLength(0)
  expect(first.animation?.parent).toBeNull()
  change('(prefers-reduced-motion: reduce)', false); expect(owned()).toHaveLength(1)
  const last = owned()[0]; view.unmount(); expect(ScrollTrigger.getAll()).not.toContain(last)
})
it.each([[false, false], [true, true]])('keeps small/reduced Hero static and navigation visible: %s/%s', (wide, reduced) => {
  media(wide, reduced); render(<App />)
  expect(owned()).toHaveLength(0)
  expect(screen.getByRole('link', { name: 'Algorithm Lab 바로가기' })).toBeDefined()
  expect(screen.getByRole('region', { name: 'MST 도입' }).querySelector('svg')).not.toBeNull()
})
