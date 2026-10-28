import { useRef } from 'react'
import { useFloatingBackground } from '../animation/useFloatingBackground'
import { useCanvasIllustrations } from '../animation/useCanvasIllustrations'
import type { ArtKind } from './algorithmArt'
import './floatingBackground.css'

const artworks: readonly ArtKind[] = ['tree', 'k5', 'directed', 'mesh']
export function AlgorithmFloatingBackground() {
  const root = useRef<HTMLDivElement>(null)
  useFloatingBackground(root)
  useCanvasIllustrations(root)
  return <div ref={root} data-algorithm-background className="algorithm-floating-background" aria-hidden="true" inert
    style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <div className="floating-art-field">{artworks.map((kind, index) =>
      <div className={'art-anchor art-' + kind} data-art-cluster={kind} data-depth={index} key={kind}>
        <div className="art-scroll"><div className="art-mouse"><div className="art-float">
          <canvas data-art={kind} width="440" height="410" aria-hidden="true" />
        </div></div></div>
      </div>
    )}</div>
  </div>
}
