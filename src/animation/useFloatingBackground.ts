import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'

/** Decorative owner only: no imports from algorithms, panels or playback. */
export function useFloatingBackground(ref: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia?.('(max-width: 768px)')
    const fine = window.matchMedia?.('(pointer: fine)')
    const print = window.matchMedia?.('print')
    const clusters = [...root.querySelectorAll<HTMLElement>('[data-art-cluster]')]
    const scrollLayers = clusters.map(cluster => cluster.querySelector<HTMLElement>('.art-scroll')!)
    const originals = scrollLayers.map(layer => layer.getAttribute('style'))
    const zones = [['hero-section', 'hero', 1], ['concept-section', 'concept', 0.62], ['lab-section', 'lab', 0.16], ['theory-section', 'theory', 0.06]] as const
    let context: gsap.Context | undefined
    let scrollSetters: { x: (value: number) => void; y: (value: number) => void }[] = []
    let magnets: { x: (value: number) => void; y: (value: number) => void; cluster: HTMLElement }[] = []
    const paused = new Set<gsap.core.Tween>()
    let frame: number | null = null, pointerX = 0, pointerY = 0, hasPointer = false
    const cancelFrame = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null }
    const clearScene = () => {
      cancelFrame(); context?.revert(); context = undefined; paused.clear(); scrollSetters = []; magnets = []
      scrollLayers.forEach((layer, i) => { if (originals[i] === null) layer.removeAttribute('style'); else layer.setAttribute('style', originals[i]!) })
    }
    const renderFrame = () => {
      frame = null
      if (document.hidden || print?.matches) return
      const anchor = window.innerHeight * 0.4
      for (const [selector, name, strength] of zones) {
        const rectangle = document.querySelector(`.${selector}`)?.getBoundingClientRect()
        if (rectangle && rectangle.top <= anchor && rectangle.bottom > anchor) {
          root.dataset.zone = name; root.style.setProperty('--art-intensity', String(strength)); break
        }
      }
      // Bounded continuous travel retains depth on long Theory pages, without wraps.
      const travel = Math.sin(window.scrollY / Math.max(window.innerHeight, 1) * 0.65)
      scrollSetters.forEach((setter, i) => {
        const depth = [28, 18, 42, 12][i] * (mobile?.matches ? 0.35 : 1)
        setter.y(-travel * depth); setter.x(travel * depth * (i % 2 ? -0.12 : 0.12))
      })
      if (hasPointer && magnets.length) {
        // Batch layout reads before writes; transforms belong to separate layers.
        const centers = magnets.map(magnet => magnet.cluster.getBoundingClientRect())
        magnets.forEach((magnet, i) => {
          const rect = centers[i], dx = pointerX - (rect.left + rect.width / 2), dy = pointerY - (rect.top + rect.height / 2)
          const influence = Math.max(0, 1 - Math.hypot(dx, dy) / Math.max(window.innerWidth * 0.55, 1))
          magnet.x(Math.max(-12, Math.min(12, dx * 0.025 * influence)))
          magnet.y(Math.max(-10, Math.min(10, dy * 0.025 * influence)))
        })
      }
    }
    const schedule = () => { if (frame === null && !document.hidden && !print?.matches) frame = requestAnimationFrame(renderFrame) }
    const visibility = () => {
      if (document.hidden) {
        cancelFrame()
        context?.getTweens().forEach((tween: gsap.core.Tween) => { if (!tween.paused()) { paused.add(tween); tween.pause() } })
      } else { paused.forEach(tween => { tween.resume() }); paused.clear(); schedule() }
    }
    const configure = () => {
      clearScene(); root.hidden = print?.matches ?? false
      if (!root.dataset.zone) { root.dataset.zone = 'hero'; root.style.setProperty('--art-intensity', '1') }
      if (!reduced?.matches && !print?.matches) {
        context = gsap.context(() => {
          clusters.forEach((cluster, i) => {
            const active = !mobile?.matches || i === 0 || i === 2
            if (!active) return
            const amplitude = mobile?.matches ? 0.45 : 1
            gsap.to(cluster.querySelector('.art-float'), { x: (i % 2 ? 8 : -8) * amplitude, y: (i % 2 ? -13 : 11) * amplitude, rotation: i === 1 ? 5 : i % 2 ? -2 : 3, duration: 12 + i * 3, delay: i * 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' })
            const setX = gsap.quickSetter(scrollLayers[i], 'x', 'px'), setY = gsap.quickSetter(scrollLayers[i], 'y', 'px')
            scrollSetters[i] = { x: value => { setX(value) }, y: value => { setY(value) } }
            if (fine?.matches && !mobile?.matches) {
              const layer = cluster.querySelector('.art-mouse')!
              magnets.push({ cluster, x: gsap.quickTo(layer, 'x', { duration: 0.7, ease: 'power2.out' }), y: gsap.quickTo(layer, 'y', { duration: 0.7, ease: 'power2.out' }) })
            }
          })
        }, root)
      }
      renderFrame(); visibility()
    }
    const pointer = (event: PointerEvent) => { if (!magnets.length) return; pointerX = event.clientX; pointerY = event.clientY; hasPointer = true; schedule() }
    configure()
    for (const media of [reduced, mobile, fine, print]) media?.addEventListener('change', configure)
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule, { passive: true }); window.addEventListener('pointermove', pointer, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    return () => {
      for (const media of [reduced, mobile, fine, print]) media?.removeEventListener('change', configure)
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); window.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', visibility)
      clearScene(); root.style.removeProperty('--art-intensity'); delete root.dataset.zone
    }
  }, [ref])
}
