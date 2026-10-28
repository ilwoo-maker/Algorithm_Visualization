import { useEffect } from 'react'
import type { RefObject } from 'react'
import { paintIllustration, paintPacket } from '../components/algorithmArt'
import type { ArtKind } from '../components/algorithmArt'

/** One packet clock, cached glow layers, no layout reads in the animation loop. */
export function useCanvasIllustrations(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia?.('(max-width: 768px)')
    const print = window.matchMedia?.('print')
    const canvases = [...root.querySelectorAll<HTMLCanvasElement>('canvas')]
    const layers = canvases.flatMap(canvas => {
      const ctx = canvas.getContext('2d'), cache = document.createElement('canvas'), cached = cache.getContext('2d')
      return ctx && cached ? [{ canvas, ctx, cache, cached, kind: canvas.dataset.art as ArtKind }] : []
    })
    let frame: number | null = null, previous = -Infinity, elapsed = 0, lastTime: number | null = null
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; lastTime = null }
    const restore = () => layers.forEach(({ ctx, canvas, cache }) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(cache, 0, 0)
    })
    const animate = (time: number) => {
      frame = null
      if (document.hidden || print?.matches || reduced?.matches || mobile?.matches) return
      if (time - previous >= 1000 / 30) {
        if (lastTime !== null) elapsed += Math.min(time - lastTime, 100)
        lastTime = time; previous = time; restore()
        layers.forEach(({ ctx, canvas, kind }, index) => {
          ctx.save(); ctx.scale(canvas.width / 440, canvas.height / 410)
          paintPacket(ctx, kind, elapsed, index); ctx.restore()
        })
      }
      frame = requestAnimationFrame(animate)
    }
    const configure = () => {
      stop(); previous = -Infinity
      if (print?.matches || document.hidden) return
      // Bound memory on high-DPI/mobile screens; rasterize only on resize/preferences.
      const ratio = mobile?.matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
      layers.forEach(({ canvas, cache, cached, kind }) => {
        canvas.width = cache.width = Math.round(440 * ratio)
        canvas.height = cache.height = Math.round(410 * ratio)
        cached.setTransform(ratio, 0, 0, ratio, 0, 0); paintIllustration(cached, kind)
      })
      restore()
      if (layers.length && !reduced?.matches && !mobile?.matches) frame = requestAnimationFrame(animate)
    }
    configure()
    for (const media of [reduced, mobile, print]) media?.addEventListener('change', configure)
    window.addEventListener('resize', configure, { passive: true })
    document.addEventListener('visibilitychange', configure)
    return () => {
      stop()
      for (const media of [reduced, mobile, print]) media?.removeEventListener('change', configure)
      window.removeEventListener('resize', configure); document.removeEventListener('visibilitychange', configure)
      layers.forEach(({ canvas, cache }) => { canvas.width = cache.width = 0; canvas.height = cache.height = 0 })
    }
  }, [ref])
}
