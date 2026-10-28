import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'

/** Decorative clocks only. The center anchor, graph geometry and Lab are untouched. */
export function useMstOrbitMotion(ref: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)'), print = window.matchMedia?.('print')
    const targets = [...root.querySelectorAll<HTMLElement | SVGElement>('.orbit-ring,.orbit-packet,.orbit-breath,.mst-orbit-scroll')]
    const originals = targets.map(element => ({ element, style: element.getAttribute('style'), transform: element.getAttribute('transform'), origin: element.getAttribute('data-svg-origin') }))
    let context: gsap.Context | undefined, frame: number | null = null
    let scaleTo: ((value: number) => void) | undefined, moveTo: ((value: number) => void) | undefined
    const paused = new Set<gsap.core.Tween>()
    const cancelFrame = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null }
    const clear = () => {
      cancelFrame(); context?.revert(); context = undefined; scaleTo = undefined; moveTo = undefined; paused.clear()
      for (const { element, style, transform, origin } of originals) {
        for (const [attribute, value] of [['style', style], ['transform', transform], ['data-svg-origin', origin]] as const) {
          if (value === null) element.removeAttribute(attribute)
          else element.setAttribute(attribute, value)
        }
      }
    }
    const update = () => {
      frame = null
      if (document.hidden || reduced?.matches || print?.matches) return
      const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(window.innerHeight * 2, 1)))
      scaleTo?.(1 - progress * 0.25); moveTo?.(-48 * progress)
    }
    const schedule = () => { if (frame === null && !document.hidden && !reduced?.matches && !print?.matches) frame = requestAnimationFrame(update) }
    const visibility = () => {
      if (document.hidden) {
        cancelFrame(); context?.getTweens().forEach((animation: gsap.core.Tween) => { if (!animation.paused()) { paused.add(animation); animation.pause() } })
      } else { paused.forEach(animation => { animation.resume() }); paused.clear(); schedule() }
    }
    const configure = () => {
      clear(); root.hidden = print?.matches ?? false
      if (!reduced?.matches && !print?.matches) {
        context = gsap.context(() => {
          root.querySelectorAll('.orbit-ring').forEach((ring, index) => {
            gsap.to(ring, { rotation: index % 2 ? -360 : 360, svgOrigin: '500 500', duration: [210, 240, 290, 340][index], repeat: -1, ease: 'none' })
          })
          root.querySelectorAll('.orbit-packet').forEach((packet, index) => {
            gsap.to(packet, { strokeDashoffset: -100, duration: 5 + index * 0.6, delay: index * 0.7, repeat: -1, ease: 'none' })
          })
          gsap.to(root.querySelector('.orbit-breath'), { opacity: 0.8, duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut' })
          const scroll = root.querySelector('.mst-orbit-scroll')!
          const scaleX = gsap.quickTo(scroll, 'scaleX', { duration: 0.8, ease: 'power2.out' })
          const scaleY = gsap.quickTo(scroll, 'scaleY', { duration: 0.8, ease: 'power2.out' })
          scaleTo = value => { scaleX(value); scaleY(value) }
          moveTo = gsap.quickTo(scroll, 'y', { duration: 0.8, ease: 'power2.out' })
        }, root)
      }
      update(); visibility()
    }
    configure()
    reduced?.addEventListener('change', configure); print?.addEventListener('change', configure)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule, { passive: true })
    return () => {
      reduced?.removeEventListener('change', configure); print?.removeEventListener('change', configure)
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule)
      clear()
    }
  }, [ref])
}
