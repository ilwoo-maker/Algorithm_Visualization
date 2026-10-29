import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { Snapshot } from '../algorithms/types'
import { EDGE_STYLES, VERTEX_POSITIONS, VERTEX_STYLE, WEIGHT_POSITIONS } from './graphPresentation'

/** Decorative graph; the adjacent text provides its accessible explanation. */
export function StoryGraph({ snapshot }: { snapshot?: Snapshot }) {
  return <svg viewBox="0 0 520 340" aria-hidden="true" className="story-graph">
    {ASSIGNMENT_GRAPH.edges.map(edge => {
      const name = edge.source + edge.target, start = VERTEX_POSITIONS[edge.source], end = VERTEX_POSITIONS[edge.target], label = WEIGHT_POSITIONS[name]
      const style = EDGE_STYLES[snapshot?.edges.find(item => item.name === name)?.status ?? 'present']
      return <g key={name}><line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} />
        <rect x={label.x - 17} y={label.y - 15} width="34" height="30" rx="8" className="weight-badge" /><text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" className="weight-text">{edge.weight}</text></g>
    })}
    {ASSIGNMENT_GRAPH.vertices.map(vertex => { const point = VERTEX_POSITIONS[vertex]; return <g key={vertex} className="story-vertex"><circle cx={point.x} cy={point.y} r="21" fill={VERTEX_STYLE.fill} stroke={VERTEX_STYLE.stroke} strokeWidth="2" /><text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fill={VERTEX_STYLE.label}>{vertex}</text></g> })}
  </svg>
}
