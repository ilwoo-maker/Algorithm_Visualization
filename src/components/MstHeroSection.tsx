export function MstHeroSection() {
  return <section className="intro hero-section" aria-label="MST 도입">
    <div><p className="eyebrow">MINIMUM SPANNING TREE</p><h1>같은 목표, <span>다른 선택.</span></h1>
      <p className="intro-copy">가벼운 간선을 더하는 Kruskal과 무거운 간선을 지우는 Reverse-Delete.<br />선택과 이유를 따라가며 최소 신장 트리를 비교해 보세요.</p>
      <nav className="section-links" aria-label="페이지 탐색"><a href="#comparison">Algorithm Lab 바로가기</a><a href="#theory">이론 바로가기</a></nav>
    </div><aside className="input-summary" aria-label="공통 입력 그래프"><span className="summary-kicker">하나의 그래프, 두 가지 접근</span><div className="summary-numbers"><span><strong>5</strong> 정점</span><span><strong>7</strong> 간선</span><span>무방향 가중치 그래프</span></div><p>동률 간선은 정규화된 이름의 사전순으로 검사합니다.</p></aside>
  </section>
}
