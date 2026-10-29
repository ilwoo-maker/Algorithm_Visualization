import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { NormalizedEdge } from '../algorithms/types'

export const ORBIT_RINGS = [
  { factor: .26, width: 1.2, ticks: 16, color: 'rgba(56,189,248,.45)', text: 'MINIMUM SPANNING TREE' },
  { factor: .44, width: 1.4, ticks: 28, color: 'rgba(16,185,129,.42)', text: 'STAGE: 01 // EXPANDED GRAPH ORBIT' },
  { factor: .72, width: 1.8, ticks: 52, color: 'rgba(56,189,248,.5)', text: 'GREEDY MINIMUM EDGE QUEUE // UNION-FIND DISJOINT SET' },
  { factor: 1.05, width: 1.3, ticks: 40, color: 'rgba(245,158,11,.35)', text: 'SUB // TEST CUT BFS · CONNECTIVITY CHECK' },
  { factor: 1.35, width: 1, ticks: 64, color: 'rgba(148,163,184,.25)', text: 'UNDIRECTED WEIGHTED GRAPH // ALGORITHM LAB' },
] as const
type Point = Readonly<{ x: number; y: number }>
const colors: Record<string, string> = { A: '#10b981', C: '#10b981', B: '#38bdf8', E: '#38bdf8', D: '#f59e0b' }
// Reference-video pacing, independent of Lab playback and pointer easing.
const MOTION = {
  ringRadiansPerSecond: [.12, -.14, .09, -.055, .035],
  satelliteRadiansPerSecond: [.95, -.72, .66, -.46, .42, -.29, .26, -.18],
  packetCyclesPerSecond: .8,
} as const

/** Layout only: reads a completed run's edge IDs; never computes graph decisions. */
export function createOrbitScene(width: number, height: number, mst: readonly NormalizedEdge[]) {
  const desktop = width >= 1200, cx = width * (desktop ? .58 : .5), cy = desktop ? height * .49 : Math.min(260, height * .4)
  const cardRight = Math.max(40, (width - 1280) / 2) + 440
  // Reserve node + halo + maximum parallax beyond the card's right edge.
  const clearanceR = (cx - cardRight - 64) / (.72 / Math.SQRT2)
  const baseR = desktop ? Math.max(1, Math.min(560, width * .37, height * .56, clearanceR)) : Math.min(350, width * .65, height * .48)
  const offset = baseR * .72 / Math.SQRT2
  const nodes: Readonly<Record<string, Point>> = { B: { x: 0, y: 0 }, A: { x: -offset, y: -offset }, C: { x: -offset, y: offset }, E: { x: offset, y: -offset }, D: { x: offset, y: offset } }
  const selected = new Set(mst.map(edge => edge.id))
  const edges = ASSIGNMENT_GRAPH.edges.map(edge => ({ ...edge, name: [edge.source, edge.target].sort().join(''), selected: selected.has(JSON.stringify([edge.source, edge.target].sort())) }))
  const satellites = [0, 1, 1, 2, 2, 3, 3, 4].map((ring, index) => ({ ring, phase: index * 2.399, speed: MOTION.satelliteRadiansPerSecond[index] }))
  return { width, height, cx, cy, baseR, nodes, edges, satellites, desktop }
}
export type OrbitScene = ReturnType<typeof createOrbitScene>
export function orbitTag(scene: OrbitScene) {
  const compact = !scene.desktop, width = compact ? Math.min(212, Math.max(60, scene.nodes.C.y - 42)) : 212
  return { x: -width / 2, y: compact ? 39 : 43, width, height: compact ? 30 : 27, compact }
}

function segment(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, width: number, blur = 0) {
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y)
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.stroke(); ctx.shadowBlur = 0
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2) }
function arcText(ctx: CanvasRenderingContext2D, text: string, radius: number, angle: number, color: string) {
  ctx.save(); ctx.font = '9px ui-monospace, Consolas, monospace'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  for (const letter of text) {
    const advance = (ctx.measureText(letter).width + 1.2) / radius
    ctx.save(); ctx.rotate(angle + advance / 2); ctx.translate(0, -radius - 12); ctx.fillText(letter, 0, 0); ctx.restore()
    angle += advance
  }
  ctx.restore()
}

/** All visual state is decorative. No Canvas state is ever written back to React/Lab. */
export function drawOrbit(ctx: CanvasRenderingContext2D, scene: OrbitScene, seconds: number, parallax: Point, scroll: number) {
  const { width, height, cx, cy, baseR, nodes } = scene
  ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = 1
  ctx.fillStyle = '#040814'; ctx.fillRect(0, 0, width, height)
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.6)
  aura.addColorStop(0, 'rgba(8,70,83,.22)'); aura.addColorStop(.5, 'rgba(6,34,52,.14)'); aura.addColorStop(1, 'rgba(4,8,20,0)')
  ctx.fillStyle = aura; ctx.fillRect(0, 0, width, height)
  ctx.translate(cx + parallax.x, cy + parallax.y - 48 * scroll); ctx.scale(1 - .25 * scroll, 1 - .25 * scroll)
  ctx.lineCap = 'round'
  for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]) {
    const x = Math.cos(angle) * baseR * 1.35, y = Math.sin(angle) * baseR * 1.35
    segment(ctx, { x: -x, y: -y }, { x, y }, 'rgba(56,189,248,.1)', .6)
  }
  ORBIT_RINGS.forEach((ring, index) => {
    const radius = baseR * ring.factor, rotation = seconds * MOTION.ringRadiansPerSecond[index] + index * .9
    circle(ctx, 0, 0, radius); ctx.lineWidth = ring.width; ctx.strokeStyle = ring.color
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = index === 2 ? 18 : 0; ctx.stroke(); ctx.shadowBlur = 0
    for (let tick = 0; tick < ring.ticks; tick++) {
      const angle = tick / ring.ticks * Math.PI * 2 + rotation, length = tick % 4 ? 3 : 6
      segment(ctx, { x: Math.cos(angle) * (radius - length), y: Math.sin(angle) * (radius - length) }, { x: Math.cos(angle) * (radius + 3), y: Math.sin(angle) * (radius + 3) }, ring.color, .8)
    }
    arcText(ctx, ring.text, radius, rotation, ring.color)
  })
  for (const satellite of scene.satellites) {
    const radius = baseR * ORBIT_RINGS[satellite.ring].factor, angle = seconds * satellite.speed + satellite.phase
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius, color = satellite.ring === 3 ? '#f59e0b' : satellite.ring === 1 ? '#10b981' : '#38bdf8'
    ctx.shadowColor = color; ctx.shadowBlur = 13; ctx.fillStyle = color; circle(ctx, x, y, 3); ctx.fill(); ctx.shadowBlur = 0
    circle(ctx, x, y, 6); ctx.strokeStyle = color; ctx.lineWidth = .8; ctx.stroke()
  }
  scene.edges.forEach((edge, index) => {
    const from = nodes[edge.source], to = nodes[edge.target], outer = edge.source === 'B' ? edge.target : edge.source, color = colors[outer]
    if (edge.selected) {
      segment(ctx, from, to, color, 4.2, 24)
      segment(ctx, from, to, '#e8fff9', 1.4)
      const fraction = (seconds * MOTION.packetCyclesPerSecond + index * .21) % 1, point = nodes[outer]
      ctx.fillStyle = '#f1fff9'; ctx.shadowColor = color; ctx.shadowBlur = 16
      circle(ctx, point.x * fraction, point.y * fraction, 3.5); ctx.fill(); ctx.shadowBlur = 0
    } else segment(ctx, from, to, 'rgba(148,163,184,.4)', 1.6)
    const x = (from.x + to.x) / 2, y = (from.y + to.y) / 2
    circle(ctx, x, y, 13); ctx.fillStyle = '#061522'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = edge.selected ? color : '#546172'
    ctx.shadowColor = color; ctx.shadowBlur = edge.selected ? 10 : 0; ctx.stroke(); ctx.shadowBlur = 0
    ctx.font = '600 12px ui-monospace, Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = edge.selected ? '#e9fff8' : '#a2afc2'; ctx.fillText(String(edge.weight), x, y)
  })
  for (const [name, point] of Object.entries(nodes)) {
    const center = name === 'B', color = colors[name]
    // time += 0.02 per 60Hz frame, expressed in seconds for refresh-rate independence.
    const breathingTime = seconds * 1.2, pulse = Math.sin(breathingTime * 2 + (center ? 0 : 1.5))
    const radius = (center ? 28 : 22) + pulse * (center ? 2.4 : 1.4)
    circle(ctx, point.x, point.y, radius); ctx.fillStyle = '#071b29'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2.2
    ctx.shadowColor = color; ctx.shadowBlur = (center ? 28 : 18) + pulse * 4; ctx.stroke(); ctx.shadowBlur = 0
    circle(ctx, point.x, point.y, radius + 5); ctx.lineWidth = .8; ctx.stroke()
    ctx.font = `700 ${name === 'B' ? 22 : 17}px ui-monospace, Consolas, monospace`; ctx.fillStyle = '#e1f4ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, point.x, point.y)
  }
  const tag = orbitTag(scene)
  ctx.beginPath(); ctx.roundRect(tag.x, tag.y, tag.width, tag.height, 5); ctx.fillStyle = '#071b29'; ctx.fill(); ctx.strokeStyle = 'rgba(56,189,248,.55)'; ctx.lineWidth = .8; ctx.stroke()
  // Vector lightning avoids missing emoji glyphs in Canvas font fallbacks.
  const boltX = tag.compact ? -27 : -94, boltY = tag.y + 5
  ctx.beginPath(); ctx.moveTo(boltX + 5, boltY); ctx.lineTo(boltX, boltY + 6); ctx.lineTo(boltX + 3, boltY + 6); ctx.lineTo(boltX + 1, boltY + 11); ctx.lineTo(boltX + 7, boltY + 4); ctx.lineTo(boltX + 4, boltY + 4); ctx.closePath(); ctx.fillStyle = '#f59e0b'; ctx.fill()
  ctx.fillStyle = '#7dd3fc'; ctx.font = `600 ${tag.compact ? 8 : 10}px ui-monospace, Consolas, monospace`
  if (tag.compact) { ctx.fillText('MINIMUM', 4, tag.y + 10); ctx.fillText('SPANNING TREE', 0, tag.y + 22) }
  else ctx.fillText('MINIMUM SPANNING TREE', 7, tag.y + 14)
  ctx.restore()
}
