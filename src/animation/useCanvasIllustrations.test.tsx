// @vitest-environment jsdom
import { StrictMode, useRef } from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useCanvasIllustrations } from './useCanvasIllustrations'
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
function setup() {
  const pending = new Map<number, FrameRequestCallback>(); let id = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { pending.set(++id, callback); return id })
  vi.stubGlobal('cancelAnimationFrame', (key: number) => { pending.delete(key) })
  const media = new Map<string, MediaQueryList>()
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!media.has(query)) { const events = new EventTarget(); media.set(query, Object.assign(events, { matches: false }) as MediaQueryList) }
    return media.get(query)
  })
  let draws = 0
  const ctx = { save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, closePath() {}, arc() {}, fillText() {}, setLineDash() {}, setTransform() {}, clearRect() {}, scale() {}, drawImage() { draws++ } }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as unknown as CanvasRenderingContext2D)
  return { pending, draws: () => draws,
    tick(time: number) { act(() => { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(callback => callback(time)) }) },
    change(query: string, matches: boolean) { act(() => { Object.assign(media.get(query)!, { matches }); media.get(query)!.dispatchEvent(new Event('change')) }) } }
}
function Scene() { const ref = useRef<HTMLDivElement>(null); useCanvasIllustrations(ref); return <div ref={ref}><canvas data-art="tree" /></div> }
it('caps packet drawing and cancels all clocks on preference, print, visibility and unmount transitions', () => {
  const clock = setup(), view = render(<StrictMode><Scene /></StrictMode>)
  expect(clock.pending.size).toBe(1)
  clock.tick(0); const first = clock.draws(); clock.tick(16); expect(clock.draws()).toBe(first)
  clock.tick(34); expect(clock.draws()).toBe(first + 1)
  for (const query of ['(prefers-reduced-motion: reduce)', '(max-width: 768px)', 'print']) {
    clock.change(query, true); expect(clock.pending.size).toBe(0)
    clock.change(query, false); expect(clock.pending.size).toBe(1)
  }
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) }); expect(clock.pending.size).toBe(0)
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) }); expect(clock.pending.size).toBe(1)
  view.unmount(); expect(clock.pending.size).toBe(0)
  act(() => { window.dispatchEvent(new Event('resize')) }); expect(clock.pending.size).toBe(0)
})
it('bounds backing-store memory at high device pixel ratios and uses a static mobile scene', () => {
  const clock = setup(); vi.stubGlobal('devicePixelRatio', 4)
  const view = render(<Scene />), canvas = view.container.querySelector('canvas')!
  expect(canvas.width).toBe(660); expect(canvas.height).toBe(615)
  clock.change('(max-width: 768px)', true)
  expect(canvas.width).toBe(440); expect(canvas.height).toBe(410); expect(clock.pending.size).toBe(0)
})
it('keeps the decorative mount safe when a 2D context is unavailable', () => {
  const clock = setup(); vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const view = render(<Scene />); expect(view.container.querySelector('canvas')).not.toBeNull(); expect(clock.pending.size).toBe(0)
})
