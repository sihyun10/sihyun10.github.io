---
title: "[3주차 공부 키워드] 다익스트라, 플로이드 워셜, 위상 정렬"
date: 2025-04-04 01:34:00 +09:00
categories: [KraftonJungle, keyword]
tags: [jungle]
pin: true
---

### 글의 목차

이번 글에선 최단 경로 알고리즘, 위상정렬에 대해 다룹니다.

1. 최단 경로 알고리즘  
   1-1. 다익스트라  
   1-2. 플로이드 워셜
2. 위상정렬

---

알고리즘 문제 중 최단 경로 (가장 짧은 경로를 찾는 알고리즘) 유형이 있다.  
최단 경로 알고리즘에는 **다익스트라 최단 경로 알고리즘**, **플로이드 워셜**, **벨만 포드 알고리즘** 이 3가지가 대표적이다.  
이 중 다익스트라와 플로이드 워셜에 대해 알아볼 것이다.

### 1. 다익스트라 최단 경로 알고리즘 (Dijkstra)

출발 노드와 이외의 모든 노드 간의 최단거리를 구하는 알고리즘  
음의 간선이 없을 때 정상적으로 동작함  
그리디 알고리즘으로 분류 (매 상황에서 가장 비용이 적은 노드를 선택해 임의의 과정을 반복하기 때문에)

#### 동작 과정

1. 출발 노드 설정  
   1-1. 출발 노드로 지정되면 거리는 0으로 설정  
   1-2. 이외의 노드들은 무한(♾️)으로 초기화
2. 최단거리 테이블 초기화
3. 방문하지 않은 노드 중에서 최단거리가 가장 짧은 노드 선택
4. 해당 노드를 거쳐 다른 노드로 가는 비용을 계산하여 최단 거리 테이블 갱신
5. 3~4번 반복하며 최단 거리 배열 완성

![다익스트라 동작과정](/assets/img/dijkstra_algorithm.jpeg)

#### 구현 코드

- 코드 출처 : [나동빈님](https://github.com/ndb796/python-for-coding-test/blob/master/9/1.py)

```python
import sys
input = sys.stdin.readline
INF = int(1e9)

# n : 노드 개수, m : 간선 개수
n, m = map(int, input().split())
start = int(input()) # 시작 노드 번호
graph = [[] for i in range(n + 1)]
visited = [False] * (n + 1)
distance = [INF] * (n + 1)

# 간선 정보를 입력받아 그래프에 튜플형태로 값 저장
for _ in range(m):
  a, b, c = map(int, input().split())
  graph[a].append((b, c))

# 방문하지 않은 노드 중 최단 거리가 가장 짧은 노드 선택
def get_smallest_node():
  min_value = INF
  index = 0
  for i in range(1, n + 1):
    if distance[i] < min_value and not visited[i]:
      min_value = distance[i]
  return index

def dijkstra(start):
  distance[start] = 0
  visited[start] = True
  for j in graph[start]:
    distance[j[0]] = j[1]
  for i in range(n - 1):
    now = get_smallest_node()
    visited[now] = True
    for j in graph[now]:
      cost = distance[now] + j[1]
      if cost < distance[j[0]]:
        distance[j[0]] = cost

dijkstra(start)

for i in range(1, n + 1):
  if distance[i] == INF:
    print("INF")
  else:
    print(distance[i])
```

위 코드는 다익스트라 알고리즘을 구현한거지만, 단점이 있다.

- 시간복잡도가 비효율적  
  `get_smallest_node()`함수는 **O(N)**의 시간복잡도를 가짐  
  최단거리가 가장 짧은 노드를 선택하기 위해서 매번 선형 탐색하기 때문이다  
  그래서 전체 시간 복잡도가 **O(N²)** 이 된다  
  만약 간선개수가 많아진다면 더욱 비효율적인 코드가 된다

이 단점을 해결할 수 있는 방안이 있다.  
바로 **우선순위 큐**를 사용하는것이다!  
우선순위 큐를 사용한다면 가장 짧은 거리의 노드를 자동으로 선택할 수 있기 때문에 초기화 과정이 필요없기 때문이다

일단, 개선된 코드를 보기 전에 우선순위 큐에 대해서 알아보자.  
우선순위 큐를 구현하기 위해 사용하는 자료구조인 **힙(Heap)** 에 대해서도 알아야한다.

#### 우선순위 큐 (Priority Queue)

우선순위가 가장 높은 데이터를 가장 먼저 삭제함

#### 힙 (Heap)

완전 이진 트리의 일종으로 우선순위 큐를 위해 만들어진 자료구조  
여러 값들 중 최대값, 최소값을 빠르게 찾아준다

종류로는 **최대 힙**, **최소 힙**이 있다

- 최대 힙 : 값이 낮은 데이터부터 꺼내는 방식
- 최소 힙 : 값이 높은 데이터부터 꺼내는 방식

그렇다면 궁금한 부분이 데이터를 삽입하고 꺼내는 과정이 오래걸리지않을까?  
힙은 내부적으로 트리구조를 이용해 데이터 삽입, 삭제에 있어 **O(logN)** 시간복잡도가 걸린다

파이썬 내장 모듈인 `heapq`는 힙을 제공해준다  
기본적으로 최소 힙으로 작동한다

- 값 추가 : `heappush(heap, item)`
- 값 제거 : `heappop(heap)`

```python
# 최소힙
import heapq
data = [1,5,3,2,9,4]
heap = []
result = []

for value in data:
  heapq.heappush(heap, value)

for i in range(len(heap)):
  result.append(heapq.heappop(heap))

print(result) # [1, 2, 3, 4, 5, 9]
```

```python
# 최대힙
# 삽입할때 -로, 뺄때도 -로
import heapq
data = [1,5,3,2,9,4]
heap = []
result = []

for value in data:
  heapq.heappush(heap, -value)

for i in range(len(heap)):
  result.append(-heapq.heappop(heap))

print(result) # [9, 5, 4, 3, 2, 1]
```

#### 개선된 구현 방법

우선순위 큐(힙)을 사용하여 가장 짧은 거리의 노드를 자동으로 선택할 수 있게해서 초기화 과정이 필요 없어졌다

- 코드 출처 : [나동빈님](https://github.com/ndb796/python-for-coding-test/blob/master/9/2.py)

```python
import heapq
import sys
input = sys.stdin.readline
INF = int(1e9)

# n : 노드의 개수, m : 간선의 개수
n, m = map(int, input().split())
start = int(input())
graph = [[] for i in range(n+1)]
distance = [INF] * (n+1)

for _ in range(m):
  a, b, c = map(int, input().split())
  graph[a].append((b,c))

def dijkstra(start):
  q = []
  heapq.heappush(q, (0, start))
  distance[start] = 0
  while q:
    dist, now = heapq.heappop(q) # 가장 짧은 거리의 노드 선택

    # 기존 거리보다 큰 값이면 무시
    if distance[now] < dist:
      continue
    for i in graph[now]:
      cost = dist + i[1]
      if cost < distance[i[0]]:
        distance[i[0]] = cost
        heapq.heappush(q, (cost, i[0]))

dijkstra(start)

for i in range(1, n+1):
  if distance[i] == INF:
    print("INF")
  else:
    print(distance[i])
```

![우선순위 큐로 개선된 동작과정](/assets/img/dijkstra_priority_queue.jpeg)

- 따로 `get_smallest_node()`를 호출할 필요 없이 힙에서 바로 꺼내서 사용하면 됨
- 시작 노드와 직접 연결된 노드 뿐만 아니라, 모든 가능한 노드가 거리가 업데이트될때마다 큐에 들어감
- 즉 이전엔 처음에 시작 노드와 연결된 노드만 초기화했지만, 우선순위 큐를 사용함으로써 모든 가능한 경로가 자연스럽게 업데이트 된다
- 시간 복잡도가 개선됨 : 기존 O(N²) → **O(E log N)** 의 시간복잡도

---

### 2. 플로이드 워셜 (Floyd-Warshall)

모든 노드에서 다른 모든 노드까지의 최단 경로를 모두 구해야 하는 경우 사용한다  
**다익스트라** 알고리즘의 최단 거리 테이블에서 거리가 가장 짧은 노드를 탐색하는 과정은 필요하지 않다는 점이 차이점이다  
2차원 리스트에 최단거리의 정보를 저장한다  
노드의 개수 N만큼 점화식에 맞게 2차원 리스트를 갱신하므로 `다이나믹 프로그래밍`으로 볼 수 있다

- 점화식 : Dab = min(Dab, Dak + Dkb)

각 단계마다 특정한 노드 k를 거쳐 가는 경우를 확인함  
a에서 b로 가는 최단 거리보다 a에서 k를 거쳐 b로 가는 거리가 더 짧은지 검사함

#### 동작과정

1. 그래프 초기화 후에 간선 정보를 입력
2. 점화식을 적용해 최단 거리 계산

#### 코드 구현

```python
import sys
input = sys.stdin.readline

n = int(input()) # 노드 개수
m = int(input()) # 간선 개수
INF = int(1e9)
graph = [[INF] * (n + 1) for _ in range(n + 1)]

# 자기자신 → 자기자신 거리 = 0 (초기화)
for i in range(1, n+1):
  graph[i][i] = 0

# 간선 정보 입력 받아서 그래프에 그 값으로 초기화
for _ in range(m):
  m1, m2, c = map(int, input().split())
  graph[m1][m2] = c

# 플로이드 워셜 점화식
for k in range(1, n+1):
  for i in range(1, n+1):
    for j in range(1, n+1):
      graph[i][j] = min(graph[i][j], graph[i][k] + graph[k][j])

# 출력 (경로가 없을때 0으로 출력)
for i in range(1, n+1):
  for j in range(1, n+1):
    if graph[i][j] == INF:
      print("0", end = " ")
    else:
      print(graph[i][j], end = " ")

  print()
```

```
# 입력 예시
4
4
1 2 3
2 3 2
3 4 1
4 2 6

# 출력 결과
0 3 5 6
0 0 2 3
0 7 0 1
0 6 8 0
```

---

### 위상 정렬 (Topology Sort)

사이클이 존재하지 않는 방향 그래프(`DAG` = `Directed Acyclic Graph`)에서 간선으로 주어진 정점 간 선후 관계를 위배하지 않도록 나열하는 정렬이다

- 간선이 방향성을 가지는 그래프
- 그래프 내부에 사이클(cycle)이 없어야함

위상 정렬은 **진입 차수**를 이용해 구현한다  
**indegree**(진입차수) : 들어오는 차수의 개수  
**차수** : 한 정점에 연결되어 있는 간선의 개수

#### 특징

- 싸이클이 없는 방향 그래프(DAG) 에만 적용 가능
- 정답이 여러개 존재 가능
- 모든 노드를 방문하지 못한다면 → 사이클이 존재한다고 판단 가능
- 시간 복잡도 : `O(V+E)`
  - 차례대로 모든 노드 확인 (`O(V)`), 해당 노드에서 출발하는 간선 차례대로 제거 (`O(E)`)
  - 노드와 간선을 모두 확인한다고 고려한다면 `O(V) + O(E) = O(V+E)` 시간복잡도가 걸림

#### 동작 과정

1. 자신에게 들어오는 간선의 수가 없는 노드를 큐에 담기
2. 큐에서 노드를 꺼내고 그 노드에 연결된 간선을 삭제
3. 큐가 빌때까지 위 과정을 반복

![위상정렬 동작과정](/assets/img/topology_sort.jpeg)

#### 구현 코드

```python
from collections import deque
import sys
input = sys.stdin.readline

# n : 노드 개수, m : 간선의 개수
n, m = map(int, input().split())
graph = [[] for i in range(n + 1)]
indegree = [0] * (n + 1) # 진입차수 0 초기화

for _ in range(m):
  a, b = map(int, input().split())
  graph[a].append(b) # 정점 a → b 방향 간선 저장
  indegree[b] += 1 # b의 진입차수 증가

def topology_sort():
  result = []
  queue = deque()
  # 처음 시작할 때는 진입차수가 0인 노드를 먼저 큐에 삽입
  for i in range(1, n + 1):
    if indegree[i] == 0:
      queue.append(i)

  while queue:
    now = queue.popleft()
    result.append(now)

    for i in graph[now]:
      indegree[i] -= 1
      # 새롭게 진입차수가 0이 되는 노드를 큐에 삽입
      if indegree[i] == 0:
        queue.append(i)

  # 위상 정렬 수행한 결과 출력
  for i in result:
    print(i, end = " ")

topology_sort()
print()
```

```
# 입력
7 8
1 2
1 5
2 3
2 6
3 4
4 7
5 6
6 4

# 출력 결과
1 2 5 3 6 4 7
```
