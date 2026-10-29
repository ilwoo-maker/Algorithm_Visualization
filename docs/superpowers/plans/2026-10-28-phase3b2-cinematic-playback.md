# Phase 3B-2 Cinematic Playback Implementation Plan

**Goal:** 스냅샷 확정과 GSAP 연출을 일치시키고 독립적인 순차 재생을 제공한다.
**Architecture:** 기존 scopedTimeline/graphEntrance/edgeTransition을 확장하고 useEdgeTransition.ts의 소유권을 패널로 옮겨 useAlgorithmPlayback을 제공한다. GraphView는 확정된 snapshot과 전환 대상만 소비한다.
**Tech Stack:** React 19, TypeScript, GSAP 3.15, SVG, Vitest/jsdom. 신규 의존성 없음.
**Spec:** ../specs/2026-10-28-phase3b2-cinematic-playback-design.md

## Global Constraints
- dev / 기준 b92226d. 기존 두 커밋 보존. Push·PR·병합·배포 없음.
- 코어·코어 테스트·CI·패키지 파일 변경 없음. 기준 149개 검증 의도 유지.
- 패널별 활성 Timeline 하나, interval 없음. 확정 수치의 임의 보간 없음.
- 브라우저 안전 중단 우회 없음. 미검증 화면을 PASS로 보고하지 않는다.

## Review Focus
1. 완료 직전/직후 수치·간선·설명 일관성 → Gate A 확정 전/후 검증.
2. 빠른 Next와 이전/직접 선택 후 늦은 콜백 → Gate C 취소·범위 테스트.
3. Pause 중 속도·Reduced Motion·탭 숨김 → Gate C 현재 위치 및 재개 검증.
4. StrictMode/unmount와 두 패널 동시 실행 → Gate C 소유권·누수 테스트.
5. 마지막 단계·읽기 대기 중 조작 → Gate D 완료 순서·정지·다시 시작 테스트.

## Gate A — Transition Architecture
**Files:** useEdgeTransition.ts, GraphView.tsx, AlgorithmPanel.tsx, scopedTimeline.ts; 신규 cinematicPlayback.test.tsx, playbackTiming.ts.
**Interfaces:** useAlgorithmPlayback(run, svgRef, weightRef)는 snapshot, target, phase, status, speed와 next/previous/jump/play/pause/restart/setSpeed를 제공한다. createEdgeTransition은 추가 lifecycle 옵션(onCommit/onPhase/hold)을 받아 확정 지점과 완료를 분리한다.
- [x] 실패 테스트: Next 직후 원래 수치/상태 유지, Focus/Decision/Settle 순서, 완료 후 원자적 갱신.
- [x] npm test -- src/animation/cinematicPlayback.test.tsx 실행, 조기 결과 노출 실패 확인.
- [x] 최소 구현: 확정 index/targetIndex 분리, 한 타임라인에 3개 구간·확정 콜백.
- [x] 관련 테스트 통과 및 자체 검토. 기존 UI 테스트의 Next 기대 시점만 조정.

## Gate B — Algorithm-Specific Motion
**Files:** edgeTransition.ts, GraphView.tsx, index.css, cinematicPlayback.test.tsx; 기존 animation 테스트 시점 조정.
**Interfaces:** 기존 createEdgeTransition(base,effect,from,to,onComplete,finalScene?,lifecycle?) 유지·확장. SVG의 edge-effect/edge-streak/light-head/vertex-wave 재사용, 절단용 두 반쪽 장식 추가.
- [x] 실패 테스트: Draw, Reject, 중앙 절단, Restore 및 취소 후 스타일 복원.
- [x] 실패 실행 확인 후 기존 효과를 1.1초 공통 리듬으로 구성, 배지 scale 복귀.
- [x] 전체 기존 애니메이션 검증 의도 보존하여 통과, 자체 검토.

## Gate C — Playback Controller
**Files:** useEdgeTransition.ts, AlgorithmPanel.tsx, index.css, cinematicPlayback.test.tsx.
**Interfaces:** 단일 소유 Timeline.timeScale/pause/resume 사용, reading label로 읽기 대기 검증. 완료 콜백만 다음 revision을 시작한다.
- [x] 실패 테스트: Play/Pause/Resume/Restart/Speed, 끝 정지·끝 Play, 중복 Play, 빠른 Next, 이전/직접 이동, 대기 Pause, 독립성, Reduced Motion/visibility/StrictMode/unmount.
- [x] 실패 실행 확인 후 최소 제어 UI·수명 관리 구현.
- [x] 관련 테스트 통과 및 자체 검토. 자동 재생은 interval을 쓰지 않는다.

## Gate D — Integration / Commit
**Files:** 최종 완료 장면, 위 테스트와 문서 기록.
- [x] 실패 테스트: 판단 후 최종 MST 효과, 7 → 11 → 8, CD·DE 미검사.
- [x] 최소 구현 및 테스트 통과 확인.
- [x] npm test / npm run build / npm run lint / git diff --check. 코어·CI·의존성 diff 없음 확인.
- [x] 별도 읽기 전용 최종 코드 리뷰와 필요한 회귀 수정.
- [x] 로컬 커밋 준비: 검증된 전체 변경을 1개로 정리한다. 실제 SHA·최종 상태는 커밋 후 보고하며 원격 작업은 하지 않는다.

## 자체 검토 및 실행 기록

계획은 기존 실제 함수·모듈에 근거했다. 새 playback 시스템을 이중으로 두지 않고 기존 hook을 확장한다. 사용자가 현재 dev 실행과 설계 방향을 승인했으므로 별도 워크트리·승인 대기는 생략한다. 커밋은 통합 검증 후 1개로 정리한다.

기준 검증: 2026-10-28, dev b92226d, clean, ahead 2, 7개 파일 149개 테스트 PASS.

### 검증 기록
- Gate A/B: 기존 조기 결과 공개를 신규 5개 실패 테스트로 재현 → 확정 인덱스 분리 후 전체 154개 PASS. GSAP 지연 초기화 트윈이 중간 스타일을 복원하는 사례도 재현 → 원래 스타일 보존/복원으로 해결.
- Gate C: 재생 컨트롤 부재로 신규 17개 실패 확인 → 단일 Timeline 완료 체인·동일 실행 pause/resume/timeScale·읽기 대기 구현 후 171개 PASS.
- Gate D: 중앙 절단·최종 결과 공개 순서·등장 중 Play·동일 이벤트 중복 Play 검증 추가. 별도 읽기 전용 리뷰 수행.
- 리뷰 중요 문제 2건을 실패 테스트로 확인 후 수정: Pause 중 Reduced Motion 변경은 확정 index를 보존하고 Resume에서 확정한다. 수동 최종 완료 연출 중 Play는 0단계로 돌아간다. 일시정지한 최종 실행의 Resume은 같은 실행을 잇는다.
- 최종 실행: 8개 파일 176개 테스트 PASS = 기존 149개 + 신규 27개. 테스트 삭제/비활성화 없음. 기존 UI·애니메이션 테스트는 확정 시점과 Focus 길이에 맞춰 기대 시점만 변경.
- npm run build PASS, npm run lint PASS(경고 없음), git diff --check PASS. 알고리즘 코어·기존 알고리즘 테스트·CI·package.json·lockfile 변경 없음.
- 경미한 후속 검토(보류): 최종 완료 강조의 정점 stroke/가중치 transform 인라인 스타일은 읽기 대기 동안 유지되고 최종 정지 시 제거된다. 값이나 간선 결과에는 영향이 없으며, 읽기 시작점에서 더 일찍 정리할지는 다음 시각 검토에서 결정한다.

### 브라우저 검토 및 녹화 절차 — 아직 미검증

이전 Computer Use가 Windows의 브라우저 URL을 충분히 확인하지 못해 안전 중단되었다. 재시도·우회하지 않았다. 개발 서버 HTTP 200은 확인했지만 화면 품질 검증으로 간주하지 않는다.

1. 기존 서버 http://127.0.0.1:5173/ 를 연다. 서버가 없으면 PowerShell에서 `$env:Path = 'C:\Program Files\nodejs;' + $env:Path; npm.cmd run dev` 실행.
2. 1440px에서 새로고침 후 등장 완료를 기다린다. Kruskal 0.5배속 재생을 녹화하고 Focus → Decision → Settle 동안 설명/수치가 확정 전 결과로 바뀌지 않는지 확인한다.
3. 검사 중 일시정지 → 계속 재생, 배속 변경, Next 연타, 이전·직접 선택, 다시 시작을 확인한다. 양쪽 재생 후 한쪽만 멈춰 독립성을 확인한다.
4. Reverse-Delete 전체 재생 및 BE 임시 제거 5단계(7, 연결 요소 2개) → 6단계 복구(11) → 최종 14단계(8)를 녹화한다. 최종 MST 강조 후 정적 상태를 확인한다.
5. 390px·320px, 200% 확대에서 버튼 겹침/가로 넘침, 설명과 라벨 가독성을 확인한다. Tab/Enter/Space 키 조작, 실제 Reduced Motion, 탭 숨김 후 수동 Resume, 개발자 콘솔 오류를 점검한다.

실제 브라우저 페인팅·모바일 배치·200% 확대·수동 키보드·콘솔 검증은 완료되지 않았다. DOM/GSAP 테스트 통과와 구분한다.
