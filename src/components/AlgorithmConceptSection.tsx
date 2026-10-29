import type { MstRun } from '../algorithms/types'
import { StoryGraph } from './StoryGraph'
import './academicLab.css'
export function AlgorithmConceptSection({ runs }: { runs: readonly MstRun[] }) {
  return <section className="concept-section academic-concept" aria-label="알고리즘 개념 비교">
    <p className="eyebrow">TWO GREEDY STRATEGIES</p><h2>더해서 연결하고, 덜어내어 남깁니다.</h2><p>개념 소개입니다. 아래 Lab의 단계나 재생 상태를 변경하지 않습니다.</p>
    <div className="concept-grid">{(['kruskal', 'reverse-delete'] as const).map(algorithm => {
      const run = runs.find(candidate => candidate.algorithm === algorithm)
      const isKruskal = algorithm === 'kruskal', name = isKruskal ? 'Kruskal' : 'Reverse-Delete'
      const example = run?.snapshots.find(step => algorithm === 'kruskal' ? step.action === 'accept' : step.action === 'try-remove' && step.components.length > 1)
      return <article className={`concept-algorithm-card ${isKruskal ? 'concept-kruskal' : 'concept-reverse'}`} aria-label={`${name} 개념 카드`} key={algorithm}>
        <header className="concept-card-heading"><span className="concept-strategy">{isKruskal ? '01 / CONSTRUCTIVE GREEDY' : '02 / DESTRUCTIVE GREEDY'}</span><h3>{name}</h3><p>{isKruskal ? '가벼운 간선부터 검사하고, 사이클을 만들지 않을 때 선택합니다. 간선을 더하며 MST를 구성합니다.' : '무거운 간선을 임시 제거한 뒤 연결성을 확인합니다. 연결이 유지되면 삭제하고, 끊어지면 복구합니다.'}</p></header>
        {example && <figure className="concept-graph"><StoryGraph snapshot={example} /><figcaption><div className="concept-terminal" role="group" aria-label={`${name} 개념 로그`}>
          <div className="concept-log-heading"><strong>{isKruskal ? '선택의 예' : '임시 제거의 예'}</strong><span className="concept-log-step">SNAPSHOT {String(example.index).padStart(2, '0')}</span></div>
          <p>{example.what}</p><p className="concept-log-why">{example.why}</p><div className="concept-log-footer"><code>현재 활성 합 {example.totalWeight}</code><span>개념용 읽기 전용 예시입니다.</span></div>
        </div></figcaption></figure>}
      </article>
    })}</div>
  </section>
}
