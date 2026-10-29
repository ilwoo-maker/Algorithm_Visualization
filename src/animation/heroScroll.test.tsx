// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import App from '../App'
import { MstHeroSection } from '../components/MstHeroSection'
import { kruskal } from '../algorithms/kruskal'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
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
it('reads the Hero final-weight statistic from the supplied run, independently of Lab', () => {
  const result = kruskal(ASSIGNMENT_GRAPH)
  if (!result.ok) throw new Error('Fixture must succeed')
  render(<MstHeroSection run={{ ...result.value, totalWeight: 42 }} />)
  const hero = within(screen.getByRole('region', { name: 'MST 도입' }))
  expect(hero.getByLabelText('최종 MST 가중치').textContent).toContain('42')
  expect(hero.getByLabelText('입력 정점 수').textContent).toContain('5')
  expect(hero.getByLabelText('입력 간선 수').textContent).toContain('7')
})
it('removes the duplicate intro graph and scrolling never changes Lab snapshots', () => {
  media(); render(<App />)
  const hero = screen.getByRole('region', { name: 'MST 도입' })
  expect(hero.querySelector('figure, svg')).toBeNull()
  expect(document.querySelector('[data-mst-orbit]')).not.toBeNull()
  const panel = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } })
  expect(owned()).toHaveLength(0)
  fireEvent.scroll(window)
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('4')
})
it('creates no obsolete Hero trigger on media changes or StrictMode remount', () => {
  const change = media(); const view = render(<StrictMode><App /></StrictMode>)
  const before = ScrollTrigger.getAll()
  expect(owned()).toHaveLength(0)
  change('(prefers-reduced-motion: reduce)', true); expect(owned()).toHaveLength(0)
  change('(prefers-reduced-motion: reduce)', false); expect(owned()).toHaveLength(0)
  view.unmount(); expect(ScrollTrigger.getAll()).toEqual(before)
})
it.each([[false, false], [true, true]])('keeps small/reduced Hero static and navigation visible: %s/%s', (wide, reduced) => {
  media(wide, reduced); render(<App />)
  expect(owned()).toHaveLength(0)
  expect(screen.getByRole('link', { name: 'Algorithm Lab 탐색하기' })).toBeDefined()
  expect(screen.getByRole('region', { name: 'MST 도입' }).querySelector('svg')).toBeNull()
  expect(screen.getByRole('link', { name: '수도코드 / 복잡도' }).getAttribute('href')).toBe('#theory')
})
