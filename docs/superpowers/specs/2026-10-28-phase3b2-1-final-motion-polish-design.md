# Phase 3B-2.1 Final Motion Polish Design

## Intent / 승인된 범위
현재 dev ad177cc의 단일 GSAP 타임라인·패널별 제어기·불변 스냅샷 구조를 유지한다. 사용자 영상 피드백의 네 가지 항목만 수정한다: 정점 라벨 대비, 최종 MST 마무리, Reverse-Delete 복구 Snap, 읽기 대기 0.7초.

## 실제 코드 분석
GraphView 정점 채움/글자색은 index.css에 있고 pulse는 vertex-circle의 stroke만 변경한다. 현재 코드만으로 영상의 노란 내부를 재현했다고 판단할 수는 없다. SVG의 정점 내부·라벨·파동 채움을 명시하여 강조색이 내부로 번지는 것을 방지하고, 같은 색 토큰을 pulse에서도 사용한다. 기본 위치/반지름은 유지한다.

completion은 edgeTransition.ts의 마지막 판정 뒤에 붙고 MstRun.mst를 읽는다. 정적 current-edge-halo 및 is-current 배지는 마지막 스냅샷에도 남는다. 완료 메시지는 현재 AlgorithmPanel 설명 영역에 즉시 표시된다. scopedTimeline은 원래 인라인 스타일을 보관하나 시각 효과가 끝난 뒤에도 읽기 대기 끝까지 최종 context 정리를 미룬다.

Restore는 kept 분기의 청색 선 복원이며 좌표는 고정이다. 읽기 대기는 PLAYBACK_TIMING.reading=1.3과 같은 타임라인의 빈 트윈이다. timeScale/pause/resume이 전환과 대기에 함께 적용된다. Reduced Motion에서는 장식 없이 스냅샷을 표시하고 같은 읽기 대기를 사용한다.

## 완료 조건
1. 정점 내부 #213e53, 글자 #eef8ff를 모든 기본/강조 상태에서 유지한다. 파동·연결 요소 테두리는 fill=none이다. DOM에서 대비 4.5:1 이상을 수치 검증하며 실제 페인팅과 구분한다.
2. 마지막 판정 확정 시 정적 금색 halo/배지 강조를 없앤다. 실제 MstRun.mst 간선만 청록 Bloom 0.6초를 한 번 수행하고, 그래프 아래 작은 완료 카드가 0.24초 fade/scale-in 한다. 값은 run.totalWeight다. 직접 마지막 선택·Reduced Motion은 정적 카드와 결과를 즉시 표시한다.
3. 완료 장면 종료 경계(읽기 대기 시작 전)에 SVG·가중치·카드의 임시 style/transform을 명시적으로 복원한다. 카드의 최종 표시 여부는 React가 소유한다. 전체 타임라인 취소/종료도 같은 원본 복원을 수행한다.
4. kept 분기에서 복원 후 stroke width를 1.2배 올렸다가 0.15초 내 기본값으로 되돌린다. 좌표/scale은 건드리지 않는다. 다른 판정에는 Snap이 없다.
5. 1배속 읽기 대기 0.7초, 전환 1.1초 유지. 속도는 기존 timeScale만 사용하여 대기 중 변경/정지에도 위치를 보존한다.

## 접근성·취소
카드는 그래프/가중치 배지를 가리지 않는 SVG 아래 일반 텍스트다. 한 번의 완료 텍스트 삽입/공개를 유지하고 재렌더마다 다시 알리지 않는다. 장식만 GSAP으로 처리한다. Pause/Resume은 같은 실행 위치를 보존한다. Restart/직접 이동/마지막 Play는 기존 generation 취소를 재사용하여 남은 효과와 콜백을 제거한다. Reduced Motion은 Bloom/Snap/카드 움직임을 생략한다. 두 패널은 독립적이다.

## Exclusions / 검증 한계
코어·스냅샷·기존 알고리즘 테스트·CI·패키지·lockfile·테마·페이지 구조를 변경하지 않는다. 새 제어기/라이브러리/타이머/입력/전체 화면/아이콘/파티클/Floating Text/Push/PR/병합/배포 없음. 기존 세 로컬 커밋 보존, 성공 시 로컬 커밋 1개만 추가한다.

브라우저 안전 중단을 우회하지 않는다. 영상 피드백은 사용자 관찰이며 새 실제 화면 검증으로 대체하지 않는다. 1440/390/320px, 200%, 실제 키보드·콘솔·Reduced Motion·체감 리듬은 수동 검토 대상으로 남긴다.
