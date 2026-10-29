import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { MstRun, Result } from '../algorithms/types'
import { AlgorithmPanel } from './AlgorithmPanel'

const COMPACT_QUERY = '(max-width: 1199px)'
export function AlgorithmLabSection({ runs }: { runs: readonly Result<MstRun>[] }) {
  const [compact, setCompact] = useState(() => window.matchMedia?.(COMPACT_QUERY).matches ?? false)
  const [selected, setSelected] = useState(0)
  const root = useRef<HTMLElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const panels = useRef<(HTMLDivElement | null)[]>([])
  const id = useId()
  useLayoutEffect(() => {
    const media = window.matchMedia?.(COMPACT_QUERY)
    const print = window.matchMedia?.('print')
    const update = () => {
      // Paged print width is not a user viewport resize; keep playback untouched.
      if (print?.matches) return
      const focused = document.activeElement
      if (media?.matches) {
        const index = panels.current.findIndex(panel => panel?.contains(focused))
        if (index >= 0) setSelected(index)
      } else if (focused && root.current?.querySelector('.lab-tabs')?.contains(focused)) {
        const index = tabs.current.findIndex(tab => tab === focused)
        panels.current[index]?.querySelector<HTMLElement>('button:not(:disabled), select')?.focus()
      }
      setCompact(media?.matches ?? false)
    }
    media?.addEventListener('change', update)
    window.addEventListener('afterprint', update)
    return () => { media?.removeEventListener('change', update); window.removeEventListener('afterprint', update) }
  }, [])
  const choose = (index: number) => { setSelected(index); tabs.current[index]?.focus() }
  return <section ref={root} aria-label="Algorithm Lab" className="lab-section academic-lab" id="comparison" tabIndex={-1}>
    <div className="comparison-heading"><h2>알고리즘 나란히 보기</h2><p>각 패널의 단계를 독립적으로 이동할 수 있습니다.</p></div>
    <div className="lab-tabs" role="tablist" aria-label="실습 알고리즘" hidden={!compact}>
      {runs.map((result, index) => <button key={index} ref={element => { tabs.current[index] = element }} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
        onClick={() => choose(index)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % runs.length : event.key === 'ArrowLeft' ? (index + runs.length - 1) % runs.length : event.key === 'Home' ? 0 : event.key === 'End' ? runs.length - 1 : null
          if (next !== null) { event.preventDefault(); choose(next) }
        }}>{result.ok && result.value.algorithm === 'kruskal' ? 'Kruskal' : 'Reverse-Delete'}</button>)}
    </div>
    <div className="comparison-grid">{runs.map((result, index) => <div key={index} ref={element => { panels.current[index] = element }} className="lab-panel" id={`${id}-panel-${index}`} role={compact ? 'tabpanel' : undefined} aria-labelledby={compact ? `${id}-tab-${index}` : undefined} hidden={compact && selected !== index}>
      {result.ok ? <AlgorithmPanel run={result.value} visible={!compact || selected === index} /> : <p role="alert">그래프를 준비하지 못했습니다: {result.error.message}</p>}
    </div>)}</div>
  </section>
}
