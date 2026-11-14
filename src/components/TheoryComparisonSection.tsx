import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { MstRun } from '../algorithms/types'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import { TheoryDocumentContent } from './theoryContent'
import { theoryGroups } from './theoryDocument'
import './theoryComparison.css'
import { AlgorithmReferences } from './AlgorithmReferences'

const tabNames = ['문제 정의 및 스펙', '알고리즘 의사코드', '복잡도 분석']
const definitions = theoryGroups.filter(group => group.title.startsWith('Definition part'))
const procedures = theoryGroups.filter(group => group.title.startsWith('Procedure part'))
const costs = theoryGroups.filter(group => !group.title.startsWith('Definition part') && !group.title.startsWith('Procedure part') && group.title !== '의사코드' && group.title !== '효율성 비교 요약')
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
      <article className="theory-card"><p className="theory-kicker">01 / PROBLEM</p><h4>최소의 비용으로, 모두 연결하기</h4><p>이번 비교에서 풀 문제는 단순 무방향 연결 가중치 그래프 <code>G=(정점 집합, 이음선 집합, w)</code>의 최소 신장 트리이다. 모든 정점을 연결하고 사이클이 없는 트리 <code>T</code> 중 가중치 합이 가장 작은 것을 구한다.</p><div className="theory-formula">min ∑ w(e), e ∈ T<span>|T| = n − 1</span></div><p>간선 수만 줄이거나 가중치 합만 낮추는 것으로는 충분하지 않다. 모든 정점의 연결을 유지하면서 비용을 최소화해야 한다. 동률이 있으면 최적 이음선 집합은 여러 개일 수 있다.</p></article>
      <article className="theory-card"><p className="theory-kicker">02 / INPUT → OUTPUT</p><h4>공통 입력 그래프</h4><dl className="theory-sample-spec"><div><dt>Input</dt><dd>무방향 연결 가중치 그래프<br /><code>n = {ASSIGNMENT_GRAPH.vertices.length}</code> <code>m = {ASSIGNMENT_GRAPH.edges.length}</code></dd></div><div><dt>Output</dt><dd><code>T = {'{'}{sample?.mst.map(edge => edge.name).join(', ') ?? '결과 없음'}{'}'}</code><span className="theory-output-weight" aria-label="최종 MST 가중치">최종 가중치 <strong>{sample?.totalWeight ?? '—'}</strong></span></dd></div></dl><p>{sample ? `${algorithmName(sample)}의 최종 실행 결과이다.` : '실행 결과가 없다.'} Lab의 현재 단계와는 독립적이다.</p></article>
    </div>
    <div className="theory-card-grid">{definitions.slice(0, 2).map((group, index) => <section className="theory-card" aria-label={group.title} key={group.title}>
      <p className="theory-kicker">{index === 0 ? 'CONSTRUCTIVE GREEDY' : 'DESTRUCTIVE GREEDY'}</p><h4>{index === 0 ? 'Kruskal' : 'Reverse-Delete'}</h4>
      <p>{index === 0 ? '가벼운 이음선부터 선택한다. 서로 다른 연결 요소일 때만 합쳐 사이클을 방지한다.' : '무거운 이음선부터 임시로 제거한다. BFS로 연결성을 확인하고, 끊어지면 복구한다.'}</p>
      <details className="theory-disclosure"><summary>Problem · Parameter · Inputs · Outputs</summary><TheoryDocumentContent text={group.body} title={group.title} specification /></details>
    </section>)}</div>
    {definitions.slice(2).map(group => <details className="theory-disclosure theory-card" key={group.title}><summary>{group.title}</summary><TheoryDocumentContent text={group.body} title={group.title} /></details>)}
    {theoryGroups.filter(group => group.title === '의사코드' && group.body.trim()).map(group => <TheoryDocumentContent key={group.title} text={group.body} />)}
  </>
}
function PseudocodePanel() {
  const main = procedures.filter(group => ['Procedure part — Kruskal', 'Procedure part — Reverse-Delete'].includes(group.title))
  return <><p className="theory-panel-description">정렬 후 Kruskal은 간선 양 끝 정점의 대표를 비교하고, Reverse-Delete는 간선을 임시 제거한 그래프를 BFS로 탐색한다. AC를 기각하는 조건과 BE를 복구하는 조건이 각각 어느 분기에 해당하는지 확인할 수 있다.</p>
    <div className="theory-card-grid theory-algorithm-editors">{main.map(group => <DocumentGroup group={group} key={group.title} />)}</div>
    <details className="theory-disclosure theory-card"><summary>보조 의사코드 · 서로소인 집합 자료구조와 BFS 연결 요소 탐색</summary><div className="theory-card-grid">{procedures.filter(group => !main.includes(group)).map(group => <DocumentGroup group={group} key={group.title} />)}</div></details>
  </>
}
function ComplexityPanel() {
  return <>
    <p className="theory-scope-note">정점 수 n과 이음선 수 m에 따른 최악 시간복잡도 W(m, n)을 분석한다. Θ는 세타, lg는 밑이 2인 로그이다.</p>
    <div className="lecture-analysis-meta"><span>정점의 수 <code>n = {ASSIGNMENT_GRAPH.vertices.length}</code></span><span>이음선의 수 <code>m = {ASSIGNMENT_GRAPH.edges.length}</code></span><span>단위연산: 비교문</span></div>
    <div className="theory-card-grid">
      <article className="theory-card theory-metric"><p className="theory-kicker">KRUSKAL / DISJOINT SET</p><h4>Kruskal</h4><dl><div><dt>최악 시간복잡도</dt><dd className="lecture-worst-case">W(m, n) = Θ(m lg m)</dd></div><div><dt>서로소인 집합 자료구조의 공간</dt><dd>Θ(n)</dd></div></dl><div className="lecture-complete-case"><span>완전 그래프의 최악 시간</span><strong>Θ(n² lg n)</strong></div><p className="theory-memory-note">현재 구현 전체의 추가 공간: Θ(n+m)</p><p>서로소인 집합 자료구조(disjoint set data structure)의 <code>find</code>, <code>equal</code>, <code>merge</code>를 사용한다.</p></article>
      <article className="theory-card theory-metric"><p className="theory-kicker">REVERSE-DELETE / BFS</p><h4>Reverse-Delete</h4><dl><div><dt>최악 시간복잡도</dt><dd className="lecture-worst-case">W(m, n) = Θ(m n + m²)</dd></div><div><dt>추가 공간</dt><dd>Θ(n+m)</dd></div></dl><div className="lecture-complete-case"><span>완전 그래프의 최악 시간</span><strong>Θ(n⁴)</strong></div><p className="theory-memory-note">완전 그래프: m = n(n − 1)/2 ∈ Θ(n²)</p><p>m개 이음선을 검사하며 BFS를 반복한다. 최악의 반복 탐색 총량은 <code>m × Θ(n+m)</code>이다.</p></article>
    </div>
    {costs.map(group => group.title === '알고리즘 핵심과 기록 비용의 구분'
      ? <details className="theory-disclosure theory-card" key={group.title}><summary>분석 조건 · 실제 최적화 구현과 시각화 기록 비용</summary><DocumentGroup group={group} /></details>
      : <div key={group.title} className={`theory-card ${group.title === '기본 연산' ? 'theory-operations' : ''}`}><DocumentGroup group={group} /></div>)}
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
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabNames.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabNames.length : event.key === 'ArrowLeft' ? (index + tabNames.length - 1) % tabNames.length : null
    if (next === null) return
    event.preventDefault(); setActive(next); buttons.current[next]?.focus()
  }
  const panels = [<DefinitionPanel key="definition" results={results} />, <PseudocodePanel key="pseudocode" />, <ComplexityPanel key="complexity" />]
  return <section ref={root} id="theory" aria-label="이론과 비교" className="theory-section theory-comparison" tabIndex={-1}>
    <header id="theory-section" tabIndex={-1} className="theory-section-heading"><p className="theory-kicker">THE ALGORITHM REFERENCE / 03 CHAPTERS</p><h2>상세 이론 및 의사코드</h2></header>
    <div className="theory-tabs" role="tablist" aria-label="이론과 비교 목차">{tabNames.map((name, index) => <button key={name} type="button" role="tab" id={`${prefix}-tab-${index}`} aria-controls={`${prefix}-panel-${index}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} ref={element => { buttons.current[index] = element }} onClick={() => setActive(index)} onKeyDown={event => navigate(event, index)}>{name}</button>)}</div>
    {panels.map((panel, index) => <div key={index} role="tabpanel" id={`${prefix}-panel-${index}`} aria-labelledby={`${prefix}-tab-${index}`} tabIndex={0} hidden={!printing && active !== index} className="theory-tabpanel"><h3 className="theory-panel-title">{tabNames[index]}</h3>{panel}</div>)}
    <AlgorithmReferences />
  </section>
}
