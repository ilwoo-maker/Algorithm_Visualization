import { useLayoutEffect, useRef } from 'react'
import type { NormalizedEdge } from '../algorithms/types'
import { createOrbitScene, drawOrbit } from './technicalMstOrbit'
import './singleGiantMstOrbit.css'

/** Owns one decorative Canvas clock. It never reads or writes Lab playback state. */
export function SingleGiantMstOrbitBackground({ mst }: { mst: readonly NormalizedEdge[] }) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const element = canvas.current, layer = root.current
    if (!element || !layer || typeof CanvasRenderingContext2D === 'undefined') return
    const ctx = element.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)'), print = window.matchMedia?.('print')
    let scene = createOrbitScene(window.innerWidth, window.innerHeight, mst)
    let frame: number | null = null, lastTime: number | null = null, elapsed = 0
    const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 }
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; lastTime = null }
    const canAnimate = () => !document.hidden && !reduced?.matches && !print?.matches
    const paint = () => {
      const scroll = reduced?.matches ? 0 : Math.max(0, Math.min(1, window.scrollY / Math.max(scene.height * 2, 1)))
      drawOrbit(ctx, scene, elapsed, eased, scroll)
    }
    const tick = (time: number) => {
      frame = null
      if (!canAnimate()) return
      const delta = lastTime === null ? 0 : Math.min(50, Math.max(0, time - lastTime))
      lastTime = time; elapsed += delta / 1000
      // Exactly 0.04 at 60Hz, equivalent easing at other refresh rates.
      const blend = 1 - Math.pow(1 - .04, delta / (1000 / 60))
      eased.x += (pointer.x - eased.x) * blend; eased.y += (pointer.y - eased.y) * blend
      paint()
      frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      scene = createOrbitScene(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), mst)
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      element.width = Math.round(scene.width * dpr); element.height = Math.round(scene.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pointer.x = pointer.y = eased.x = eased.y = 0
      if (!document.hidden && !print?.matches) paint()
    }
    const sync = () => {
      stop(); layer.hidden = print?.matches ?? false
      pointer.x = pointer.y = eased.x = eased.y = 0
      if (reduced?.matches) elapsed = 0
      if (!document.hidden && !print?.matches) paint()
      if (canAnimate()) frame = requestAnimationFrame(tick)
    }
    const move = (event: MouseEvent) => {
      if (!canAnimate() || !scene.desktop) return
      pointer.x = Math.max(-1, Math.min(1, event.clientX / scene.width * 2 - 1)) * 14
      pointer.y = Math.max(-1, Math.min(1, event.clientY / scene.height * 2 - 1)) * 10
    }
    const resetPointer = () => { pointer.x = pointer.y = 0 }
    resize(); sync()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('blur', resetPointer); document.addEventListener('mouseleave', resetPointer)
    document.addEventListener('visibilitychange', sync)
    reduced?.addEventListener('change', sync); print?.addEventListener('change', sync)
    return () => {
      stop()
      window.removeEventListener('resize', resize); window.removeEventListener('mousemove', move)
      window.removeEventListener('blur', resetPointer); document.removeEventListener('mouseleave', resetPointer)
      document.removeEventListener('visibilitychange', sync)
      reduced?.removeEventListener('change', sync); print?.removeEventListener('change', sync)
    }
  }, [mst])
  return <div ref={root} data-mst-orbit className="single-mst-orbit-background" aria-hidden="true" inert
    style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <canvas ref={canvas} className="mst-orbit-canvas" aria-hidden="true" />
  </div>
}
