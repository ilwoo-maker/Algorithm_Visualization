// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from '../App'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import { kruskal } from '../algorithms/kruskal'
import { reverseDelete } from '../algorithms/reverseDelete'
import type { MstRun, Result } from '../algorithms/types'
import { createEdgeTransition } from './edgeTransition'

function requireRun(result: Result<MstRun>) {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
const k = requireRun(kruskal(ASSIGNMENT_GRAPH))
const r = requireRun(reverseDelete(ASSIGNMENT_GRAPH))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function installMotionPreference(initial = false) {
  const events = new EventTarget()
  const media = {
    matches: initial,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  }
  vi.stubGlobal('matchMedia', () => media)
  return {
    change(matches: boolean) {
      media.matches = matches
      act(() => { events.dispatchEvent(new Event('change')) })
    },
  }
}

function makeLines(color: string, dash: string | null) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const base = document.createElementNS(svg.namespaceURI, 'line') as SVGLineElement
  base.setAttribute('x1', '0')
  base.setAttribute('y1', '0')
  base.setAttribute('x2', '100')
  base.setAttribute('y2', '0')
  base.setAttribute('stroke', color)
  if (dash) base.setAttribute('stroke-dasharray', dash)
  const effect = base.cloneNode() as SVGLineElement
  effect.setAttribute('opacity', '0')
  svg.append(base, effect)
  document.body.append(svg)
  return { svg, base, effect }
}

describe('real GSAP edge transitions (DOM lifecycle, not browser painting)', () => {
  it.each([
    ['Kruskal accept', k, 1, '#087f70', null, [8, 127, 112]],
    ['Kruskal reject', k, 4, '#b04460', '7 4', [176, 68, 96]],
    ['Reverse-Delete try-remove', r, 1, '#a35b06', '10 4 2 4', [163, 91, 6]],
    ['Reverse-Delete remove', r, 2, '#8390a1', '2 6', [163, 91, 6]],
    ['Reverse-Delete restore', r, 6, '#315bb5', null, [49, 91, 181]],
  ] as const)('%s animates a decorative edge and restores exact snapshot attributes on completion', (_name, run, index, color, dash, effectColor) => {
    const target = run.snapshots[index]
    const to = target.edges.find((edge) => edge.id === target.edgeId)!
    const from = run.snapshots[index - 1].edges.find((edge) => edge.id === target.edgeId)!
    const { svg, base, effect } = makeLines(color, dash)
    let completed = 0
    const animation = createEdgeTransition(base, effect, from, to, () => { completed++ })
    animation.timeline.pause().progress(0.5)
    expect(gsap.utils.splitColor(effect.style.stroke)).toEqual(effectColor)
    if (to.status === 'selected') {
      expect(Number.parseFloat(effect.style.strokeDashoffset)).toBeGreaterThan(0)
      expect(Number.parseFloat(effect.style.strokeDashoffset)).toBeLessThan(100)
    }
    if (['temporarily-removed', 'removed', 'kept'].includes(to.status)) {
      expect(Number(effect.style.opacity)).toBeGreaterThan(0)
      expect(Number(effect.style.opacity)).toBeLessThan(1)
    }
    expect(base.getAttribute('stroke')).toBe(color)
    expect(base.getAttribute('stroke-dasharray')).toBe(dash)
    animation.timeline.progress(1)
    expect(completed).toBe(1)
    expect(base.style.cssText).toBe('')
    expect(effect.style.cssText).toBe('')
    expect(effect.getAttribute('opacity')).toBe('0')
    expect(base.getAttribute('stroke')).toBe(color)
    expect(base.getAttribute('stroke-dasharray')).toBe(dash)
    expect(animation.timeline.parent).toBeNull()
    animation.cancel()
    expect(completed).toBe(1)
    svg.remove()
  })

  it('cancels idempotently without firing a stale completion or leaving inline styles', () => {
    const { svg, base, effect } = makeLines('#087f70', null)
    let completed = 0
    const to = k.snapshots[1].edges.find((edge) => edge.name === 'BC')!
    const from = k.snapshots[0].edges.find((edge) => edge.name === 'BC')!
    const animation = createEdgeTransition(base, effect, from, to, () => { completed++ })
    animation.timeline.pause().progress(0.4)
    animation.cancel()
    animation.cancel()
    expect(completed).toBe(0)
    expect(base.style.cssText).toBe('')
    expect(effect.style.cssText).toBe('')
    expect(animation.timeline.parent).toBeNull()
    svg.remove()
  })
})

function panel(name: string) {
  return within(screen.getByRole('region', { name }))
}
function currentEffect(scope: ReturnType<typeof within>) {
  return scope.getByRole('img').querySelector('.edge-effect')!
}
function ownedTimeline(effect: Element) {
  const tween = gsap.getTweensOf(effect)[0]
  expect(tween).toBeDefined()
  return tween.parent as gsap.core.Timeline
}

describe('snapshot navigation and effect ownership', () => {
  it('only animates Next; an adjacent dropdown choice, backward step and reset are immediate', () => {
    installMotionPreference()
    render(<App />)
    const scope = panel('Kruskal')
    expect(scope.getByRole('img').getAttribute('aria-busy')).toBe('false')
    fireEvent.change(scope.getByRole('combobox'), { target: { value: '1' } })
    expect(gsap.getTweensOf(currentEffect(scope))).toHaveLength(0)
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    const old = ownedTimeline(currentEffect(scope))
    expect(scope.getByRole('img').getAttribute('aria-busy')).toBe('true')
    expect(scope.getByText('간선 전환 중 · 선택한 단계 기준')).toBeDefined()
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('2')
    fireEvent.click(scope.getByRole('button', { name: '이전' }))
    expect(old.parent).toBeNull()
    expect(scope.getByRole('img').getAttribute('aria-busy')).toBe('false')
    expect(gsap.getTweensOf(currentEffect(scope))).toHaveLength(0)
    fireEvent.click(scope.getByRole('button', { name: '처음으로' }))
    expect(scope.getByRole<HTMLSelectElement>('combobox').value).toBe('0')
  })

  it('cancels rapid forward effects and leaves a direct jump at its exact snapshot', () => {
    installMotionPreference()
    render(<App />)
    const scope = panel('Kruskal')
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    const first = ownedTimeline(currentEffect(scope))
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    expect(first.parent).toBeNull()
    const second = ownedTimeline(currentEffect(scope))
    expect(second).not.toBe(first)
    fireEvent.change(scope.getByRole('combobox'), { target: { value: '5' } })
    expect(second.parent).toBeNull()
    expect(scope.getByRole('img').getAttribute('aria-busy')).toBe('false')
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('8')
    expect(scope.getByRole('row', { name: /^CD 5 미검사/ })).toBeDefined()
    expect(scope.getByRole('row', { name: /^DE 7 미검사/ })).toBeDefined()
  })

  it('finishes one panel without cancelling the other and removes all transient styles', () => {
    installMotionPreference()
    render(<App />)
    const left = panel('Kruskal'), right = panel('Reverse-Delete')
    fireEvent.click(left.getByRole('button', { name: '다음' }))
    fireEvent.click(right.getByRole('button', { name: '다음' }))
    const leftTimeline = ownedTimeline(currentEffect(left))
    const rightTimeline = ownedTimeline(currentEffect(right))
    act(() => { leftTimeline.progress(1) })
    expect(left.getByRole('img').getAttribute('aria-busy')).toBe('false')
    expect(right.getByRole('img').getAttribute('aria-busy')).toBe('true')
    expect(rightTimeline.parent).not.toBeNull()
    expect(left.getByRole('img').querySelectorAll('line[style]:not([style=""])')).toHaveLength(0)
    act(() => { rightTimeline.progress(1) })
    expect(right.getByRole('img').getAttribute('aria-busy')).toBe('false')
  })

  it('keeps Reverse-Delete temporary weight 7, restored weight 11 and final weight 8', () => {
    installMotionPreference()
    render(<App />)
    const scope = panel('Reverse-Delete')
    fireEvent.change(scope.getByRole('combobox'), { target: { value: '4' } })
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    expect(scope.getByRole('note', { name: '임시 단절 안내' })).toBeDefined()
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('7')
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    expect(scope.queryByRole('note', { name: '임시 단절 안내' })).toBeNull()
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('11')
    act(() => { ownedTimeline(currentEffect(scope)).progress(1) })
    fireEvent.change(scope.getByRole('combobox'), { target: { value: '14' } })
    expect(scope.getByLabelText('현재 활성 간선 가중치 합').textContent).toBe('8')
  })

  it('skips effects when reduced motion is already enabled', () => {
    installMotionPreference(true)
    render(<App />)
    const scope = panel('Kruskal')
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    expect(scope.getByRole('img').getAttribute('aria-busy')).toBe('false')
    expect(gsap.getTweensOf(currentEffect(scope))).toHaveLength(0)
    expect(scope.getByRole('row', { name: /^BC 1 선택/ })).toBeDefined()
  })

  it('cancels an active effect when reduced motion is enabled at runtime', () => {
    const preference = installMotionPreference()
    render(<App />)
    const scope = panel('Kruskal')
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    const animation = ownedTimeline(currentEffect(scope))
    preference.change(true)
    expect(animation.parent).toBeNull()
    expect(scope.getByRole('img').getAttribute('aria-busy')).toBe('false')
    expect(scope.getByRole('img').querySelectorAll('line[style]:not([style=""])')).toHaveLength(0)
  })

  it('cleans up its owned effects on unmount under StrictMode', () => {
    installMotionPreference()
    const view = render(<StrictMode><App /></StrictMode>)
    const scope = panel('Kruskal')
    fireEvent.click(scope.getByRole('button', { name: '다음' }))
    const effect = currentEffect(scope)
    const animation = ownedTimeline(effect)
    view.unmount()
    expect(animation.parent).toBeNull()
    expect(gsap.getTweensOf(effect)).toHaveLength(0)
    expect((effect as SVGLineElement).style.cssText).toBe('')
  })
})
