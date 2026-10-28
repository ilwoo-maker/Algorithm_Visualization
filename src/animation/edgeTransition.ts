import type { RefObject } from 'react'
import type { EdgeSnapshot, MstRun } from '../algorithms/types'
import { EDGE_STYLES } from '../components/graphPresentation'
import { scopedTimeline, svgLineLength } from './scopedTimeline'

export interface CompletionScene {
  run: MstRun
  weightRef?: RefObject<HTMLOutputElement | null>
}

function pulse(timeline: gsap.core.Timeline, svg: SVGSVGElement, vertices: readonly string[], color: string, start: number) {
  for (const vertex of svg.querySelectorAll<SVGGElement>('.vertex')) {
    if (!vertices.includes(vertex.getAttribute('data-vertex')!)) continue
    const wave = vertex.querySelector('.vertex-wave')!
    const circle = vertex.querySelector('.vertex-circle')!
    timeline.fromTo(wave, { attr: { r: 23 }, opacity: 0.8, stroke: color }, { attr: { r: 37 }, opacity: 0, duration: 0.55, immediateRender: false }, start)
      .to(circle, { stroke: color, strokeWidth: 3.5, duration: 0.15 }, start)
  }
}

function inspection(timeline: gsap.core.Timeline, base: SVGLineElement, effect: SVGLineElement, to: EdgeSnapshot) {
  const svg = base.ownerSVGElement
  const color = to.status === 'kept' ? EDGE_STYLES.kept.color : '#ffcc67'
  timeline.to(effect, { stroke: color, strokeWidth: 5, duration: 0.2 }, 0)
  if (svg) {
    const group = base.parentElement!
    const streaks = [...group.querySelectorAll('.edge-streak, .edge-streak-glow')]
    const head = group.querySelector('.light-head')
    const length = svgLineLength(base)
    if (streaks.length) timeline.fromTo(streaks, { opacity: 0, strokeDasharray: `${length * 0.16} ${length}`, strokeDashoffset: length * 0.16, stroke: color }, { opacity: 1, strokeDashoffset: -length, duration: 0.6, ease: 'none' }, 0.08)
      .to(streaks, { opacity: 0, duration: 0.12 }, 0.68)
    if (head) timeline.fromTo(head, { opacity: 0, attr: { cx: Number(base.getAttribute('x1')), cy: Number(base.getAttribute('y1')) }, fill: color }, { opacity: 1, attr: { cx: Number(base.getAttribute('x2')), cy: Number(base.getAttribute('y2')) }, duration: 0.6, ease: 'none' }, 0.08)
      .to(head, { opacity: 0, duration: 0.12 }, 0.68)
    pulse(timeline, svg, [to.source, to.target], color, 0.25)
  }
  timeline.addLabel('decision', 0.8)
}

function completion(timeline: gsap.core.Timeline, svg: SVGSVGElement, scene: CompletionScene) {
  const start = timeline.duration()
  timeline.addLabel('completion', start)
  const groups = [...svg.querySelectorAll<SVGGElement>('g[data-edge-id]')]
  scene.run.mst.forEach((edge, index) => {
    const group = groups.find(item => item.getAttribute('data-edge-id') === edge.id)
    const base = group?.querySelector('.graph-edge')
    const effect = group?.querySelector('.edge-effect')
    if (!base || !effect) return
    timeline.fromTo(effect, { opacity: 0, stroke: base.getAttribute('stroke') ?? '#34e4b8', strokeWidth: 8, strokeDasharray: 'none' }, { opacity: 0.95, duration: 0.14, immediateRender: false }, start + index * 0.09)
      .to(effect, { opacity: 0, duration: 0.35 }, start + index * 0.09 + 0.14)
  })
  const vertices = [...svg.querySelectorAll('.vertex')].map(vertex => vertex.getAttribute('data-vertex')!)
  pulse(timeline, svg, vertices, '#34e4b8', start + 0.2)
  const weight = scene.weightRef?.current
  if (weight) timeline.fromTo(weight, { scale: 1, transformOrigin: 'left center' }, { scale: 1.18, duration: 0.18 }, start + 0.2)
    .to(weight, { scale: 1, duration: 0.3 }, start + 0.38)
}

/** Snapshot attributes define the settled state; every temporary scene mutation is reverted. */
export function createEdgeTransition(
  base: SVGLineElement,
  effect: SVGLineElement,
  from: EdgeSnapshot,
  to: EdgeSnapshot,
  onComplete: () => void,
  finalScene?: CompletionScene,
) {
  const previous = EDGE_STYLES[from.status]
  const target = EDGE_STYLES[to.status]
  return scopedTimeline(base.ownerSVGElement ?? base, (timeline) => {
    timeline.set(effect, {
      opacity: 1, stroke: previous.color, strokeWidth: previous.width,
      strokeDasharray: previous.dash ?? 'none', strokeDashoffset: 0,
    })
    inspection(timeline, base, effect, to)
    timeline.set(effect, { stroke: previous.color, strokeWidth: previous.width, opacity: 1, strokeDasharray: previous.dash ?? 'none' }, 'decision')

    switch (to.status) {
      case 'selected': {
        // Length in SVG coordinates; no dependency on viewport pixels/getTotalLength.
        const length = svgLineLength(base)
        timeline.set(base, { opacity: 0 })
          .set(effect, { stroke: '#ffcc67', strokeWidth: 5, strokeDasharray: 'none' })
          .to(effect, { duration: 0.12, stroke: '#ffcc67' })
          .set(effect, { stroke: target.color, strokeWidth: target.width, strokeDasharray: length, strokeDashoffset: length })
          .to(effect, { duration: 0.5, strokeDashoffset: 0 })
        break
      }
      case 'rejected':
        timeline.set(base, { opacity: 0 })
          .set(effect, { stroke: '#ffcc67', strokeWidth: 5, strokeDasharray: 'none' })
          .to(effect, { duration: 0.18, stroke: target.color })
          .to(effect, { duration: 0.22, strokeWidth: target.width })
          .set(effect, { strokeDasharray: target.dash })
          .to(effect, { duration: 0.1, opacity: 1 })
        break
      case 'temporarily-removed':
        // Fade the previous solid edge to reveal the snapshot's orange ghost line.
        timeline.to(effect, { duration: 0.15, stroke: target.color, strokeWidth: 4 })
          .to(effect, { duration: 0.5, opacity: 0 })
        break
      case 'removed':
        timeline.set(effect, { opacity: 0.4 })
          .to(effect, { duration: 0.4, opacity: 0 })
        break
      case 'kept':
        timeline.set(base, { opacity: 0 })
          .set(effect, { opacity: 0, stroke: target.color, strokeWidth: target.width, strokeDasharray: 'none' })
          .to(effect, { duration: 0.5, opacity: 1 })
        break
    }
    if (finalScene && base.ownerSVGElement) completion(timeline, base.ownerSVGElement, finalScene)
  }, onComplete)
}
