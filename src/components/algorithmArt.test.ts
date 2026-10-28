import { expect, it, vi } from 'vitest'
import { paintIllustration } from './algorithmArt'
// Canvas is the rendering boundary; record actual drawing commands, not a DOM replica.
function recorder() {
  const labels: string[] = [], dashes: number[][] = [], radii: number[] = []
  const ctx = { save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, closePath() {},
    arc(_x: number, _y: number, r: number) { radii.push(r) },
    fillText(text: string) { labels.push(text) }, setLineDash(value: number[]) { dashes.push(value) } }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, labels, dashes, radii }
}
it('renders seven labelled binary-tree discs with readable node radii', () => {
  const r = recorder(); paintIllustration(r.ctx, 'tree')
  expect(r.labels).toEqual(['BINARY TREE', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])
  expect(r.radii.filter(n => n === 18)).toHaveLength(7)
})
it('renders a closed four-node cycle with four separate arrowheads', () => {
  const r = recorder(), closed = vi.spyOn(r.ctx, 'closePath')
  paintIllustration(r.ctx, 'directed')
  expect(r.labels).toEqual(['DIRECTED CYCLE', 'A', 'B', 'C', 'D'])
  expect(closed).toHaveBeenCalledTimes(4)
})
it('renders numeric weights on both dashed and solid network edges', () => {
  const r = recorder(); paintIllustration(r.ctx, 'mesh')
  expect(r.labels).toEqual(['WEIGHTED GRAPH', '3', '5', '8', '2', '6', '4', 'A', 'B', 'C', 'D', 'E'])
  expect(r.dashes.some(d => d.length === 2)).toBe(true)
  expect(r.dashes.some(d => d.length === 0)).toBe(true)
})
