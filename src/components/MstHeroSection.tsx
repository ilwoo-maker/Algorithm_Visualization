import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'
import type { MstRun } from '../algorithms/types'

export function MstHeroSection({ run }: { run?: MstRun }) {
  return <section className="intro hero-section" aria-label="MST 도입">
    <div className="hero-card"><p className="eyebrow"><span className="hero-signal" aria-hidden="true" />MINIMUM SPANNING TREE</p><h1>같은 목표,<span>다른 선택.</span></h1>
      <p className="intro-copy">가벼운 간선을 더하는 <strong>Kruskal</strong>과 무거운 간선을 지우는 <strong>Reverse-Delete</strong>.<br />선택과 이유를 따라가며 최소 신장 트리를 비교해 보세요.</p>
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
