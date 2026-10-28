import type { MstRun } from '../algorithms/types'
import { CoreTheoryContent } from './theoryContent'
import { documentedCost } from './theoryDocument'

function FinalComparison({ results }: { results: readonly MstRun[] }) {
  return (
    <section className="final-comparison" aria-labelledby="final-comparison-title">
      <div className="final-comparison-heading">
        <p className="eyebrow">THE SAME GOAL</p>
        <h3 id="final-comparison-title">샘플 그래프의 최종 실행 결과</h3>
        <p>위 패널의 현재 단계와 별개로, 각 알고리즘의 마지막 실행 결과를 비교합니다.</p>
      </div>
      <table>
        <caption className="sr-only">샘플 그래프의 최종 MST와 알고리즘 접근 방식 비교</caption>
        <thead><tr><th scope="col">비교 항목</th>{results.map((run) => <th scope="col" key={run.algorithm}>{run.algorithm === 'kruskal' ? 'Kruskal' : 'Reverse-Delete'}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">접근 방식</th>{results.map((run) => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '작은 가중치부터 선택' : '큰 가중치부터 삭제 시도'}</td>)}</tr>
          <tr><th scope="row">핵심 판단</th>{results.map((run) => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '사이클 발생 여부' : '연결성 유지 여부'}</td>)}</tr>
          <tr><th scope="row">검사 순서</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '가중치 오름차순' : '가중치 내림차순'} · 동률 이름/ID 오름차순</td>)}</tr>
          <tr><th scope="row">간선 처리</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? '서로 다른 집합을 합치며 추가' : '임시 제거 후 BFS로 삭제/복구 판정'}</td>)}</tr>
          <tr><th scope="row">종료 조건</th>{results.map(run => <td key={run.algorithm}>{run.algorithm === 'kruskal' ? 'V−1개 간선 선택' : '모든 E개 간선 검사'}</td>)}</tr>
          <tr><th scope="row">핵심 시간</th>{results.map(run => <td key={run.algorithm}>{documentedCost('기록을 제외한 핵심 시간', run.algorithm)}</td>)}</tr>
          <tr><th scope="row">작업 공간</th>{results.map(run => <td key={run.algorithm}>{documentedCost('기록 제외 최대 추가 메모리', run.algorithm)}</td>)}</tr>
          <tr><th scope="row">전체 기록 공간</th>{results.map(run => <td key={run.algorithm}>{documentedCost('저장한 전체 실행 기록 메모리', run.algorithm)}</td>)}</tr>
          <tr><th scope="row">최종 MST</th>{results.map((run) => <td key={run.algorithm}>{run.mst.map((edge) => edge.name).join(', ')}</td>)}</tr>
          <tr><th scope="row">최종 가중치</th>{results.map((run) => <td className="final-weight" key={run.algorithm}>{run.totalWeight}</td>)}</tr>
        </tbody>
      </table>
      <p className="tie-note">이 샘플에서는 두 MST가 같습니다. 일반적으로 가중치가 같은 간선이 있으면 최적 MST의 간선 집합이 달라질 수 있으며, 최적 가중치가 일치하는 것이 중요합니다.</p>
    </section>
  )
}

export function TheorySection({ results }: { results: readonly MstRun[] }) {
  return <section id="theory" aria-label="이론과 비교" className="theory-section" tabIndex={-1}>
    <h2>이론과 비교</h2>
    <p>V는 정점 수, E는 간선 수입니다. 정의·수도코드·기본 연산과 비용은 프로젝트의 코어 문서를 직접 표시합니다.</p>
    <CoreTheoryContent />
    <FinalComparison results={results} />
  </section>
}
