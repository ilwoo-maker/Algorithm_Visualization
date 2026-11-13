import type { Action, EdgeStatus } from '../algorithms/types'

// Keep readable interiors independent of inspection/bloom stroke colors.
export const VERTEX_STYLE = { fill: '#213e53', label: '#eef8ff', stroke: '#a4bdce' } as const

export const GRAPH_VIEWBOX = { width: 500, height: 284, attribute: '0 0 500 284' } as const

// Presentation only: both panels share this fixed, non-crossing layout.
export const VERTEX_POSITIONS: Record<string, { x: number; y: number }> = {
  A: { x: 78, y: 46 }, B: { x: 250, y: 141 }, C: { x: 78, y: 236 },
  D: { x: 422, y: 236 }, E: { x: 422, y: 46 },
}

export const WEIGHT_POSITIONS: Record<string, { x: number; y: number }> = {
  AB: { x: 164, y: 94 }, AC: { x: 52, y: 141 }, BC: { x: 164, y: 188 },
  BD: { x: 336, y: 188 }, BE: { x: 336, y: 94 }, CD: { x: 250, y: 257 },
  DE: { x: 448, y: 141 },
}

export const EDGE_STYLES: Record<EdgeStatus, { label: string; color: string; dash?: string; width: number }> = {
  pending: { label: '미검사', color: '#8fa5b8', dash: '7 5', width: 2 },
  selected: { label: '선택', color: '#34e4b8', width: 4 },
  rejected: { label: '사이클 기각', color: '#ff748e', dash: '7 4', width: 2.5 },
  present: { label: '남아 있음', color: '#8fa5b8', width: 2.5 },
  'temporarily-removed': { label: '임시 제거', color: '#ffcc67', dash: '10 4 2 4', width: 3 },
  removed: { label: '삭제 확정', color: '#708699', dash: '2 6', width: 2 },
  kept: { label: '복구·유지', color: '#65aaff', width: 4 },
}

export const ACTION_NAMES: Record<Action, string> = {
  initialize: '초기 상태', accept: '선택', reject: '사이클 기각',
  'try-remove': '임시 제거', remove: '삭제 확정', restore: '복구·유지',
}
