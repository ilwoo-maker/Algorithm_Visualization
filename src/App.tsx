import { ASSIGNMENT_GRAPH } from './algorithms/fixtures'
import { kruskal } from './algorithms/kruskal'
import { reverseDelete } from './algorithms/reverseDelete'
import { AlgorithmPanel } from './components/AlgorithmPanel'

// Compute the immutable records once; each panel only selects a snapshot.
const runs = [kruskal(ASSIGNMENT_GRAPH), reverseDelete(ASSIGNMENT_GRAPH)]

function App() {
  return (
    <>
      <a className="skip-link" href="#comparison">비교 화면으로 건너뛰기</a>
      <header className="site-header">
        <div className="page-width header-inner">
          <div className="brand"><span className="brand-mark" aria-hidden="true">a.</span>Algorithm Lab<span className="brand-divider" />Visualization</div>
          <span className="header-label">GRAPH ALGORITHMS <span aria-hidden="true">/</span> 01</span>
        </div>
      </header>
      <main className="page-width">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" />MINIMUM SPANNING TREE</p>
            <h1 id="page-title">같은 목표, <span>다른 선택.</span></h1>
            <p className="intro-copy">가벼운 간선을 더하는 Kruskal과 무거운 간선을 지우는 Reverse-Delete.<br className="desktop-break" />각 단계의 선택과 이유를 따라가며 최소 신장 트리를 비교해 보세요.</p>
          </div>
          <aside className="input-summary" aria-label="공통 입력 그래프">
            <span className="summary-kicker">하나의 그래프, 두 가지 접근</span>
            <div className="summary-numbers"><span><strong>5</strong> 정점</span><span><strong>7</strong> 간선</span><span className="graph-type">무방향<br />가중치 그래프</span></div>
            <p>동률 간선은 정규화된 이름의 사전순으로 검사합니다.</p>
          </aside>
        </section>

        <div className="comparison-heading"><h2>알고리즘 나란히 보기</h2><p><span aria-hidden="true">↔</span> 각 패널의 단계를 독립적으로 이동할 수 있습니다.</p></div>
        <div id="comparison" className="comparison-grid" tabIndex={-1}>
          {runs.map((result, index) => result.ok
            ? <AlgorithmPanel key={result.value.algorithm} run={result.value} />
            : <p role="alert" key={index}>그래프를 준비하지 못했습니다: {result.error.message}</p>)}
        </div>
        <footer className="page-footer"><span>Algorithm Visualization</span><p>간선의 색·선 모양·상태명을 함께 확인하세요. 단계별 가중치는 현재 활성 간선의 합입니다.</p><span>KRUSKAL / REVERSE-DELETE</span></footer>
      </main>
    </>
  )
}

export default App
