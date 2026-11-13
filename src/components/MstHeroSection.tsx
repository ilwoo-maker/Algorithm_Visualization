import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { MstRun } from '../algorithms/types'

export function MstHeroSection({ run }: { run?: MstRun }) {
  return <section className="intro hero-section" aria-label="MST 도입">
    <div className="hero-card"><p className="eyebrow"><span className="hero-signal" aria-hidden="true" />MINIMUM SPANNING TREE</p><h1>같은 목표,<span>다른 선택.</span></h1>
      <p className="intro-copy">같은 그래프에 <strong>Kruskal</strong>과 <strong>Reverse-Delete</strong>를 적용했다.<br />하나는 간선을 추가하고, 다른 하나는 간선을 제거한다. 두 방법이 어떤 근거로 간선을 남기는지 살펴보고, 최종 결과와 연산 비용을 비교한다.</p>
      <nav className="section-links" aria-label="페이지 탐색"><a href="#comparison">Algorithm Lab 탐색하기</a><a href="#theory">의사코드 / 복잡도</a></nav>
      <aside className="hero-input" aria-label="공통 입력 그래프">
        <dl className="hero-stats">
          <div aria-label="입력 정점 수"><dt>VERTICES</dt><dd>{ASSIGNMENT_GRAPH.vertices.length}<span>개 정점</span></dd></div>
          <div aria-label="입력 간선 수"><dt>EDGES</dt><dd>{ASSIGNMENT_GRAPH.edges.length}<span>개 간선</span></dd></div>
          <div aria-label="최종 MST 가중치"><dt>MST WEIGHT</dt><dd>{run?.totalWeight ?? '—'}<span>최종 합</span></dd></div>
        </dl>
        <p>무방향 가중치 그래프이며, 가중치가 같으면 정규화된 간선 이름의 사전순으로 검사한다.</p>
      </aside>
    </div>
    <p className="hero-scroll-hint" aria-hidden="true">SCROLL TO EXPLORE DUAL STRATEGY<span>↓</span></p>
  </section>
}
