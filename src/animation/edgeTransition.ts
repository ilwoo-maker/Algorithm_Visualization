import { gsap } from 'gsap'
import type { EdgeSnapshot } from '../algorithms/types'
import { EDGE_STYLES } from '../components/graphPresentation'

/** Owns only decorative CSS; canonical SVG attributes always belong to React. */
export function createEdgeTransition(
  base: SVGLineElement,
  effect: SVGLineElement,
  from: EdgeSnapshot,
  to: EdgeSnapshot,
  onComplete: () => void,
) {
  let settled = false
  let timeline!: gsap.core.Timeline
  const previous = EDGE_STYLES[from.status]
  const target = EDGE_STYLES[to.status]
  const context = gsap.context(() => {
    timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power1.out' },
      onComplete: () => {
        if (settled) return
        settled = true
        context.revert()
        onComplete()
      },
    })
    timeline.set(effect, {
      opacity: 1, stroke: previous.color, strokeWidth: previous.width,
      strokeDasharray: previous.dash ?? 'none', strokeDashoffset: 0,
    })

    switch (to.status) {
      case 'selected': {
        // Length in SVG coordinates; no dependency on viewport pixels/getTotalLength.
        const length = Math.hypot(
          Number(base.getAttribute('x2')) - Number(base.getAttribute('x1')),
          Number(base.getAttribute('y2')) - Number(base.getAttribute('y1')),
        )
        timeline.set(base, { opacity: 0 })
          .set(effect, { stroke: '#d19b27', strokeWidth: 5, strokeDasharray: 'none' })
          .to(effect, { duration: 0.12, stroke: '#d19b27' })
          .set(effect, { stroke: target.color, strokeWidth: target.width, strokeDasharray: length, strokeDashoffset: length })
          .to(effect, { duration: 0.5, strokeDashoffset: 0 })
        break
      }
      case 'rejected':
        timeline.set(base, { opacity: 0 })
          .set(effect, { stroke: '#d19b27', strokeWidth: 5, strokeDasharray: 'none' })
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
  }, base.ownerSVGElement ?? base)

  timeline.play()
  return {
    timeline,
    cancel() {
      if (settled) return
      settled = true
      context.revert()
    },
  }
}
