import type { MstRun } from '../algorithms/types'
import { StoryGraph } from './StoryGraph'
import './academicLab.css'
import { stepExplanation } from './stepExplanation'
export function AlgorithmConceptSection({ runs }: { runs: readonly MstRun[] }) {
  return <section className="concept-section academic-concept" aria-label="알고리즘 개념 비교">
    <p className="eyebrow">TWO GREEDY STRATEGIES</p><h2>더해서 연결하고, 덜어내어 남깁니다.</h2><p>같은 MST 문제라도 시작 상태와 판단 기준은 다릅니다. Kruskal의 첫 선택과 Reverse-Delete의 연결이 끊기는 장면을 예로 들어 이 차이를 정리했습니다.</p>
    <div className="concept-grid">{(['kruskal', 'reverse-delete'] as const).map(algorithm => {
      const run = runs.find(candidate => candidate.algorithm === algorithm)
      const isKruskal = algorithm === 'kruskal', name = isKruskal ? 'Kruskal' : 'Reverse-Delete'
      const example = run?.snapshots.find(step => algorithm === 'kruskal' ? step.action === 'accept' : step.action === 'try-remove' && step.components.length > 1)
      const explanation = run && example ? stepExplanation(run, example) : undefined
      return <article className={`concept-algorithm-card ${isKruskal ? 'concept-kruskal' : 'concept-reverse'}`} aria-label={`${name} 개념 카드`} key={algorithm}>
        <header className="concept-card-heading"><span className="concept-strategy">{isKruskal ? '01 / CONSTRUCTIVE GREEDY' : '02 / DESTRUCTIVE GREEDY'}</span><h3>{name}</h3><p>{isKruskal ? '빈 간선 집합에서 시작해 가벼운 간선부터 추가합니다. 두 정점이 이미 연결되어 있다면 그 간선은 사이클을 만들기 때문에 제외합니다. 새 연결을 늘려 가며 필요한 간선을 남기는 방식입니다.' : '모든 간선이 있는 상태에서 무거운 간선부터 제거를 시도합니다. 비용이 줄어도 정점이 떨어져 나가면 복구해야 합니다. 연결을 유지하면서 불필요한 간선을 줄이는 방식입니다.'}</p></header>
        {example && <figure className="concept-graph"><StoryGraph snapshot={example} /><figcaption><div className="concept-terminal" role="group" aria-label={`${name} 개념 로그`}>
          <div className="concept-log-heading"><strong>{isKruskal ? '선택의 예' : '임시 제거의 예'}</strong><span className="concept-log-step">SNAPSHOT {String(example.index).padStart(2, '0')}</span></div>
          <p>{example.what}</p><p className="concept-log-why">{example.why}</p>
          {explanation && <p className="concept-log-why">{explanation}</p>}
        </div></figcaption></figure>}
      </article>
    })}</div>
  </section>
}
