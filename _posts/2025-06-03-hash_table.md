---
title: "Hash Table (해시 테이블)"
date: 2025-06-03 14:36:00 +09:00
categories: [KraftonJungle, keyword]
tags: [jungle]
---

들어가기에 앞서...  
해시 알고리즘에 대해 짚고 넘어가자!  
(아래 내용은 **김영한의 실전 자바 - 중급 2편** (인프런) 강의 자료 내용을 참고하였습니다.)

![hash_algorithm](/assets/img/hash_algorithm.jpg){:style="max-width: 90%; height: auto; border:1px solid #eaeaea; border-radius: 7px; padding: 0px;" }

해시 테이블도 똑같다.  
해시 테이블은 `(Key, Value)`로 데이터를 저장하는 자료구조이다.  
각각의 `Key`값에 해시함수를 적용해 배열의 고유한 `index`를 생성하고, 그 `index`를 활용해 값을 저장하거나 검색한다.

각각의 `Key`값은 해시함수에 의해 고유한 `index`를 가지기에 평균 `O(1)`의 시간복잡도로 데이터를 조회할 수 있다.  
마찬가지로 데이터 저장/삭제도 평균적으로 `O(1)`의 시간복잡도를 가진다.  
하지만 해시 충돌이 발생한 경우, `Chaining`에 연결된 리스트들까지 검색해야하므로 `O(N)`의 시간복잡도를 가질 수 있다.

이제 `Pintos`에서는 어떻게 `Hash Table`을 사용하는지 알아보자!

---

[Hash Table](https://casys-kaist.github.io/pintos-kaist/appendix/hash_table.html) ← 이 글을 참고하여 작성된 글입니다.

---

### Hash Table

Pintos는 `lib/kernel/hash.c`에서 해시 테이블 자료구조를 제공한다.  
이 해시 테이블을 사용하려면, 헤더 파일인 `lib/kernel/hash.h`를 `#include "hash.h"`로 포함시켜야 한다.  
Pintos에서 제공되는 코드 중에서는 이 해시 테이블을 사용하는 부분이 없다.  
즉, 이 구조체를 그대로 사용해도 되고, 자신의 목적에 맞게 수정해도 되고, 사용하지 않아도 된다.

대부분의 가상 메모리 과제 구현에서는 해시 테이블을 사용하여 **페이지**(`page`)를 **프레임**(`frame`)으로 매핑한다.  
(해시 테이블은 이 외에도 다른 용도로 사용할 수 있다.)

- 페이지 : 가상 메모리를 일정한 크기로 나눈 블록 (프로세스 관점)
- 프레임 : 물리 메모리를 일정한 크기로 나눈 블록 (메모리 관점)

가상 메모리 구현에서는 특정 가상 주소가 어떤 물리 메모리 주소(프레임)에 대응하는지를 찾아야한다.  
이를 빠르게 찾기 위해 해시 테이블을 사용한다.

---

### Data Types

해시 테이블은 `struct hash`로 표현된다.

```c
/* Hash table. */
struct hash {
  size_t elem_cnt;            /* Number of elements in table. */
  size_t bucket_cnt;          /* Number of buckets, a power of 2. */
  struct list *buckets;       /* Array of `bucket_cnt' lists. */
  hash_hash_func *hash;       /* Hash function. */
  hash_less_func *less;       /* Comparison function. */
  void *aux;                  /* Auxiliary data for `hash' and `less'. */
};
```

`struct hash`는 해시 테이블 전체를 표현한다.  
`struct hash`의 실제 멤버들은 "불투명(`opaque`)"하다.  
즉, 해시 테이블을 사용하는 코드는 `struct hash`의 멤버에 직접 접근해서는 안되고, 그럴 필요도 없다.  
대신, 해시 테이블 관련 함수들과 매크로를 사용해야 한다.

해시 테이블은 `struct hash_elem` 타입의 요소들에 대해 작동한다.

```c
/* Hash element. */
struct hash_elem {
  struct list_elem list_elem;
};
```

해시 테이블에 넣고 싶은 구조체 안에 `struct hash_elem` 멤버를 포함시켜야 한다.  
`struct hash`와 마찬가지로, `struct hash_elem`도 불투명(`opaque`)하다.  
해시 테이블 요소를 다루는 모든 함수는 실제 구조체 포인터가 아닌, `struct hash_elem` 포인터를 인자로 받고 반환한다.  
실제 구조체로부터 `struct hash_elem`을 얻거나, 그 반대로 변환하는 작업이 자주 필요하다.  
실제 구조체에서 `&`연산자를 사용하여 그 안의 `struct hash_elem`포인터를 얻을 수 있다.

반대로 `struct hash_elem`에서 실제 구조체로 변환할 때는 `hash_entry()` 매크로를 사용한다.

```c
#define hash_entry (elem, type, member) { /* Omit details */ }
```

이 매크로는 `elem`이 포함된 구조체로 **포인터를 되돌려주는 역할**을 한다.  
여기서 `type`은 구조체 이름, `member`는 `hash_elem` 멤버의 이름이다.  
`elem`(즉, `struct hash_elem*`)이 포함된 구조체의 포인터를 반환한다.  
이때, `type`은 구조체 이름이고, `member`는 그 구조체 안에 정의된 `struct hash_elem`멤버의 이름이어야한다.

예를 들어, `h`가 `struct thread` 구조체 안의 `h_elem`이라는 `struct hash_elem`멤버를 가리키는 포인터라고 가정하자.  
이 경우 `hash_entry(h, struct thread, h_elem)`은 `h`가 속한 `struct thread`의 주소를 반환한다.  
해시 테이블의 각 요소는 반드시 고유한 키(`key`) 데이터를 가져야 하며, 이는 다른 요소들과 구분되는 식별자 역할을 한다.  
(요소는 key 외에도 중복 가능한 데이터를 포함할 수 있다.)  
요소가 해시 테이블에 있는 동안에는 `key` 값은 절대로 바꾸면 안된다.  
꼭 바꿔야 한다면, 먼저 테이블에서 제거한 뒤, 키를 수정하고 다시 삽입해야한다.

각 해시 테이블마다 키에 작용하는 두 개의 함수를 작성해야 한다 : 해시 함수와 비교 함수이다.  
이 함수들은 다음과 같은 프로토타입을 따라야 한다:

```c
typedef unsigned hash_hash_func (const struct hash_elem *e, void *aux);
```

요소의 데이터를 해싱한 값을 `unsigned int` 범위 내에서 반환한다.  
요소의 해시 값은 그 요소의 키에 기반한 의사 난수 함수여야한다.  
Pintos는 해시 함수를 만들기 위한 적절한 기반 함수들을 제공한다.

```c
unsigned hash_bytes (const void *buf, size t *size)
```

`buf`로부터 시작하는 `size`바이트 크기의 데이터를 해싱한 값을 반환한다.  
이 구현은 32-bit 워드용 범용 `Fowler-Noll-Vo` 해시이다.

```c
unsigned hash_string (const char *s)
```

`null`문자로 끝나는 문자열 `s`를 해싱한 값을 반환한다.

```c
unsigned hash_int (int i)
```

정수 `i`를 해싱한 값을 반환한다.

`key`가 하나의 적절한 타입의 데이터라면, 위 함수들 중 하나의 반환값을 그대로 해시 함수로 사용하는 것이 적절하다.  
여러 개의 데이터를 `key`로 사용할 경우, 예를 들어 `^`(배타적 OR) 연산자를 사용해 위 함수들을 여러번 호출한 결과를 결합할 수 있다.  
물론 위 함수들을 사용하지 않고 해시 함수를 처음부터 직접 작성할 수도 있다.  
하지만 목표는 **운영체제 커널을 만드는 것이지 해시 함수를 설계하는 것이 아님**을 기억해라.

```c
bool hash_less_func (const struct hash_elem *a, const struct hash_elem *b, void *aux)
```

요소 `a`와 `b`에 저장된 키들을 비교한다.  
`a`가 `b`보다 작으면 `true`를, 그렇지 않으면 `false`를 반환한다.  
두 요소가 같다고 비교된다면, 이들은 동일한 해시 값을 가져야한다.

```c
void hash_action_func (struct hash_elem *element, void *aux)
```

호출자가 선택한 어떤 동작을 해당 요소 `element`에 대해 수행한다.

---

### Basic Functions

이 함수들은 해시 테이블을 생성하고, 제거하고, 상태를 확인하는 기본적인 역할을 한다.

```c
bool hash_init (struct hash *hash, hash_hash_func *hash_func,
                    hash_less_func *less_func, void *aux);
```

해시 테이블 `hash`를 초기화한다.

- `hash_func`는 해시 함수로,
- `less_func`는 비교 함수로,
- `aux`는 부가 데이터(보통 NULL)를 넘긴다.

성공 시 `true`, 실패 시 `false`를 반환한다.  
`hash_init()`은 `malloc()`을 호출하며, 메모리 할당에 실패할 경우 실패한다.

```c
void hash_clear (struct hash *hash, hash_action_func *action);
```

`hash`테이블의 모든 요소를 제거한다.  
이 `hash`는 `hash_init()`으로 초기화된 상태여야 한다.

- `action`이 `NULL`이 아니면, 각 요소마다 한 번씩 `action` 함수가 호출된다.
- 이렇게 하면, 요소가 동적 메모리(`malloc()`)로 할당되어 있다면 `free()`를 호출할 수 있다.

요소에 대해 `action`이 호출된 이후에는 `hash_clear()`가 그 요소의 메모리를 다시 접근하지 않으므로 안전하다.  
단, `action` 내에서 `hash_insert()` 또는 `hash_delete()`처럼 해시 테이블을 수정하는 함수는 호출하면 안된다.

```c
void hash_destroy (struct hash *hash, hash_action_func *action);
```

`action`이 `NULL`이 아니면, `hash_clear()`처럼 각 요소에 대해 `action`을 호출한다.  
그 후 `hash` 자체에 할당된 메모리를 해제한다.  
`hash_destroy()` 이후에는 `hash`를 어떤 해시 테이블 함수에도 넘겨서는 안되며,  
다시 사용하려면 `hash_init()`을 다시 호출해야한다.

```c
size_t hash_size (struct hash *hash);
```

현재 해시 테이블에 저장된 요소 수를 반환한다.

```c
bool hash_empty (struct hash *hash);
```

해시 테이블이 비어 있다면 `true`, 하나라도 요소가 있으면 `false`를 반환한다.

---

### Search Functions

이 함수들은 해시 테이블 안에서 특정 요소를 찾고, 그 결과에 따라 **삽입, 교체, 반환, 삭제** 등의 동작을 수행한다.

```c
struct hash_elem *hash_insert (struct hash *hash, struct hash elem *element);
```

`hash` 테이블에서 `element`와 같은 키를 가진 요소를 검색한다.

- 찾지 못하면, `element`를 해시 테이블에 삽입하고 `NULL`을 반환한다.
- 이미 동일한 요소가 존재하면, 삽입하지 않고 그 기존 요소를 반환한다.

```c
struct hash_elem *hash_replace (struct hash *hash, struct hash elem *element);
```

`element`를 해시 테이블에 삽입한다.

- 이미 동일한 키를 가진 요소가 있다면, 기존 요소를 제거하고,
- 제거된 요소를 반환한다.
- 만약 동일한 요소가 없다면, `NULL`을 반환한다.

주의 : 반환된 요소는 사용자가 `free()`등의 방식으로 직접 자원 해제를 해야한다.  
즉, `malloc()`으로 동적 할당된 요소였다면 직접 `free()`해주어야한다.

> `hash_find()`와 `hash_delete()`에서 쓰는 `element`는 진짜 삽입되는게 아니다!  
> `hash_find()`나 `hash_delete()`에 넘기는 `element`는 해싱과 비교에만 사용된다.  
> 이 `element`는 실제로 해시 테이블에 삽입되지 않는다.  
> 따라서 `key`만 초기화하면 된다.  
> 나머지 필드는 사용할 일이 없다.
>
> 🧪 Tip : 보통 이럴 땐 `element` 구조체를 지역 변수(`local variable`)로 선언한 후,  
> 키 값만 넣고 `hash_find()` 또는 `hash_delete()`에 넘긴다.  
> (단, 큰 구조체는 지역 변수로 선언하면 스택을 과도하게 사용할 수 있으니 주의해라!)

```c
struct hash_elem *hash_find (struct hash *hash, struct hash elem *element);
```

`hash`테이블에서 `element`와 동일한 키를 가진 요소를 검색한다.

- 찾으면 그 요소를 반환,
- 없으면 `NULL`을 반환한다.

```c
struct hash_elem *hash_delete (struct hash *hash, struct hash elem *element);
```

`hash`에서 `element`와 같은 키를 가진 요소를 검색한다.

- 찾으면 그 요소를 해시 테이블에서 제거하고 반환한다.
- 없으면 `NULL`을 반환, 해시 테이블은 그대로 유지된다.

주의 : 반환된 요소는 필요에 따라 사용자가 직접 메모리 해제해야한다.

---

### Iteration Functions

해시 테이블 안의 모든 요소를 반복적으로 접근할 수 있도록 2가지 방법을 제공한다.

#### 방법 1 : `hash_action_func` 함수 사용

```c
void hash_apply (struct hash *hash, hash_action_func *action);
```

- `hash` 안에 있는 모든 요소에 대해 `action` 함수를 한 번씩 호출한다.
- 호출 순서는 임의이다. (정렬되지 않음)
- `action` 함수 안에서는 절대 `hash_insert()`나 `hash_delete()` 같은 해시 테이블을 수정하는 함수를 호출해서는 안된다.
- `action`은 요소의 키(`key`) 데이터는 수정하지 말고, 다른 데이터는 수정할 수 있다.

#### 방법 2 : 반복자 (`iterator`) 사용

`iterator` 기반 방식은 C에서 반복 구조를 제공하기 위한 전통적인 방법이다.  
다음처럼 사용한다 :

```c
struct hash_iterator i;
hash_first (&i, h);
while (hash_next (&i)) {
    struct foo *f = hash_entry (hash_cur (&i), struct foo, elem);
    // f를 이용해 무언가 작업 수행
}
```

```c
struct hash_iterator;
```

- 해시 테이블 안의 위치를 나타내는 구조체이다.
- **해시 테이블을 수정하는 함수 (`hash_insert()`, `hash_delete()`등)를 호출하면,  
  해당 반복자는 무효화된다.** (더 이상 사용하지 말 것)

```c
void hash_first (struct hash iterator *iterator, struct hash *hash);
```

- `iterator`를 `hash`의 첫 번째 요소 바로 앞에 위치하도록 초기화한다.
- 반복을 시작하려면 반드시 먼저 호출해야 한다.

```c
struct hash_elem *hash_next (struct hash iterator *iterator);
```

- `iterator`를 다음 요소로 이동시키고 해당 요소를 반환한다.
- 더 이상 요소가 없다면 NULL을 반환한다.
- NULL을 반환한 이후 `hash_next()`를 또 호출하면 동작이 정의되지 않음 (`undefined behavior`) ➔ 주의!

```c
struct hash_elem *hash_cur (struct hash iterator *iterator);
```

- `hash_next()`가 가장 최근에 반환한 요소를 반환한다.
- 단, `hash_first()` 호출 후 `hash_next()`를 한 번도 호출하지 않았다면 ➔ 호출하지 말 것 (동작이 정의되지 않음)

---

### Hash Table Example

`struct page`라는 구조체를 해시 테이블에 넣고 싶다고 가정해보자.  
먼저, `struct page`에 `struct hash_elem` 멤버를 포함시켜야 한다:

```c
struct page {
  struct hash_elem hash_elem; /* 해시 테이블 요소 */
  void *addr; /* 가상 주소 */
  /* . . . 기타 멤버들 . . . */
};
```

그 다음, 주소(`addr`)를 키로 사용하여 해시 함수와 비교 함수를 작성합니다.  
포인터는 그 바이트 값을 기반으로 해싱할 수 있으며, `<` 연산자를 사용해 포인터 비교도 가능하다:

```c
/* page p에 대한 해시 값을 반환 */
unsigned
page_hash (const struct hash_elem *p_, void *aux UNUSED) {
  const struct page *p = hash_entry (p_, struct page, hash_elem);
  return hash_bytes (&p->addr, sizeof p->addr);
}
```

```c
/* page a가 page b보다 앞서면 true 반환 */
bool
page_less (const struct hash_elem *a_,
           const struct hash_elem *b_, void *aux UNUSED) {
  const struct page *a = hash_entry (a_, struct page, hash_elem);
  const struct page *b = hash_entry (b_, struct page, hash_elem);

  return a->addr < b->addr;
}
```

> 참고: 함수의 매개변수로 사용된 `aux`는 사용되지 않으므로 `UNUSED` 키워드를 붙여 경고를 방지한다. `UNUSED`와 `aux`의 의미에 대해서는 관련 문서를 참고해라.

이제 해시 테이블을 아래와 같이 생성할 수 있다:

```c
struct hash pages;
hash_init (&pages, page_hash, page_less, NULL);
```

`p`가 `struct page`에 대한 포인터라면, 이를 해시 테이블에 삽입하는 방법은 다음과 같다:

```c
hash_insert (&pages, &p->hash_elem);
```

이미 동일한 `addr`값을 가진 `page`가 존재할 수 있다면, `hash_insert()`의 반환값을 반드시 확인해야한다.

#### 요소 검색

해시 테이블에서 요소를 검색할 때는 `hash_find()`를 사용한다.  
이 함수는 비교할 요소를 받아야 하기 때문에 약간의 준비가 필요하다.  
아래는 가상 주소를 기준으로 페이지를 찾아 반환하는 함수이다. (`pages`는 파일 전역에서 정의되어 있다고 가정)

```c
/* 주어진 가상 주소를 포함하는 page를 반환. 없으면 NULL 반환 */
struct page *
page_lookup (const void *address) {
  struct page p;
  struct hash_elem *e;

  p.addr = address;
  e = hash_find (&pages, &p.hash_elem);
  return e != NULL ? hash_entry (e, struct page, hash_elem) : NULL;
}
```

여기서 `struct page`는 지역 변수로 선언되어 있는데, 이는 해당 구조체가 작기 때문에 가능하다.  
큰 구조체는 지역 변수로 선언하지 않는 것이 좋다.

이와 유사한 방식으로, `hash_delete()`를 이용해 주소를 기준으로 페이지를 삭제하는 함수도 만들 수 있다.

---

### Auxiliary Data (보조 데이터)

위에서 본 간단한 예제처럼, 복잡하지 않은 경우에는 `aux` 매개변수가 필요 없습니다.  
이런 경우에는 `hash_init()`에 `null 포인터`(NULL)를 넘기면 되고, 해시 함수나 비교 함수 내에서 `aux`로 전달된 값을 무시하면 됩니다.  
(`aux`를 사용하지 않으면 컴파일러가 경고를 낼 수 있는데, 예제에서처럼 `UNUSED` 매크로를 사용해 그 경고를 없애거나 그냥 무시해도 됩니다.)

하지만 `aux`는 다음과 같은 특정 상황에서 유용합니다:

- 해시 테이블에 저장된 데이터의 어떤 속성(`property`)이 일정하고 고정되어 있으며, 해싱 또는 비교에 사용되지만, 데이터 항목 안에는 그 속성이 직접 저장되어 있지 않을 경우입니다.

예를 들어, 해시 테이블에 저장된 항목들이 **고정 길이의 문자열(fixed-length strings)** 일 때,  
그런데 각 항목 자체에는 그 문자열의 길이 정보가 포함되어 있지 않다면,  
문자열의 길이 정보를 `aux` 매개변수로 넘겨서 해시 함수나 비교 함수가 사용할 수 있게 하면 됩니다.

---

### Synchronization (동기화)

해시 테이블은 내부적으로 동기화를 제공하지 않는다.  
즉, 여러 스레드가 동시에 해시 테이블을 사용할 때 발생할 수 있는 충돌이나 문제는 사용자가 직접 막아야한다는 뜻이다.

▶︎ **동기화는 호출자가 책임진다.**

- 해시 테이블은 동기화를 자체적으로 처리하지 않는다.
- 따라서 해시 테이블에 접근하는 코드를 작성할 때, **동기화 처리**는 사용자가 직접 해야한다.

▶︎ **읽기 작업은 동시에 가능**

- 해시 테이블을 수정하지 않고 읽기만 하는 함수들
- `hash_find()`, `hash_next()` 같은 함수는 여러 개가 동시에 실행되어도 안전하다.

▶︎ **수정 작업은 동시 실행 불가**

- 하지만 `hash_insert()`나 `hash_delete()`처럼 해시 테이블의 내용을  
  수정하는 함수들은 동시에 실행하면 안전하지 않다.
- 즉, 해시 테이블을 수정하는 함수들은 한 번에 하나만 실행되어야 하며,  
  **동시에 읽기 작업과 수정 작업을 실행하는 것도 안전하지 않다.**

#### 해시 테이블 내부 데이터의 동기화도 필요

해시 테이블 안에 들어 있는 데이터 구조(예: `struct page`)의 동기화도 호출자가 책임져야 합니다.

그 구조체 안에 있는 데이터를 어떻게 동기화할지는  
그 데이터 구조가 어떻게 설계되어 있는지에 따라 달라집니다.  
(예: 락을 멤버로 가지거나, 외부에서 락을 걸고 접근하거나 등)
