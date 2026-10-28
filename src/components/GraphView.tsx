import { useId, useRef } from 'react'
import type { Snapshot } from '../algorithms/types'
import { useEdgeTransition } from '../animation/useEdgeTransition'
import { EDGE_STYLES, VERTEX_POSITIONS, WEIGHT_POSITIONS } from './graphPresentation'

interface GraphViewProps {
  snapshot: Snapshot
  name: string
  animateForward?: boolean
}

export function GraphView({ snapshot, name, animateForward = false }: GraphViewProps) {
  const descriptionId = useId()
  const svg = useRef<SVGSVGElement>(null)
  const transitioning = useEdgeTransition(svg, snapshot, animateForward)
  return (
    <>
    <p className="motion-status" role="status">{transitioning ? '간선 전환 중 · 선택한 단계 기준' : '선택한 단계 표시'}</p>
    <svg ref={svg} className="graph-svg" viewBox="0 0 520 340" role="img" aria-label={`${name} 그래프`} aria-describedby={descriptionId} aria-busy={transitioning}>
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
            <line className="graph-edge" x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} />
            {current && <line className="edge-effect" aria-hidden="true" x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={style.color} strokeWidth={style.width} opacity="0" />}
            <rect className={current ? 'weight-badge is-current' : 'weight-badge'} x={label.x - 17} y={label.y - 15} width="34" height="30" rx="8" />
            <text className="weight-text" x={label.x} y={label.y} dominantBaseline="central" textAnchor="middle">{edge.weight}</text>
          </g>
        )
      })}
      {snapshot.components.flat().map((vertex) => {
        const point = VERTEX_POSITIONS[vertex]
        return <g key={vertex} className="vertex"><circle cx={point.x} cy={point.y} r="21" /><text x={point.x} y={point.y} dominantBaseline="central" textAnchor="middle">{vertex}</text></g>
      })}
    </svg>
    </>
  )
}
