import { gsap } from 'gsap'

/** One local scene with identical completion/cancellation restoration semantics. */
export function scopedTimeline(scope: Element, build: (timeline: gsap.core.Timeline) => void, onComplete: () => void) {
  let settled = false
  let timeline!: gsap.core.Timeline
  const context = gsap.context(() => {
    timeline = gsap.timeline({ paused: true, defaults: { ease: 'power1.out' }, onComplete: () => {
      if (settled) return
      settled = true
      context.revert()
      onComplete()
    } })
    build(timeline)
  }, scope)
  timeline.play()
  return { timeline, cancel() {
    if (settled) return
    settled = true
    context.revert()
  } }
}

export function svgLineLength(line: SVGLineElement) {
  return Math.hypot(Number(line.getAttribute('x2')) - Number(line.getAttribute('x1')), Number(line.getAttribute('y2')) - Number(line.getAttribute('y1')))
}
