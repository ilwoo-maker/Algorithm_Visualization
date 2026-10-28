import { ASSIGNMENT_GRAPH } from './algorithms/fixtures'
import { kruskal } from './algorithms/kruskal'
import { reverseDelete } from './algorithms/reverseDelete'
import { MstHeroSection } from './components/MstHeroSection'
import { AlgorithmConceptSection } from './components/AlgorithmConceptSection'
import { AlgorithmLabSection } from './components/AlgorithmLabSection'
import { TheorySection } from './components/TheorySection'
import { SingleGiantMstOrbitBackground } from './components/SingleGiantMstOrbitBackground'

// Immutable records are computed once. Hero has no access to Lab owners.
const runs = [kruskal(ASSIGNMENT_GRAPH), reverseDelete(ASSIGNMENT_GRAPH)]
const completedRuns = runs.flatMap(result => result.ok ? [result.value] : [])
export default function App() {
  return <div className="algorithm-site" style={{ isolation: 'isolate', position: 'relative' }}><SingleGiantMstOrbitBackground mst={completedRuns[0]?.mst ?? []} /><div className="algorithm-content" style={{ position: 'relative', zIndex: 1 }}>
    <a className="skip-link" href="#comparison">비교 화면으로 건너뛰기</a>
    <header className="site-header"><div className="page-width header-inner"><div className="brand"><span className="brand-mark" aria-hidden="true">a.</span>Algorithm Lab<span className="brand-divider" />Visualization</div><span className="header-label">GRAPH ALGORITHMS / 01</span></div></header>
    <main className="page-width">
      <MstHeroSection /><AlgorithmConceptSection runs={completedRuns} /><AlgorithmLabSection runs={runs} /><TheorySection results={completedRuns} />
      <footer className="page-footer"><span>Algorithm Visualization</span><p>간선의 색·선 모양·상태명을 함께 확인하세요. 단계별 가중치는 현재 활성 간선의 합입니다.</p></footer>
    </main>
  </div></div>
}
