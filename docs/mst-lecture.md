# MST — 알고리즘 분석 노트

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

서로소인 집합 자료구조(disjoint set data structure)의 추상 연산을 `find`, `equal`, `merge`로 구분한다. `find`는 대표 원소를 찾고, `equal`은 대표 원소를 비교하며, `merge`는 서로 다른 두 집합을 합친다. 구현에서는 대표 비교와 합치기를 한 메서드에서 처리한다. 의사코드에서는 판단 과정을 드러내기 위해 find, equal, merge로 나누었다.

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

이 의사코드에서는 두 대표 원소 p와 q의 비교가 선택과 기각을 가른다. 대표가 다르면 서로 떨어진 집합을 합칠 수 있고, 같으면 이미 연결된 정점 사이에 간선을 더하는 것이므로 사이클이 생긴다. 이번 입력의 AC 기각이 두 번째 경우에 해당한다. 선택한 간선이 n−1개가 되면 반복을 끝내므로, 정렬된 간선을 반드시 모두 검사하는 것은 아니다.

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

여기서는 먼저 간선을 임시 제거하고, 그 상태에서 구한 연결 요소 수로 삭제 또는 복구를 결정한다. 연결 요소가 하나이면 제거 상태를 유지하고, 둘 이상이면 다시 연결해야 하므로 복구한다. 이번 입력에서는 BE를 뺐을 때 E가 고립되는 장면이 이 분기를 보여 준다. 임시 제거와 확정 판정을 별도 기록으로 나눠, 판단 전후를 구분했다.

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

## 표기와 분석 범위

정점의 수는 n, 이음선의 수는 m이다. 과제 입력은 n = 5, m = 7이다. 단위연산은 비교문이며 최악 시간복잡도는 W(m, n)으로 쓴다. lg는 밑이 2인 로그, Θ는 같은 차수의 상한과 하한을 함께 나타내는 세타 표기이다.

작은 예제의 단계 수와 입력이 커질 때의 비용을 구분하기 위해, 정점 수 n과 이음선 수 m으로 분석한다. 이름 길이는 상수로 보고 Map·Set 접근에는 평균 상수 시간 가정을 사용한다. 모든 정점이 연결된 그래프가 반드시 완전 그래프인 것은 아니므로, m이 n² 차수로 늘어나는 경우는 따로 대입한다. 시각화 기록 비용도 핵심 알고리즘 비용과 분리한다.

### 기본 연산

- **단위연산: 비교문.** 이음선 가중치 비교, 대표 원소 비교 및 BFS의 방문 여부 판단을 분석한다.
- **입력크기:** 정점의 수 n, 이음선의 수 m. 연결 그래프이므로 m ≥ n − 1이다.
- **서로소인 집합 자료구조 (disjoint set data structure):** find로 대표 원소를 찾고, equal로 비교하며, merge로 합친다.
- **연결성 검사:** 현재 남아 있는 이음선 수를 mₐ라 하면 인접 리스트 구성과 BFS 탐색은 Θ(n+mₐ)이다.

### Kruskal 수행시간 유도

- **1. 이음선 정렬:** 이음선을 가중치 순으로 정렬하는 최악 시간은 Θ(m lg m)이다.
- **2. 반복문:** 최악에서 m에 비례하는 횟수로 find, equal, merge를 수행한다. 집합 연산 비용을 로그 규모로 두는 분석 모형에서는 이 항을 Θ(m lg m)으로 둔다. 현재 최적화 구현의 상각 비용은 아래에서 별도로 구분한다. 실제 실행은 n−1개를 선택하면 조기 종료할 수 있다.
- **3. 초기화:** n개의 서로소인 집합을 초기화하는 시간은 Θ(n)이다.

```math
m ≥ n − 1
W(m, n) = Θ(m lg m) + Θ(m lg m) + Θ(n)
W(m, n) = Θ(m lg m)
```

세 항을 더한 뒤에는 입력이 커질 때 가장 빠르게 증가하는 항을 남긴다. 연결 그래프에서는 m ≥ n−1이므로, 위 정렬·반복문 분석 항이 집합 초기화 비용을 지배한다. 따라서 핵심 최악 시간은 Θ(m lg m)으로 정리된다. 이는 입력 크기에 따른 증가 차수이며, 이번 5회 검사의 실제 소요 시간을 뜻하지 않는다. 정점 하나와 이음선이 없는 입력은 별도로 즉시 처리한다.

**완전 그래프에서의 최악 규모:** 모든 정점 쌍에 이음선이 있으면 m이 n² 차수로 증가한다. 위 식의 m 자리에 이 규모를 대입해 정점 수 기준으로 바꾼다.

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

**완전 그래프에서의 최악 규모:** m ∈ Θ(n²)를 대입하면 n³ 항과 n⁴ 항이 나온다. 더 빠르게 증가하는 n⁴ 항이 지배하므로 최악 시간은 Θ(n⁴)으로 정리된다.

```math
W(m, n) ∈ Θ(n²(n + n²))
         = Θ(n³ + n⁴)
         = Θ(n⁴)
```

### 알고리즘 핵심과 기록 비용의 구분

**분석 모형과 실제 최적화 구현은 구분한다.** 위 반복문의 Θ(m lg m)은 집합 연산 비용을 로그 규모로 두었을 때의 분석 항이다. 현재 코드는 rank 기반 합치기와 경로 압축을 사용하므로 find/merge의 연속 호출은 상각 α(n)에 비례하는 시간 상한으로 분석한다. 따라서 위 반복문 항이 현재 코드의 정확한 세타 비용을 뜻하지는 않는다. 최악 정렬을 포함한 핵심 결론 Θ(m lg m)은 유지된다.

Reverse-Delete의 m × Θ(n+m)은 최악의 반복 탐색 총량을 나타낸다. 이음선이 삭제되면 각 BFS의 실제 mₐ는 줄어들므로 모든 BFS가 항상 동일한 시간이 걸린다는 뜻은 아니다. 임시 제거 스냅샷에서 구한 BFS 결과는 삭제 판단에 재사용하며 중복 검사하지 않는다.

| 구분 | Kruskal | Reverse-Delete |
|---|---|---|
| 기록을 제외한 핵심 시간(최악 분석) | W(m, n) = Θ(m lg m) | W(m, n) = Θ(m n + m²) |
| 집합 자료구조만의 공간 | Θ(n) | 해당 없음 |
| 기록 제외 최대 추가 메모리 | Θ(n+m) | Θ(n+m) |
| 스냅샷 수 | Sₖ = 1+t, t ≤ m | Sᵣ = 1+2m |
| 저장한 전체 실행 기록 메모리 | Θ(Sₖ(n+m)) | Θ(Sᵣ(n+m)) |

여기서 t는 Kruskal이 실제로 검사한 이음선 수이다. 각 스냅샷은 전체 m개 이음선 상태와 n개 정점의 연결 요소를 저장하므로 생성 시간과 저장 공간은 Θ(n+m)이다. 전체 기록 비용은 핵심 시간에 추가해야 하며, 두 알고리즘 모두 최악의 기록 공간은 Θ(m(n+m))이다.

서로소인 집합 자료구조 자체의 공간은 Θ(n)이지만, 현재 구현은 입력 보존용 복사본·정렬 배열·상태 Map도 사용하므로 전체 추가 공간은 두 알고리즘 모두 Θ(n+m)이다. 최종 MST의 이음선은 n−1개이며 출력 크기는 Θ(n)이다. 단일 정점 입력은 빈 MST·가중치 0·초기 기록 1개를 반환한다.

### 효율성 비교 요약

두 알고리즘 모두 처음에는 이음선을 정렬한다. 차이는 그다음에 무엇을 확인하는가에 있다. Kruskal은 두 정점이 같은 집합에 속하는지 확인해 선택 여부를 판단한다. 반면 현재 Reverse-Delete 구현은 이음선을 임시 제거할 때마다 BFS로 남은 그래프의 연결성을 확인한다.

**이 반복 탐색 때문에 핵심 알고리즘의 최악 시간 분석에서는 Kruskal이 유리하다.** Kruskal의 시간은 Θ(m lg m)인 반면, Reverse-Delete는 반복 연결성 검사로 Θ(m(n+m))이 된다. 완전 그래프 규모로 비교하면 각각 Θ(n² lg n)과 Θ(n⁴)이므로, 입력이 커질수록 최악 시간의 증가 폭이 달라진다.

이번 실행에서도 판단 방식의 차이를 볼 수 있다. Kruskal은 AC를 기각하고 필요한 4개 이음선을 선택한 시점에 종료한다. Reverse-Delete는 7개 이음선을 모두 검사하며 삭제 또는 복구를 결정한다. 이는 실행 과정의 차이이며, 실제 소요 시간을 측정한 결과는 아니다.

| 비교 항목 | Kruskal | Reverse-Delete |
|---|---|---|
| 핵심 시간 요약 | Θ(m lg m) | Θ(m n + m²) |
| 완전 그래프의 최악 시간 | Θ(n² lg n) | Θ(n⁴) |
| 기록 제외 추가 공간 | Θ(n+m) | Θ(n+m) |
| 주요 비교문 | 정렬 및 집합 대표 원소 비교 | 정렬 및 BFS 방문·연결성 검사 |

공간은 무엇을 포함하는지에 따라 비교가 달라진다. 서로소인 집합 자료구조만 보면 Θ(n)이지만, 현재 구현의 정렬 배열과 상태 저장 등을 포함하면 두 알고리즘의 기록 제외 추가 공간은 모두 Θ(n+m)이다. 따라서 시간 분석에서 Kruskal이 유리하다는 결론을 그대로 메모리 비교에 적용할 수는 없다.

시각화 스냅샷을 만드는 시간과 저장 공간은 핵심 알고리즘의 분석과 별도로 더해야 한다. 이 샘플의 기록은 Kruskal 6개, Reverse-Delete 15개이지만, 이 비율이 실행 속도 비율을 뜻하지는 않는다. 실제 시간 측정 없이 “몇 배 빠르다”거나 “모든 입력에서 더 빠르다”고 단정하지 않는다.

## 검증 방법

원래 구현 분석과 알고리즘 코드·테스트는 그대로 보존한다. 이 문서는 화면에 표시하는 분석 설명이며, 실행 로직과 스냅샷 상태를 변경하지 않는다.
