import type { MstRun, Result } from '../algorithms/types'
import { AlgorithmPanel } from './AlgorithmPanel'
export function AlgorithmLabSection({ runs }: { runs: readonly Result<MstRun>[] }) {
  return <section aria-label="Algorithm Lab" className="lab-section" id="comparison" tabIndex={-1}>
    <div className="comparison-heading"><h2>알고리즘 나란히 보기</h2><p>각 패널의 단계를 독립적으로 이동할 수 있습니다.</p></div>
    <div className="comparison-grid">{runs.map((result, index) => result.ok ? <AlgorithmPanel key={result.value.algorithm} run={result.value} /> : <p role="alert" key={index}>그래프를 준비하지 못했습니다: {result.error.message}</p>)}</div>
  </section>
}
