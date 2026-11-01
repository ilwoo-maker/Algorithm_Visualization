import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { MstRun } from '../algorithms/types'

export function MstHeroSection({ run }: { run?: MstRun }) {
  return <section className="intro hero-section" aria-label="MST 도입">
    <div className="hero-card"><p className="eyebrow"><span className="hero-signal" aria-hidden="true" />MINIMUM SPANNING TREE</p><h1>같은 목표,<span>다른 선택.</span></h1>
      <p className="intro-copy">이번 과제에서는 같은 그래프에 <strong>Kruskal</strong>과 <strong>Reverse-Delete</strong>를 적용했습니다.<br />간선을 더할 때의 사이클 판단과 뺄 때의 연결성 판단이 어떻게 다른지, 최종 결과와 판단 비용을 비교합니다.</p>
      <nav className="section-links" aria-label="페이지 탐색"><a href="#comparison">Algorithm Lab 탐색하기</a><a href="#theory">수도코드 / 복잡도</a></nav>
      <aside className="hero-input" aria-label="공통 입력 그래프">
        <dl className="hero-stats">
          <div aria-label="입력 정점 수"><dt>VERTICES</dt><dd>{ASSIGNMENT_GRAPH.vertices.length}<span>개 정점</span></dd></div>
          <div aria-label="입력 간선 수"><dt>EDGES</dt><dd>{ASSIGNMENT_GRAPH.edges.length}<span>개 간선</span></dd></div>
          <div aria-label="최종 MST 가중치"><dt>MST WEIGHT</dt><dd>{run?.totalWeight ?? '—'}<span>최종 합</span></dd></div>
        </dl>
        <p>무방향 가중치 그래프 · 동률 간선은 정규화된 이름의 사전순으로 검사합니다.</p>
      </aside>
    </div>
    <p className="hero-scroll-hint" aria-hidden="true">SCROLL TO EXPLORE DUAL STRATEGY<span>↓</span></p>
  </section>
}
