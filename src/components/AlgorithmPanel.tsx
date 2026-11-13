import { useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { Ref } from 'react'
import type { EdgeStatus, MstRun } from '../algorithms/types'
import { GraphView } from './GraphView'
import { ACTION_NAMES, EDGE_STYLES } from './graphPresentation'
import { useAlgorithmPlayback } from '../animation/useEdgeTransition'
import './academicLab.css'
import { snapshotStepCopy, stepExplanation } from './stepExplanation'
import './completionAchievement.css'

export interface AlgorithmPanelHandle {
  play: () => void
  pause: () => void
  restart: () => void
}

export function AlgorithmPanel({ run, visible = true, ref }: { run: MstRun; visible?: boolean; ref?: Ref<AlgorithmPanelHandle> }) {
  const weight = useRef<HTMLOutputElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const notice = useRef<HTMLParagraphElement>(null)
  const playback = useAlgorithmPlayback(run, svg, weight, notice)
  useImperativeHandle(ref, () => ({
    play: playback.play,
    pause: playback.pause,
    restart: playback.restart,
  }), [playback.play, playback.pause, playback.restart])
  const { pause, status } = playback
  useLayoutEffect(() => { if (!visible) pause() }, [visible, status, pause])
  const { index, snapshot, target } = playback
  const copy = snapshotStepCopy(run, snapshot)
  const explanation = copy ? undefined : stepExplanation(run, snapshot)
  const requestedIndex = target?.index ?? index
  const id = useId()
  const isKruskal = run.algorithm === 'kruskal'
  const name = isKruskal ? 'Kruskal' : 'Reverse-Delete'
  const lastIndex = run.snapshots.length - 1
  const isFinal = index === lastIndex
  const vertexCount = snapshot.components.flat().length
  const isCompleted = isFinal && snapshot.components.length === 1 && snapshot.activeEdgeIds.length === vertexCount - 1
  const inspectedCount = run.snapshots.slice(0, index + 1).filter(step =>
    isKruskal ? step.action === 'accept' || step.action === 'reject' : step.action === 'try-remove').length
  const uninspected = snapshot.edges.filter(edge => edge.status === 'pending')
  const isEarlyTermination = isCompleted && isKruskal && uninspected.length > 0 && inspectedCount < snapshot.edges.length
  const current = snapshot.edges.find((edge) => edge.id === snapshot.edgeId)
  const disconnected = !isKruskal && snapshot.components.length > 1
  const statuses: EdgeStatus[] = isKruskal
    ? ['pending', 'selected', 'rejected']
    : ['present', 'temporarily-removed', 'removed', 'kept']

  return (
    <section className={`algorithm-panel ${isKruskal ? 'kruskal-panel' : 'reverse-panel'}${isCompleted ? ' is-completed' : ''}${isEarlyTermination ? ' is-early-termination' : ''}${status === 'paused' || !visible ? ' completion-paused' : ''}`} aria-labelledby={`${id}-title`}>
      {isCompleted && <span className="completion-border" aria-hidden="true" />}
      <header className="panel-header">
        <div className="panel-title-row">
          <span className="algorithm-number" aria-hidden="true">{isKruskal ? '01' : '02'}</span>
          <h3 id={`${id}-title`}>{name}</h3>
          {isCompleted ? (
            <span className="achievement-badge" role="status" aria-label="완료 성취">
              <span aria-hidden="true">{isEarlyTermination ? '⚡' : '✓'}</span>{' '}
              {isKruskal ? `${isEarlyTermination ? '조기 종료' : '탐색 완료'} · ${inspectedCount}회 검사로 MST 완성` : `탐색 완료 · 전체 ${inspectedCount}개 이음선 검사`}
            </span>
          ) : (
            <span className="approach-tag">{isKruskal ? '간선을 더하며' : '간선을 지우며'}</span>
          )}
        </div>
        <p>{isKruskal ? '가벼운 간선부터 선택 · Union-Find' : '무거운 간선부터 삭제 시도 · BFS 연결성 검사'}</p>
      </header>

      <div className="panel-playback">
        <div className="step-heading"><p><span className="step-index">{String(index).padStart(2, '0')}</span><span className="step-total"> / {String(lastIndex).padStart(2, '0')} 단계</span></p><span className={`action-badge ${current ? `status-${current.status}` : ''}`}>{current ? `${current.name} · ` : ''}{ACTION_NAMES[snapshot.action]}</span></div>
        <div className="step-progress" aria-hidden="true">{run.snapshots.map((step) => <span key={step.index} className={step.index <= index ? 'filled' : ''} />)}</div>

        <div className="step-controls">
          <div className="step-buttons">
            <button type="button" onClick={() => playback.jump(0)} disabled={requestedIndex === 0}><span aria-hidden="true">↤</span> 처음으로</button>
            <button type="button" onClick={playback.previous} disabled={requestedIndex === 0}><span aria-hidden="true">←</span> 이전</button>
            <button className="next-button" type="button" onClick={playback.next} disabled={requestedIndex === lastIndex}>다음 <span aria-hidden="true">→</span></button>
          </div>
          <div className="step-select"><label htmlFor={`${id}-step`}>단계 선택</label><select id={`${id}-step`} value={index}
            onPointerDown={() => playback.jump(index)}
            onKeyDown={(event) => { if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) playback.jump(index) }}
            onChange={(event) => playback.jump(Number(event.target.value))}>
            {run.snapshots.map((step) => {
              const edge = step.edges.find((candidate) => candidate.id === step.edgeId)
              return <option value={step.index} key={step.index}>{String(step.index).padStart(2, '0')} · {edge ? `${edge.name} ` : ''}{ACTION_NAMES[step.action]}</option>
            })}
          </select></div>
        </div>
        <div className="playback-controls">
          <div className="playback-buttons">
            <button type="button" className="play-button" onClick={playback.status === 'playing' ? playback.pause : playback.play}>
              {playback.status === 'playing' ? '일시정지' : playback.status === 'paused' ? '계속 재생' : '재생'}
            </button>
            <button type="button" onClick={playback.restart}>다시 시작</button>
          </div>
          <div className="speed-controls" role="group" aria-label="재생 속도">
            {([0.5, 1, 2] as const).map(speed => <button key={speed} type="button" aria-label={`${speed}배속`} aria-pressed={playback.speed === speed} onClick={() => playback.setSpeed(speed)}>{speed}×</button>)}
          </div>
          <p className="playback-status" role="status">{playback.status === 'playing' ? '자동 재생 중' : playback.status === 'paused' ? '일시정지됨' : playback.status === 'finished' ? '재생 완료' : '재생 대기'} · {playback.speed}배속</p>
        </div>
      </div>

      <div className="graph-area">
        <div className="graph-toolbar"><span className="graph-caption">동일 입력 그래프</span><span className="current-caption">{isFinal ? '최종 MST · 검사 강조 종료' : <><i aria-hidden="true" />금색 테두리: 현재 간선</>}</span></div>
        <GraphView snapshot={snapshot} name={name} svgRef={svg} phase={playback.phase} target={target} final={isFinal} finalWeight={run.totalWeight} finalMst={isFinal ? run.mst : undefined} noticeRef={notice} />
        <div className="graph-legend" aria-label="간선 상태 범례">
          {statuses.map((status) => <span className="legend-item" key={status}><svg width="22" height="10" aria-hidden="true"><line x1="1" y1="5" x2="21" y2="5" stroke={EDGE_STYLES[status].color} strokeWidth={EDGE_STYLES[status].width} strokeDasharray={EDGE_STYLES[status].dash} /></svg>{EDGE_STYLES[status].label}</span>)}
        </div>
      </div>

      <div className="panel-content">
        <div className="explanation" role="group" aria-label="단계별 동작과 판단 근거" aria-live="polite" aria-atomic="true">
          <div className="explanation-block what-block"><span className="inspector-code" aria-hidden="true">WHAT / ACTION</span><h4><span className="explanation-dot" aria-hidden="true" />무엇을 했나요?</h4><p>{copy?.what ?? snapshot.what}</p></div>
          <div className="explanation-block why-block"><span className="inspector-code" aria-hidden="true">WHY / DECISION</span><h4><span className="explanation-dot" aria-hidden="true" />왜 그런가요?</h4><ul className="why-reasons"><li>{copy?.why ?? snapshot.why}</li></ul>
            {explanation && <p className="step-context">{explanation}</p>}
          </div>
          {isCompleted && <div className="achievement-summary" role="group" aria-label="완료 결과 요약">
            <p className="completion-label"><span aria-hidden="true">✓</span> <span>최종 MST 완성</span><strong>최소 비용 {snapshot.totalWeight}</strong></p>
            {isKruskal ? <p className="termination-note" role="note" aria-label="종료 조건 안내">
              정점 {vertexCount}개를 연결하기 위해 총 {inspectedCount}개 간선을 검사해 간선 {snapshot.activeEdgeIds.length}개를 선택했다. 최종 가중치 합은 {snapshot.totalWeight}이다.
              {uninspected.length > 0 && <>{' '}{uninspected.map(edge => edge.name).join(', ')}는 검사하지 않았으며, 사이클 때문에 기각한 간선과는 구분된다.</>}
            </p> : <p>간선 {inspectedCount}개를 모두 검사했다. {snapshot.edges.filter(edge => edge.status === 'removed').map(edge => edge.name).join('·')}는 삭제하고, {snapshot.edges.filter(edge => edge.status === 'kept').map(edge => edge.name).join('·')}는 제거하면 연결이 끊어져 복구했다. 최종 간선은 {snapshot.activeEdgeIds.length}개이며 가중치 합은 {snapshot.totalWeight}이다.</p>}
          </div>}
          {disconnected && <p className="disconnection-note" role="note" aria-label="임시 단절 안내">임시 제거로 연결 요소가 {snapshot.components.length}개로 나뉘었다. 아래 가중치는 이 상태의 합이며 최종 MST 가중치가 아니다. 다음 단계에서 삭제 또는 복구 판정을 확인한다.</p>}
        </div>

        <div className="metrics" role="group" aria-label="현재 스냅샷 수치">
          <div className="metric"><span>현재 활성 간선 가중치 합</span><output ref={weight} aria-label="현재 활성 간선 가중치 합">{snapshot.totalWeight}</output><small>{isFinal ? '최종 MST 가중치' : '현재 단계 기준'}</small></div>
          <div className="metric"><span>현재 활성 간선 수</span><div className="metric-value-row"><output aria-label="현재 활성 간선 수">{snapshot.activeEdgeIds.length}</output><span className="metric-denominator" aria-hidden="true">/ {snapshot.edges.length}</span></div><small>전체 {snapshot.edges.length}개 중</small></div>
          <div className="metric"><span>연결 요소</span><div className="metric-value-row"><strong aria-label="연결 요소 수">{snapshot.components.length}</strong><span className="metric-denominator" aria-hidden="true">개</span></div><small>{snapshot.components.length === 1 ? '모든 정점 연결됨' : '분리된 정점 집합'}</small></div>
        </div>

        <div className="components-info"><h4>연결 요소 구성</h4><ul aria-label="연결 요소">{snapshot.components.map((group, groupIndex) => <li key={groupIndex}>{group.join(', ')}</li>)}</ul></div>
        <details className="edge-details">
          <summary>간선별 상태 <span>{snapshot.edges.length}개</span></summary>
          <table><caption className="sr-only">{name} 현재 간선별 가중치와 상태</caption><thead><tr><th scope="col">간선</th><th scope="col">가중치</th><th scope="col">상태</th></tr></thead><tbody>
            {snapshot.edges.map((edge) => <tr key={edge.id} className={edge.id === snapshot.edgeId ? 'current-row' : undefined}><th scope="row">{edge.name}</th><td>{edge.weight}</td><td><span className={`edge-status status-${edge.status}`}>{EDGE_STYLES[edge.status].label}</span>{edge.id === snapshot.edgeId && <span className="current-row-label">현재</span>}</td></tr>)}
          </tbody></table>
        </details>
      </div>
    </section>
  )
}
