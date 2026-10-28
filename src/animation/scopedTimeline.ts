import { gsap } from 'gsap'

/** One local scene with identical completion/cancellation restoration semantics. */
export function scopedTimeline(scope: Element, build: (timeline: gsap.core.Timeline) => void, onComplete: () => void, startPaused = false) {
  let settled = false
  let timeline!: gsap.core.Timeline
  // Later-initialized overlapping tweens may capture another tween's inline state.
  // Preserve the owner's original presentation independently of GSAP's lazy capture.
  const originals = [scope, ...scope.querySelectorAll('*')].map(element => ({
    element, style: element.getAttribute('style'), transform: element.getAttribute('transform'), origin: element.getAttribute('data-svg-origin'),
  }))
  const restorePresentation = () => {
    for (const { element, style, transform, origin } of originals) {
      for (const [attribute, value] of [['style', style], ['transform', transform], ['data-svg-origin', origin]] as const) {
        if (value === null) element.removeAttribute(attribute)
        else element.setAttribute(attribute, value)
      }
    }
  }
  const restore = () => { context.revert(); restorePresentation() }
  const context = gsap.context(() => {
    timeline = gsap.timeline({ paused: true, defaults: { ease: 'power1.out' }, onComplete: () => {
      if (settled) return
      settled = true
      restore()
      onComplete()
    } })
    build(timeline)
  }, scope)
  if (!startPaused) timeline.play()
  return { timeline, restorePresentation, cancel() {
    if (settled) return
    settled = true
    restore()
  } }
}

export function svgLineLength(line: SVGLineElement) {
  return Math.hypot(Number(line.getAttribute('x2')) - Number(line.getAttribute('x1')), Number(line.getAttribute('y2')) - Number(line.getAttribute('y1')))
}
