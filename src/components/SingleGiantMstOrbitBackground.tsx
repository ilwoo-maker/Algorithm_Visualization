import { useId, useRef } from 'react'
import { useMstOrbitMotion } from '../animation/useMstOrbitMotion'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { NormalizedEdge } from '../algorithms/types'
import './singleGiantMstOrbit.css'

const points: Record<string, readonly [number, number]> = { B: [500, 500], A: [260, 290], C: [260, 710], E: [740, 290], D: [740, 710] }
const ringRadii = [115, 215, 340, 465]
const ringLabels = ['MINIMUM SPANNING TREE', 'GREEDY MINIMUM EDGE QUEUE', 'UNION-FIND DISJOINT SET', '5 VERTICES / 7 EDGES / CONNECTED COMPONENTS']

/** Read-only final-result artwork. No algorithm execution or Lab state ownership. */
export function SingleGiantMstOrbitBackground({ mst }: { mst: readonly NormalizedEdge[] }) {
  const id = useId(), selected = new Set(mst.map(edge => edge.id))
  const root = useRef<HTMLDivElement>(null)
  useMstOrbitMotion(root)
  return <div ref={root} data-mst-orbit className="single-mst-orbit-background" aria-hidden="true" inert
    style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <div className="mst-orbit-anchor" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <div className="mst-orbit-scroll">
        <svg viewBox="0 0 1000 1000" focusable="false" aria-hidden="true" style={{ opacity: 0.26 }}>
          <defs>
            <radialGradient id={`${id}-aura`}><stop stopColor="#2ee7ce" stopOpacity=".35" /><stop offset=".48" stopColor="#16a8b6" stopOpacity=".1" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
            <linearGradient id={`${id}-core`}><stop stopColor="#34d399" /><stop offset="1" stopColor="#38bdf8" /></linearGradient>
            <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
            {ringRadii.map((radius, index) => <path id={`${id}-arc-${index}`} key={radius} d={`M${500 - radius} 500 a${radius} ${radius} 0 1 1 ${radius * 2} 0 a${radius} ${radius} 0 1 1 ${-radius * 2} 0`} />)}
          </defs>
          <circle cx="500" cy="500" r="440" fill={`url(#${id}-aura)`} />
          {ringRadii.map((radius, index) => <g className="orbit-ring" key={radius} data-orbit-ring={index}>
            <circle cx="500" cy="500" r={radius} fill="none" stroke="#38bdf8" strokeOpacity=".15" strokeWidth={index === 3 ? 1.2 : 1} strokeDasharray={index % 2 ? '3 10' : undefined} />
            <circle cx="500" cy={500 - radius} r={index % 2 ? 2 : 3} fill="#7ee7ff" opacity=".75" />
            <text fill="#89d9e9" fontSize={index === 3 ? 11 : 10} letterSpacing="2.5" opacity=".72"><textPath href={`#${id}-arc-${index}`} startOffset={`${12 + index * 16}%`}>{ringLabels[index]}</textPath></text>
          </g>)}
          <g className="orbit-breath">
            {ASSIGNMENT_GRAPH.edges.map(edge => {
              const name = [edge.source, edge.target].sort().join(''), key = JSON.stringify([edge.source, edge.target].sort())
              const [x1, y1] = points[edge.source], [x2, y2] = points[edge.target]
              const isMst = selected.has(key), outer = edge.source === 'B' ? edge.target : edge.source
              const color = isMst ? points[outer][0] < 500 ? '#34d399' : '#38bdf8' : '#c1ac79'
              return <g key={key} data-orbit-edge={name}>
                {isMst && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="13" strokeOpacity=".55" filter={`url(#${id}-glow)`} />}
                <line className="orbit-edge" x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={isMst ? 3.5 : 1.2} strokeOpacity={isMst ? 1 : .35} strokeDasharray={isMst ? undefined : '6 8'} />
                {isMst && <path className="orbit-packet" d={`M500 500 L${points[outer][0]} ${points[outer][1]}`} pathLength="100" fill="none" stroke="#d9fff5" strokeWidth="5" strokeDasharray="2 98" strokeLinecap="round" />}
                <g className="orbit-weight"><rect x={(x1 + x2) / 2 - 18} y={(y1 + y2) / 2 - 18} width="36" height="36" rx="18" fill="#0a1d2c" stroke={color} strokeWidth={isMst ? 1.7 : 1} strokeOpacity={isMst ? .9 : .4} /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2} textAnchor="middle" dominantBaseline="central" fill={isMst ? '#e2fff8' : '#c6bd9d'} fontSize="17" fontWeight="600">{edge.weight}</text></g>
              </g>
            })}
            {ASSIGNMENT_GRAPH.vertices.map(vertex => {
              const [x, y] = points[vertex], center = vertex === 'B', radius = center ? 42 : 27
              const color = center ? `url(#${id}-core)` : x < 500 ? '#34d399' : '#38bdf8'
              return <g key={vertex} data-orbit-node={vertex}>
                <circle cx={x} cy={y} r={radius * 2.3} fill={`url(#${id}-aura)`} />
                <circle cx={x} cy={y} r={radius + 3} fill="none" stroke={color} strokeWidth="9" strokeOpacity=".6" filter={`url(#${id}-glow)`} />
                <circle className="orbit-node-disc" cx={x} cy={y} r={radius} fill={center ? '#0d3548' : '#0c2330'} stroke={color} strokeWidth={center ? 3 : 2} />
                <text x={x} y={y} fill={center ? '#91f3ed' : '#ddfff4'} fontSize={center ? 30 : 23} fontWeight="600" textAnchor="middle" dominantBaseline="central">{vertex}</text>
              </g>
            })}
          </g>
        </svg>
      </div>
    </div>
  </div>
}
