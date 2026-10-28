import { useId } from 'react'
import type { RefObject } from 'react'
import type { Snapshot } from '../algorithms/types'
import type { TransitionPhase } from '../animation/playbackTiming'
import { EDGE_STYLES, VERTEX_POSITIONS, WEIGHT_POSITIONS } from './graphPresentation'

interface GraphViewProps {
  snapshot: Snapshot
  name: string
  svgRef: RefObject<SVGSVGElement | null>
  phase: TransitionPhase
  target?: Snapshot
}

export function GraphView({ snapshot, name, svgRef, phase, target }: GraphViewProps) {
  const descriptionId = useId()
  const candidate = target?.edges.find(edge => edge.id === target.edgeId)
  const phases = { idle: '선택한 단계 표시', entrance: '그래프 구성 중 · 조작하면 즉시 표시', focus: '검사 중', decision: '판정 연출 중', settle: '확정 준비 중', completion: 'MST 완료 연출', reading: '설명 읽기' }
  const disconnected = snapshot.algorithm === 'reverse-delete' && snapshot.components.length > 1
  return (
    <>
    <p className="motion-status" role="status">{phases[phase]}{candidate && ['focus', 'decision', 'settle'].includes(phase) ? ` · ${candidate.name} · 아래 정보는 ${snapshot.index}단계 확정 상태` : ''}</p>
    <svg ref={svgRef} className="graph-svg" viewBox="0 0 520 340" role="img" aria-label={`${name} 그래프`} aria-describedby={descriptionId} aria-busy={phase !== 'idle' && phase !== 'reading'}>
      <desc id={descriptionId}>
        {snapshot.edges.map((edge) => `${edge.name}: 가중치 ${edge.weight}, ${EDGE_STYLES[edge.status].label}`).join('. ')}.
        연결 요소 {snapshot.components.length}개. 현재 검사 간선은 금색 테두리로 표시됩니다. 아래 표에서도 간선별 상태를 확인할 수 있습니다.
      </desc>
      <rect className="stage-flash" aria-hidden="true" x="0" y="0" width="520" height="340" fill="#b9e8ff" opacity="0" />
      {snapshot.edges.map((edge) => {
        const start = VERTEX_POSITIONS[edge.source]
        const end = VERTEX_POSITIONS[edge.target]
        const label = WEIGHT_POSITIONS[edge.name]
        const style = EDGE_STYLES[edge.status]
        const current = edge.id === (target?.edgeId ?? snapshot.edgeId)
        return (
          <g key={edge.id} role="group" data-edge-id={edge.id} data-edge-name={edge.name} aria-label={`간선 ${edge.name}, 가중치 ${edge.weight}, ${style.label}`} aria-current={current ? 'true' : undefined}>
            {current && edge.status !== 'removed' && <line className="current-edge-halo" aria-hidden="true" x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeDasharray={style.dash} />}
            <line className="graph-edge" x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} />
            <line className="edge-effect" aria-hidden="true" x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={style.color} strokeWidth={style.width} opacity="0" />
            {current && <>
              <line className="edge-streak-glow" aria-hidden="true" x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth="10" opacity="0" />
              <line className="edge-streak" aria-hidden="true" x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth="3" opacity="0" />
              <circle className="light-head" aria-hidden="true" cx={start.x} cy={start.y} r="4" opacity="0" />
              <line className="edge-cut" aria-hidden="true" x1={start.x} y1={start.y} x2={(start.x + end.x) / 2} y2={(start.y + end.y) / 2} stroke="#ffcc67" strokeWidth="4" opacity="0" />
              <line className="edge-cut" aria-hidden="true" x1={end.x} y1={end.y} x2={(start.x + end.x) / 2} y2={(start.y + end.y) / 2} stroke="#ffcc67" strokeWidth="4" opacity="0" />
            </>}
            <g className="weight-label">
            <rect className={current ? 'weight-badge is-current' : 'weight-badge'} x={label.x - 17} y={label.y - 15} width="34" height="30" rx="8" />
            <text className="weight-text" x={label.x} y={label.y} dominantBaseline="central" textAnchor="middle">{edge.weight}</text>
            </g>
          </g>
        )
      })}
      {snapshot.components.flatMap((component, componentIndex) => component.map((vertex) => {
        const point = VERTEX_POSITIONS[vertex]
        return <g key={vertex} className="vertex" data-vertex={vertex} data-component={componentIndex}>
          {disconnected && <circle className="component-boundary" aria-hidden="true" cx={point.x} cy={point.y} r="27" stroke={componentIndex % 2 ? '#ffcc67' : '#65aaff'} />}
          <circle className="vertex-wave" aria-hidden="true" cx={point.x} cy={point.y} r="23" opacity="0" />
          <circle className="vertex-circle" cx={point.x} cy={point.y} r="21" />
          <text x={point.x} y={point.y} dominantBaseline="central" textAnchor="middle">{vertex}</text>
        </g>
      }))}
    </svg>
    <p className="stage-note">빛의 이동은 검사 강조이며 간선의 방향을 뜻하지 않습니다.{disconnected && ' 테두리 색은 분리된 연결 요소를 구분합니다.'}</p>
    </>
  )
}
