import type { MstRun } from '../algorithms/types'
import { StoryGraph } from './StoryGraph'
import './academicLab.css'
import { stepExplanation } from './stepExplanation'
export function AlgorithmConceptSection({ runs }: { runs: readonly MstRun[] }) {
  return <section className="concept-section academic-concept" aria-label="알고리즘 개념 비교">
    <p className="eyebrow">TWO GREEDY STRATEGIES</p><h2>간선을 추가하는 방법과 제거하는 방법</h2><p>Kruskal은 간선이 없는 상태에서 시작하고, Reverse-Delete는 모든 간선이 있는 상태에서 시작한다. Kruskal은 추가했을 때 사이클이 생기는지 판단하고, Reverse-Delete는 제거한 뒤에도 연결이 유지되는지 판단한다.</p>
    <div className="concept-grid">{(['kruskal', 'reverse-delete'] as const).map(algorithm => {
      const run = runs.find(candidate => candidate.algorithm === algorithm)
      const isKruskal = algorithm === 'kruskal', name = isKruskal ? 'Kruskal' : 'Reverse-Delete'
      const example = run?.snapshots.find(step => algorithm === 'kruskal' ? step.action === 'accept' : step.action === 'try-remove' && step.components.length > 1)
      const explanation = run && example ? stepExplanation(run, example) : undefined
      return <article className={`concept-algorithm-card ${isKruskal ? 'concept-kruskal' : 'concept-reverse'}`} aria-label={`${name} 개념 카드`} key={algorithm}>
        <header className="concept-card-heading"><span className="concept-strategy">{isKruskal ? '01 / CONSTRUCTIVE GREEDY' : '02 / DESTRUCTIVE GREEDY'}</span><h3>{name}</h3><p>{isKruskal ? '가중치가 작은 간선부터 검사한다. 양 끝 정점이 서로 다른 연결 요소에 속하면 선택하고, 이미 연결되어 있으면 제외한다. 이미 연결된 두 정점 사이에 간선을 하나 더 넣으면 사이클이 생기기 때문이다. 필요한 n−1개 간선을 선택하면 종료한다.' : '가중치가 큰 간선부터 임시로 제거한다. 제거한 뒤에도 모든 정점이 연결되어 있으면 삭제를 확정하고, 연결이 끊기면 복구한다. 가중치 합을 줄이는 것만으로는 답이 되지 않으므로, 간선을 제거할 때마다 연결성을 확인한다.'}</p></header>
        {example && <figure className="concept-graph"><StoryGraph snapshot={example} /><figcaption><div className="concept-terminal" role="group" aria-label={`${name} 개념 로그`}>
          <div className="concept-log-heading"><strong>{isKruskal ? '선택의 예' : '임시 제거의 예'}</strong><span className="concept-log-step">SNAPSHOT {String(example.index).padStart(2, '0')}</span></div>
          {explanation ? <p className="concept-log-why">{isKruskal
            ? 'BC의 가중치는 1이다. BD도 1이지만, 같은 가중치는 이름순으로 처리하므로 BC를 먼저 검사한다. 아직 B와 C는 연결되어 있지 않으므로 BC를 선택해도 사이클이 생기지 않는다.'
            : '앞서 DE를 삭제한 상태에서 BE까지 제거하면 E가 고립된다. 가중치 합은 7로 줄지만, 모든 정점을 연결하지 못한다. 따라서 BE를 삭제할 수 없으며 다음 단계에서 복구한다.'}</p>
            : <><p>{example.what}</p><p className="concept-log-why">{example.why}</p></>}
        </div></figcaption></figure>}
      </article>
    })}</div>
  </section>
}
