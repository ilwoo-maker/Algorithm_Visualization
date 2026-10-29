import { scopedTimeline, svgLineLength } from './scopedTimeline'

export function createGraphEntrance(svg: SVGSVGElement, onComplete: () => void) {
  return scopedTimeline(svg, (timeline) => {
    const vertices = [...svg.querySelectorAll<SVGGElement>('.vertex')]
    const lines = [...svg.querySelectorAll<SVGLineElement>('.graph-edge')]
    const labels = [...svg.querySelectorAll<SVGGElement>('.weight-label')]
    timeline.set(vertices, { opacity: 0 }, 0).set(lines, { opacity: 0 }, 0).set(labels, { opacity: 0 }, 0)
    vertices.forEach((vertex, index) => {
      const circle = vertex.querySelector('.vertex-circle')!
      timeline.fromTo(circle, { attr: { r: 8 } }, { attr: { r: 21 }, duration: 0.34, ease: 'back.out(1.2)' }, index * 0.07)
        .to(vertex, { opacity: 1, duration: 0.25 }, index * 0.07)
    })
    lines.forEach((line, index) => {
      const start = 0.5 + index * 0.065
      const length = svgLineLength(line)
      timeline.set(line, { opacity: 1, strokeDasharray: length, strokeDashoffset: length }, start)
        .to(line, { strokeDashoffset: 0, duration: 0.35 }, start)
        .to(labels[index], { opacity: 1, duration: 0.25 }, start + 0.2)
    })
    const flash = svg.querySelector('.stage-flash')
    if (flash) timeline.to(flash, { opacity: 0.07, duration: 0.12 }, 1.4).to(flash, { opacity: 0, duration: 0.18 })
  }, onComplete)
}
