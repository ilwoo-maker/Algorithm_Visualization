# Phase 3B-2.2 Final Visual Design

## 승인된 범위
기존 완료 타임라인의 배너와 최종 간선 표현만 보완한다. 과제 적합성은 코드·문서를 읽어 감사 보고서를 작성하며, 누락 기능이나 제출물을 이번 작업에서 구현하지 않는다. 기준 dev 708bf22, 기존 네 로컬 커밋 보존, 로컬 커밋 1개만 추가한다.

## 실제 구조와 최소 변경
- edgeTransition.ts의 completion은 Bloom 뒤 announcement 라벨에서 카드에 0.96→1 scale/fade를 0.24초 적용한다. 이를 y=8→0, opacity=0→1, 0.35초, power2.out으로 교체한다. 새 Timeline은 만들지 않는다.
- GraphView는 final 단계와 정적 Snapshot을 받고 AlgorithmPanel이 MstRun을 보유한다. finalMst를 전달하여 ID 집합으로 MST 여부를 판별한다. 최종 비MST의 graph-edge에만 opacity=0.35를 적용하고 나머지 단계·MST 간선은 1이다. 부모 그룹/가중치/상태표/스냅샷은 변경하지 않는다. Bloom 중 추가 0.20 효과는 생략한다.
- 기존 canonical selected 청록 / kept 청색과 rejected/pending/removed의 점선을 보존한다. 색으로 MST 소속을 추정하지 않는다. 최종 강조는 현재 상태 의미와 Bloom의 공통 청록 효과로 구분한다.
- 기존 generation 취소, scopedTimeline 원본 복원, visualComplete 정리를 재사용한다. 최종 opacity는 React SVG 속성이므로 임시 style 복원과 충돌하지 않는다. 직접 마지막 선택·Reduced Motion은 정적인 결과를 즉시 표시한다.

## 완료 조건과 검증 한계
배너는 Bloom 뒤에만 나타나고 Pause/Resume 위치를 보존한다. Restart/Previous/직접 선택·재생 시작·해제 시 y/opacity 잔상이 없다. 최종 비MST 3개는 식별 가능한 점선을 유지하며 가중치 배지는 흐려지지 않는다. 일반 단계로 돌아가면 opacity가 1로 복원된다.

감사는 동일 문제/알고리즘 조합/정점 상한/전체 단계/what·why/Definition/Procedure/기본 연산과 시간/공간/PDF/배포URL/캡처의 12항목을 웹앱과 제출물로 나누어 평가한다. 정렬·사이클·BFS·종료·스냅샷 비용을 실제 구현과 대조한다. 강의 내용·최종 제출물은 근거 없이는 충족으로 표시하지 않는다.

코어·Snapshot·기존 알고리즘 테스트·CI·의존성·페이지 구조·제어기는 변경하지 않는다. PDF·배포·Push·PR·병합 없음. CLI/DOM 검증은 실제 화면 품질·스크린리더 공지 검증이 아니다. 기존 브라우저 안전 중단을 우회하지 않는다.
