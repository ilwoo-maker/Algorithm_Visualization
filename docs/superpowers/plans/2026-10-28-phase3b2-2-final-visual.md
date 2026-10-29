# Phase 3B-2.2 Final Visual Implementation Plan

**Goal:** 완료 배너 이동/fade와 최종 비MST 표현을 보완하고 과제 감사를 기록한다.
**Architecture:** 기존 completion의 카드 트윈만 교체한다. AlgorithmPanel의 MstRun.mst를 GraphView로 전달해 정적 선 opacity를 적용한다. 기존 타임라인·제어기·정리를 재사용한다.
**Tech Stack:** 기존 React/TypeScript/SVG/GSAP/Vitest/jsdom, 신규 패키지 없음.
**Spec:** ../specs/2026-10-28-phase3b2-2-final-visual-design.md

## Global Constraints
- dev 708bf22, clean, 기존 네 커밋 보존. 성공 시 로컬 커밋 1개, 원격 작업 없음.
- 코어·Snapshot·기존 알고리즘 테스트·CI·의존성 변경 없음. 기존 206개 보존.
- 배너 y 8→0 / opacity 0→1 / 0.35초 / power2.out. 최종 비MST 선만 opacity 0.35.
- 감사에서 발견한 별도 누락은 보고서에만 기록. PDF·배포·브라우저 안전 우회 없음.

## Review Focus
- Final 직전/후 및 취소 시 React opacity와 GSAP style 간 충돌 → Task B 단계 이동·전환 완료 검사.
- 가중치 배지가 부모 opacity에 의해 흐려지는지 → Task B 선/그룹/라벨 분리 검사.
- kept 청색 또는 다른 MST 조합을 잘못 분류하는지 → Task B 두 알고리즘·변형 가중치 입력 검사.
- 배너 이동의 재시작/직접 선택/Reduced Motion → Task A 같은 타임라인과 cleanup 검사.
- 문서 존재와 제출물 완료를 혼동하는지 → Task C 증거·미확인 구분 감사.

## Task A — Banner
**Files:** src/animation/edgeTransition.ts, playbackTiming.ts; 신규 finishVisualAudit.test.tsx.
- [x] 실제 카드의 중간 Y/Fade, 0.35초 구간, Pause/Resume·취소·직접 마지막/Reduced Motion 실패 테스트 작성.
- [x] 해당 테스트 실패 확인 후 기존 completion의 scale 트윈을 y/fade로 교체.
- [x] 관련 테스트 통과, 기존 정리 경계와 공지 DOM 유지 검토.

## Task B — Final Edge Presentation / Accuracy
**Files:** GraphView.tsx, AlgorithmPanel.tsx, finishVisualAudit.test.tsx.
**Interface:** GraphView의 선택적 finalMst는 readonly NormalizedEdge 배열, AlgorithmPanel은 isFinal일 때 run.mst를 전달한다.
- [x] 최종 선 opacity 0.35/1, 모든 상태·배지 보존, 이전/Reset 복원 실패 테스트 작성.
- [x] 실패 확인 후 graph-edge의 SVG opacity 속성만 최소 추가.
- [x] Kruskal6/Reverse-Delete15 단계의 직접 선택·인접 전환·자동 재생 결과/설명/수치/간선 상태를 독립적인 기대 시퀀스와 대조.
- [x] 전체 테스트 통과와 scope 검토.

## Task C — Read-only Assignment Audit / Finish
**Files:** 신규 docs/reviews/2026-10-28-assignment-compliance-audit.md, 본 문서.
- [x] 별도 읽기 전용 감사 결과와 직접 코드·문서 확인을 종합, 12개 요구사항의 상태/파일·위치/증거/남은 작업/필수 여부 기록.
- [x] docs/mst-core.md의 Definition/Procedure/기본 연산/공간 기록 비용을 코드와 대조. 감사 대상 소스/문서는 변경하지 않는다.
- [x] 전체 npm test/build/lint/diff check, 금지 파일 diff 없음 및 독립 최종 리뷰.
- [x] 미확인 브라우저 항목과 수동 녹화 절차 기록. 검증된 변경을 로컬 커밋 1개로 준비, SHA는 커밋 후 보고.

## 자체 검토 / 실행 기록
실제 기존 함수/자료형을 기준으로 계획했다. 사용자가 지정한 현재 dev에서 승인 범위만 수행하며 추가 승인 대기/워크트리는 생략한다. 기준 9개 파일 206개 테스트 PASS.

### 실행 결과
- 시각 테스트에서 Y 이동 부재와 최종 opacity 미적용을 10개 실패로 확인했다. 기존 완료 트윈 교체 및 선 속성만 추가한 뒤 신규 시각 11개와 기존 206개가 통과했다.
- 신규 정확성 6개 검사: Kruskal6/RD15 스냅샷의 직접 선택·Next 완료·자동 재생 완료를 독립 기대 시퀀스(행동/상태/활성 합/활성 간선/연결 요소) 및 DOM 표·그래프·설명과 대조하여 통과했다.
- 최종 전체 실행 결과: 10개 파일 **223개 PASS = 기존 206 + 신규 17**. 기존 테스트 수정/삭제/비활성화 없음. build/lint/diff check PASS.
- 생성 소스 변경은 edgeTransition.ts, playbackTiming.ts, GraphView.tsx, AlgorithmPanel.tsx 네 파일이며 기존 제어기·코어·Snapshot·알고리즘 테스트·CI·패키지·lockfile·기존 mst-core 문서는 변경하지 않았다.
- 별도 읽기 전용 과제 감사와 최종 리뷰를 수행했다. 최종 리뷰에서 실행/정리 결함은 발견되지 않았다. 보고서 경로가 요청된 docs/reviews와 달랐던 점은 커밋 전에 바로잡았다. 체크리스트 및 근거 기록도 완료했다.
- 감사 결론: **일부 요구사항 미충족 또는 확인 필요**. 저장소의 Definition/Procedure/복잡도는 구현과 일치하나 최종 PDF 반영·배포 URL·최종 캡처·수업 조합 적합성은 별도 확인/준비가 필요하다. 이를 앱 기능 결함으로 간주하거나 임의 구현하지 않았다.

### 변경 파일
- src/animation/edgeTransition.ts
- src/animation/playbackTiming.ts
- src/components/GraphView.tsx
- src/components/AlgorithmPanel.tsx
- src/animation/finishVisualAudit.test.tsx (신규)
- docs/superpowers/specs/2026-10-28-phase3b2-2-final-visual-design.md (신규)
- docs/superpowers/plans/2026-10-28-phase3b2-2-final-visual.md (신규)
- docs/reviews/2026-10-28-assignment-compliance-audit.md (신규)

### 브라우저 미검증 / 수동 녹화 절차
기존 Computer Use 안전 중단을 재시도/우회하지 않았다. 실제 페인팅·1440/390/320px·200%·키보드·콘솔·Reduced Motion·스크린리더 완료 발표는 미검증이다. CLI 성공과 구분한다.

1. 개발 서버 http://127.0.0.1:5173/ 를 연다. 서버가 없다면 PowerShell에서 `$env:Path = 'C:\Program Files\nodejs;' + $env:Path; npm.cmd run dev` 실행.
2. 초기 등장 후 Kruskal4단계→Next/재생, RD13단계→Next/재생을 각각 녹화한다. Bloom 뒤 배너가 아래에서 올라오는지, AC/CD/DE 선만 흐려지고 가중치는 유지되는지 확인한다.
3. 배너 도중 Pause/Resume·Previous·Restart·직접 선택을 시도하여 잔상과 선 opacity 복원을 확인한다. 직접 마지막 선택은 이동 없이 최종 상태를 즉시 표시해야 한다.
4. 0.5/1/2배속과 두 패널 독립 재생, Reduced Motion에서 배너 이동 생략을 확인한다. 화면 크기·확대·키보드·콘솔·실제 완료 공지를 확인한다.

시각적 최종 품질과 제출 준비 완료 여부는 사용자 검토 전까지 승인됐다고 표현하지 않는다. 최종 로컬 커밋 SHA/clean 상태는 커밋 후 별도 보고하며 원격 작업은 하지 않는다.
