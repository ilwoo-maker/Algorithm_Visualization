/** Fixed decorative presets. Never derived from the interactive Lab graph. */
export type ArtKind = 'tree' | 'directed' | 'mesh' | 'k5'
type Point = readonly [number, number]
type Edge = readonly [number, number, number?, boolean?]
interface Art { title: string; color: string; nodes: readonly Point[]; edges: readonly Edge[] }
const pentagon: readonly Point[] = [[220, 70], [370, 180], [312, 350], [128, 350], [70, 180]]
export const algorithmArt: Record<ArtKind, Art> = {
  tree: { title: 'BINARY TREE', color: '#10b981', nodes: [[220, 92], [128, 195], [312, 195], [62, 312], [174, 312], [266, 312], [378, 312]], edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]] },
  directed: { title: 'DIRECTED CYCLE', color: '#38bdf8', nodes: [[125, 110], [330, 110], [330, 310], [125, 310]], edges: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  mesh: { title: 'WEIGHTED GRAPH', color: '#67e8cf', nodes: [[85, 125], [245, 85], [365, 210], [245, 335], [75, 300]], edges: [[0, 1, 3], [1, 2, 5, true], [2, 3, 8], [3, 4, 2, true], [4, 0, 6], [0, 3, 4]] },
  k5: { title: 'COMPLETE GRAPH · K5', color: '#a5b4fc', nodes: pentagon, edges: pentagon.flatMap((_, a) => pentagon.slice(a + 1).map((__, b) => [a, a + b + 1] as const)) },
}

/** Trim edges to the outside of the node discs, including the arrow tip. */
export function edgeSegment(from: Point, to: Point) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const ux = (to[0] - from[0]) / length, uy = (to[1] - from[1]) / length
  return { x1: from[0] + ux * 22, y1: from[1] + uy * 22, x2: to[0] - ux * 24, y2: to[1] - uy * 24, ux, uy }
}
export function paintIllustration(ctx: CanvasRenderingContext2D, kind: ArtKind) {
  const art = algorithmArt[kind]
  ctx.save()
  ctx.strokeStyle = art.color; ctx.fillStyle = art.color
  ctx.font = '600 12px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.globalAlpha = .8; ctx.fillText(art.title, 220, 27); ctx.globalAlpha = 1
  ctx.shadowColor = art.color; ctx.shadowBlur = 14; ctx.lineWidth = 2.25
  for (const [a, b, weight, dashed] of art.edges) {
    const s = edgeSegment(art.nodes[a], art.nodes[b])
    ctx.globalAlpha = kind === 'k5' ? .52 : .86
    ctx.setLineDash(dashed ? [7, 7] : [])
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); ctx.setLineDash([])
    if (kind === 'directed') {
      // Mid-edge arrows remain obvious even with packets passing nearby.
      const x = (s.x1 + s.x2) / 2 + s.ux * 9, y = (s.y1 + s.y2) / 2 + s.uy * 9
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.lineTo(x - s.ux * 13 - s.uy * 7, y - s.uy * 13 + s.ux * 7)
      ctx.lineTo(x - s.ux * 13 + s.uy * 7, y - s.uy * 13 - s.ux * 7)
      ctx.closePath(); ctx.fill()
    }
    if (weight !== undefined) {
      const x = (s.x1 + s.x2) / 2, y = (s.y1 + s.y2) / 2
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2)
      ctx.fillStyle = '#102a36'; ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#e3fff8'; ctx.font = '600 13px ui-monospace, monospace'; ctx.fillText(String(weight), x, y)
      ctx.fillStyle = art.color; ctx.shadowBlur = 14
    }
  }
  ctx.globalAlpha = 1
  art.nodes.forEach(([x, y], i) => {
    ctx.shadowBlur = 16; ctx.lineWidth = 2.25
    ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#102833'; ctx.fill(); ctx.stroke()
    ctx.shadowBlur = 0; ctx.fillStyle = '#e6fff9'; ctx.font = '600 14px ui-monospace, monospace'
    ctx.fillText(String.fromCharCode(65 + i), x, y)
  })
  ctx.restore()
}

export function paintPacket(ctx: CanvasRenderingContext2D, kind: ArtKind, elapsed: number, offset: number) {
  const art = algorithmArt[kind], position = elapsed / (2100 + offset * 350) + offset
  const edge = Math.floor(position) % art.edges.length, progress = position % 1
  const [a, b] = art.edges[edge], s = edgeSegment(art.nodes[a], art.nodes[b])
  ctx.save(); ctx.shadowColor = art.color; ctx.shadowBlur = 14; ctx.fillStyle = '#edfff9'
  ctx.beginPath(); ctx.arc(s.x1 + (s.x2 - s.x1) * progress, s.y1 + (s.y2 - s.y1) * progress, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.restore()
}
