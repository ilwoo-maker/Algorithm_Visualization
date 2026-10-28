import { useId, useRef } from 'react'
import { useFloatingBackground } from '../animation/useFloatingBackground'
import './floatingBackground.css'

type Point = readonly [number, number, number]
interface Illustration { kind: string; color: string; nodes: readonly Point[]; edges: readonly (readonly [number, number])[]; packet: string }
const pentagon: readonly Point[] = [[220, 42, 8], [392, 165, 6], [326, 360, 5], [114, 360, 7], [48, 165, 5]]
const artworks: readonly Illustration[] = [
  { kind: 'tree', color: '#10b981', nodes: [[220, 52, 9], [118, 158, 6.5], [322, 158, 6.5], [54, 292, 4.5], [166, 292, 5], [274, 292, 5], [386, 292, 4.5]], edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], packet: 'M220 52 L118 158 L54 292' },
  { kind: 'k5', color: '#38bdf8', nodes: pentagon, edges: pentagon.flatMap((_, i) => pentagon.slice(i + 1).map((__, j) => [i, i + j + 1] as const)), packet: 'M220 42 L326 360' },
  { kind: 'directed', color: '#f59e0b', nodes: [[96, 100, 7], [348, 118, 6], [220, 334, 8], [386, 298, 5]], edges: [[0, 1], [1, 2], [2, 0], [1, 3]], packet: 'M96 100 L348 118 L220 334 Z' },
  { kind: 'mesh', color: '#67d8cb', nodes: [[65, 76, 5], [212, 56, 6], [372, 98, 4], [48, 208, 6], [220, 182, 9], [390, 234, 5], [90, 342, 4], [242, 328, 6], [368, 358, 4]], edges: [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8], [0, 4], [4, 8]], packet: 'M65 76 L220 182 L368 358' },
]

export function AlgorithmFloatingBackground() {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  useFloatingBackground(root)
  return <div ref={root} data-algorithm-background className="algorithm-floating-background" aria-hidden="true" inert
    style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <div className="floating-art-field">{artworks.map((art, index) => {
      const prefix = `${id}-${art.kind}`
      return <div className={`art-anchor art-${art.kind}`} data-art-cluster={art.kind} data-depth={index} key={art.kind}>
        <div className="art-scroll"><div className="art-mouse"><div className="art-float">
          <svg viewBox="0 0 440 410" focusable="false" aria-hidden="true">
            <defs>
              <radialGradient id={`${prefix}-halo`}><stop stopColor={art.color} stopOpacity=".5" /><stop offset=".55" stopColor={art.color} stopOpacity=".1" /><stop offset="1" stopColor={art.color} stopOpacity="0" /></radialGradient>
              <filter id={`${prefix}-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
              <marker id={`${prefix}-arrow`} viewBox="0 0 10 10" refX="23" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill={art.color} /></marker>
            </defs>
            <ellipse cx="220" cy="208" rx="192" ry="116" fill="none" stroke={art.color} strokeOpacity=".09" strokeDasharray="2 13" />
            <g filter={`url(#${prefix}-glow)`}>{art.edges.map(([a, b], edge) => <line key={edge} x1={art.nodes[a][0]} y1={art.nodes[a][1]} x2={art.nodes[b][0]} y2={art.nodes[b][1]} stroke={art.color} strokeWidth="7" strokeOpacity={art.kind === 'k5' ? '.14' : '.23'} />)}</g>
            {art.edges.map(([a, b], edge) => <g key={edge} data-art-edge={`${a}-${b}`}>
              <line className="art-edge" x1={art.nodes[a][0]} y1={art.nodes[a][1]} x2={art.nodes[b][0]} y2={art.nodes[b][1]} stroke={art.color} strokeWidth={edge % 3 ? 1.3 : 1.8} strokeOpacity={edge % 3 ? '.5' : '.8'} markerEnd={art.kind === 'directed' ? `url(#${prefix}-arrow)` : undefined} />
              {art.kind === 'mesh' && edge % 4 === 0 && <g className="art-weight"><rect x={(art.nodes[a][0] + art.nodes[b][0]) / 2 - 11} y={(art.nodes[a][1] + art.nodes[b][1]) / 2 - 9} width="22" height="18" rx="6" fill="#102a36" stroke={art.color} strokeOpacity=".4" /><text x={(art.nodes[a][0] + art.nodes[b][0]) / 2} y={(art.nodes[a][1] + art.nodes[b][1]) / 2} fill="#d4fff5" textAnchor="middle" dominantBaseline="central" fontSize="10">{[3, 5, 2, 8][edge / 4]}</text></g>}
            </g>)}
            <path className="art-packet" d={art.packet} pathLength="100" fill="none" stroke={art.color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 96" strokeOpacity=".95" />
            {art.nodes.map(([x, y, radius], node) => <g key={node} data-art-node={node} opacity={node % 3 === 2 ? '.65' : '1'}>
              <circle cx={x} cy={y} r={radius * 4} fill={`url(#${prefix}-halo)`} />
              <circle cx={x} cy={y} r={radius + 4} fill="#091826" stroke={art.color} strokeOpacity=".35" strokeWidth=".8" />
              <circle cx={x} cy={y} r={radius} fill={art.color} fillOpacity={node === 0 ? '.9' : '.6'} /><circle cx={x - radius * .2} cy={y - radius * .2} r={radius * .38} fill="#e9fff9" fillOpacity=".8" />
            </g>)}
          </svg>
        </div></div></div>
      </div>
    })}</div>
  </div>
}
