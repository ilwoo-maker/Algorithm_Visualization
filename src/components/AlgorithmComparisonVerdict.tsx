import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import type { MstRun } from '../algorithms/types'
import { documentedCost } from './theoryDocument'
import './algorithmComparisonVerdict.css'

const algorithms = ['kruskal', 'reverse-delete'] as const
const inspections = (run: MstRun) => run.snapshots.filter(step => run.algorithm === 'kruskal'
  ? step.action === 'accept' || step.action === 'reject' : step.action === 'try-remove').length

export function AlgorithmComparisonVerdict({ results }: { results: readonly MstRun[] }) {
  const id = useId()
  const detail = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    let original: boolean | undefined
    const before = () => {
      if (!detail.current) return
      original ??= detail.current.open
      detail.current.open = true
    }
    const after = () => {
      if (detail.current && original !== undefined) detail.current.open = original
      original = undefined
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); after() }
  }, [])
  const runs = algorithms.map(algorithm => results.find(run => run.algorithm === algorithm))
  const [left, right] = runs
  const sameCost = left && right && left.totalWeight === right.totalWeight
  const sample = left?.snapshots[0] ?? right?.snapshots[0]
  const n = sample?.components.flat().length
  const m = sample?.edges.length
  const early = left && left.snapshots.at(-1)?.edges.some(edge => edge.status === 'pending')
    && inspections(left) < (left.snapshots[0]?.edges.length ?? 0)
  const row = (label: string, value: (run: MstRun) => ReactNode) => <tr key={label}><th scope="row">{label}</th>{runs.map((run, index) => <td key={algorithms[index]}>{run ? value(run) : '미확인'}</td>)}</tr>
  return <section className="comparison-verdict" id="evaluation" aria-labelledby={`${id}-title`}>
    <header className="verdict-heading">
      <p className="verdict-kicker"><span aria-hidden="true">🏆</span> ALGORITHM EVALUATION</p>
      <h2 id={`${id}-title`}>두 알고리즘 핵심 비교 및 효율성 평가</h2>
      <p className="verdict-headline">같은 목표, 다른 판단 비용</p>
      <p>{sameCost ? <>Kruskal은 {inspections(left)}회 검사해 간선 {left.mst.length}개를 선택했고, Reverse-Delete는 {inspections(right)}개 간선을 모두 검사했다. 두 결과의 가중치 합은 <strong>{left.totalWeight}</strong>로 같다.</> : '두 실행의 최종 결과와 판단 비용이다.'}</p>
      <p className="verdict-scope">Lab의 현재 단계와 별개인 전체 실행의 최종 결과이다.{sample && ` 공통 입력은 정점 n = ${n}, 이음선 m = ${m}이다.`}</p>
    </header>
    <section className="verdict-results" aria-label="샘플 그래프의 최종 실행 결과">
      <div className="verdict-result-cards">{runs.map((run, index) => <div className={`verdict-result-card ${index === 0 ? 'verdict-kruskal' : 'verdict-reverse'}`} key={algorithms[index]}>
        <h3>{index === 0 ? 'Kruskal' : 'Reverse-Delete'}</h3><strong>{run?.totalWeight ?? '—'}<span>최종 가중치</span></strong>
        <p>{run ? `${inspections(run)}회 검사${index === 0 && early ? ' · 조기 종료' : ''}` : '실행 결과 미확인'}</p>
      </div>)}</div>
      <div className="verdict-table-scroll" role="region" aria-label="핵심 비교표 가로 스크롤" tabIndex={0}>
        <table><caption>같은 문제를 해결하는 두 알고리즘의 실행 결과와 핵심 비용</caption>
          <thead><tr><th scope="col">비교 항목</th><th scope="col">Kruskal</th><th scope="col">Reverse-Delete</th></tr></thead>
          <tbody>
            {row('접근 방식', run => run.algorithm === 'kruskal' ? '상향식 · 작은 이음선부터 추가' : '하향식 · 큰 이음선부터 삭제 시도')}
            {row('최종 결과', run => <><strong>가중치 {run.totalWeight}</strong><span className="verdict-final-edges">{run.mst.map(edge => edge.name).join(', ') || '빈 이음선 집합'}</span></>)}
            {row('이번 입력의 검사 횟수', run => `${inspections(run)}회 검사${run.algorithm === 'kruskal' && early ? ` · ${run.mst.length}개 선택 후 조기 종료` : run.algorithm === 'reverse-delete' ? ' · 전체 이음선 검사' : ''}`)}
            {row('최악 시간복잡도', run => documentedCost('기록을 제외한 핵심 시간', run.algorithm))}
            {row('작업 공간', run => documentedCost('기록 제외 최대 추가 메모리', run.algorithm))}
            {row('단위연산 / 핵심 비용', run => run.algorithm === 'kruskal' ? '비교문 · 정렬과 집합 대표 원소 비교 (find/equal/merge)' : '비교문 · 정렬과 반복 BFS 방문·연결성 검사')}
          </tbody>
        </table>
      </div>
      <details ref={detail} className="verdict-disclosure">
        <summary>
          <span className="verdict-disclosure-copy"><span className="verdict-disclosure-title">상세 비교</span><span className="verdict-disclosure-description">검사 순서·종료 조건·기록 공간까지 확인하기</span></span>
          <span className="verdict-disclosure-action" aria-hidden="true"><span className="verdict-expand-label">펼쳐보기</span><span className="verdict-collapse-label">접기</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </summary>
        <div className="verdict-table-scroll" role="region" aria-label="상세 비교표 가로 스크롤" tabIndex={0}>
          <table><caption>검사 순서·종료 조건과 확장 분석</caption><thead><tr><th scope="col">비교 항목</th><th scope="col">Kruskal</th><th scope="col">Reverse-Delete</th></tr></thead><tbody>
            {row('핵심 판단', run => run.algorithm === 'kruskal' ? '추가하면 사이클이 생기는가?' : '제거해도 연결이 유지되는가?')}
            {row('검사 순서', run => `${run.algorithm === 'kruskal' ? '가중치 오름차순' : '가중치 내림차순'} · 동률 이름/ID 오름차순`)}
            {row('이음선 처리', run => run.algorithm === 'kruskal' ? '서로 다른 집합을 합치며 추가' : '임시 제거 후 BFS로 삭제/복구 판정')}
            {row('종료 조건', run => run.algorithm === 'kruskal' ? 'n−1개 이음선 선택' : '현재 구현은 모든 m개 이음선 검사')}
            {row('완전 그래프의 최악 시간', run => run.algorithm === 'kruskal' ? 'Θ(n² lg n)' : 'Θ(n⁴)')}
            {row('전체 기록 공간', run => documentedCost('저장한 전체 실행 기록 메모리', run.algorithm))}
          </tbody></table>
        </div>
      <p className="verdict-scope">완전 그래프에서는 m = n(n−1)/2 ∈ Θ(n²)이다. 전체 기록 공간의 Sₖ·Sᵣ는 각각 초기 상태를 포함한 스냅샷 수이다.{left && right && ` 이번 실행은 Kruskal ${left.snapshots.length}개, Reverse-Delete ${right.snapshots.length}개이다.`}</p>
      </details>

    </section>
    <section className="verdict-reasons" aria-labelledby={`${id}-why`}>
      <h3 id={`${id}-why`}>왜 Kruskal이 시간 효율 면에서 유리한가?</h3>
      <div className="verdict-reason-grid">
        <article><span className="verdict-reason-number">01 / 판단 비용</span><h4>집합 소속 확인과 반복 BFS의 차이</h4><p>Kruskal은 간선 양 끝 정점의 대표만 비교한다. AC를 검사할 때는 A와 C의 대표가 같으므로, 그래프 전체를 다시 탐색하지 않고도 사이클이 생긴다는 것을 판단한다. 경로 압축과 rank 기반 합치기를 적용해 집합 연산의 상각 비용을 낮췄다.</p><p>반면 Reverse-Delete는 임시 제거 뒤에 남은 그래프를 BFS로 다시 탐색한다. 남은 이음선 수가 mₐ이면 한 번 탐색에 Θ(n+mₐ)가 필요하고, 이를 반복해 최악 Θ(m(n+m))이 된다. BE를 뺐을 때 E가 고립되는지도 매번 BFS로 확인해야 한다.</p></article>
        <article><span className="verdict-reason-number">02 / 종료 조건</span><h4>필요한 이음선을 확보하면 종료</h4><p>Kruskal은 필요한 n−1개 이음선을 선택하면 검사를 끝낼 수 있다.{left && early && ` 이번 입력에서는 ${left.mst.length}개를 선택하기까지 ${inspections(left)}회 검사하고 나머지는 검사하지 않았다.`}</p><p>반면 현재 Reverse-Delete 구현은 모든 이음선의 삭제·복구 여부를 판정한 뒤 종료한다.{right && ` 이번 입력에서는 ${inspections(right) === 7 && m === 7 ? 'DE부터 BC·BD까지 총 7개' : `${inspections(right)}개`} 이음선을 모두 검사했다.`}</p></article>
      </div>
    </section>
    <p className="verdict-conclusion"><strong>현재 BFS 기반 구현과 비교하면 최악 시간 효율 면에서는 Kruskal이 더 유리하다고 생각한다.</strong> 정렬 후 집합의 대표만 비교하는 방식이 간선마다 BFS를 반복하는 방식보다 입력이 커질 때 증가하는 연산 비용이 작기 때문이다. 이번 그래프에서도 Kruskal은 n−1=4개 간선을 확보한 뒤 CD와 DE를 검사하지 않고 종료했다. 추가 작업 공간은 두 구현 모두 Θ(n+m)으로 같다.</p>
    <a className="verdict-details-link" href="#theory-section" onClick={event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
      const destination = document.getElementById('theory-section')
      if (!destination) return
      event.preventDefault()
      destination.focus({ preventScroll: true })
      destination.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    }}>상세 의사코드 및 복잡도 유도 보기 <span aria-hidden="true">↓</span></a>
  </section>
}
