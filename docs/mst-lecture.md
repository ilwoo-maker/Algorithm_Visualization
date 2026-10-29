# MST — 강의교안 표기 학습 노트

## 의사코드

### Definition part — Kruskal

| 항목 | 정의 |
|---|---|
| Problem | 단순 무방향 연결 가중치 그래프에서 모든 정점을 연결하고 사이클이 없으며 이음선 가중치 합이 최소인 신장 트리(MST)를 구한다. Kruskal은 가벼운 이음선부터 서로 다른 연결 요소를 합친다. |
| Parameter | 그래프를 G=(정점 집합, 이음선 집합, w)로 나타내며, w는 각 이음선의 가중치이다. 정점의 수 n과 이음선의 수 m은 입력에서 계산하며 별도의 함수 인자로 받지 않는다. |
| Inputs | `kruskal(input: unknown)`의 `input`은 `{ vertices, edges }` 형태이다. 정점은 중복 없는 비어 있지 않은 문자열이며 최소 1개이고, 이음선은 `{ source, target, weight }`이다. 끝점은 정점 목록에 있어야 하며 자기 루프·중복 무방향 이음선은 허용하지 않는다. 가중치는 유한한 JavaScript `number`로 0·음수·소수를 허용한다. 정규화 순서의 가중치 절댓값 합이 유한하고 그래프가 연결되어 있어야 한다. 동률은 정규화된 이름·ID 오름차순으로 처리한다. |
| Outputs | 성공 시 `{ ok: true, value: { algorithm: 'kruskal', mst, totalWeight, snapshots } }`를 반환한다. `mst`는 정규화 이름순의 최종 이음선 n−1개, `totalWeight`는 최종 MST 가중치 합이다. `snapshots`는 초기 상태와 각 선택·기각의 불변 기록으로, t개 이음선을 검사하면 1+t개이다. 단일 정점이면 빈 MST·가중치 0·초기 기록 1개를 반환한다. 검증 실패 시 `{ ok: false, error: { code, message } }`를 반환한다. |

### Definition part — Reverse-Delete

| 항목 | 정의 |
|---|---|
| Problem | 같은 MST 문제를 무거운 이음선부터 제거하는 방식으로 해결한다. 각 제거 시도 후 연결성을 검사하여 연결이 유지되면 삭제하고, 끊기면 복구한다. |
| Parameter | G=(정점 집합, 이음선 집합, w), n=\|정점 집합\|, m=\|이음선 집합\|의 의미는 Kruskal과 같다. 두 알고리즘에 같은 그래프를 입력하며, n과 m은 별도 함수 인자가 아니다. |
| Inputs | `reverseDelete(input: unknown)`은 Kruskal과 동일한 그래프 형식·유효성 조건을 사용한다. 모든 이음선이 있는 상태에서 시작하며, 가중치 내림차순으로 검사한다. 동률은 가중치 방향과 무관하게 정규화된 이름·ID 오름차순으로 처리한다. |
| Outputs | 성공 시 `{ ok: true, value: { algorithm: 'reverse-delete', mst, totalWeight, snapshots } }`를 반환한다. `mst`는 정규화 이름순의 최종 이음선 n−1개, `totalWeight`는 최종 MST 가중치 합이다. `snapshots`는 초기 상태와 각 이음선의 임시 제거·삭제 또는 복구 기록으로 총 1+2m개이다. 단일 정점이면 빈 MST·가중치 0·초기 기록 1개를 반환한다. 검증 실패 시 Kruskal과 같은 오류 형식을 반환한다. |

두 알고리즘 모두 입력을 변경하지 않는다. 과제 그래프에서는 같은 MST를 반환하지만, 일반적인 동률 그래프에서는 이음선 집합이 달라도 최적 가중치는 같다. 각 `Snapshot.totalWeight`는 그 시점의 활성 이음선 합이며, 최종 결과의 `MstRun.totalWeight`와 구분한다. 특히 Reverse-Delete의 임시 제거 기록은 비연결 상태일 수 있다.

### Definition part — 공통 자료구조와 보조 연산

```text
Graph = (vertices: 문자열 배열, edges: (source, target, weight) 배열)
n = 정점 수, m = 이음선 수
PreparedGraph = 검증·정렬·끝점 정규화된 그래프의 불변 복사본
Result<T> = Success(T) | Failure(code, 한국어 message)

DisjointSets (서로소인 집합 자료구조):
  parent: Map<Vertex, Vertex>, rank: Map<Vertex, Integer>

WorkingState:
  states: Map<EdgeId, EdgeStatus>
  snapshots: Snapshot 배열

Snapshot:
  현재 행동·이유·이음선, 전체 이음선별 상태, 활성 이음선 ID와 가중치 합,
  활성 그래프의 BFS 연결 요소, 한국어 what/why

CAPTURE(graph, states, metadata):
  상태를 복사하고 활성 이음선을 추출하여 BFS 연결 요소를 구한다.
  가중치 합을 계산하고 중첩 자료까지 동결한 스냅샷을 반환한다.
FINISH(graph, snapshots):
  마지막 활성 이음선으로 MST를 만들고 최종 결과·기록 배열을 동결한다.
```

### Procedure part — 공통 검증과 BFS

```text
PREPARE(input):
  그래프/정점/이음선 형식과 중복, 루프, 끝점, 가중치를 검사한다.
  오류이면 Failure(code, 한국어 message)를 반환한다.
  정점과 이음선을 복사하고 끝점/ID/이름을 정규화하여 정렬한다.
  BFS_COMPONENTS(vertices, edges)의 요소 수가 1이 아니면 비연결 오류를 반환한다.
  불변 PreparedGraph를 반환한다.

BFS_COMPONENTS(vertices, activeEdges):
  각 정점의 인접 배열을 만들고 각 무방향 이음선을 양쪽에 추가한다.
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

### Procedure part — 서로소인 집합 자료구조

서로소인 집합 자료구조(disjoint set data structure)의 추상 연산을 `find`, `equal`, `merge`로 구분한다. `find`는 대표 원소를 찾고, `equal`은 대표 원소를 비교하며, `merge`는 서로 다른 두 집합을 합친다. 현재 구현은 이 판단과 합치기를 한 메서드 안에서 수행한다. 아래는 같은 동작을 강의용 추상 연산으로 나눈 의사코드이며 계산 코드를 변경한 것이 아니다.

```text
initialize(vertices):
  각 vertex에 대해 parent[vertex] ← vertex, rank[vertex] ← 0

find(vertex):
  root ← vertex
  WHILE parent[root] ≠ root: root ← parent[root]
  current ← vertex
  WHILE current ≠ root:
    next ← parent[current]
    parent[current] ← root
    current ← next
  RETURN root

equal(p, q):
  RETURN p = q

merge(p, q):
  // p와 q는 find로 얻은 서로 다른 대표 원소이다.
  IF rank[p] < rank[q]: SWAP(p, q)
  parent[q] ← p
  IF rank[p] = rank[q]: rank[p] ← rank[p] + 1
```

### Procedure part — Kruskal

```text
KRUSKAL(input):
  graph ← PREPARE(input); 오류이면 즉시 반환
  서로소인 집합 초기화, 모든 이음선 상태 ← pending, selectedCount ← 0
  snapshots ← [CAPTURE(초기 상태, 초기 한국어 설명)]
  ordered ← 이음선을 (가중치 ↑, 이름 ↑)으로 정렬한 복사본
  FOR edge IN ordered:
    IF selectedCount = n - 1: BREAK
    p ← find(edge.source), q ← find(edge.target)
    IF NOT equal(p, q):
      merge(p, q)
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
  모든 이음선 상태 ← present
  snapshots ← [CAPTURE(초기 상태, 초기 한국어 설명)]
  ordered ← 이음선을 (가중치 ↓, 이름 ↑)으로 정렬한 복사본
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

## 강의교안 표기와 분석 범위

정점의 수는 n, 이음선의 수는 m이다. 과제 입력은 n = 5, m = 7이다. 단위연산은 비교문이며 최악 시간복잡도는 W(m, n)으로 쓴다. lg는 밑이 2인 로그, Θ는 같은 차수의 상한과 하한을 함께 나타내는 세타 표기이다.

아래 유도는 Chap.4 The Greedy Approach에 맞춘 교안 분석 모형을 따른다. 핵심 알고리즘과 시각화 스냅샷 기록 비용은 구분한다. 이름 길이를 상수로 보고, Map·Set 접근에는 평균 상수 시간 가정을 사용한다. 일반적인 연결 그래프와 모든 정점 쌍 사이에 이음선이 있는 완전 그래프는 서로 다른 조건이다.

### 기본 연산

- **단위연산: 비교문.** 이음선 가중치 비교, 대표 원소 비교 및 BFS의 방문 여부 판단을 분석한다.
- **입력크기:** 정점의 수 n, 이음선의 수 m. 연결 그래프이므로 m ≥ n − 1이다.
- **서로소인 집합 자료구조 (disjoint set data structure):** find로 대표 원소를 찾고, equal로 비교하며, merge로 합친다.
- **연결성 검사:** 현재 남아 있는 이음선 수를 mₐ라 하면 인접 리스트 구성과 BFS 탐색은 Θ(n+mₐ)이다.

### Kruskal 수행시간 유도

- **1. 이음선 정렬:** 가중치 비교로 이음선들을 정렬하는 교안의 최악 분석은 Θ(m lg m)이다.
- **2. 반복문:** 최악에서 m에 비례하는 횟수로 find, equal, merge를 수행하며, 교안의 집합 연산 분석 항을 Θ(m lg m)으로 둔다. 실제 실행은 n−1개를 선택하면 조기 종료할 수 있다.
- **3. 초기화:** n개의 서로소인 집합을 초기화하는 시간은 Θ(n)이다.

```math
m ≥ n − 1
W(m, n) = Θ(m lg m) + Θ(m lg m) + Θ(n)
W(m, n) = Θ(m lg m)
```

연결 그래프에서는 정렬과 반복문 분석 항이 초기화 항을 지배한다. 이 수식은 입력 크기가 커지는 경우의 점근 분석이며, 정점 하나와 이음선이 없는 입력은 별도로 즉시 처리한다.

**완전 그래프에서의 최악 규모:** 모든 서로 다른 정점 쌍에 이음선이 있으면 다음과 같다.

```math
m = n(n − 1)/2 ∈ Θ(n²)
W(m, n) ∈ Θ(n² lg n²)
         = Θ(2n² lg n)
         = Θ(n² lg n)
```

### Reverse-Delete 수행시간 유도

- **1. 내림차순 정렬:** 이음선들의 정렬 시간은 Θ(m lg m)이다.
- **2. 반복 BFS:** m개 이음선을 검사하며, 전체 크기 기준의 최악 반복 탐색 총량은 m × Θ(n+m)이다.
- **지배 관계:** 반복 BFS 비용이 정렬 시간을 지배하므로 최악 시간복잡도는 다음과 같다.

```math
W(m, n) = Θ(m lg m) + Θ(m(n + m))
W(m, n) = Θ(m(n + m)) = Θ(m n + m²)
```

**완전 그래프에서의 최악 규모:** m ∈ Θ(n²)를 대입하면 다음과 같다.

```math
W(m, n) ∈ Θ(n²(n + n²))
         = Θ(n³ + n⁴)
         = Θ(n⁴)
```

### 알고리즘 핵심과 기록 비용의 구분

**교안 분석 모형과 실제 최적화 구현은 구분한다.** 위 Kruskal 반복문의 Θ(m lg m)은 제시된 교안의 집합 연산 분석 항이다. 현재 코드는 rank 기반 합치기와 경로 압축을 사용하므로 find/merge의 연속 호출은 상각 α(n)에 비례하는 시간 상한으로 분석한다. 따라서 교안의 반복문 항을 현재 코드 반복문의 정확한 세타 비용이라고 해석하지 않는다. 최악 정렬을 포함한 핵심 결론 Θ(m lg m)은 유지된다.

Reverse-Delete의 m × Θ(n+m)은 최악의 반복 탐색 총량을 나타낸다. 이음선이 삭제되면 각 BFS의 실제 mₐ는 줄어들므로 모든 BFS가 항상 동일한 시간이 걸린다는 뜻은 아니다. 임시 제거 스냅샷에서 구한 BFS 결과는 삭제 판단에 재사용하며 중복 검사하지 않는다.

| 구분 | Kruskal | Reverse-Delete |
|---|---|---|
| 기록을 제외한 핵심 시간(교안 최악 분석) | W(m, n) = Θ(m lg m) | W(m, n) = Θ(m n + m²) |
| 집합 자료구조만의 공간 | Θ(n) | 해당 없음 |
| 기록 제외 최대 추가 메모리 | Θ(n+m) | Θ(n+m) |
| 스냅샷 수 | Sₖ = 1+t, t ≤ m | Sᵣ = 1+2m |
| 저장한 전체 실행 기록 메모리 | Θ(Sₖ(n+m)) | Θ(Sᵣ(n+m)) |

여기서 t는 Kruskal이 실제로 검사한 이음선 수이다. 각 스냅샷은 전체 m개 이음선 상태와 n개 정점의 연결 요소를 저장하므로 생성 시간과 저장 공간은 Θ(n+m)이다. 전체 기록 비용은 핵심 시간에 추가해야 하며, 두 알고리즘 모두 최악의 기록 공간은 Θ(m(n+m))이다.

서로소인 집합 자료구조 자체의 공간은 Θ(n)이지만, 현재 구현은 입력 보존용 복사본·정렬 배열·상태 Map도 사용하므로 전체 추가 공간은 두 알고리즘 모두 Θ(n+m)이다. 최종 MST의 이음선은 n−1개이며 출력 크기는 Θ(n)이다. 단일 정점 입력은 빈 MST·가중치 0·초기 기록 1개를 반환한다.

### 효율성 비교 요약

**교안의 핵심 최악 시간 분석에서는 Kruskal이 시간 효율 면에서 유리하다.** 정렬 후 서로소인 집합의 find, equal, merge로 판단하는 방식이, 매 이음선마다 BFS로 연결성을 검사하는 방식보다 유리하다. 완전 그래프 규모에서는 Θ(n² lg n)과 Θ(n⁴)의 차이가 커진다.

| 비교 항목 | Kruskal | Reverse-Delete |
|---|---|---|
| 핵심 시간 요약 | Θ(m lg m) | Θ(m n + m²) |
| 완전 그래프의 최악 시간 | Θ(n² lg n) | Θ(n⁴) |
| 기록 제외 추가 공간 | Θ(n+m) | Θ(n+m) |
| 주요 비교문 | 정렬 및 집합 대표 원소 비교 | 정렬 및 BFS 방문·연결성 검사 |

시각화 스냅샷 저장 비용을 포함한 프로그램 전체 시간과 핵심 알고리즘의 W(m, n)은 구분해야 한다. 이 샘플의 기록은 Kruskal 6개, Reverse-Delete 15개지만 이 개수 비율이 실행 속도 비율은 아니다. 벤치마크 없이 “몇 배 빠르다” 또는 “모든 입력에서 실제로 더 빠르다”고 주장하지 않는다.

## 검증 방법

원래 구현 분석과 알고리즘 코드·테스트는 그대로 보존한다. 이 문서는 화면의 강의용 표기이며, 실행 로직과 스냅샷 상태를 변경하지 않는다.
