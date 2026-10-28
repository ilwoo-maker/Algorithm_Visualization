import { useId, useState } from 'react'
import type { EdgeStatus, MstRun } from '../algorithms/types'
import { GraphView } from './GraphView'
import { ACTION_NAMES, EDGE_STYLES } from './graphPresentation'

export function AlgorithmPanel({ run }: { run: MstRun }) {
  const [index, setIndex] = useState(0)
  const [animateForward, setAnimateForward] = useState(false)
  const id = useId()
  const snapshot = run.snapshots[index]
  const isKruskal = run.algorithm === 'kruskal'
  const name = isKruskal ? 'Kruskal' : 'Reverse-Delete'
  const lastIndex = run.snapshots.length - 1
  const isFinal = index === lastIndex
  const current = snapshot.edges.find((edge) => edge.id === snapshot.edgeId)
  const disconnected = !isKruskal && snapshot.components.length > 1
  const statuses: EdgeStatus[] = isKruskal
    ? ['pending', 'selected', 'rejected']
    : ['present', 'temporarily-removed', 'removed', 'kept']

  return (
    <section className={`algorithm-panel ${isKruskal ? 'kruskal-panel' : 'reverse-panel'}`} aria-labelledby={`${id}-title`}>
      <header className="panel-header">
        <div className="panel-title-row"><span className="algorithm-number" aria-hidden="true">{isKruskal ? '01' : '02'}</span><h3 id={`${id}-title`}>{name}</h3><span className="approach-tag">{isKruskal ? '간선을 더하며' : '간선을 지우며'}</span></div>
        <p>{isKruskal ? '가벼운 간선부터 선택 · Union-Find' : '무거운 간선부터 삭제 시도 · BFS 연결성 검사'}</p>
      </header>

      <div className="panel-playback">
        <div className="step-heading"><p><span className="step-index">{String(index).padStart(2, '0')}</span><span className="step-total"> / {String(lastIndex).padStart(2, '0')} 단계</span></p><span className={`action-badge ${current ? `status-${current.status}` : ''}`}>{current ? `${current.name} · ` : ''}{ACTION_NAMES[snapshot.action]}</span></div>
        <div className="step-progress" aria-hidden="true">{run.snapshots.map((step) => <span key={step.index} className={step.index <= index ? 'filled' : ''} />)}</div>

        <div className="step-controls">
          <div className="step-buttons">
            <button type="button" onClick={() => { setAnimateForward(false); setIndex(0) }} disabled={index === 0}><span aria-hidden="true">↤</span> 처음으로</button>
            <button type="button" onClick={() => { setAnimateForward(false); setIndex((value) => Math.max(0, value - 1)) }} disabled={index === 0}><span aria-hidden="true">←</span> 이전</button>
            <button className="next-button" type="button" onClick={() => { setAnimateForward(true); setIndex((value) => Math.min(lastIndex, value + 1)) }} disabled={isFinal}>다음 <span aria-hidden="true">→</span></button>
          </div>
          <div className="step-select"><label htmlFor={`${id}-step`}>단계 선택</label><select id={`${id}-step`} value={index} onChange={(event) => { setAnimateForward(false); setIndex(Number(event.target.value)) }}>
            {run.snapshots.map((step) => {
              const edge = step.edges.find((candidate) => candidate.id === step.edgeId)
              return <option value={step.index} key={step.index}>{String(step.index).padStart(2, '0')} · {edge ? `${edge.name} ` : ''}{ACTION_NAMES[step.action]}</option>
            })}
          </select></div>
        </div>
      </div>

      <div className="graph-area">
        <div className="graph-toolbar"><span className="graph-caption">동일 입력 그래프</span><span className="current-caption"><i aria-hidden="true" />금색 테두리: 현재 간선</span></div>
        <GraphView snapshot={snapshot} name={name} animateForward={animateForward} />
        <div className="graph-legend" aria-label="간선 상태 범례">
          {statuses.map((status) => <span className="legend-item" key={status}><svg width="22" height="10" aria-hidden="true"><line x1="1" y1="5" x2="21" y2="5" stroke={EDGE_STYLES[status].color} strokeWidth={EDGE_STYLES[status].width} strokeDasharray={EDGE_STYLES[status].dash} /></svg>{EDGE_STYLES[status].label}</span>)}
        </div>
      </div>

      <div className="panel-content">
        <div className="explanation" aria-live="polite" aria-atomic="true">
          <div className="explanation-block"><h4><span className="explanation-dot" />무엇을 했나요?</h4><p>{snapshot.what}</p></div>
          <div className="explanation-block why-block"><h4><span className="explanation-dot" />왜 그런가요?</h4><p>{snapshot.why}</p></div>
          {isFinal && <p className="completion-label"><span aria-hidden="true">✓</span> <span>최종 MST 완성</span></p>}
          {isKruskal && isFinal && <p className="termination-note" role="note" aria-label="종료 조건 안내">
            정점 {snapshot.components.flat().length}개를 연결하는 신장 트리에 필요한 간선 {snapshot.activeEdgeIds.length}개를 선택했습니다.
            {' '}따라서 MST가 완성되어 알고리즘을 종료합니다.
            {snapshot.edges.some((edge) => edge.status === 'pending') && <>{' '}{snapshot.edges.filter((edge) => edge.status === 'pending').map((edge) => edge.name).join(', ')}는 검사하지 않습니다.</>}
          </p>}
          {disconnected && <p className="disconnection-note" role="note" aria-label="임시 단절 안내">임시 제거로 연결 요소가 {snapshot.components.length}개로 나뉘었습니다. 아래 가중치는 이 상태의 합이며 최종 MST 가중치가 아닙니다. 다음 단계에서 삭제 또는 복구 판정을 확인하세요.</p>}
        </div>

        <div className="metrics">
          <div className="metric"><span>현재 활성 간선 가중치 합</span><output aria-label="현재 활성 간선 가중치 합">{snapshot.totalWeight}</output><small>{isFinal ? '최종 MST 가중치' : '현재 단계 기준'}</small></div>
          <div className="metric"><span>현재 활성 간선 수</span><output aria-label="현재 활성 간선 수">{snapshot.activeEdgeIds.length}</output><small>전체 {snapshot.edges.length}개 중</small></div>
          <div className="metric"><span>연결 요소</span><strong>{snapshot.components.length}</strong><small>{snapshot.components.length === 1 ? '모든 정점 연결됨' : '분리된 정점 집합'}</small></div>
        </div>

        <div className="components-info"><h4>연결 요소 구성</h4><ul aria-label="연결 요소">{snapshot.components.map((group, groupIndex) => <li key={groupIndex}>{group.join(', ')}</li>)}</ul></div>
        <details className="edge-details" open>
          <summary>간선별 상태 <span>{snapshot.edges.length}개</span></summary>
          <table><caption className="sr-only">{name} 현재 간선별 가중치와 상태</caption><thead><tr><th scope="col">간선</th><th scope="col">가중치</th><th scope="col">상태</th></tr></thead><tbody>
            {snapshot.edges.map((edge) => <tr key={edge.id} className={edge.id === snapshot.edgeId ? 'current-row' : undefined}><th scope="row">{edge.name}</th><td>{edge.weight}</td><td><span className={`edge-status status-${edge.status}`}>{EDGE_STYLES[edge.status].label}</span>{edge.id === snapshot.edgeId && <span className="current-row-label">현재</span>}</td></tr>)}
          </tbody></table>
        </details>
      </div>
    </section>
  )
}
