import type { RefObject } from 'react'
import type { EdgeSnapshot, MstRun } from '../algorithms/types'
import { EDGE_STYLES, VERTEX_STYLE } from '../components/graphPresentation'
import { scopedTimeline, svgLineLength } from './scopedTimeline'
import { PLAYBACK_TIMING } from './playbackTiming'
import type { TransitionPhase } from './playbackTiming'

export interface TransitionLifecycle {
  onCommit?: () => void
  onPhase?: (phase: TransitionPhase) => void
  onVisualComplete?: () => void
  readingSeconds?: number
}

export interface CompletionScene {
  run: MstRun
  weightRef?: RefObject<HTMLOutputElement | null>
  noticeRef?: RefObject<HTMLParagraphElement | null>
}

function pulse(timeline: gsap.core.Timeline, svg: SVGSVGElement, vertices: readonly string[], color: string, start: number) {
  for (const vertex of svg.querySelectorAll<SVGGElement>('.vertex')) {
    if (!vertices.includes(vertex.getAttribute('data-vertex')!)) continue
    const wave = vertex.querySelector('.vertex-wave')!
    const circle = vertex.querySelector('.vertex-circle')!
    timeline.fromTo(wave, { attr: { r: 23 }, opacity: 0.8, stroke: color }, { attr: { r: 37 }, opacity: 0, duration: 0.35, immediateRender: false }, start)
      .set(circle, { fill: VERTEX_STYLE.fill }, start)
      .to(circle, { stroke: color, strokeWidth: 3.5, duration: 0.15 }, start)
  }
}

function inspection(timeline: gsap.core.Timeline, base: SVGLineElement, effect: SVGLineElement, to: EdgeSnapshot) {
  const svg = base.ownerSVGElement
  const color = '#ffcc67'
  timeline.to(effect, { stroke: color, strokeWidth: 5, duration: 0.2 }, 0)
  if (svg) {
    const group = base.parentElement!
    const streaks = [...group.querySelectorAll('.edge-streak, .edge-streak-glow')]
    const head = group.querySelector('.light-head')
    const length = svgLineLength(base)
    if (streaks.length) timeline.fromTo(streaks, { opacity: 0, strokeDasharray: `${length * 0.16} ${length}`, strokeDashoffset: length * 0.16, stroke: color }, { opacity: 1, strokeDashoffset: -length, duration: 0.26, ease: 'none' }, 0.02)
      .to(streaks, { opacity: 0, duration: 0.08 }, 0.28)
    if (head) timeline.fromTo(head, { opacity: 0, attr: { cx: Number(base.getAttribute('x1')), cy: Number(base.getAttribute('y1')) }, fill: color }, { opacity: 1, attr: { cx: Number(base.getAttribute('x2')), cy: Number(base.getAttribute('y2')) }, duration: 0.26, ease: 'none' }, 0.02)
      .to(head, { opacity: 0, duration: 0.08 }, 0.28)
    pulse(timeline, svg, [to.source, to.target], color, 0.2)
    const badge = group.querySelector('.weight-label')
    if (badge) timeline.to(badge, { scale: 1.08, transformOrigin: 'center', duration: 0.2 }, 0.05)
      .to(badge, { scale: 1, duration: 0.3 }, PLAYBACK_TIMING.settle)
  }
}

function completion(timeline: gsap.core.Timeline, svg: SVGSVGElement, scene: CompletionScene, onAnnounce: () => void) {
  const start = timeline.duration()
  timeline.addLabel('completion', start)
  const groups = [...svg.querySelectorAll<SVGGElement>('g[data-edge-id]')]
  scene.run.mst.forEach((edge) => {
    const group = groups.find(item => item.getAttribute('data-edge-id') === edge.id)
    const base = group?.querySelector('.graph-edge')
    const effect = group?.querySelector('.edge-effect')
    if (!base || !effect) return
    timeline.fromTo(effect, { opacity: 0, stroke: '#34e4b8', strokeWidth: 8, strokeDasharray: 'none' }, { opacity: 0.95, duration: 0.16, immediateRender: false }, start)
      .to(effect, { opacity: 0, duration: PLAYBACK_TIMING.bloom - 0.16 }, start + 0.16)
  })
  const vertices = [...svg.querySelectorAll('.vertex')].map(vertex => vertex.getAttribute('data-vertex')!)
  pulse(timeline, svg, vertices, '#34e4b8', start + 0.05)
  const weight = scene.weightRef?.current
  if (weight) timeline.fromTo(weight, { scale: 1, transformOrigin: 'left center' }, { scale: 1.18, duration: 0.18, immediateRender: false }, start + 0.2)
    .to(weight, { scale: 1, duration: 0.3 }, start + 0.38)
  const announcement = start + PLAYBACK_TIMING.bloom
  timeline.addLabel('announcement', announcement).call(onAnnounce, [], 'announcement')
  const notice = scene.noticeRef?.current
  if (notice) timeline.fromTo(notice, { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: PLAYBACK_TIMING.announcement, ease: 'power2.out', immediateRender: false }, 'announcement')
}

/** Snapshot attributes define the settled state; every temporary scene mutation is reverted. */
export function createEdgeTransition(
  base: SVGLineElement,
  effect: SVGLineElement,
  from: EdgeSnapshot,
  to: EdgeSnapshot,
  onComplete: () => void,
  finalScene?: CompletionScene,
  lifecycle: TransitionLifecycle = {},
) {
  const previous = EDGE_STYLES[from.status]
  const target = EDGE_STYLES[to.status]
  return scopedTimeline(base.ownerSVGElement ?? base, (timeline) => {
    timeline.addLabel('focus', 0).addLabel('decision', PLAYBACK_TIMING.decision)
      .addLabel('settle', PLAYBACK_TIMING.settle).addLabel('commit', PLAYBACK_TIMING.commit)
      .call(() => lifecycle.onPhase?.('focus'), [], 0)
      .call(() => lifecycle.onPhase?.('decision'), [], 'decision')
      .call(() => lifecycle.onPhase?.('settle'), [], 'settle')
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
        timeline.set(base, { opacity: 0 }, 'decision')
          .set(effect, { stroke: target.color, strokeWidth: target.width, strokeDasharray: length, strokeDashoffset: length }, 'decision')
          .to(effect, { duration: 0.4, strokeDashoffset: 0 }, 'decision')
        break
      }
      case 'rejected':
        timeline.set(base, { opacity: 0 }, 'decision')
          .to(effect, { duration: 0.12, stroke: target.color, strokeWidth: target.width }, 'decision')
          .to(effect, { x: 2, duration: 0.035, repeat: 3, yoyo: true }, PLAYBACK_TIMING.decision)
          .set(effect, { x: 0, strokeDasharray: target.dash }, 'settle')
        break
      case 'temporarily-removed':
        timeline.set(base, { opacity: 0 }, 'decision')
          .to(effect, { duration: 0.12, stroke: target.color, strokeWidth: 4 }, 'decision')
          .to(effect, { duration: 0.28, opacity: 0 }, PLAYBACK_TIMING.decision + 0.12)
        // Two decorative halves shrink toward their endpoints, opening a central cut.
        for (const half of base.parentElement?.querySelectorAll('.edge-cut') ?? []) {
          const length = svgLineLength(half as SVGLineElement)
          timeline.fromTo(half, { opacity: 1, strokeDasharray: length, strokeDashoffset: 0 },
            { strokeDashoffset: length, opacity: 0, duration: 0.4, immediateRender: false }, 'decision')
        }
        break
      case 'removed':
        timeline.set(base, { opacity: 0 }, 'decision')
          .set(effect, { opacity: 0.4 }, 'decision')
          .to(effect, { duration: 0.4, opacity: 0 }, 'decision')
        break
      case 'kept':
        timeline.set(base, { opacity: 0 }, 'decision')
          .set(effect, { opacity: 0, stroke: target.color, strokeWidth: target.width, strokeDasharray: 'none', strokeDashoffset: svgLineLength(base) }, 'decision')
          .to(effect, { duration: 0.4, opacity: 1, strokeDashoffset: 0, strokeDasharray: svgLineLength(base) }, 'decision')
        break
    }
    if (base.ownerSVGElement && ['selected', 'kept'].includes(to.status)) {
      pulse(timeline, base.ownerSVGElement, [to.source, to.target], target.color, 0.55)
    }
    timeline.set(effect, { opacity: 1, stroke: target.color, strokeWidth: target.width, strokeDasharray: target.dash ?? 'none', strokeDashoffset: 0, x: 0 }, 'settle')
      .to(effect, { duration: PLAYBACK_TIMING.commit - PLAYBACK_TIMING.settle, opacity: 1 }, 'settle')
      .call(() => lifecycle.onCommit?.(), [], 'commit')
    if (to.status === 'kept') {
      // Width-only snap: neither the edge endpoints nor its scale can move.
      timeline.addLabel('restoreSnap', PLAYBACK_TIMING.settle)
        .to(effect, { strokeWidth: target.width * 1.2, autoRound: false, duration: PLAYBACK_TIMING.restoreSnap * 0.4 }, 'restoreSnap')
        .to(effect, { strokeWidth: target.width, autoRound: false, duration: PLAYBACK_TIMING.restoreSnap * 0.6 }, PLAYBACK_TIMING.settle + PLAYBACK_TIMING.restoreSnap * 0.4)
    }
    if (finalScene && base.ownerSVGElement) {
      timeline.call(() => lifecycle.onPhase?.('completion'), [], 'commit')
      completion(timeline, base.ownerSVGElement, finalScene, () => lifecycle.onPhase?.('announcement'))
    }
    timeline.addLabel('visualComplete', timeline.duration()).call(() => lifecycle.onVisualComplete?.(), [], 'visualComplete')
    timeline.addLabel('reading', timeline.duration())
    if (lifecycle.readingSeconds) timeline.call(() => lifecycle.onPhase?.('reading'), [], 'reading')
      .to({}, { duration: lifecycle.readingSeconds })
  }, onComplete, false, [finalScene?.weightRef?.current, finalScene?.noticeRef?.current].filter(element => element != null))
}
