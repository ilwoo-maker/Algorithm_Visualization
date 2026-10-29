import { vi } from 'vitest'
export function recordingContext() {
  const strokes: { color: string; width: number; blur: number }[] = []
  const context = {
    strokeStyle: '', lineWidth: 1, shadowBlur: 0,
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), closePath: vi.fn(), arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(() => strokes.push({ color: String(context.strokeStyle), width: context.lineWidth, blur: context.shadowBlur })),
    fill: vi.fn(), fillRect: vi.fn(), clearRect: vi.fn(), roundRect: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), setTransform: vi.fn(),
    fillText: vi.fn(), measureText: vi.fn(() => ({ width: 6 })), setLineDash: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  }
  return { context: context as unknown as CanvasRenderingContext2D, methods: context, strokes }
}
