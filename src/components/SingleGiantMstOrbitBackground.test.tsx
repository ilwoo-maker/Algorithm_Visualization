// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { SingleGiantMstOrbitBackground } from './SingleGiantMstOrbitBackground'
import { recordingContext } from '../test/orbitContext'
import { kruskal } from '../algorithms/kruskal'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import App from '../App'

const result = kruskal(ASSIGNMENT_GRAPH)
if (!result.ok) throw new Error('Fixture must succeed')
const mst = result.value.mst
const orbit = () => document.querySelector<HTMLElement>('[data-mst-orbit]')!
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
function environment(initialReduced = false) {
  const recording = recordingContext(), frames = new Map<number, FrameRequestCallback>(), media = new Map<string, { matches: boolean; events: EventTarget }>()
  let id = 0
  vi.stubGlobal('CanvasRenderingContext2D', class {})
  vi.stubGlobal('innerWidth', 1440); vi.stubGlobal('innerHeight', 900); vi.stubGlobal('devicePixelRatio', 3)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(recording.context)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id })
  vi.stubGlobal('cancelAnimationFrame', (frame: number) => { frames.delete(frame) })
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!media.has(query)) media.set(query, { matches: query.includes('reduce') && initialReduced, events: new EventTarget() })
    const entry = media.get(query)!
    return { get matches() { return entry.matches }, addEventListener: entry.events.addEventListener.bind(entry.events), removeEventListener: entry.events.removeEventListener.bind(entry.events) }
  })
  return {
    ...recording, frames,
    step(time: number) { const pending = [...frames.values()]; frames.clear(); act(() => { pending.forEach(callback => callback(time)) }) },
    change(query: string, matches: boolean) { const entry = media.get(query)!; entry.matches = matches; act(() => { entry.events.dispatchEvent(new Event('change')) }) },
  }
}
it('mounts one noninteractive Canvas with no old clusters or duplicate Hero graph', () => {
  environment(); render(<App />)
  expect(document.querySelectorAll('[data-mst-orbit]')).toHaveLength(1)
  expect(orbit().querySelectorAll('canvas')).toHaveLength(1); expect(orbit().querySelector('svg')).toBeNull()
  expect(orbit().style.position).toBe('fixed'); expect(orbit().style.pointerEvents).toBe('none'); expect(orbit().style.zIndex).toBe('0')
  expect(orbit().getAttribute('aria-hidden')).toBe('true'); expect(orbit().hasAttribute('inert')).toBe(true)
  expect(document.querySelector('[data-art-cluster]')).toBeNull()
  expect(screen.getByRole('region', { name: 'MST 도입' }).querySelector('figure')).toBeNull()
  expect(screen.getByRole('link', { name: 'Algorithm Lab 탐색하기' }).getAttribute('href')).toBe('#comparison')
})
it('owns one StrictMode frame, caps DPR, handles resize and cancels work/listeners on unmount', () => {
  const env = environment(); const view = render(<StrictMode><SingleGiantMstOrbitBackground mst={mst} /></StrictMode>)
  const canvas = orbit().querySelector('canvas')!
  expect(canvas.width).toBe(2880); expect(canvas.height).toBe(1800); expect(env.frames.size).toBe(1)
  env.step(0); env.step(40); expect(env.frames.size).toBe(1)
  vi.stubGlobal('innerWidth', 390); fireEvent.resize(window)
  expect(canvas.width).toBe(780); expect(env.frames.size).toBe(1)
  view.unmount(); expect(env.frames.size).toBe(0)
  env.methods.fillRect.mockClear(); fireEvent.resize(window); fireEvent.mouseMove(window, { clientX: 100 }); env.step(100)
  expect(env.methods.fillRect).not.toHaveBeenCalled()
})
it('eases mouse parallax within a bounded range without changing graph state', () => {
  const env = environment(); render(<SingleGiantMstOrbitBackground mst={mst} />)
  fireEvent.mouseMove(window, { clientX: 1440, clientY: 0 }); env.step(0); env.step(40)
  const translations = env.methods.translate.mock.calls.filter(([x]) => Number(x) > 800)
  const [x, y] = translations.at(-1)!.map(Number)
  expect(x).toBeGreaterThan(1440 * .58); expect(x).toBeLessThanOrEqual(1440 * .58 + 14)
  expect(y).toBeLessThan(900 * .49); expect(y).toBeGreaterThanOrEqual(900 * .49 - 10)
})
it('pauses while hidden, hides/stops for print and resumes with one frame', () => {
  const env = environment(); render(<SingleGiantMstOrbitBackground mst={mst} />)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true); fireEvent(document, new Event('visibilitychange')); expect(env.frames.size).toBe(0)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false); fireEvent(document, new Event('visibilitychange')); expect(env.frames.size).toBe(1)
  env.change('print', true); expect(orbit().hidden).toBe(true); expect(env.frames.size).toBe(0)
  env.change('print', false); expect(orbit().hidden).toBe(false); expect(env.frames.size).toBe(1)
})
it('renders a static Canvas for Reduced Motion from mount and after preference changes', () => {
  const env = environment(true); render(<SingleGiantMstOrbitBackground mst={mst} />)
  expect(env.frames.size).toBe(0); expect(env.methods.fillRect).toHaveBeenCalled()
  env.methods.fillRect.mockClear(); fireEvent.mouseMove(window, { clientX: 1440 }); env.step(40)
  expect(env.methods.fillRect).not.toHaveBeenCalled()
  env.change('(prefers-reduced-motion: reduce)', false); expect(env.frames.size).toBe(1)
  env.change('(prefers-reduced-motion: reduce)', true); expect(env.frames.size).toBe(0)
})
it('keeps Lab navigation and snapshot metrics independent of background scroll and pointer input', () => {
  environment(); render(<App />); const panel = within(screen.getByRole('region', { name: 'Kruskal' }))
  fireEvent.change(panel.getByRole('combobox'), { target: { value: '3' } }); fireEvent.scroll(window); fireEvent.mouseMove(window, { clientX: 1440 })
  expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('3')
  expect(panel.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('4')
  fireEvent.click(panel.getByRole('button', { name: '이전' })); expect(panel.getByRole<HTMLSelectElement>('combobox').value).toBe('2')
})
it('draws each animation frame and uses the same eased mouse position at 60Hz and 120Hz', () => {
  const sample = (hz: number) => {
    const env = environment(), view = render(<SingleGiantMstOrbitBackground mst={mst} />)
    env.step(0); env.methods.fillRect.mockClear()
    fireEvent.mouseMove(window, { clientX: 1440, clientY: 0 })
    for (let index = 1; index <= hz / 10; index++) env.step(index * 1000 / hz)
    expect(env.methods.fillRect).toHaveBeenCalledTimes(hz / 10 * 2)
    const position = env.methods.translate.mock.calls.filter(([x]) => Number(x) > 800).at(-1)!.map(Number)
    view.unmount(); return position
  }
  const sixty = sample(60), faster = sample(120)
  expect(sixty[0]).toBeCloseTo(1440 * .58 + 14 * (1 - .96 ** 6))
  expect(faster[0]).toBeCloseTo(sixty[0]); expect(faster[1]).toBeCloseTo(sixty[1])
})
