import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { MstRun } from '../algorithms/types'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import { TheoryDocumentContent } from './theoryContent'
import { documentedCost, theoryGroups } from './theoryDocument'
import './theoryComparison.css'

const tabNames = ['문제 정의 및 스펙', '알고리즘 의사코드', '복잡도 분석', '최종 실행 결과 비교']
const definitions = theoryGroups.filter(group => group.title.startsWith('Definition part'))
const procedures = theoryGroups.filter(group => group.title.startsWith('Procedure part'))
const costs = theoryGroups.filter(group => !group.title.startsWith('Definition part') && !group.title.startsWith('Procedure part') && group.title !== '의사코드')
type Group = (typeof theoryGroups)[number]
const algorithmName = (run: MstRun) => run.algorithm === 'kruskal' ? 'Kruskal' : 'Reverse-Delete'

function DocumentGroup({ group }: { group: Group }) {
  const heading = group.title === 'Procedure part — Kruskal' ? 'Kruskal · 서로소인 집합 자료구조' : group.title === 'Procedure part — Reverse-Delete' ? 'Reverse-Delete · BFS' : group.title.replace('Procedure part — ', '')
  return <section className="theory-document-group" aria-label={group.title}><h4>{heading}</h4><TheoryDocumentContent text={group.body} title={group.title} /></section>
}
function DefinitionPanel({ results }: { results: readonly MstRun[] }) {
  const sample = results[0]
  return <>
    <div className="theory-card-grid">
      <article className="theory-card"><p className="theory-kicker">01 / PROBLEM</p><h4>최소의 비용으로, 모두 연결하기</h4><p>단순 무방향 연결 가중치 그래프 <code>G=(정점 집합, 이음선 집합, w)</code>에서 모든 정점을 연결하고 사이클이 없는 트리 <code>T</code>를 구합니다.</p><div className="theory-formula">min ∑ w(e), e ∈ T<span>|T| = n − 1</span></div><p>목표는 선택한 이음선 가중치 합의 최소화입니다. 같은 가중치가 있으면 최적 이음선 집합은 여러 개일 수 있습니다.</p></article>
      <article className="theory-card"><p className="theory-kicker">02 / INPUT → OUTPUT</p><h4>이번 과제의 공통 그래프</h4><dl className="theory-sample-spec"><div><dt>Input</dt><dd>무방향 연결 가중치 그래프<br /><code>n = {ASSIGNMENT_GRAPH.vertices.length}</code> <code>m = {ASSIGNMENT_GRAPH.edges.length}</code></dd></div><div><dt>Output</dt><dd><code>T = {'{'}{sample?.mst.map(edge => edge.name).join(', ') ?? '결과 없음'}{'}'}</code><span className="theory-output-weight" aria-label="최종 MST 가중치">최종 가중치 <strong>{sample?.totalWeight ?? '—'}</strong></span></dd></div></dl><p>{sample ? `${algorithmName(sample)}의 최종 실행 결과입니다.` : '실행 결과를 확인해 주세요.'} Lab의 현재 단계와는 독립적입니다.</p></article>
    </div>
    <div className="theory-card-grid">{definitions.slice(0, 2).map((group, index) => <section className="theory-card" aria-label={group.title} key={group.title}>
      <p className="theory-kicker">{index === 0 ? 'CONSTRUCTIVE GREEDY' : 'DESTRUCTIVE GREEDY'}</p><h4>{index === 0 ? 'Kruskal' : 'Reverse-Delete'}</h4>
      <p>{index === 0 ? '가벼운 이음선부터 선택합니다. 서로 다른 연결 요소일 때만 합쳐 사이클을 방지합니다.' : '무거운 이음선부터 임시 제거합니다. BFS로 연결성을 확인하고, 끊어지면 복구합니다.'}</p>
      <details className="theory-disclosure"><summary>Problem · Parameter · Inputs · Outputs</summary><TheoryDocumentContent text={group.body} title={group.title} specification /></details>
    </section>)}</div>
    {definitions.slice(2).map(group => <details className="theory-disclosure theory-card" key={group.title}><summary>{group.title}</summary><TheoryDocumentContent text={group.body} title={group.title} /></details>)}
    {theoryGroups.filter(group => group.title === '의사코드' && group.body.trim()).map(group => <TheoryDocumentContent key={group.title} text={group.body} />)}
  </>
}
function PseudocodePanel() {
  const main = procedures.filter(group => ['Procedure part — Kruskal', 'Procedure part — Reverse-Delete'].includes(group.title))
  return <><p className="theory-panel-description">같은 입력에서 서로 다른 탐욕적 선택을 비교하세요. 선택·기각과 삭제·복구의 판단이 핵심입니다.</p>
    <div className="theory-card-grid theory-algorithm-editors">{main.map(group => <DocumentGroup group={group} key={group.title} />)}</div>
    <details className="theory-disclosure theory-card"><summary>보조 의사코드 · 서로소인 집합 자료구조, 공통 검증과 BFS</summary><div className="theory-card-grid">{procedures.filter(group => !main.includes(group)).map(group => <DocumentGroup group={group} key={group.title} />)}</div></details>
  </>
}
function ComplexityPanel() {
  return <>
    <p className="theory-scope-note">교안 분석 모형의 최악 시간복잡도 W(m, n)입니다. Θ는 세타, lg는 밑이 2인 로그입니다. 시각화 기록 비용과 실제 최적화 구현의 분석 조건은 상세 설명에서 구분합니다.</p>
    <div className="lecture-analysis-meta"><span>정점의 수 <code>n = {ASSIGNMENT_GRAPH.vertices.length}</code></span><span>이음선의 수 <code>m = {ASSIGNMENT_GRAPH.edges.length}</code></span><span>단위연산: 비교문</span></div>
    <div className="theory-card-grid">
      <article className="theory-card theory-metric"><p className="theory-kicker">KRUSKAL / DISJOINT SET</p><h4>Kruskal</h4><dl><div><dt>최악 시간복잡도</dt><dd className="lecture-worst-case">W(m, n) = Θ(m lg m)</dd></div><div><dt>서로소인 집합 자료구조의 공간</dt><dd>Θ(n)</dd></div></dl><div className="lecture-complete-case"><span>완전 그래프의 최악 시간</span><strong>Θ(n² lg n)</strong></div><p className="theory-memory-note">현재 구현 전체의 추가 공간: Θ(n+m)</p><p>서로소인 집합 자료구조(disjoint set data structure)의 <code>find</code>, <code>equal</code>, <code>merge</code>를 사용합니다.</p></article>
      <article className="theory-card theory-metric"><p className="theory-kicker">REVERSE-DELETE / BFS</p><h4>Reverse-Delete</h4><dl><div><dt>최악 시간복잡도</dt><dd className="lecture-worst-case">W(m, n) = Θ(m n + m²)</dd></div><div><dt>추가 공간</dt><dd>Θ(n+m)</dd></div></dl><div className="lecture-complete-case"><span>완전 그래프의 최악 시간</span><strong>Θ(n⁴)</strong></div><p className="theory-memory-note">완전 그래프: m = n(n − 1)/2 ∈ Θ(n²)</p><p>m개 이음선을 검사하며 BFS를 반복합니다. 최악의 반복 탐색 총량은 <code>m × Θ(n+m)</code>입니다.</p></article>
    </div>
    {costs.map(group => group.title === '알고리즘 핵심과 기록 비용의 구분'
      ? <details className="theory-disclosure theory-card" key={group.title}><summary>분석 조건 · 실제 최적화 구현과 시각화 기록 비용</summary><DocumentGroup group={group} /></details>
      : <div key={group.title} className={`theory-card ${group.title === '기본 연산' ? 'theory-operations' : ''} ${group.title === '효율성 비교 요약' ? 'theory-efficiency' : ''}`}><DocumentGroup group={group} /></div>)}
  </>
}
function FinalEvaluation({ results }: { results: readonly MstRun[] }) {
  const first = results[0], second = results[1]
  const secondIds = new Set(second?.mst.map(edge => edge.id))
  const sameTree = results.length === 2 && first.totalWeight === second.totalWeight && first.mst.length === second.mst.length && first.mst.every(edge => secondIds.has(edge.id))
  return <>
    {sameTree && <div className="theory-result-banner"><p className="theory-kicker">DIFFERENT STRATEGIES. SAME RESULT.</p><h4>상반된 두 접근, 같은 MST</h4><p>상향식 이음선 추가와 하향식 이음선 제거가 이 입력에서 같은 결과에 도달했습니다.</p><div><code>{'{'}{first.mst.map(edge => edge.name).join(', ')}{'}'}</code><span>최종 가중치 <strong>{first.totalWeight}</strong></span></div></div>}
    <section className="final-comparison" aria-labelledby="final-comparison-title">
      <div className="final-comparison-heading"><p className="theory-kicker">FINAL EVALUATION</p><h3 id="final-comparison-title">샘플 그래프의 최종 실행 결과</h3><p>위 패널의 현재 단계와 별개로, 각 알고리즘의 마지막 실행 결과를 비교합니다.</p></div>
      <div className="theory-table-scroll" role="region" aria-label="최종 결과 표 스크롤" tabIndex={0}><table><caption className="sr-only">샘플 그래프의 최종 MST와 알고리즘 접근 방식 비교</caption><thead><tr><th scope="col">비교 항목</th>{results.map(run => <th scope="col" key={run.algorithm}>{algorithmName(run)}</th>)}</tr></thead><tbody>
        <tr><th scope="row">접근 방식</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '상향식 · 작은 이음선부터 추가' : '하향식 · 큰 이음선부터 삭제 시도'}</td>)}</tr>
        <tr><th scope="row">핵심 판단</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '사이클 발생 여부' : '연결성 유지 여부'}</td>)}</tr>
        <tr><th scope="row">검사 순서</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '가중치 오름차순' : '가중치 내림차순'} · 동률 이름/ID 오름차순</td>)}</tr>
        <tr><th scope="row">이음선 처리</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '서로 다른 집합을 합치며 추가' : '임시 제거 후 BFS로 삭제/복구 판정'}</td>)}</tr>
        <tr><th scope="row">종료 조건</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? 'n−1개 이음선 선택' : '모든 m개 이음선 검사'}</td>)}</tr>
        <tr><th scope="row">최악 시간복잡도</th>{results.map(run => <td key={run.algorithm}>{documentedCost('기록을 제외한 핵심 시간', run.algorithm)}</td>)}</tr>
        <tr><th scope="row">작업 공간</th>{results.map(run => <td key={run.algorithm}>{documentedCost('기록 제외 최대 추가 메모리', run.algorithm)}</td>)}</tr>
        <tr><th scope="row">전체 기록 공간</th>{results.map(run => <td key={run.algorithm}>{documentedCost('저장한 전체 실행 기록 메모리', run.algorithm)}</td>)}</tr>
        <tr><th scope="row">최종 MST</th>{results.map(run => <td key={run.algorithm}>{run.mst.map(edge => edge.name).join(', ')}</td>)}</tr>
        <tr><th scope="row">최종 가중치</th>{results.map(run => <td className="final-weight" key={run.algorithm}>{run.totalWeight}</td>)}</tr>
      </tbody></table></div>
      <p className="tie-note">{sameTree && '이 샘플에서는 두 MST가 같습니다. '}일반적으로 가중치가 같은 이음선이 있으면 최적 MST의 이음선 집합이 달라질 수 있으며, 최적 가중치가 일치하는 것이 중요합니다.</p>
    </section>
  </>
}

export function TheoryComparisonSection({ results }: { results: readonly MstRun[] }) {
  const [active, setActive] = useState(0), [printing, setPrinting] = useState(false)
  const root = useRef<HTMLElement>(null), buttons = useRef<(HTMLButtonElement | null)[]>([]), prefix = useId()
  useEffect(() => {
    let original: Map<HTMLDetailsElement, boolean> | undefined
    const restore = () => { original?.forEach((open, detail) => { detail.open = open }); original = undefined }
    const before = () => {
      if (!original) original = new Map([...root.current!.querySelectorAll('details')].map(detail => [detail, detail.open]))
      original.forEach((_, detail) => { detail.open = true }); setPrinting(true)
    }
    const after = () => { restore(); setPrinting(false) }
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); restore() }
  }, [])
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : event.key === 'ArrowRight' ? (index + 1) % 4 : event.key === 'ArrowLeft' ? (index + 3) % 4 : null
    if (next === null) return
    event.preventDefault(); setActive(next); buttons.current[next]?.focus()
  }
  const panels = [<DefinitionPanel key="definition" results={results} />, <PseudocodePanel key="pseudocode" />, <ComplexityPanel key="complexity" />, <FinalEvaluation key="evaluation" results={results} />]
  return <section ref={root} id="theory" aria-label="이론과 비교" className="theory-section theory-comparison" tabIndex={-1}>
    <header className="theory-section-heading"><p className="theory-kicker">THE ALGORITHM REFERENCE / 04 CHAPTERS</p><h2>이론과 비교</h2><p>정의에서 최종 결과까지. 필요한 관점으로 살펴보세요.</p></header>
    <div className="theory-tabs" role="tablist" aria-label="이론과 비교 목차">{tabNames.map((name, index) => <button key={name} type="button" role="tab" id={`${prefix}-tab-${index}`} aria-controls={`${prefix}-panel-${index}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} ref={element => { buttons.current[index] = element }} onClick={() => setActive(index)} onKeyDown={event => navigate(event, index)}>{name}</button>)}</div>
    {panels.map((panel, index) => <div key={index} role="tabpanel" id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} tabIndex={0} hidden={!printing && active !== index} className="theory-tabpanel"><h3 className="theory-panel-title">{tabNames[index]}</h3>{panel}</div>)}
  </section>
}
