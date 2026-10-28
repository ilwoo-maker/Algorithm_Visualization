# Phase 3B-2.1 Final Motion Polish Implementation Plan

**Goal:** 기존 재생 구조를 보존하며 네 가지 승인된 시각·리듬 보완을 수행한다.
**Architecture:** GraphView의 정적 표현과 edgeTransition의 기존 pulse/completion/kept 분기를 확장한다. scopedTimeline의 원본 복원 범위에 외부 가중치/완료 카드를 포함하고 시각 종료 경계를 읽기 대기와 분리한다. 새 상태 관리기는 만들지 않는다.
**Tech Stack:** React/TypeScript/SVG/GSAP 3.15/Vitest/jsdom, 기존 패키지.
**Spec:** ../specs/2026-10-28-phase3b2-1-final-motion-polish-design.md

## Global Constraints
- dev / 기준 ad177cc, clean, 원격 추적 정보보다 ahead 3. 기존 커밋 보존.
- 코어·기존 알고리즘 테스트·Snapshot·CI·의존성 변경 없음. 기존 176개 검증 의도 유지.
- 단일 타임라인·제어기 재사용. 읽기 대기 0.7초, 전환 1.1초 유지.
- 성공 시 별도 로컬 커밋 1개, Push/PR/main 병합/배포/브라우저 안전 우회 없음.

## Review Focus
- Pulse/Ripple/복구 중 내부 채움이 라벨을 덮는지 → Task A 모든 정점·전환 시점 색/대비 검사.
- 완료 카드가 판정/Bloom보다 먼저 보이거나 직접 선택 시 숨겨지는지 → Task B 공개 시점 및 직접 선택/Reduced Motion 검사.
- 읽기 대기가 끝나기 전에 임시 스타일이 제거되는지 → Task B visualComplete 경계/취소/Pause 테스트.
- Restore Snap이 다른 판정 또는 다른 패널로 새는지 → Task C 실제 stroke width/고정 좌표/취소 검사.
- 속도 변경이 대기를 재예약하는지 → Task D 같은 실행·time 위치·남은 시간/종료 검사.

## Task A — Readability
**Files:** graphPresentation.ts, GraphView.tsx, index.css, edgeTransition.ts; 신규 src/animation/finalMotionPolish.test.tsx.
**Interfaces:** 정적 VERTEX_STYLE 색 토큰을 GraphView와 pulse가 공유한다. 파동·테두리는 명시적 fill=none.
- [x] 실패 테스트: 기본·Focus·Decision·Settle의 내부/라벨 색, 대비 ≥4.5, 파동 비채움, 취소/Reduced Motion 복원.
- [x] npm test -- src/animation/finalMotionPolish.test.tsx 로 실패 확인.
- [x] 최소 구현: SVG 기본 채움 명시, 바깥 pulse, 기존 반지름·좌표 유지.
- [x] 관련 테스트 PASS 후 변경 검토.

## Task B — Finish
**Files:** edgeTransition.ts, scopedTimeline.ts, useEdgeTransition.ts, playbackTiming.ts, GraphView.tsx, AlgorithmPanel.tsx, index.css; finalMotionPolish.test.tsx.
**Interfaces:** CompletionScene에 noticeRef를 선택적으로 추가. scopedTimeline의 선택적 additionalElements를 원본 복원 대상으로 포함. TransitionLifecycle.onVisualComplete로 시각 종료를 알리고 기존 소유자가 복원한다. 기존 phase에 announcement 구간 추가, 카드 표시는 final/phase로 결정.
- [x] 실패 테스트: 최종 halo 제거, MstRun 간선만 0.6초 Bloom, Bloom 후 카드 공개, 읽기 전 스타일 정리, 직접 마지막/Reduced Motion 즉시 표시, Pause/Resume/Restart/이전/Play 취소.
- [x] 실패 확인 후 기존 completion만 확장. 카드 ref는 GraphView가 제공하고 기존 제어기가 전달한다.
- [x] 관련 테스트 PASS 및 기존 완료 테스트의 의도를 유지한 시점 조정, 자체 검토.

## Task C — Restore Snap
**Files:** edgeTransition.ts, playbackTiming.ts, finalMotionPolish.test.tsx.
**Interfaces:** kept 분기의 restoreSnap 라벨에서 strokeWidth 1.2배 → 원래 값, 총 0.15초. 위치/scale 불변.
- [x] Restore만 peak width 발생, Remove/Try Remove 미발생, 좌표 불변/완료/취소/독립성 실패 테스트 작성 및 실패 확인.
- [x] 기존 kept 타임라인 안에 최소 트윈 추가.
- [x] 관련 테스트 PASS, 스냅샷 7 → 11 → 8 및 cleanup 회귀 검토.

## Task D — Playback Rhythm / Final Verification
**Files:** playbackTiming.ts, cinematicPlayback.test.tsx, finalMotionPolish.test.tsx, 본 문서.
- [x] 대기 0.7초와 배속별 1.4/0.7/0.35초, 대기 중 Pause/Resume/Speed/Restart/수동 취소 실패 테스트 작성·실패 확인.
- [x] reading 설정값만 변경, 독립 타이머 추가 없음.
- [x] 관련 테스트 및 전체 npm test / npm run build / npm run lint / git diff --check PASS 확인.
- [x] 기존 176개 보존·금지 영역 변경 없음·추가 읽기 전용 리뷰 확인.
- [x] 브라우저 미검증/수동 녹화 절차 기록, 검증된 변경만 로컬 커밋 1개로 준비한다. 실제 SHA는 커밋 후 보고.

## 자체 검토 / 실행 기록
실제 기존 함수와 제어기 인터페이스에 근거했다. 현재 dev에서 실행하라는 사용자 지정과 네 작업 승인에 따라 추가 워크트리/승인 대기는 생략한다. 설계 문서만 작성하고 중단하지 않는다.

Baseline: dev ad177cc2cbdb17832c8255dfd5e8088ea81b29f8, clean, ahead 3. 8개 파일 176개 테스트 PASS.

### 실행 결과 / 근거 구분
- Task A RED→GREEN: 정점 색과 비채움 파동이 SVG에 명시되지 않은 상태를 4개 실패 테스트로 확인한 뒤 명시적 색/비채움을 추가했다. 테스트는 기본/검사/판정/안착/취소/Reduced Motion 및 최종 Bloom의 내부·라벨 대비 ≥4.5를 검증한다. **사용자 영상의 노란 채움 현상을 현재 브라우저에서 재현한 것은 아니다.**
- Task B RED→GREEN: 마지막 halo 잔존·새 완료 카드 부재를 9개 실패 테스트로 확인한 후 기존 completion을 보강했다. 0.6초 청록 Bloom → 카드 0.24초 등장 → visualComplete 복원 → 읽기 순서다. 마지막 확정 시 gold halo/is-current 배지를 제거한다. 직접 마지막 선택과 Reduced Motion은 즉시 정적 결과를 표시한다. 다른 가중치 입력의 완료 값 16도 확인했다.
- Task C RED→GREEN: 4개 복구 단계에서 Snap 부재를 확인한 후 stroke width 1.2배/150ms 복귀를 추가했다. GSAP의 CSS 픽셀 반올림을 발견하여 autoRound:false로 4.8px peak를 유지했다. 위치/반지름/선 좌표/scale은 변경하지 않는다.
- Task D RED→GREEN: 신규 대기 테스트와 기존 배속 테스트가 1.3초를 보고 실패하는 것을 확인한 뒤 reading만 0.7로 변경했다. 기존 cinematicPlayback.test.tsx의 수정은 승인된 대기 시간 기대값 1줄(매개변수 3개 테스트)에 한정한다.
- 외부 완료 카드·가중치의 해제 시 원본 복원, 두 알고리즘의 Reduced Motion 최종 자동 재생을 추가 확인했다.
- 테스트 결과: 기존 176개 + 신규 30개 = 9개 파일 206개 PASS. 삭제·비활성화 없음. 기존 알고리즘 테스트 수정 없음.
- 전체 테스트, build, lint, diff check를 실행했다. 별도 읽기 전용 최종 코드 리뷰에서 중요/경미 문제를 발견하지 못했다. 알고리즘·Snapshot·CI·package.json·lockfile 변경 없음.
- 코드 확인 사실: 기존 단일 GSAP 타임라인/완료 체인/timeScale/pause/resume을 재사용하며 새 타이머나 제어기를 추가하지 않았다. 전체 시각 종료/취소 정리는 원본 스타일을 복원하며 읽기 대기 종료에 의존하지 않는다.
- 실제 브라우저 확인 사실: 없음. 개발 서버 HTTP 200만 확인했으며 이는 렌더링 검증이 아니다. 이전 Windows 브라우저 URL 확인 실패에 따른 Computer Use 안전 중단을 재시도/우회하지 않았다.

### 변경 파일 목록
- src/animation/edgeTransition.ts
- src/animation/playbackTiming.ts
- src/animation/scopedTimeline.ts
- src/animation/useEdgeTransition.ts
- src/animation/cinematicPlayback.test.tsx
- src/animation/finalMotionPolish.test.tsx (신규)
- src/components/AlgorithmPanel.tsx
- src/components/GraphView.tsx
- src/components/graphPresentation.ts
- src/index.css
- docs/superpowers/specs/2026-10-28-phase3b2-1-final-motion-polish-design.md (신규)
- docs/superpowers/plans/2026-10-28-phase3b2-1-final-motion-polish.md (신규)

### 사용자 수동 검토·녹화 절차 — 아직 미검증
1. http://127.0.0.1:5173/ 에서 새로고침 후 초기 등장 완료를 기다린다. 서버가 없다면 PowerShell에서 `$env:Path = 'C:\Program Files\nodejs;' + $env:Path; npm.cmd run dev` 실행.
2. 장면 A/B: Reverse-Delete 4단계를 직접 선택 → 0.5배속 재생. BE 임시 제거(5단계 가중치 7/연결 요소 2개) → 복구(6단계 11)의 라벨 대비와 두께 Snap을 녹화한다. 6단계 확정 후 Pause하여 잔상·좌표·기본 두께를 확인한다.
3. 장면 C: Kruskal 4단계 → 재생. BE 확정 후 금색 강조 제거 → MST 4개 간선 청록 Bloom → 그래프 아래 총 가중치 8 카드 → 정적 상태를 확인한다.
4. 장면 D: Reverse-Delete 13단계 → 재생. BD 복구/Snap → 같은 완료 순서를 확인하며 DE/CD/AC가 최종 연결처럼 강조되지 않는지 확인한다.
5. 장면 E/F: 1배속 전체 재생에서 대기 단축 체감, 0.5/2배속 차이, Bloom/카드/Snap/읽기 중 Pause·Resume, Next 연타·직접 선택·Restart·완료 후 재생의 잔상과 중복 실행을 확인한다.
6. 1440px/390px/320px, 200% 확대에서 카드·라벨·컨트롤 겹침을 확인한다. 키보드, 실제 Reduced Motion, 탭 숨김 후 수동 Resume, 콘솔 오류와 스크린리더 완료 공지도 확인한다.

남은 위험은 실제 브라우저 페인팅·시각적 강도/리듬·모바일 카드 배치·보조기술 공지에 관한 미검증이다. DOM 대비/GSAP 수명 테스트를 실제 화면 PASS로 표현하지 않는다. 기능적 미해결 회귀는 발견되지 않았다.
