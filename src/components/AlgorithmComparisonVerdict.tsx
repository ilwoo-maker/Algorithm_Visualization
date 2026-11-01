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
  const sameTree = sameCost && left.mst.length === right.mst.length
    && left.mst.every(edge => right.mst.some(candidate => candidate.id === edge.id))
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
      <p>{sameCost ? <>이번 실행에서 두 알고리즘 모두 최소 비용 <strong>{left.totalWeight}</strong>에 도달했습니다. 같은 비용을 얻었지만, 어떤 간선을 검사하고 무엇을 근거로 남겼는지는 달랐습니다.</> : '각 실행에서 얻은 최종 결과와 그 결과를 만드는 데 필요한 판단 비용을 정리했습니다.'}</p>
      <p className="verdict-scope">Lab의 현재 단계와 별개인 전체 실행의 최종 결과입니다.{sample && ` 공통 입력: 정점 n = ${n}, 이음선 m = ${m}.`}</p>
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
            {row('작업 공간', run => `${documentedCost('기록 제외 최대 추가 메모리', run.algorithm)} · 시각화 기록 제외`)}
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
      <p className="verdict-scope">완전 그래프에서는 m = n(n−1)/2 ∈ Θ(n²)입니다. 전체 기록 공간의 Sₖ·Sᵣ는 각각 초기 상태를 포함한 스냅샷 수입니다.{left && right && ` 이번 실행은 Kruskal ${left.snapshots.length}개, Reverse-Delete ${right.snapshots.length}개입니다.`}</p>
      </details>
      <p className="verdict-tie-note">{sameTree ? '이 입력에서는 최종 이음선 집합도 같습니다. ' : ''}일반적으로 가중치가 같은 이음선이 있으면 최적 MST의 이음선 집합은 달라질 수 있습니다. 최적 가중치의 일치와 이음선 집합의 일치는 구분해야 합니다.</p>
    </section>
    <section className="verdict-reasons" aria-labelledby={`${id}-why`}>
      <h3 id={`${id}-why`}>왜 Kruskal이 시간 효율 면에서 유리한가?</h3>
      <div className="verdict-reason-grid">
        <article><span className="verdict-reason-number">01 / 판단 비용</span><h4>집합 소속 확인과 반복 BFS의 차이</h4><p>비용 차이를 만드는 부분은 정렬 다음의 판단입니다. Kruskal은 서로소인 집합에서 두 정점의 대표를 비교합니다. 이미 연결되어 있으면 기각하고, 다르면 집합을 합칩니다. 현재 구현의 경로 압축과 rank 기반 합치기는 연속 집합 연산의 상각 비용을 α(n)에 비례하게 낮춥니다.</p><p>Reverse-Delete는 임시 제거 뒤에 남은 그래프를 BFS로 확인합니다. 남은 이음선 수가 mₐ이면 한 번에 Θ(n+mₐ)가 필요하고, 이 탐색을 반복해 최악 Θ(m(n+m))이 됩니다. 같은 선택 판단이라도 확인해야 하는 정보의 범위가 다릅니다. 집합 연산을 정확한 상수 시간으로 가정한 비교는 아닙니다.</p></article>
        <article><span className="verdict-reason-number">02 / 종료 조건</span><h4>필요한 이음선을 확보하면 종료</h4><p>Kruskal은 필요한 n−1개 이음선을 선택하면 검사를 끝낼 수 있습니다.{left && early && ` 이번 입력에서는 ${left.mst.length}개를 선택하기까지 ${inspections(left)}회 검사하고 나머지는 검사하지 않았습니다.`}</p><p>현재 Reverse-Delete 구현은 모든 이음선에 대해 임시 제거와 삭제·복구 판정을 수행합니다. 다른 Reverse-Delete 구현에서도 조기 종료가 불가능하다는 의미는 아닙니다.</p></article>
      </div>
    </section>
    <p className="verdict-conclusion"><strong>핵심 알고리즘의 최악 시간 분석에서는 Kruskal이 유리합니다.</strong> 근거는 정렬 후의 집합 판별과 반복 BFS의 비용 차이입니다. 이번 입력에서 먼저 검사를 끝낸 점은 종료 조건의 차이를 보여 줍니다. 두 알고리즘의 기록 제외 추가 공간은 모두 Θ(n+m)이므로, 시간과 메모리에 대한 결론은 나눠 정리했습니다.</p>
    <p className="verdict-scope">검사 횟수·스냅샷 수·애니메이션 재생 시간은 실제 실행 시간 측정값이 아닙니다. 시각화 기록을 만드는 시간과 저장 공간은 핵심 알고리즘 비용에 별도로 더해야 합니다.</p>
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
