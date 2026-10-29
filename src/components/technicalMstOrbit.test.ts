import { expect, it } from 'vitest'
import { recordingContext } from '../test/orbitContext'
import { kruskal } from '../algorithms/kruskal'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import { createOrbitScene, drawOrbit, orbitTag, ORBIT_RINGS } from './technicalMstOrbit'

const result = kruskal(ASSIGNMENT_GRAPH)
if (!result.ok) throw new Error('Fixture must succeed')
const mst = result.value.mst
it('defines exactly five solid rings with the specified radii and radar tick counts', () => {
  expect(ORBIT_RINGS.map(ring => ring.factor)).toEqual([.26, .44, .72, 1.05, 1.35])
  expect(ORBIT_RINGS.map(ring => ring.ticks)).toEqual([16, 28, 52, 40, 64])
  const scene = createOrbitScene(1440, 900, mst)
  expect(scene.satellites).toHaveLength(8)
  expect(scene.cx).toBe(1440 * .58); expect(scene.cy).toBe(900 * .49)
})
it('reads all seven fixture weights and four final-run edges without recalculating the algorithm', () => {
  const scene = createOrbitScene(1440, 900, mst)
  expect(scene.edges.map(edge => [edge.name, edge.weight])).toEqual([['BC', 1], ['BD', 1], ['AB', 2], ['AC', 3], ['BE', 4], ['CD', 5], ['DE', 7]])
  expect(scene.edges.filter(edge => edge.selected).map(edge => edge.name).sort()).toEqual(['AB', 'BC', 'BD', 'BE'])
  expect(createOrbitScene(1440, 900, []).edges.some(edge => edge.selected)).toBe(false)
})
it.each([1200, 1280, 1440, 1920, 2560])('reserves room for the full 440px Hero and B/C glow at desktop width %s', width => {
  const scene = createOrbitScene(width, 900, mst), cardRight = Math.max(40, (width - 1280) / 2) + 440
  expect(scene.cx + scene.nodes.C.x - 14 - 48).toBeGreaterThanOrEqual(cardRight)
  expect(scene.cx - 14 - 48).toBeGreaterThan(cardRight)
})
it.each([320, 390, 768])('keeps all five node discs inside narrow viewport width %s', width => {
  const scene = createOrbitScene(width, 800, mst)
  for (const point of Object.values(scene.nodes)) {
    expect(scene.cx + point.x - 28).toBeGreaterThanOrEqual(0)
    expect(scene.cx + point.x + 28).toBeLessThanOrEqual(width)
  }
})
it('paints solid candidates and white-core neon MST strokes without requesting any dashed line', () => {
  const { context, methods, strokes } = recordingContext()
  drawOrbit(context, createOrbitScene(1440, 900, mst), 0, { x: 0, y: 0 }, 0)
  expect(methods.setLineDash).not.toHaveBeenCalled()
  expect(strokes.filter(stroke => stroke.width === 4.2 && stroke.blur === 24)).toHaveLength(4)
  expect(strokes.filter(stroke => stroke.width === 1.4 && stroke.color === '#e8fff9')).toHaveLength(4)
  expect(strokes.filter(stroke => stroke.width === 1.6)).toHaveLength(3)
  for (const node of ['A', 'B', 'C', 'D', 'E']) expect(methods.fillText).toHaveBeenCalledWith(node, expect.any(Number), expect.any(Number))
})
it('animates only decorative drawing coordinates and retains the immutable graph data', () => {
  const scene = createOrbitScene(1440, 900, mst), before = JSON.stringify(scene)
  const first = recordingContext(), next = recordingContext()
  drawOrbit(first.context, scene, 0, { x: 0, y: 0 }, 0)
  drawOrbit(next.context, scene, 10, { x: 12, y: -8 }, 1)
  expect(next.methods.translate).toHaveBeenCalledWith(scene.cx + 12, scene.cy - 8 - 48)
  expect(next.methods.scale).toHaveBeenCalledWith(.75, .75)
  expect(next.methods.arc.mock.calls).not.toEqual(first.methods.arc.mock.calls)
  expect(JSON.stringify(scene)).toBe(before)
})
it.each([[320, 844], [390, 844], [844, 390], [1440, 900]])('keeps the B tag clear of every weight badge at %sx%s', (width, height) => {
  const scene = createOrbitScene(width, height, mst), tag = orbitTag(scene)
  for (const edge of scene.edges) {
    const x = (scene.nodes[edge.source].x + scene.nodes[edge.target].x) / 2
    const y = (scene.nodes[edge.source].y + scene.nodes[edge.target].y) / 2
    const separated = tag.x + tag.width + 2 < x - 14 || tag.x - 2 > x + 14 || tag.y + tag.height + 2 < y - 14 || tag.y - 2 > y + 14
    expect(separated).toBe(true)
  }
})
it('breathes every node with phase-offset radius, synchronized glow and a following rim', () => {
  const scene = createOrbitScene(1440, 900, mst), start = recordingContext(), peak = recordingContext()
  drawOrbit(start.context, scene, 0, { x: 0, y: 0 }, 0)
  drawOrbit(peak.context, scene, Math.PI / 4.8, { x: 0, y: 0 }, 0)
  const radii = (recording: ReturnType<typeof recordingContext>) => recording.methods.arc.mock.calls.slice(-10).map(call => Number(call[2]))
  const before = radii(start), after = radii(peak)
  expect(before[0]).toBeCloseTo(28); expect(after[0]).toBeCloseTo(30.4)
  for (const index of [2, 4, 6, 8]) {
    expect(before[index]).toBeCloseTo(22 + Math.sin(1.5) * 1.4)
    expect(after[index]).toBeCloseTo(22 + Math.sin(Math.PI / 2 + 1.5) * 1.4)
  }
  for (let index = 0; index < 10; index += 2) expect(after[index + 1] - after[index]).toBeCloseTo(5)
  expect(peak.strokes.filter(stroke => stroke.width === 2.2).map(stroke => stroke.blur)).toEqual([32, ...Array(4).fill(18 + Math.sin(Math.PI / 2 + 1.5) * 4)])
})
