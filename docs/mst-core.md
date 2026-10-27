# MST 알고리즘 코어

## 범위와 API

React, SVG, GSAP에 의존하지 않는 순수 TypeScript 모듈이다. 외부 의존성을 추가하지 않았다. UI 파일과 기존 README는 변경하지 않았다.

```ts
import { ASSIGNMENT_GRAPH } from '../src/algorithms/fixtures'
import { kruskal } from '../src/algorithms/kruskal'
import { reverseDelete } from '../src/algorithms/reverseDelete'

const result = kruskal(ASSIGNMENT_GRAPH) // 또는 reverseDelete(ASSIGNMENT_GRAPH)
if (result.ok === false) {
  console.error(result.error.code, result.error.message)
} else {
  const { mst, totalWeight, snapshots } = result.value
  // mst: 이름순의 최종 간선, totalWeight: 최종 가중치, snapshots: 단계별 상태
}
```

입력의 정점은 비어 있지 않은 문자열, 간선은 `{ source, target, weight }`이다. 공개 알고리즘 함수는 `unknown`을 받아 런타임에서도 검증하며, 실패 시 예외 대신 `{ ok: false, error: { code, message } }`를 반환한다. 성공 결과는 `{ ok: true, value: MstRun }`이다. 내부 Union-Find의 잘못된 정점 접근은 프로그래밍 오류이므로 `RangeError`를 던지지만, 공개 알고리즘은 끝점을 먼저 검증한다.

최소 정점 수는 1이다. 단일 정점은 간선 0개, 가중치 0, 초기 스냅샷 1개로 성공한다. 가중치는 유한한 실수이며 0·음수·소수를 허용한다. JavaScript `number`의 IEEE 754 정밀도를 따른다. 모든 부분집합의 가중치 합이 유한하도록 간선 가중치 절댓값의 합이 오버플로하는 입력은 거부한다. 임의 정밀도 실수/정수 연산은 제공하지 않는다.

절댓값 합은 입력 순서가 아니라 **스냅샷과 동일한 정규화 간선 순서**로 계산한다. 따라서 순열에 따라 오류 여부가 달라지지 않으며, 같은 순서의 양수 절댓값 합이 모든 활성 부분집합의 부호 있는 합을 제한한다. `MAX_VALUE`에 작은 수를 순서 없이 더해 반올림으로 오버플로를 놓치는 경계 사례를 회귀 테스트로 검증한다.

| 코드 | 의미 |
|---|---|
| `INVALID_GRAPH` | 잘못된 필드·배열 형식 또는 정점이 없는 그래프 |
| `INVALID_VERTEX` | 문자열이 아니거나 공백뿐인 정점 이름 |
| `DUPLICATE_VERTEX` | 같은 정점 이름 중복 |
| `INVALID_EDGE` | 간선 객체 또는 문자열 끝점 누락 |
| `UNKNOWN_VERTEX` | 정점 목록에 없는 끝점 |
| `SELF_LOOP` | 자기 루프 |
| `DUPLICATE_EDGE` | 방향을 뒤집은 경우를 포함한 중복 무방향 간선 |
| `INVALID_WEIGHT` | 숫자가 아니거나 NaN·무한대인 가중치 |
| `WEIGHT_OVERFLOW` | 가중치 절댓값 합의 표현 범위 초과 |
| `DISCONNECTED_GRAPH` | 연결되지 않아 신장 트리를 만들 수 없음 |

단순 무방향 연결 그래프를 대상으로 하며 다중 간선은 거부한다. 비연결 그래프의 최소 신장 포리스트를 반환하지 않는다.

## 파일 책임과 결정성

| 파일 | 책임 |
|---|---|
| `src/algorithms/types.ts` | 입력·결과·오류·스냅샷의 readonly 타입 |
| `graph.ts` | 단일 검증 경로, 정규화, 정렬, 공통 BFS |
| `unionFind.ts` | 경로 압축과 rank 기반 합치기 |
| `snapshot.ts` | 전체 상태 복사·동결, 최종 결과 생성 |
| `kruskal.ts` | 오름차순 검사·선택·사이클 기각 |
| `reverseDelete.ts` | 내림차순 임시 제거·연결성 판정·삭제/복구 |
| `fixtures.ts` | 깊게 동결한 과제 그래프 |
| `*.test.ts` | 단위·상태·불변성·독립 완전탐색 검증 |

문자열은 locale에 의존하지 않는 UTF-16 사전순(`<`, `>`)으로 비교한다. 끝점을 이 순서로 정규화한다. 간선 ID는 `JSON.stringify([source, target])`로 구분자 충돌을 피한다. 두 정점 이름이 각각 한 글자이면 표시 이름은 `AB`처럼 연결하고, 그 외에는 JSON 쌍을 표시 이름으로 사용한다. 정점과 정규화 간선 배열도 정렬하여 입력 순서와 방향을 뒤집어도 전체 기록이 동일하다.

Kruskal은 `(가중치 오름차순, 이름 오름차순, ID 오름차순)`, Reverse-Delete는 `(가중치 내림차순, 이름 오름차순, ID 오름차순)`으로 검사한다. 결과 MST는 검사 순서와 별개로 정규화 이름순이다.

과제 그래프에서는 두 결과가 모두 `{AB, BC, BD, BE}`이다. **일반적으로 동률이 있으면 동일한 최적 가중치의 서로 다른 MST가 가능하다.** 예를 들어 AB=AC=BC=1인 삼각형은 위 동률 규칙에 따라 Kruskal이 `{AB, AC}`, Reverse-Delete가 `{AC, BC}`를 반환한다. 각 알고리즘의 재현성과 최적성은 유지된다.

## 스냅샷 계약

모든 스냅샷은 다음 정보를 가진다.

- `index`, `algorithm`, `action`, `reason`, `edgeId`: 순번·알고리즘·행동·구조화된 근거·현재 간선. 초기 상태의 `edgeId`는 null이다.
- `edges`: 원본의 모든 간선 정보와 각 간선의 상태. 검사하지 않은 간선도 포함한다.
- `activeEdgeIds`, `totalWeight`: **해당 시점에 실제 포함된 간선**과 그 합. Kruskal에서는 선택된 포리스트, Reverse-Delete에서는 아직 남아 있는 그래프이다.
- `components`: 해당 활성 간선으로 계산한 연결 요소. 정규화된 정점/간선에 대한 결정적인 BFS 발견 순서로 기록한다. 구성원은 별도로 사전순 정렬하지 않는다.
- `what`, `why`: 한국어 행동 설명과 판단 이유. 복구 이유는 명시적으로 직전의 **임시 제거 상태**를 설명한다.

| 알고리즘 | 간선 상태 |
|---|---|
| Kruskal | `pending` → `selected` 또는 `rejected` |
| Reverse-Delete | `present` → `temporarily-removed` → `removed` 또는 `kept` |

활성 상태는 `selected`, `present`, `kept`이다. Reverse-Delete의 임시 제거 상태는 실제로 비연결일 수 있다. 삭제 확정 또는 복구 후에는 항상 연결된다. 임시 상태의 `totalWeight`는 MST 가중치를 뜻하지 않는다.

입력을 복사하고 정규화한 뒤 모든 간선과 정점 배열을 동결한다. 매 기록마다 새 간선 상태 객체·활성 ID 배열·BFS 연결 요소를 만들고 중첩 배열까지 `Object.freeze`한다. 최종 결과와 기록 배열도 동결한다. 외부 입력을 나중에 변경하거나 이후 실행에서 작업 Map을 변경해도 기존 기록은 변하지 않는다. 불변 객체끼리는 최종 MST의 정규화 간선 객체를 안전하게 공유한다.

## 과제 그래프의 실행 기록

정점: A, B, C, D, E. 간선: BC=1, BD=1, AB=2, AC=3, BE=4, CD=5, DE=7.

### Kruskal

| 단계 | 행동 | 활성 간선 | 가중치 | 이유 |
|---:|---|---|---:|---|
| 0 | 초기화 | ∅ | 0 | 각 정점이 독립된 연결 요소이며 가벼운 간선부터 검사 |
| 1 | BC 선택 | BC | 1 | B와 C가 서로 다른 연결 요소 |
| 2 | BD 선택 | BC, BD | 2 | B와 D가 서로 다른 연결 요소 |
| 3 | AB 선택 | AB, BC, BD | 4 | A와 B가 서로 다른 연결 요소 |
| 4 | AC 기각 | AB, BC, BD | 4 | A와 C는 이미 A–B–C 경로로 연결되어 사이클 발생 |
| 5 | BE 선택 | AB, BC, BD, BE | 8 | E를 나머지 연결 요소에 연결; V−1개가 되어 종료 |

AC 기각 시 연결 요소는 `{A,B,C,D}`, `{E}`이다. 최종 스냅샷에서 AC는 `rejected`, CD·DE는 `pending`이다. 이 두 간선은 조기 종료로 검사하지 않았다. 총 6개 스냅샷이다.

### Reverse-Delete

| 단계 | 행동 | 활성 간선 | 가중치 | 이유 |
|---:|---|---|---:|---|
| 0 | 초기화 | AB, AC, BC, BD, BE, CD, DE | 23 | 모든 간선으로 시작하여 무거운 간선부터 검사 |
| 1 | DE 임시 제거 | AB, AC, BC, BD, BE, CD | 16 | BFS 연결성 검사 |
| 2 | DE 삭제 확정 | AB, AC, BC, BD, BE, CD | 16 | 연결 유지 |
| 3 | CD 임시 제거 | AB, AC, BC, BD, BE | 11 | BFS 연결성 검사 |
| 4 | CD 삭제 확정 | AB, AC, BC, BD, BE | 11 | 연결 유지 |
| 5 | BE 임시 제거 | AB, AC, BC, BD | 7 | `{A,B,C,D}`와 `{E}`로 분리됨 |
| 6 | BE 복구·유지 | AB, AC, BC, BD, BE | 11 | E가 고립되므로 삭제 취소 |
| 7 | AC 임시 제거 | AB, BC, BD, BE | 8 | BFS 연결성 검사 |
| 8 | AC 삭제 확정 | AB, BC, BD, BE | 8 | 연결 유지 |
| 9 | AB 임시 제거 | BC, BD, BE | 6 | `{A}`와 `{B,C,D,E}`로 분리됨 |
| 10 | AB 복구·유지 | AB, BC, BD, BE | 8 | A가 고립되므로 삭제 취소 |
| 11 | BC 임시 제거 | AB, BD, BE | 7 | `{A,B,D,E}`와 `{C}`로 분리됨 |
| 12 | BC 복구·유지 | AB, BC, BD, BE | 8 | C가 고립되므로 삭제 취소 |
| 13 | BD 임시 제거 | AB, BC, BE | 7 | `{A,B,C,E}`와 `{D}`로 분리됨 |
| 14 | BD 복구·유지 | AB, BC, BD, BE | 8 | D가 고립되므로 삭제 취소 |

모든 7개 간선을 검사한다. 삭제 확정 순서는 DE, CD, AC이며, 유지 판정 순서는 BE, AB, BC, BD이다. 총 15개 스냅샷이다.

## 정확성 근거

Kruskal은 현재 포리스트의 서로 다른 연결 요소를 잇는 가장 가벼운 간선을 선택한다. 절단 속성으로 안전한 선택이며, 같은 연결 요소 내부 간선은 사이클을 만들므로 기각한다. 연결 그래프에서 V−1개 간선을 선택하면 신장 트리가 된다.

Reverse-Delete는 무거운 간선부터 삭제를 시도한다. 제거 후에도 연결된다면 그 간선에는 대체 경로가 있어 사이클에 속하며, 사이클 속성에 따라 최적 신장 트리를 남기면서 제거할 수 있다. 연결이 끊기면 현재 그래프의 브리지이므로 반드시 복구한다. 모든 간선을 검사한 최종 연결 그래프에는 사이클이 남을 수 없으므로 최소 신장 트리이다. 동률은 어느 최적 트리를 택하는지에 영향을 줄 뿐 최적 가중치를 바꾸지 않는다.

## 의사코드

### Definition part

```text
Graph = (vertices: 문자열 배열, edges: (source, target, weight) 배열)
V = 정점 수, E = 간선 수
PreparedGraph = 검증·정렬·끝점 정규화된 그래프의 불변 복사본
Result<T> = Success(T) | Failure(code, 한국어 message)

UnionFind:
  parent: Map<Vertex, Vertex>, rank: Map<Vertex, Integer>

WorkingState:
  states: Map<EdgeId, EdgeStatus>
  snapshots: Snapshot 배열

Snapshot:
  현재 행동·이유·간선, 전체 간선별 상태, 활성 간선 ID와 가중치 합,
  활성 그래프의 BFS 연결 요소, 한국어 what/why

CAPTURE(graph, states, metadata):
  상태를 복사하고 활성 간선을 추출하여 BFS 연결 요소를 구한다.
  가중치 합을 계산하고 중첩 자료까지 동결한 스냅샷을 반환한다.
FINISH(graph, snapshots):
  마지막 활성 간선으로 MST를 만들고 최종 결과·기록 배열을 동결한다.
```

### Procedure part — 공통 검증과 BFS

```text
PREPARE(input):
  그래프/정점/간선 형식과 중복, 루프, 끝점, 가중치를 검사한다.
  오류이면 Failure(code, 한국어 message)를 반환한다.
  정점과 간선을 복사하고 끝점/ID/이름을 정규화하여 정렬한다.
  BFS_COMPONENTS(vertices, edges)의 요소 수가 1이 아니면 비연결 오류를 반환한다.
  불변 PreparedGraph를 반환한다.

BFS_COMPONENTS(vertices, activeEdges):
  각 정점의 인접 배열을 만들고 각 무방향 간선을 양쪽에 추가한다.
  visited ← 빈 Set, components ← []
  FOR start IN vertices:
    IF start IN visited: CONTINUE
    queue ← [start], visited에 start 추가, head ← 0
    WHILE head < queue.length:
      vertex ← queue[head], head ← head + 1
      FOR neighbor IN adjacency[vertex]:
        IF neighbor NOT IN visited:
          visited에 neighbor 추가, queue에 neighbor 추가
    components에 queue 추가
  RETURN components
```

### Procedure part — Union-Find

```text
INITIALIZE(vertices):
  각 vertex에 대해 parent[vertex] ← vertex, rank[vertex] ← 0

FIND(vertex):
  root ← vertex
  WHILE parent[root] ≠ root: root ← parent[root]
  current ← vertex
  WHILE current ≠ root:
    next ← parent[current]
    parent[current] ← root
    current ← next
  RETURN root

UNION(a, b):
  ra ← FIND(a), rb ← FIND(b)
  IF ra = rb: RETURN false
  IF rank[ra] < rank[rb]: SWAP(ra, rb)
  parent[rb] ← ra
  IF rank[ra] = rank[rb]: rank[ra] ← rank[ra] + 1
  RETURN true
```

### Procedure part — Kruskal

```text
KRUSKAL(input):
  graph ← PREPARE(input); 오류이면 즉시 반환
  UnionFind 초기화, 모든 간선 상태 ← pending, selectedCount ← 0
  snapshots ← [CAPTURE(초기 상태, 초기 한국어 설명)]
  ordered ← 간선을 (가중치 ↑, 이름 ↑)으로 정렬한 복사본
  FOR edge IN ordered:
    IF selectedCount = V - 1: BREAK
    IF UNION(edge.source, edge.target):
      states[edge] ← selected, selectedCount ← selectedCount + 1
      snapshots에 CAPTURE(선택, 서로 다른 연결 요소라는 이유) 추가
    ELSE:
      states[edge] ← rejected
      snapshots에 CAPTURE(기각, 같은 연결 요소의 사이클이라는 이유) 추가
  RETURN Success(FINISH(graph, snapshots))
```

### Procedure part — Reverse-Delete

```text
REVERSE_DELETE(input):
  graph ← PREPARE(input); 오류이면 즉시 반환
  모든 간선 상태 ← present
  snapshots ← [CAPTURE(초기 상태, 초기 한국어 설명)]
  ordered ← 간선을 (가중치 ↓, 이름 ↑)으로 정렬한 복사본
  FOR edge IN ordered:
    states[edge] ← temporarily-removed
    attempt ← CAPTURE(임시 제거, BFS 검사 설명)
    snapshots에 attempt 추가
    IF attempt.components.length = 1:
      states[edge] ← removed
      snapshots에 CAPTURE(삭제 확정, 연결 유지라는 이유) 추가
    ELSE:
      states[edge] ← kept
      snapshots에 CAPTURE(복구, 임시 상태의 분리된 요소를 명시한 이유) 추가
  RETURN Success(FINISH(graph, snapshots))
```

## 실제 자료구조에 따른 복잡도

V는 정점 수, E는 입력 간선 수, T는 Kruskal이 검사한 간선 수(T≤E), S는 저장한 스냅샷 수이다. 문자열 길이는 상수로, Map·Set 연산은 평균 O(1)로 본다. 가변 길이 이름에서는 문자열 비교·해싱·복사에 이름 길이 비용이 추가된다. 아래 정렬 비용은 실행 환경 V8의 비교 정렬 기준이다.

### 기본 연산

- 검증: Set으로 중복 확인 O(V+E), 정점 정렬 O(V log V), 정규화 이름 정렬 O(E log E), 최초 연결성 검사 O(V+E). 정규화 복사본/Set/인접 리스트에 O(V+E) 추가 공간을 쓴다.
- 검사 순서 정렬: 원본을 변경하지 않기 위해 간선 배열을 복사한다. O(E log E) 시간, 배열 및 정렬 작업용 O(E) 공간 상한이다. 가중치 비교는 뺄셈 대신 `<`/`>`를 사용한다.
- Union-Find: parent/rank Map 초기화 O(V), 공간 O(V). rank 기반 합치기와 경로 압축을 함께 사용하므로 일련의 find/union은 연산당 상각 O(α(V))이다. 개별 최초 find는 O(log V)일 수 있다. 반복문을 사용하여 재귀 스택이 없다.
- BFS: 활성 간선 수를 Eₐ라 하면 인접 리스트 구성과 탐색은 O(V+Eₐ). 방문 시 Set에 넣어 중복 enqueue를 방지한다. 인덱스 head로 큐를 읽어 `Array.shift()`의 이동 비용이 없다. 인접 리스트·visited·큐·요소 목록의 최대 추가 공간은 O(V+Eₐ)이다.

### 알고리즘 핵심과 기록 비용의 구분

| 구분 | Kruskal | Reverse-Delete |
|---|---|---|
| 기록을 제외한 핵심 시간(검증·정렬 포함) | O(V log V + E log E + T α(V)) | O(V log V + E log E + E(V+E)) |
| 기록 제외 최대 추가 메모리 | O(V+E) | O(V+E) |
| 스냅샷 수 | Sₖ = 1+T ≤ 1+E | Sᵣ = 1+2E |
| 저장한 전체 실행 기록 메모리 | O(Sₖ(V+E)) | O(Sᵣ(V+E)) |

Kruskal의 **Union-Find 자체**는 O(V)이지만, 실제 구현은 입력 보존을 위한 정규화 그래프·정렬 복사본·간선 상태 Map도 가지므로 기록을 제외한 추가 메모리는 O(V+E)이다. Reverse-Delete도 상태 Map과 각 검사에서 쓰는 인접 리스트 때문에 O(V+E)이다. 최종 MST 출력 간선은 O(V)이다.

각 스냅샷은 모든 E개 간선 상태를 복사하고, 활성 간선을 추출하고, 합을 계산하며, BFS로 V개 정점의 연결 요소를 기록한다. 따라서 **스냅샷 하나의 생성 시간과 저장 공간은 O(V+E)**이다. freeze도 이 자료의 수에 선형이다. 스냅샷 메모리는 작업 메모리와 달리 실행이 끝나도 결과가 유지되는 동안 남는다.

Kruskal의 실제 전체 실행 시간은

```text
O(V log V + E log E + T α(V) + Sₖ(V+E))
```

이다. 즉, 이 구현 전체를 단순히 O(E log E)라고 부르면 전체 상태 기록과 BFS 연결 요소 재구성 비용을 누락한다.

Reverse-Delete는 임시 제거 스냅샷의 BFS 결과를 삭제 판정에 그대로 재사용한다. 별도 BFS 구현 또는 별도 연결성 재검사는 없다. 초기 상태와 삭제/복구 후 스냅샷도 연결 요소를 기록하므로 BFS는 전체적으로 1+2E회 수행되며, 검증 시 BFS가 한 번 추가된다. 기록을 포함한 전체 시간은

```text
O(V log V + E log E + Sᵣ(V+E))
= O(V log V + E log E + E(V+E))
```

이다. 임시 스냅샷의 BFS와 핵심 검사 BFS는 같은 연산이므로 이들을 별도로 중복 가산하지 않는다. 두 알고리즘 모두 최악의 기록 메모리는 O(E(V+E))이며, 기록을 스트리밍하거나 delta로 압축하는 최적화는 이번 단계에 포함하지 않았다.

## 검증 방법

```powershell
npm test
npm run build
npm run lint
git diff --check
```

- 테스트 파일을 먼저 추가하고 구현 모듈이 없어 실패하는 것을 확인한 뒤 구현했다.
- 공통 검증, Union-Find, 과제 그래프의 모든 6/15개 스냅샷, AC 기각·BE 복구 설명, 입력 불변성, 중첩 freeze, 반복·순열 재현성을 검사한다.
- 정점 4개의 64개 간선 부분집합을 모두 확인한다. 비연결 입력은 오류, 연결 입력은 모든 신장 트리 후보를 완전탐색한 최솟값과 비교하고 각 스냅샷의 활성 그래프·연결 요소·행동·이유를 검증한다.
- K4의 6개 간선에 −2/0/3을 배정한 729개 조합도 완전탐색 최적 가중치와 비교한다.
- 테스트의 독립 판정은 전이 폐쇄와 간선 부분집합 열거를 사용한다. 구현의 BFS/Union-Find/정렬 함수를 정답 계산에 재사용하지 않는다.

64개 부분집합이나 729개 조합은 각각의 테스트 내부/매개변수에 해당하며 테스트 개수와 동일하지 않다. 초기 Vitest 실행 확인과 달리 이제 실제 알고리즘 테스트가 존재하며 `--passWithNoTests`를 사용하지 않는다.

최종 검증: 테스트 파일 4개, 테스트 114개 통과. TypeScript/Vite build, Oxlint, diff 공백 검사도 통과했다. 독립 코드 검토에서 발견한 입력 순서에 따른 부동소수점 오버플로 누락은 회귀 테스트의 실패를 확인한 뒤 수정했다.
