# 알고리즘 설명 근거 및 참고자료

확인일: 2026-11-01. 사이트의 '참고자료 및 근거'와 제출 PDF를 위한 기록이다. 기존 구현에 실제 사용한 자료와 사후 검증 자료를 구분한다. 국내 논문의 서지·초록 확인을 원문 열람으로 표현하지 않는다.

## 기존 구현 참고

**[R1] algo4.pdf. Chap.4 The Greedy Approach. 수업 제공자료.**

- 30쪽: Kruskal의 전체 흐름.
- 34쪽: 서로소 집합의 find/equal/merge.
- 35쪽: n−1개 선택 시 종료하는 의사코드.
- 36쪽: 비교문, n/m, W(m,n)=Θ(m lg m), 완전 그래프의 Θ(n² lg n).
- 37쪽: Prim–Kruskal 비교. 이 파일에서 Reverse-Delete 텍스트는 찾지 못했다.
- 원문 관련 페이지를 직접 확인했다. 작성자·발행연도는 메타데이터만으로 확정하지 않고 제출 전 확인한다. 개인 PC 경로는 공개 웹 링크로 싣지 않는다.

## 추가 검증 자료

**[R2] KOCW 공개자료. 그래프 순회 및 최소비용 신장트리.**

https://contents.kocw.net/document/8th_Traversal_MCSP.pdf

원문 확인. PDF 7~11쪽은 BFS·연결 요소, 19·21쪽은 Kruskal의 선택/기각 및 종료를 뒷받침한다. 이 자료를 BFS 시간복잡도 수식이나 경로 압축 α(n)의 직접 근거로 인용하지 않는다. 작성자·소속은 파일명으로 추정하지 않는다.

**[R3] Robert Sedgewick & Kevin Wayne. Algorithms, 4th Edition, §4.3 Minimum Spanning Trees.**

https://algs4.cs.princeton.edu/43mst/index.php

오름차순·사이클 판별·n−1개 종료·정렬 지배 시간·동률 MST를 대조했다. 자료의 우선순위 큐 기반 구현과 현재 정렬 배열 기반 구현은 다르다. 전체 시각화 프로그램의 비용을 이 자료의 핵심 비용과 같다고 주장하지 않는다.

**[R4] Princeton University. COS 423, Spring 2013, Greedy Algorithms II, slide 34.**

https://www.cs.princeton.edu/courses/archive/spring13/cos423/lectures/04GreedyAlgorithmsII.pdf

Reverse-Delete 내림차순·연결성 유지 원리와 정당성의 근거. 더 고급 연결성 자료구조를 통한 빠른 구현도 언급하므로 'Reverse-Delete는 언제나 Θ(m(n+m))'라고 일반화하지 않는다. 일부 MST 증명은 서로 다른 가중치를 가정하므로 동률에 관한 주장은 [R3] 및 프로젝트의 동률 검사와 구분한다.

**[R5] Robert Sedgewick & Kevin Wayne. Algorithms, 4th Edition, §1.5 Case Study: Union-Find.**

https://algs4.cs.princeton.edu/15uf/

가중 합치기·경로 압축 및 역 아커만 함수의 상각 비용에 관한 보충 근거. 현재 코드는 size 대신 rank 기반으로 합친다. find 한 번이 항상 정확한 상수 시간이라고 서술하지 않는다.

**[R6] Robert Sedgewick & Kevin Wayne. BreadthFirstPaths API documentation.**

https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/BreadthFirstPaths.html

인접 리스트 BFS의 Θ(n+m) 시간 근거. 자료의 그래프 제외 추가 공간과 현재 코드가 인접 리스트를 구성하는 공간은 범위가 다르다.

접근 제한: [R3]~[R6]은 검색 서비스가 제공한 해당 기관 본문을 확인했다. 직접 원문 요청은 403으로 실패했다. 전체 원문 열람으로 소급하지 않는다. 제출 전 사용자 브라우저에서 접근 여부를 다시 확인한다.

## 관련 연구 — 핵심 분석의 근거와 분리

**[R7] 최명복·이상운. (2013). Kruskal과 역-삭제 최소신장트리 알고리즘의 효율적 구현 방법. 한국인터넷방송통신학회논문지, 13(2), 103–114. DOI: 10.7236/JIIBC.2013.13.2.103.**

https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001768195

서지·초록만 확인했다. 발행 당시 학술지명은 국회도서관 서지와 대조했다(https://cloud.nanet.go.kr/search/searchView.do?lodArticleId=ARTICLE_5752621). KCI 현재 표시명과 다를 수 있다. 개선된 종료 기준·전처리를 다루는 논문이며 우리 표준 BFS 구현과 동일하지 않다. 초록의 수행 횟수 비율을 우리 프로그램의 속도 배수로 인용하지 않는다. 원문 확보 전 관련 연구 이상의 근거로 쓰지 않는다.

## 프로젝트 자체 근거

- 가중치 8, 간선 집합, 검사 5/7회, 스냅샷 6/15개는 fixtures.ts와 MstRun 실행 기록의 결과다. 외부 자료에서 얻은 숫자가 아니다.
- Reverse-Delete의 Θ(m(n+m))은 현재 연결 요소 탐색이 인접 리스트를 만들고 BFS하는 비용을 m회 합산한 최악 분석이다. 한 번의 탐색은 남아 있는 mₐ 기준으로 Θ(n+mₐ)이다.
- 스냅샷의 복사·연결 요소·저장 비용은 snapshot.ts와 실제 자료구조에 근거한 자체 분석이다.
- 조합 적합성: 사용자는 수업에서 Kruskal–Reverse-Delete를 비교하지 않았다고 확인했다. 논문에서 이미 비교했다는 사실은 수업에서 이미 비교했다는 뜻이 아니다.
- AI 도구 사용과 참고문헌은 별개다. 본인이 확인한 설명과 AI 보조 범위를 구분해 제출한다.
