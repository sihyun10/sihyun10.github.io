---
title: "LinkedList"
date: 2024-08-04 21:45:00 +09:00
categories: [Study, Java]
tags: [linkedlist, list, Collection]
pin: true
---

배열 리스트는 아래와 같은 단점을 가지고 있었다.

- 사용되지 않고 낭비되는 공간
  - 배열 크기를 미리 정해져있기에 사용하지 않으면 메모리가 낭비됨
- 데이터 중간에 추가
  - 추가할 공간을 확보하기 위해 오른쪽으로 이동시켜야 함

이 단점들을 어느정도 극복해주는 자료구조가 있다.

`자신에게 필요한 공간만 사용`, `노드를 생성해 각 노드를 연결시킴`  
이와 같은 특징을 가지고 있다.

이제 그럼 **Linked List**에 대해 알아보자.  
*(단방향 연결리스트로 설명한다는 점에 유의)*

----------------------------------------------------------------

### Linked List `(단방향 연결리스트)`

```java
//Singly linked list
public class Node {
  Object data;
  Node next;

  public Node(Object data) {
    this.data = data;
  }
}
```

내부에 저장할 데이터 `data`, 연결해줄 노드 참조값 `next`를 가진다.  

```java
public class NodeMain {
  public static void main(String[] args) {
    Node head = new Node("A");
    head.next = new Node("B");
    head.next.next = new Node("C");
  }
}
```

1. `new Node("A")` ← 노드를 생성하고, 그 참조값을 `head`에 저장  
   1-1) `head`와 `Node0`이 서로 연결됨
2. `head`는 `Node0`을 가리킨다. `Node0.next`에 `new Node("B")`의 참조값 저장  
   2-1) `Node0`과 `Node1`이 서로 연결됨
3. `head.next`는 `Node1`을 가리킨다. `Node1.next`에 `new Node("C")`의 참조값 저장  
   3-1) `Node1`과 `Node2`가 서로 연결됨

바로 아래 그림과 같이 `Node`들이 연결되게 된다.

<br>

![연결리스트](/assets/img/linked_list.jpg)

----------------------------------------------------------------

### 추가  

새로운 노드를 생성하고, 그 노드의 `next`값을 다음 노드의 참조값으로 변경한다.  
(앞에 위치한 노드는 새로 생성한 노드의 참조값을 가리키면 된다.)  

**앞에 값을 추가**하는 경우는 바로 참조값 연결만 변경하고 연결시키면 되기에 시간 복잡도가 `O(1)`이다.  

하지만, **중간**이나 **끝에 값을 추가**하는 경우는 추가할 위치까지 찾는데 `O(n)`이 걸린다.   
찾은 다음 참조값 연결 변경 후 서로 연결해주는 데에는 O(1)이 걸린다.  

따라서 앞에 값을 추가하는 것이 가장 효율적이다.    

> ArrayList는 뒤에 값을 추가하는 것이 빠르며,  
> LinkedList는 앞에 값을 추가하는 것이 빠르다.  

<br>

![값 추가](/assets/img/linked_list_add.jpg){:style="width:90%; height:auto;"}  


### 삭제  

삭제도 값을 추가하는 것과 비슷하다고 보면 된다.   

삭제할 노드와 삭제 이전 노드를 찾은 다음에  
삭제 이전 노드와 삭제 이후 노드를 연결한다.  
(삭제 이전 노드의 `next`값을 삭제 이후 노드의 참조값으로 변경해주면 됨)  
마지막으로 삭제할 노드를 초기화 시킨다. (`data`값도 null, `next`값도 null)  

----------------------------------------------------------------

### Linked List 시간 복잡도    

||Linked List|
|:---:|:---|
|앞에 값 추가(삭제)|O(1)|
|중간, 뒤에 값 추가(삭제)|O(n)|  
|검색|O(n)|
|조회|O(n)|

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->
> 자바에서 제공하는 연결리스트는 **이중 연결 리스트**(Doubly Linked List)이다.  
> 이중 연결 리스트는 이전 노드 참조값도 가지고 있다.   
> 따라서 각 노드의 접근과 이동이 훨씬 수월해 진다.      
> ```java
> public class Node {
>   Object data;
>   Node next; //다음 노드 참조값 저장
>   Node previous; // 이전 노드 참조값 저장
> }
> ```      
> 마지막 노드를 참조하는 변수를 가지고 있기 때문에 `뒤에 값 추가(삭제)`가 `O(1)`의 시간복잡도를 가지게 된다.   
{: .prompt-tip }

<!-- markdownlint-restore -->
