import { useId } from 'react'
import type { Snapshot } from '../algorithms/types'
import { EDGE_STYLES, VERTEX_POSITIONS, WEIGHT_POSITIONS } from './graphPresentation'

interface GraphViewProps {
  snapshot: Snapshot
  name: string
}

export function GraphView({ snapshot, name }: GraphViewProps) {
  const descriptionId = useId()
  return (
    <svg className="graph-svg" viewBox="0 0 520 340" role="img" aria-label={`${name} 그래프`} aria-describedby={descriptionId}>
      <desc id={descriptionId}>
        {snapshot.edges.map((edge) => `${edge.name}: 가중치 ${edge.weight}, ${EDGE_STYLES[edge.status].label}`).join('. ')}.
        연결 요소 {snapshot.components.length}개. 현재 검사 간선은 금색 테두리로 표시됩니다. 아래 표에서도 간선별 상태를 확인할 수 있습니다.
      </desc>
      {snapshot.edges.map((edge) => {
        const start = VERTEX_POSITIONS[edge.source]
        const end = VERTEX_POSITIONS[edge.target]
        const label = WEIGHT_POSITIONS[edge.name]
        const style = EDGE_STYLES[edge.status]
        const current = edge.id === snapshot.edgeId
        return (
          <g key={edge.id} role="group" aria-label={`간선 ${edge.name}, 가중치 ${edge.weight}, ${style.label}`} aria-current={current ? 'true' : undefined}>
            {current && <line className="current-edge-halo" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />}
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} />
            <rect className={current ? 'weight-badge is-current' : 'weight-badge'} x={label.x - 15} y={label.y - 13} width="30" height="26" rx="8" />
            <text className="weight-text" x={label.x} y={label.y} dominantBaseline="central" textAnchor="middle">{edge.weight}</text>
          </g>
        )
      })}
      {snapshot.components.flat().map((vertex) => {
        const point = VERTEX_POSITIONS[vertex]
        return <g key={vertex} className="vertex"><circle cx={point.x} cy={point.y} r="21" /><text x={point.x} y={point.y} dominantBaseline="central" textAnchor="middle">{vertex}</text></g>
      })}
    </svg>
  )
}
