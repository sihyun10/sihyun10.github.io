---
title: "[3주차 공부 키워드] 그래프 (인접 행렬, 인접 리스트)"
date: 2025-03-28 12:38:00 +09:00
categories: [KraftonJungle, keyword]
tags: [jungle]
pin: true
---

### 글의 목차

이번 글에선 **그래프** 관련 내용을 다룹니다

1. 그래프
2. 그래프 구현 방법  
   2-1. 인접 행렬 (Adjacency Matrix)  
   2-2. 인접 리스트 (Adjacency List)
3. 그래프 탐색  
   4-1. 깊이 우선 탐색(DFS)  
   4-2. 너비 우선 탐색(BFS)

---

### 그래프

그래프는 **노드(N, node)** 와 그 노드를 연결하는 **간선(E, edge)** 의 집합으로 구성됨  
(노드는 정점(`vertex`)이라고도 불림)  
간선(edge)에 방향 화살표를 추가하면 그래프에 방향성이 생기게 되는데 그걸 **아크(arc)** 라 한다

간선으로 연결되어 있는 노드들은 **인접**하다라고 표현하며, 그래프를 구현하는 방법에는 2가지가 있다  
인접 행렬, 인접 리스트이다

그럼 하나씩 알아보자

### 인접 행렬 (Adjacency Matrix)

그래프의 연결 관계를 행렬로 표현해 2차원 리스트(배열)로 나타내는 방식  
`adj[i][j]` : 노드 i에서 j로 가는 간선이 존재하면 `1`, 존재하지 않으면 `0`

노드 끼리의 연결 여부를 확인하고 싶을땐 `adj[i][j]` 값이 1인지 0인지만 확인하면 된다  
즉 indexing으로 접근하기 때문에 `O(1)`의 시간 복잡도를 가진다

- 그래프의 노드 수(`n`)에 따라, n X n 크기의 배열을 생성
- 배열의 각 원소는 노드 간의 연결 여부를 나타내며, 연결 o : 1, 연결 x : 0
- 무방향 그래프인 경우, 대각선을 기준으로 대칭함

```python
def create_adj_matrix(n, edges, directed=False):
  graph = [[0] * n for _ in range(n)]

  for u, v in edges:
    graph[u][v] = 1
    if not directed: # 무방향인 경우
      graph[v][u] = 1
  return graph
```

```python
edges = [(0, 1), (0, 2), (1, 2), (2, 3)]
n = 4  # 정점 개수
matrix = create_adj_matrix(n, edges, directed=False)

for row in matrix:
    print(row)
```

```
# 출력 결과
[0, 1, 1, 0]
[1, 0, 1, 0]
[1, 1, 0, 1]
[0, 0, 1, 0]
```

### 인접 리스트 (Adjacency List)

각각의 노드에 연결된 노드들을 원소로 갖는 리스트들의 배열  
`adj[i]` : i번째 노드에 연결된 노드들을 원소로 갖는 리스트

무방향 그래프의 경우, 본인 노드 인덱스의 리스트 내에 서로를 원소로 가지게 된다  
유방향 그래프의 경우, 한쪽 방향만 저장한다

- (python에서는) 하나의 노드가 키(key)가 되고, 그 노드에 인접한 노드가 값(value)이 되는 딕셔너리로 구현가능
- 그래프의 전체 노드 목록을 저장

#### 장점

실제 연결된 노드에 대한 정보만 저장하기 때문에 모든 원소의 개수 합이 간선의 개수와 동일함  
즉 불필요한 간선 정보를 저장하지 않는다는 의미다

특정 노드의 인접 노드들을 빠르게 조회 가능하다 (`O(1)` ~ `O(N)`의 시간복잡도)

#### 단점

노드 `i`와 `j`의 연결 여부를 확인하는데, `adj[i]`리스트를 순회하며 `j`원소가 존재하는지 확인해야하므로 `O(N)`의 시간 복잡도가 걸린다. 반대로 인접 행렬은 `adj[i][j]`가 `1`인지 `0`인지만 확인하면 연결여부를 확인할 수 있기에 `O(1)`의 시간 복잡도가 걸린다. 따라서 정점의 개수가 많은데에 비해 간선의 개수가 적을 때 유용하다

#### 무방향 그래프, 방향 그래프

리스트와 딕셔너리 두가지 방식으로 그래프를 생성할 수 있다

- 두 그래프의 차이점 : 간선의 저장 방식

**[무방향 그래프 (Undirected Graph)]**  
(1-2) 연결 → 1리스트에 2추가, 2리스트에 1추가  
양방향 저장이 됨

ex) 친구 관계 : A가 B의 친구라면 B도 A의 친구, 결혼 관계 [A ⇄ B]

```python
# 리스트
graph = [
  [],
  [2,3],
  [1,4,5],
  [1,5],
  [2],
  [2,3]
]

#딕셔너리
graph = {
  1: [2,3],
  2: [1,4,5],
  3: [1,5],
  4: [2],
  5: [2,3]
}
```

**[방향 그래프 (Directed Graph)]**  
(1-2) 연결 → 1리스트에 2추가, (2리스트에 1추가 X)  
한쪽 방향만 저장이 됨

ex) 인스타 팔로우 관계 (맞팔이 아닌경우)

```python
#리스트
graph = [
  [],
  [2,3],
  [4,5],
  [],
  [5],
  []
]

#딕셔너리
graph = {
  1: [2,3],
  2: [4,5],
  3: [],
  4: [5],
  5: []
}
```

#### 입력값을 받아 그래프 생성

```python
def create_graph(edges, directed=False):
  graph = {}
  for u, v in edges:
    if u not in graph:
      graph[u] = []
    if v not in graph:
      graph[v] = []

    graph[u].append(v)
    #무방향인경우, 양방향으로 값 저장
    if not directed:
      graph[v].append(u)

  return graph
```

```python
edges = [(1, 2), (1, 3), (2, 4), (2, 5), (3, 5)]

#무방향 그래프
undirected_graph = create_graph(edges)
print(undirected_graph)
# {1: [2, 3], 2: [1, 4, 5], 3: [1, 5], 4: [2], 5: [2, 3]}

#방향 그래프
directed_graph = create_graph(edges, directed=True)
print(directed_graph)
# {1: [2, 3], 2: [4, 5], 3: [5], 4: [], 5: []}
```

<br>

#### 인접행렬, 인접리스트

![인접행렬, 인접리스트](/assets/img/graph.jpeg)

---

### 그래프 탐색

그래프 탐색 알고리즘엔 깊이 우선 탐색(DFS), 너비 우선 탐색(BFS)이 있다

#### **깊이 우선 탐색** (Depth First Search)

재귀 또는 스택 자료구조를 사용해 그래프의 가장 깊은 곳까지 방문한 뒤, 다시 돌아가 다른 경로를 탐색한다  
(즉 한 방향으로 끝까지 탐색 후, 돌아와서 다른 경로를 탐색하는 방식)

**동작과정**은 다음과 같습니다. (스택을 사용한다면)

1. 탐색 시작 노드를 스택에 삽입하고 방문 처리함  
   1-1) 이미 방문했던 노드는 재방문 하지 않기위해서
2. 스택의 최상단 노드에 방문하지 않은 인접 노드가 있다면 그 노드를 스택에 넣고 방문 처리함  
   2-1) 만약 방문하지 않은 인접 노드가 없다면 스택에서 최상단 노드 꺼내면 됨
3. 2번의 과정을 스택에 아무것도 없을때까지 반복함

**구현**은 2가지로 할 수 있습니다. (재귀, 스택)

**예제 전제**  
N : 정점의 개수, G: 각 정점에 연결된 인접 리스트

```python
# 무방향 그래프로 가정
N = 5
G = {
  1: [2,3],
  2: [1,4,5],
  3: [1,5],
  4 : [2],
  5: [2,3]
}
```

- 재귀방식(Recursive)

```python
def dfs_recursive(start, visited=None):
  if visited is None:
    visited = [False] * (N+1)
  visited[start] = True
  print(start, end = " ")

  for v in G[start]:
    if not visited[v]:
      dfs_recursive(v, visited)
  return visited

dfs_recursive(1)
print()

# 1 2 4 5 3 (출력 결과)
```

- 스택방식  
  `reversed`를 쓰는 이유는 작은 번호부터 먼저 꺼내도록 하기 위해

```python
from collections import deque

def dfs_stack(start, visited=None):
  if visited is None:
    visited = [False] * (N+1)
  stack = deque()
  stack.append(start)

  while stack:
    v = stack.pop()
    if not visited[v]:
      visited[v] = True
      print(v, end=" ")

      for u in reversed(G[v]):
        stack.append(u)
  return visited

dfs_stack(1)
print()

# 1 2 4 5 3 (출력 결과)
```

---

#### **너비 우선 탐색** (Breadth-First Search)

그래프의 루트 노드부터 시작해 인접한 노드를 모두 탐색 후, 다음 depth의 노드를 탐색한다  
(즉 시작 노드에서부터 가까운 노드들부터 탐색한다는 의미)  
(\* DFS : 그래프의 세로로 탐색하는 반면, BFS : 그래프를 가로로 탐색함)

**동작과정**은 다음과 같습니다.

1. 탐색 시작 노드를 큐에 삽입 후 방문 처리
2. 큐에서 노드를 꺼내, 해당 노드의 방문하지 않은 모든 인접 노드를 모두 큐에 삽입하고 방문 처리
3. 큐가 빌 때까지 반복

**구현**은 큐(`선입선출(FIFO)`)를 사용합니다.  
(최단 경로 탐색에 유리합니다)

```python
from collections import deque

def bfs(start, G, N):
  visited = [False] * (N + 1)
  que = deque([start])
  visited[start] = True

  while que:
    v = que.popleft()
    print(v, end = " ")

    for u in G[v]:
      if not visited[u]:
        visited[u] = True
        que.append(u)
  return visited

G = {
    1: [2, 3],
    2: [4, 5],
    3: [],
    4: [],
    5: []
}

N = 5

bfs(1, G, N)
print()

# 1 2 3 4 5 (출력 결과)
```

<br>

#### DFS, BFS 흐름

![DFS, BFS 흐름](/assets/img/first_search.jpeg)
