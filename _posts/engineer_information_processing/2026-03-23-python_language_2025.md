---
title: "[2025년] 정보처리기사 실기 - Python 언어"
date: 2026-03-23 22:18:20 +09:00
categories: [Study, Engineer_Information_Processing]
tags: [정보처리기사, 실기, python]
pin: false
author: sihyun
---

2025년도 1회, 2회, 3회의 정보처리기사 실기 기출문제 속 Python 언어 문제를 정리하였다.

## 2025년 1회 정보처리기사 실기

### 문제 1. 트리

```python
class Node:
  def __init__(self, value):
    self.value = value
    self.children = []

  def tree(li):
    nodes = [Node(i) for i in li]
    for i in range(1, len(li)):
      nodes[(i - 1) // 2].children.append(nodes[i])
    return nodes[0]

  def calc(node, level = 0):
    if node is None:
      return 0
    return (node.value if level % 2 == 1 else 0) + sum(calc(n, level + 1) for n in node.children)

  li = [3, 5, 8, 12, 15, 18, 21]
  root = tree(li)
  print(calc(root))
```

<details markdown="1">
  <summary>더보기</summary>
  
  [정답]   
  13
  
  [풀이]  
  **Node 클래스 (트리의 기본 구조)**

```python
class Node:
  def __init__(self, value):
    self.value = value
    self.children = []
```

트리의 **노드**를 정의하는 클래스이다.

- `value` : 노드의 값
- `children` : 자식 노드들을 저장하는 리스트

이 코드는 **완전 이진 트리 구조를 따르지만**,  
구현은 `left/right` 포인터 대신 `children` 리스트를 사용한 **일반 트리 형태**이다.

<br>

**tree(li) 함수 (리스트 ➔ 트리 변환)**

```python
def tree(li):
  nodes = [Node(i) for i in li]
  for i in range(1, len(li)):
    nodes[(i - 1) // 2].children.append(nodes[i])
  return nodes[0]
```

리스트를 **완전 이진 트리** 형태로 변환하는 함수이다.

- 각 노드는 배열 인덱스를 기반으로 부모와 연결된다.
- 부모 인덱스 : `(i - 1) // 2`

> (참고) ← _완전 이진 트리 성질_
>
> - 왼쪽 자식 : `2i + 1`
> - 오른쪽 자식 : `2i + 2`  
>   현재 노드 `i`의 부모를 찾아서 연결하는 방식이다.

<br>

```python
li = [3, 5, 8, 12, 15, 18, 21]
```

생성되는 트리 구조:

```
        3
      /   \
     5     8
    / \   / \
  12  15 18  21

nodes[0] -> 루트 노드 (3)
```

<br>

**calc(node, level) 함수**

```python
def calc(node, level = 0):
  if node is None:
    return 0
  return (node.value if level % 2 == 1 else 0) + sum(calc(n, level + 1) for n in node.children)
```

트리를 **DFS(깊이 우선 탐색)** 방식으로 순회하면서 홀수 `level`에 해당하는 노드 값만 누적한다.

- 루트 : level 0
- 자식 : level 1
- 손자 : level 2

```python
# 현재 노드가 홀수 level일 때만 값을 더한다.
(node.value if level % 2 == 1 else 0)
```

<br>

```python
sum(calc(n, level + 1) for n in node.children)
```

각 자식 노드에 대해 `calc`를 호출하고, 그 결과들을 모두 더해서 반환한다.  
즉, 각 자식 서브트리의 계산 결과를 모두 합산하는 역할을 한다.

```
        3
      /   \
     5     8
    / \   / \
  12  15 18  21

level 0:        3
level 1:      5   8
level 2:    12 15 18 21
```

홀수 level만 선택해서 더한다.

```
calc(3, 0)
➔ (0) + calc(5, 1) + calc(8, 1)

calc(5, 1)
➔ (5) + calc(12, 2) + calc(15, 2)
➔ 5

calc(8, 1)
➔ (8) + calc(18, 2) + calc(21, 2)
➔ 8

최종 결과: 5 + 8 = 13
```

```python
print(calc(root)) # 13
```

</details>

---

## 2025년 2회 정보처리기사 실기

### 문제 2. set() 생성자와 dictionary

```python
lst = [1,2,3]
dst = {i : i * 2 for i in lst}
s = set(dst.values())
lst[0] = 99
dst[2] = 7
s.add(99)
print(len(s & set(dst.values())))
```

<details markdown="1">
  <summary>더보기</summary>
  
  [정답]   
  2
  
  [풀이]  
  **딕셔너리 생성**

```python
lst = [1, 2, 3]
dst = {i : i * 2 for i in lst}
```

```python
# 생성된 dst 딕셔너리
dst = {1 : 2, 2 : 4, 3 : 6}
```

**set 생성**

```python
s = set(dst.values())
```

`set()` 생성자는 기존 데이터를 이용해서 **새로운 객체를 만들어 복사**한다.  
 또한 `set()` 생성자는 기존 데이터에서 중복되는 데이터는 제거한다.

```python
s = {2, 4, 6}
```

---

**리스트 수정**

```python
lst[0] = 99
```

```python
lst = [99, 2, 3]
```

> **참고**  
> `dst`는 `lst`의 값을 이용해 새로 만들어진 딕셔너리이므로,  
> 이후 `lst`를 수정해도 `dst`에는 영향을 주지 않는다.

**딕셔너리 값 변경**

```python
dst[2] = 7
# dst = {1 : 2, 2 : 7, 3 : 6}
```

---

**set에 값 추가**

```python
s.add(99)
# s = {2, 4, 6, 99}
```

**`print(len(s & set(dst.values())))`**

```python
# set(dst.values())
dst = {1 : 2, 2 : 7, 3 : 6}
dst.values() # dict_values([2,7,6])
set(dst.values()) # {2, 7, 6}
```

```python
# s & set(dst.values()) ➔ 교집합 구하기
s = {2, 4, 6, 99}
set(dst.values()) = {2, 7, 6}

{2, 4, 6, 99} & {2, 7, 6} = {2, 6}
```

```python
# len(s & set(dst.values()))
len({2, 6}) = 2
```

따라서 **2**가 출력된다.

<br>

---

**set(), list(), dict() 생성자**

기존 데이터를 이용해서 새로운 객체를 만들어 복사한다.  
따라서 **서로 독립적으로 변경된다.**

- 예시 코드

```python
a = [1, 2, 3]
b = list(a)

b[0] = 50

print(a) # [1,2,3]
print(b) # [50,2,3]
```

`list()`, `set()`, `dict()`로 만든 객체는  
기존 데이터를 복사해서 새로 만들기 때문에  
**한쪽을 수정해도 다른 쪽에는 영향을 주지 않는다.**

---

**dictionary 사용법**

`<Key, Value>` 형식의 컬렉션이다.  
`Key`는 `dictionary` 내에서 고유해야한다.

| **dictionary 객체에 추가, 수정, 삭제**

- 추가 (또는 수정 포함) ⟹ `dst[key] = value`
  - key가 없으면 **추가**
  - key가 있으면 **수정**

  ```python
  dst = {1 : 2, 2 : 4, 3 : 6}
  dst[4] = 10

  # dst = {1 : 2, 2 : 4, 3 : 6, 4 : 10}
  ```

- 삭제
  - `del` : 단순 삭제 (값 반환 없음)
  - `pop()` : 값을 반환하면서 삭제
    - `value = dst.pop(1)`
      - 반환값: `2` (value)
      - dst에서 `{1 : 2}` 삭제

  ```python
  dst = {1 : 2, 2 : 4, 3 : 6}
  del dst[1]

  # dst = {2 : 4, 3 : 6}
  ```

  ```python
  dst = {1 : 2, 2 : 4, 3 : 6}

  value = dst.pop(1) # value = 2
  # dst = {2 : 4, 3 : 6}
  ```

---

**List, Dictionary, Set 차이**

- List : 순서 o, 중복 o, 변경 o
- Dictionary : Key는 중복 x, value는 중복 o, (Python 3.7+ 기준) 삽입 순서 유지
- Set : 순서 x, 중복 x

**List, Tuple 차이**

- List : 수정 가능 (mutable)
- Tuple : 수정 불가능 (immutable)

</details>

---

## 2025년 3회 정보처리기사 실기

### 문제 3. enumerate() 함수

```python
data = [
  [3, 5, 2, 4, 1],
  [4, 5, 1],
  [4, 4, 1, 5, 4],
  [4, 5]
]

result = {}

for index, lis in enumerate(data):
  list_sum = sum(lis)
  list_len = len(lis)

  result[index] = (list_sum, list_len)

print(result)
```

```
[출력값]

{0: (①, ②), 1: (③, ④), 2: (⑤, ⑥), 3: (⑦, ⑧)}
```

<details markdown="1">
  <summary>더보기</summary>
  
  [정답]   
  ①=15, ②=5, ③=10, ④=3, ⑤=18, ⑥=5, ⑦=9, ⑧=2
  
  [풀이]  
  **enumerate() 함수**  
  파이썬의 내장 함수이며,  
  인덱스(`index`)와 값(`lis`)에 동시에 접근하며, 루프를 돌릴 때 사용한다.

```python
for index, lis in enumerate(data):
  list_sum = sum(lis)
  list_len = len(lis)

# (합, 길이) 형태의 튜플로 만들어 저장한다.
result[index] = (list_sum, list_len)
```

- `data`는 여러 개의 리스트를 요소로 갖는 이중 리스트이다.
- `enumerate(data)`를 사용하여 각 리스트의 **인덱스(index)**와 **리스트(lis)**를 동시에 순회한다.
- 각 리스트에 대해
  - `sum(lis)`로 리스트의 합을 구하고
  - `len(lis)`로 리스트의 길이를 구한다.
- 그 결과를 `(합, 길이)` 형태의 튜플로 만들어 `result[index]`에 저장한다.

| index | 리스트          | 합  | 길이 |
| :---- | :-------------- | :-- | :--- |
| 0     | [3, 5, 2, 4, 1] | 15  | 5    |
| 1     | [4, 5, 1]       | 10  | 3    |
| 2     | [4, 4, 1, 5, 4] | 18  | 5    |
| 3     | [4, 5]          | 9   | 2    |

```python
result = {0 : (15, 5), 1 : (10, 3), 2 : (18, 5), 3 : (9, 2)}
```

따라서 출력 값은 다음과 같다.

```
{0: (15, 5), 1: (10, 3), 2: (18, 5), 3: (9, 2)}
```

</details>
