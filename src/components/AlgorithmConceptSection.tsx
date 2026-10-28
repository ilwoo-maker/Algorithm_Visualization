import type { MstRun } from '../algorithms/types'
import { StoryGraph } from './StoryGraph'
export function AlgorithmConceptSection({ runs }: { runs: readonly MstRun[] }) {
  return <section className="concept-section" aria-label="알고리즘 개념 비교">
    <p className="eyebrow">TWO GREEDY STRATEGIES</p><h2>더해서 연결하고, 덜어내어 남깁니다.</h2><p>개념 소개입니다. 아래 Lab의 단계나 재생 상태를 변경하지 않습니다.</p>
    <div className="concept-grid"><article><h3>Kruskal · Constructive Greedy</h3><p>가벼운 간선부터 검사하고, 사이클을 만들지 않을 때 선택합니다. 간선을 더하며 MST를 구성합니다.</p></article><article><h3>Reverse-Delete · Destructive Greedy</h3><p>무거운 간선을 임시 제거한 뒤 연결성을 확인합니다. 연결이 유지되면 삭제하고, 끊어지면 복구합니다.</p></article></div>
    <div className="concept-grid">{runs.map(run => {
      const example = run.snapshots.find(step => run.algorithm === 'kruskal' ? step.action === 'accept' : step.action === 'try-remove' && step.components.length > 1)
      return example && <figure className="concept-graph" key={run.algorithm}><StoryGraph snapshot={example} /><figcaption><strong>{run.algorithm === 'kruskal' ? '선택의 예' : '임시 제거의 예'}</strong> · {example.what} {example.why} 현재 활성 합 {example.totalWeight}. 개념용 읽기 전용 예시입니다.</figcaption></figure>
    })}</div>
  </section>
}
