const sources = [
  { id: 'R2', title: 'KOCW · 그래프 순회와 최소비용 신장트리', url: 'https://contents.kocw.net/document/8th_Traversal_MCSP.pdf', use: 'PDF 7~11쪽: BFS와 연결 요소. 19·21쪽: Kruskal의 선택·기각과 n−1개 선택 후 종료. 원문 확인.' },
  { id: 'R3', title: 'Sedgewick·Wayne · Minimum Spanning Trees', url: 'https://algs4.cs.princeton.edu/43mst/index.php', use: 'Kruskal의 원리·종료 조건·핵심 시간과 동률 MST 설명을 대조했습니다.' },
  { id: 'R4', title: 'Princeton COS 423 · Greedy Algorithms II', url: 'https://www.cs.princeton.edu/courses/archive/spring13/cos423/lectures/04GreedyAlgorithmsII.pdf', use: '슬라이드 34: Reverse-Delete의 내림차순 검사와 연결 유지에 따른 삭제·복구 원리. 현재 BFS 구현의 시간 식을 직접 제시하는 자료는 아닙니다.' },
  { id: 'R5', title: 'Sedgewick·Wayne · Case Study: Union-Find', url: 'https://algs4.cs.princeton.edu/15uf/', use: '가중 합치기와 경로 압축의 원리, 역 아커만 함수에 따른 상각 비용을 확인하는 보충 자료입니다.' },
  { id: 'R6', title: 'Sedgewick·Wayne · BreadthFirstPaths', url: 'https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/BreadthFirstPaths.html', use: '인접 리스트 기반 BFS의 최악 시간 Θ(n+m)을 확인하는 자료입니다. 프로젝트 전체 메모리나 반복 BFS 총비용을 직접 제시한 것은 아닙니다.' },
]

export function AlgorithmReferences() {
  return <section className="algorithm-references" aria-label="참고자료 및 근거">
    <h3>참고자료 및 근거</h3>
    <h4>기존 구현 참고</h4>
    <p><strong>[R1] algo4.pdf · Chap.4 The Greedy Approach</strong><br />수업 제공자료. 30·34·35쪽의 Kruskal·집합 연산·종료 조건과 36쪽의 최악 시간 분석을 참고했습니다. 공개 링크가 없는 자료이며, 작성자·발행연도는 확인 후 제출 참고문헌에 기재합니다.</p>
    <h4>추가 검증 자료</h4>
    <p>아래 자료는 구현 후 설명과 분석을 대조하는 데 사용했습니다. 외부 링크는 새 탭에서 열립니다.</p>
    <ol className="reference-list">{sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">[{source.id}] {source.title}</a><p>{source.use}</p></li>)}</ol>
    <p className="reference-access">확인일: 2026-11-01. Princeton 자료 [R3]~[R6]는 검색 서비스에 수록된 본문을 확인했습니다. 직접 원문 요청은 접근 제한(403)이 있어 전체 원문을 열람했다고 표시하지 않습니다.</p>
    <h4>관련 연구 · 초록·서지 확인</h4>
    <p><a href="https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001768195" target="_blank" rel="noopener noreferrer">[R7] 최명복·이상운(2013). Kruskal과 역-삭제 최소신장트리 알고리즘의 효율적 구현 방법.</a><br />13(2), 103–114. DOI: 10.7236/JIIBC.2013.13.2.103. 종료 기준과 검사 횟수 개선을 다루는 관련 연구입니다. 초록·서지만 확인했으며, 원문을 확인하기 전에는 표준 알고리즘의 시간복잡도나 우리 실행 결과의 근거로 사용하지 않습니다.</p>
    <h4>프로젝트 자체 분석</h4>
    <p>가중치·선택 간선·검사 횟수는 이 프로젝트의 입력과 MstRun 실행 기록에서 읽습니다. Reverse-Delete의 Θ(m(n+m))은 현재 구현의 반복 BFS 비용을 합산한 분석입니다. 스냅샷 생성·저장 비용도 코드에 근거해 별도로 계산했습니다. 외부 자료의 구현 및 실험 결과와 구분합니다.</p>
  </section>
}
