---
title: "Pintos Project 3 : introduction"
date: 2025-05-30 13:33:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

카이스트 핀토스 과제 : [Project 3 : introduction](https://casys-kaist.github.io/pintos-kaist/project3/introduction.html)  
이 사이트에 작성된 내용을 바탕으로 작성한 글입니다.

---

### Project 3 : Virtual Memory

이때까지 Pintos의 내부 동작 방식에 어느 정도 익숙해졌어야 한다.  
우리의 운영체제는 적절한 동기화와 함께 여러 실행 스레드를 제대로 처리할 수 있으며, 동시에 여러 사용자 프로그램을 불러올 수 있다.  
하지만 실행할 수 있는 프로그램의 개수와 크기는 컴퓨터의 주 메모리 크기에 따라 제한된다.  
이번 과제에서는 무한한 메모리가 있는 것처럼 보이도록 만들어서 이러한 제한을 없앨 것이다.

---

### Source Files

이번 프로젝트는 `vm` 디렉토리 안에서 작업하게 된다.  
Makefile이 `-DVM` 설정을 활성화하도록 업데이트되어 있다.  
우리는 방대한 양의 템플릿 코드를 제공한다. 반드시 이 템플릿을 따라야 한다.  
`"DO NOT CHANGE"`로 표시된 템플릿 부분은 절대 변경하면 안된다.  
여기에는 여러분이 수정하게 될 각 템플릿 파일에 대한 세부 정보가 제공된다.

- `include/vm/vm.h`, `vm/vm.c`

가상 메모리를 위한 일반적인 인터페이스를 제공한다. 헤더 파일에는 가상 메모리 시스템이 지원해야 할 여러 `vm_type`(`VM_UNINIT`, `VM_ANON`, `VM_FILE`, `VM_PAGE_CACHE`)에 대한 정의와 설명이 있다. (단, `VM_PAGE_CACHE`는 지금은 무시해도 된다. 이는 프로젝트 4의 내용이다.) 또한 보조 페이지 테이블(`SUpplementary Page Table`)도 이곳에 구현하게 된다.

- `include/vm/uninit.h`, `vm/uninit.c`

초기화되지 않은 페이지(`vm_type` = `VM_UNINIT`)에 대한 작업을 제공합니다. 현재 설계에서는 모든 페이지가 처음에는 초기화되지 않은 상태로 설정되며, 이후 익명 페이지 또는 파일 기반 페이지로 변환됩니다.

- `include/vm/anon.h`, `vm/anon.c`

익명 페이지(`vm_type` = `VM_ANON`)에 대한 작업을 제공합니다.

- `include/vm/file.h`, `vm/file.c`

파일 기반 페이지(`vm_type` = `VM_FILE`)에 대한 동작을 제공합니다.

- `include/vm/inspect.h`, `vm/inspect.c`

채점을 위한 메모리 검사 작업을 포함하고 있다. 이 파일들은 변경하지 마라!

이 프로젝트에서 작성하는 대부분의 코드는 `VM` 디렉토리에 있는 파일과 이전 프로젝트에서 소개된 파일이다.  
아마도 처음 접하는 파일은 다음과 같은 몇 가지 파일일 것이다.

- `include/devices/block.h`, `devices/block.c`

블록 장치에 대한 섹터 기반 읽기/쓰기 접근을 제공한다. 스왑 파티션에 접근할 때 이 인터페이스를 사용하게 된다.

---

### Memory Terminology

먼저 `memory`와 `storage`에 대한 몇 가지 용어를 소개한다.  
이러한 용어 중 일부는 project 2에서 익숙할 수 있지만, 많은 부분이 새로운 용어이다.

### Pages

`page` 또는 `Virtual Page`는 **연속적인 가상 메모리 영역**을 의미하며, 길이는 4,096 byte(페이지 크기)이다.  
페이지는 반드시 페이지 정렬되어야 한다.  
이는 해당 페이지가 시작되는 가상 주소가 4096으로 나누어 떨어져야 함을 의미한다.  
따라서 64 bit 가상 주소의 하위 12 bit는 페이지 오프셋(`offset`)이다.  
상위 bit들은 페이지 테이블에서의 **index**를 나타내는 데 사용된다.  
64 bit 시스템에서는 4단계(`page table level 4`)의 페이지 테이블 구조를 사용하며, 가상 주소는 다음과 같은 형태를 갖는다.

```
 63          48 47            39 38            30 29            21 20         12 11         0
+-------------+----------------+----------------+----------------+-------------+------------+
| Sign Extend |    Page-Map    | Page-Directory | Page-directory |  Page-Table |    Page    |
|             | Level-4 Offset |    Pointer     |     Offset     |   Offset    |   Offset   |
+-------------+----------------+----------------+----------------+-------------+------------+
              |                |                |                |             |            |
              +------- 9 ------+------- 9 ------+------- 9 ------+----- 9 -----+---- 12 ----+
                                          Virtual Address
```

각 프로세스는 독립적인 사용자(가상) 페이지 집합을 가지며, 이는 가상 주소 `KERN_BASE`(`0x8004000000`)보다 낮은 주소에 해당한다.

반면, 커널(가상) 페이지 집합은 전역(`global`)으로, 어떤 스레드나 프로세스가 실행 중이든 항상 같은 위치에 존재한다. 커널은 사용자 페이지와 커널 페이지 모두 접근할 수 있지만, 사용자 프로세스는 자신의 사용자 페이지만 접근할 수 있다.

Pintos는 가상 주소 작업에 유용한 함수들을 여러 개 제공한다.  
자세한 내용은 [Virtual Addresses](https://casys-kaist.github.io/pintos-kaist/appendix/virtual_address.html) 섹션을 참고해라.

#### | **Virtual Addresses**

```
 63          48 47            39 38            30 29            21 20         12 11         0
+-------------+----------------+----------------+----------------+-------------+------------+
| Sign Extend |    Page-Map    | Page-Directory | Page-directory |  Page-Table |    Page    |
|             | Level-4 Offset |    Pointer     |     Offset     |   Offset    |   Offset   |
+-------------+----------------+----------------+----------------+-------------+------------+
              |                |                |                |             |            |
              +------- 9 ------+------- 9 ------+------- 9 ------+----- 9 -----+---- 12 ----+
                                          Virtual Address
```

다음 헤더 파일들에서 이러한 가상 주소를 다루는 매크로와 함수들이 정의되어 있다.

- `include/threads/vaddr.h`
- `include/threads/mmu.h`

<br>

```c
#define PGSHIFT { /* 생략 */ }
#define PGBITS  { /* 생략 */ }
```

- `PGSHIFT` : 가상 주소에서 페이지 오프셋의 시작 비트 인덱스 (0)
- `PGBITS` : 페이지 오프셋의 비트 수 (12)

```c
#define PGMASK { /* 생략 */ }
```

- `PGMASK` : 페이지 오프셋 비트를 1로 설정된 비트 마스크, 나머지는 0(`0xfff`)으로 설정됨

```c
#define PGSIZE { /* 생략 */ }
```

- `PGSIZE` : 페이지 크기(byte) (`4,096` byte)

```c
#define pg_ofs(va) { /* 생략 */ }
```

가상 주소 `va`에서 페이지 오프셋을 추출하고 반환한다.

```c
#define pg_no(va) { /* 생략 */ }
```

가상 주소 `va`가 속한 페이지 번호를 반환한다.

```c
#define pg_round_down(va) { /* Omit details */ }
```

- 주소 `va`가 포함된 페이지의 시작 주소를 반환한다.  
  즉 페이지 오프셋이 0으로 설정된 `va`를 반환한다.

```c
#define pg_round_up(va) { /* 생략 */ }
```

- 주소 `va`를 가장 가까운 다음 페이지 경계로 올림한 주소를 반환한다.

핀토스의 가상 메모리는 사용자 가상 메모리와 커널 가상 메모리의 2가지 영역으로 나뉜다.  
그들 사이의 경계는 `KERN_BASE`이다.

```c
#define KERN_BASE { /* Omit details */ }
```

커널 가상 메모리의 기본 주소이다.  
기본 값은 `0x8004000000`이다.  
사용자 가상 메모리의 범위는 가상 주소 `0`부터 `KERN_BASE`까지이다.  
커널 가상 메모리는 나머지 가상 주소 공간을 차지한다.

```c
#define is_user_vaddr(vaddr) { /* Omit details */ }
#define is_kernel_vaddr(vaddr) { /* Omit details */ }
```

- 각각의 가상 주소 `vaddr`이 사용자 가상 주소인지 또는 커널 가상 주소인지 판별한다.
- 반환값:
  - `true` : 해당 주소가 사용자/커널 주소이면
  - `false` : 그렇지 않으면

<br>

`x86-64`는 물리 주소로 직접 메모리에 접근할 수 있는 방법을 제공하지 않는다.

운영체제 커널은 물리 주소에 직접 접근할 필요가 있으므로,  
Pintos는 이를 우회하기 위해 커널 가상 메모리 공간을 물리 메모리에 1:1 매핑한다.

- `KERN_BASE`보다 큰 가상 주소 ➔ 물리 메모리의 주소로 직접 매핑된다
  - 가상 주소 `KERN_BASE` ➔ 물리 주소 `0`
  - 가상 주소 `KERN_BASE` + `0x1234` ➔ 물리 주소 `0x1234`
- 이 매핑은 물리 메모리의 전체 크기까지 유효하다

따라서

- `물리 주소 + KERN_BASE` = 해당 주소를 가리키는 **커널 가상 주소**
- `커널 가상 주소 - KERN_BASE` = 해당 주소가 가리키는 **물리 주소**

헤더 `include/threads/vaddr.h`는 이러한 번역을 수행할 수 있는 두 가지 함수를 제공한다.

```c
#define ptov(paddr) { /* Omit details */ }
```

- `ptov` : 물리 주소 `paddr`를 커널 가상 주소로 변환한다.
  - 입력 : `0 ~ 실제 물리 메모리 크기` 범위의 주소
  - 출력 : 해당 주소를 가리키는 **커널 가상 주소**

```c
#define vtop(vaddr) { /* 생략 */ }
```

- `vtop` : 커널 가상 주소 `vaddr`를 물리 주소로 변환한다.
  - 입력 : `KERN_BASE`보다 큰 가상 주소
  - 출력 : 해당 주소가 가리키는 물리 주소

`include/threads/mmu.h`는 페이지 테이블에서 작업을 제공한다.

```c
#define is_user_pte(pte) { /* Omit details */ }
#define is_kern_pte(pte) { /* Omit details */ }
```

주어진 페이지 테이블 엔트리 `pte`가 사용자 소유인지, 커널 소유인지를 확인한다.

```c
#define is_writable(pte) { /* Omit details */ }
```

주어진 페이지 테이블 엔트리 `pte`가 쓰기 가능한(`writable`) 주소를 가리키는지 여부를 반환한다.

```c
typedef bool pte_for_each_func (uint64_t *pte, void *va, void *aux);
bool pml4_for_each (uint64_t *pml4, pte_for_each_func *func, void *aux);
```

`PML4` 아래의 유효한 각 항목(`entry`)에 대해, 보조 값(`AUX`)을 사용하여 `FUNC`를 적용한다.  
`VA`는 해당 항목의 가상 주소를 나타낸다.  
만약 `pte_for_each_func`가 `false`를 반환하면, 순회를 중단하고 `false`를 반환한다.

<br>

아래 코드는 `pml4_for_each()` 함수에 전달할 수 있는 예시 함수이다.

```c
static bool
stat_page (uint64_t *pte, void *va,  void *aux) {
  if (is_user_vaddr (va))
    printf ("user page: %llx\n", va);
  if (is_writable (va))
    printf ("writable page: %llx\n", va);
  return true;
}
```

---

### Frames

프레임(`frame`)은 물리적 프레임(`physical frame`) 또는 페이지 프레임(`page frame`)이라고도 하며, 물리적 메모리 상의 연속적인 영역을 의미한다.  
페이지와 마찬가지로 프레임도 페이지 크기여야 하며, 페이지 정렬되어야 한다.  
따라서, 64 bit 물리 주소는 프레임 번호와 프레임 오프셋 (또는 단순히 오프셋)으로 나눌 수 있다.

```
                          12 11         0
    +-----------------------+-----------+
    |      Frame Number     |   Offset  |
    +-----------------------+-----------+
              Physical Address
```

`x86-64` 아키텍처는 물리 주소를 이용해 메모리에 직접 접근하는 방법을 제공하지 않는다.  
Pintos는 이를 우회하기 위해 커널 가상 메모리를 물리 메모리에 직접 1:1로 매핑한다.  
커널 가상 메모리의 첫 번째 페이지는 물리 메모리의 첫 번째 프레임에, 두 번째 페이지는 두 번째 프레임에 매핑되고, 이런식으로 계속 된다. 따라서 프레임은 커널 가상 메모리를 통해 접근할 수 있다.

Pintos는 물리 주소와 커널 가상 주소 간의 변환을 위한 함수를 제공한다.  
자세한 내용은 [Virtual Addresses](https://casys-kaist.github.io/pintos-kaist/appendix/virtual_address.html) 섹션을 참고!

---

### Page Tables

페이지 테이블(`page table`)은 CPU가 가상 주소를 물리 주소로 변환할 때 사용하는 데이터 구조이다.  
즉, 페이지를 프레임으로 변환해준다.  
페이지 테이블의 형식은 `x86-64` 아키텍처에 의해 정의되어 있다.  
Pintos는 `threads/mmu.c` 파일에 페이지 테이블을 관리하는 코드를 제공한다.

아래 그림은 페이지와 프레임 간의 관계를 보여준다.  
왼쪽에 있는 가상 주소는 페이지 번호와 오프셋(`offset`)으로 구성된다.  
페이지 테이블은 페이지 번호를 프레임 번호로 변환하며, 여기에 변경되지 않은 오프셋을 결합하여 오른쪽의 물리 주소를 얻는다.

```
                          +----------+
         .--------------->|Page Table|-----------.
        /                 +----------+            |
        |   12 11 0                               V  12 11 0
    +---------+----+                         +---------+----+
    | Page Nr | Ofs|                         |Frame Nr | Ofs|
    +---------+----+                         +---------+----+
     Virt Addr   |                            Phys Addr    ^
                  \_______________________________________/
```

- 가상 주소는 페이지 번호 + 오프셋 형태이고, 페이지 번호가 페이지 테이블을 통해 프레임 번호로 매핑되며, 오프셋은 그대로 붙어서 물리 주소가 완성된다.

### Swap Slots

스왑 슬롯(`swap slot`)은 스왑 파티션(`swap partition`) 내의 페이지 크기만큼의 디스크 공간이다.  
하드웨어 제한 사항으로 인해 슬롯의 배치가 프레임보다 더 유연하긴 하지만, 스왑 슬롯 역시 페이지 정렬되는 것이 좋다. 이는 그렇게 해도 손해가 없기 때문이다.

---

### Resource Management Overview

다음과 같은 데이터 구조를 설계하고 구현해야 한다.

- **Supplemental page table** (보조 페이지 테이블)  
  페이지 테이블을 보완하여 페이지 폴트 처리를 가능하게 한다.  
  자세한 내용은 아래 `Managing the Supplemental Page Table`을 참조해라.

- **Frame table** (프레임 테이블)  
  물리 프레임의 `eviction policy`을 효율적으로 구현할 수 있게 해준다.  
  자세한 내용은 아래 `Managing the Frame Table`을 참조해라.

- **Swap table** (스왑 테이블)  
  스왑 슬롯의 사용 현황을 추적한다.  
  자세한 내용은 아래 `Managing the Swap Table`을 참조해라.

세 데이터 구조를 꼭 완전히 분리해서 구현할 필요는 없다.  
관련된 자원을 전부 또는 일부 통합하여 하나의 데이터 구조로 구현하는 것이 더 편할 수도 있다.

각 데이터 구조에 대해 각 요소에 어떤 정보가 포함되어야 할지 결정해야 한다.  
또한 데이터 구조의 범위, 즉 로컬(프로세스별) 또는 글로벌(전체 시스템에 적용) 및 범위 내에서 필요한 인스턴스 수를 결정해야 한다.

설계를 단순화하기 위해, 이러한 데이터 구조들을 페이징되지 않는(`non-pageable`) 메모리에 저장해도 된다. (예: `calloc` 또는 `malloc`으로 할당된 메모리)  
이렇게 하면 데이터 구조들 간의 포인터가 항상 유효하다는 점을 보장받을 수 있다.

---

### Choices of implementation (Performance perspective)

구현에 사용할 수 있는 자료구조로는 배열, 리스트, 비트맵, 해시 테이블 등이 있다.  
배열은 종종 가장 단순한 방식이지만, 요소가 드문드문 있는 배열은 메모리를 낭비한다.  
리스트도 간단하지만, 특정 위치를 찾기 위해 긴 리스트를 순회하는 것은 시간이 낭비된다.  
배열과 리스트 모두 크기 조절이 가능하지만, 리스트는 중간 삽입 및 삭제를 더 효율적으로 지원한다.

Pintos는 비트맵 데이터 구조를 `lib/kernel/bitmap.c`와 `include/lib/kernel/bitmap.h`에 포함하고 있다.  
비트맵은 각각 `true` 또는 `false` 값을 가질 수 있는 비트들의 배열이다.  
비트맵은 보통 (동일한) 자원들의 사용 여부를 추적하는 데 사용된다.  
자원 `n`이 사용 중이라면 비트맵의 `n`번째 `bit`가 `true`가 된다.  
Pintos의 비트맵은 크기가 고정되어 있지만, 구현을 확장하여 크기 조절을 지원할 수도 있다.

Pintos는 해시 테이블 데이터 구조도 포함되어 있다. (자세한 내용은 [`Hash Table`](https://casys-kaist.github.io/pintos-kaist/appendix/hash_table.html) 참조)  
Pintos 해시 테이블은 다양한 크기의 테이블에 대해 삽입 및 삭제를 효율적으로 지원한다.

더 복잡한 데이터 구조들이 성능 향상이나 다른 이점을 줄 수도 있지만, 구현을 불필요하게 복잡하게 만들수도 있다.  
따라서 균형 이진 트리와 같은 고급 데이터 구조를 설계에 포함시키는 것은 권장하지 않는다.

---

### Managing the Supplemental Page Table

`supplemental page table`은 각 페이지에 대한 추가 데이터로 페이지 테이블에 보완하는 역할을 한다.  
이것은 페이지 테이블 형식이 가지는 제약 때문에 필요하다.  
이러한 데이터 구조는 종종 `page table`이라고도 불리지만, 혼동을 줄이기 위해 `supplemental`이라는 단어를 덧붙인다.

`supplemental page table`은 최소 두가지 목적으로 사용된다.  
가장 중요한 것은, 페이지 폴트가 발생했을 때 커널이 `supplemental page table`을 조회하여 해당 가상 페이지에 어떤 데이터가 있어야 하는지를 확인한다는 점이다.  
두번째로, 프로세스가 종료될 때 커널은 `supplemental page table`을 참조하여 어떤 자원을 해제할지 결정한다.

### Organization of Supplemental Page Table

`supplemental page table`은 원하는 방식으로 구성할 수 있다.  
이를 구성하는 기본적인 방식으로는 최소 두 가지, 세그먼트 기반 또는 페이지 기반 방식이 있다.  
여기서 세그먼트는 연속된 페이지들의 집합, 즉 실행 파일이나 메모리 매핑 파일이 포함된 메모리 영역을 의미한다.

선택적으로, 페이지 테이블 자체를 활용하여 `supplemental page table`의 항목들을 추적할 수도 있다.  
이를 위해서는 `threads/mmu.c`에 있는 Pintos의 페이지 테이블 구현을 수정해야한다.  
이 방식은 고급 수준의 학생들에게만 권장된다.

### Handling page fault

`supplemental page table`의 가장 중요한 사용자는 `page fault handler`이다.  
`project 2`에서 페이지 폴트는 항상 커널이나 사용자 프로그램에 버그가 있음을 의미했다.  
하지만 `project 3`에서는 더 이상 그런 의미만은 아니다.  
이제 `page fault`는 단순히 파일이나 `swap slot`에서 페이지를 불러와야 한다는 신호일 수 있다.  
이러한 상황들을 처리하기 위해 더 정교한 `page fault handler`를 구현해야 한다.  
`page fault handler`인 `userprog/exception.c`의 `page_fault()` 함수는 우리가 작성할 `vm/vm.c`의 `vm_try_handle_fault()`를 호출한다.  
우리가 구현할 `page fault handler`는 대략 다음과 같은 작업들을 수행해야 한다:

#### Step 1

`supplemental page table`에서 오류가 발생한 페이지를 찾는다.

만약 메모리 접근이 유효하다면, `supplemental page table` 항목을 사용하여 해당 페이지에 들어갈 데이터를 찾는다. 이 데이터는 파일 시스템, 스왑 슬롯, 혹은 단순히 0으로 채워진 페이지일 수 있다.  
만약 공유(즉, `Copy-on-Write`)를 구현했다면, 해당 페이지 데이터는 이미 페이지 프레임에 존재하지만, 페이지 테이블에는 없을 수도 있다.

`supplemental page table`이 해당 주소에서 어떤 데이터도 기대되지 않는다고 나타내거나, 그 주소가 커널 가상 메모리 영역에 속하거나, 읽기 전용 페이지에 쓰기를 시도한 경우, 그 접근은 유효하지 않다.  
모든 유효하지 않은 접근은 해당 프로세스를 종료시키고, 그에 따른 모든 자원을 해제한다.

#### Step 2

해당 페이지를 저장할 프레임을 확보한다.  
공유를 구현한 경우, 필요한 데이터가 이미 프레임에 존재할 수 있으므로, 해당 프레임을 찾아야 한다.

#### Step 3

파일 시스템에서 데이터를 읽어오거나 스왑하거나 0으로 초기화하는 등의 방법으로, 프레임에 데이터를 가져온다.  
공유를 구현한 경우, 필요한 페이지가 이미 프레임에 있다면 이 단계에서는 아무 작업도 할 필요가 없다.

#### Step 4

오류가 발생한 가상 주소의 페이지 테이블 항목을 해당 물리 페이지로 연결한다.  
이 작업에는 `threads/mmu.c`에 정의된 함수들을 사용할 수 있다.

---

### Managing the Frame Table

`frame table`은 각 프레임마다 하나의 항목(`entry`)을 가지고 있다.  
`frame table`의 각 항목은 해당 프레임을 현재 점유하고 있는 페이지에 대한 포인터와 필요한 다른 데이터를 포함한다. `frame table`은 빈 프레임이 없을 때 제거할 페이지를 선택함으로써, Pintos가 효율적으로 페이지 교체 정책을 구현할 수 있게 해준다.

사용자 페이지에 사용될 프레임은 반드시 `palloc_get_page(PAL_USER)`를 호출하여 `user pool`에서 얻어야 한다. `PAL_USER`를 반드시 사용해야 `"kernel pool"`에서 메모리를 할당하지 않게 되며, 그렇지 않으면 몇몇 테스트가 예기치 않게 실패할 수 있다. 만약 프레임 테이블 구현의 일환으로 `palloc.c`를 수정한다면, 사용자 풀과 커널 풀의 구분을 반드시 유지해야한다.

`frame table`에서 가장 중요한 작업은 사용하지 않은 프레임을 얻는 것이다.  
프레임이 비어 있을 때는 간단하지만, 비어 있는 프레임이 없을 경우 다른 페이지를 제거(`evict`)해서 프레임을 비워야 한다.

스왑 슬롯이 필요하지만 할당할 수 없고, 스왑 영역도 가득 찼다면, 커널 패닉을 발생시켜야 한다.  
실제 운영체제는 이런 상황을 복구하거나 예방하기 위해 다양한 정책을 적용하지만, 이러한 정책은 이 프로젝트의 범위를 벗어난다.

`eviction` 과정은 대략 다음과 같은 단계들로 이루어진다:

#### Step 1

여러분이 구현한 페이지 교체 알고리즘을 사용하여 제거할 프레임을 선택한다.  
아래에서 설명할 `accessed` 및 `dirty` bit가 이때 유용하게 사용된다.

#### Step 2

해당 프레임을 참조하고 있는 모든 페이지 테이블에서 해당 프레임에 대한 참조를 제거한다.  
공유 기능을 구현하지 않았다면, 하나의 페이지만이 하나의 프레임을 참조해야 한다.

#### Step 3

필요하다면 해당 페이지를 파일 시스템이나 스왑 영역에 기록한다.  
이렇게 제거된 프레임은 이제 다른 페이지를 저장하는 데 사용될 수 있다.

<br>

### Accessed and Dirty Bits (접근 가능한 비트와 더티 비트)

`x86-64` 하드웨어는 페이지 교체 알고리즘 구현을 돕기 위해, 각 페이지 테이블 항목(`PTE`)에 두 개의 비트를 제공한다. 페이지에 대한 읽기나 쓰기가 발생하면, CPU는 해당 페이지의 `PTE`에서 `accessed` 비트를 1로 설정한다. 페이지에 쓰기(`write`)가 발생하면 CPU는 `Dirty` 비트를 1로 설정한다. CPU는 `Accessed`, `Dirty` 비트를 자동으로 0으로 리셋하지 않는다. 운영체제가 수동으로 비트를 초기화해야한다.

`alias`에 유의해야 한다. 즉, 두 개 이상의 페이지가 같은 프레임을 참조하는 경우를 말한다.  
`alias`된 프레임에 접근하면, `Accessed` 비트와 `Dirty` 비트는 오직 하나의 페이지 테이블 엔트리(`PTE`)에서만 갱신된다. (즉, 실제 접근이 이루어진 가상 페이지에 대한 `PTE`)  
다른 `alias`에 대한 `Accessed` 비트와 `Dirty` 비트는 업데이트되지 않는다.

Pintos에서는 모든 사용자 가상 페이지가 커널 가상 페이지에 `alias`되어 있다.  
이러한 `alias`를 어떻게든 관리해야만 한다.  
예를 들어, 코드에서 두 주소 모두에 대해 `Accessed` 비트와 `Dirty` 비트를 확인하고 갱신하는 방식이 있을 수 있다. 또한, 커널이 사용자 데이터를 접근할 때 항상 사용자 가상 주소만 사용하도록 해서 이 문제를 피할 수도 있다.

다른 `alias`는 여러분이 공유 기능을 구현했거나, 코드에 버그가 있는 경우에만 발생해야 한다.

`Accessed` 및 `Dirty` 비트를 다루는 함수들에 대한 자세한 내용은 [Page Table - Accessed and Dirty Bits](https://casys-kaist.github.io/pintos-kaist/appendix/page_table.html) 섹션을 참고해라.

#### | Accessed and Dirty Bits

`x86_64` 하드웨어는 페이지 교체 알고리즘 구현을 돕기 위해, 각 페이지의 페이지 테이블 엔트리(PTE)에 두 개의 비트를 제공한다.  
페이지에 대한 읽기 또는 쓰기 동작이 있을 경우, CPU는 해당 페이지의 PTE에서 `accessed` 비트를 1로 설정한다. 쓰기 동작이 있을 경우에는 `dirty` 비트도 1로 설정한다.  
CPU는 이 비트들을 0으로 리셋하지 않지만, 운영체제는 이를 수동으로 리셋할 수 있다.  
이 비트들을 올바르게 해석하려면 `alias`를 이해해야 한다.  
`alias`란, 동일한 프레임을 참조하는 두 개 이상의 페이지를 의미한다.  
`alias`된 프레임에 접근하면, `accessed`와 `dirty`비트는 접근에 사용된 페이지의 PTE에만 업데이트 된다.  
다른 `alias` 페이지의 비트들은 업데이트되지 않는다.

```c
bool pml4_is_dirty (uint64_t *pml4, const void *vpage);
bool pml4_is_accessed (uint64_t *pml4, const void *vpage);
```

해당 `pml4` 페이지 테이블에서 `vpage`라는 가상 주소에 대한 `dirty` 또는 `accessed` 비트가 설정되어 있으면 `true`를 반환합니다. 그렇지 않으면 `false`를 반환합니다.

```c
void pml4_set_dirty (uint64_t *pml4, const void *vpage, bool dirty);
void pml4_set_accessed (uint64_t *pml4, const void *vpage, bool accessed);
```

주어진 `pml4`에서 `vpage`의 페이지 테이블 엔트리가 존재할 경우, 해당 엔트리의 `dirty` 또는 `accessed` 비트를 `dirty` 또는 `accessed` 인자 값에 따라 설정합니다.

> **요약**
>
> `alias` 상황에서는 접근된 주소의 PTE만 비트가 업데이트되고, 나머지는 갱신되지 않는다.  
> 따라서 OS는 `alias`된 주소들을 추적하여 `dirty`/`accessed`상태를 일관성 있게 관리할 필요가 있다.

---

### Managing the Swap Table

스왑 테이블은 사용 중인 스왑 슬롯과 비어 있는 슬롯을 추적하는 역할을 한다.  
페이지를 프레임에서 스왑 파티션으로 쫓아낼 때, 사용되지 않은 스왑 슬롯을 선택할 수 있어야 한다.  
페이지가 다시 메모리로 읽혀오거나, 해당 페이지를 가진 프로세스가 종료되면, 그 스왑 슬롯을 해제할 수 있어야한다.

`vm/build` 디렉토리에서 `pintos-mkdisk swap.dsk --swap-size=n` 명령어를 사용하면, `n` MB 크기의 스왑 파티션이 포함된 `swap.dsk` 디스크 파일이 생성된다.  
그 후, pintos를 실행할 때 `swap.dsk`는 자동으로 추가 디스크로 연결된다.  
또는 `--swap-size=n` 옵션을 이용해 단 한번의 실행을 위한 임시 `n` MB 스왑 디스크를 사용할 수 있다.

스왑 슬롯은 지연(lazy) 방식으로 할당되어야 하며, 즉 페이지가 실제로 쫓겨날 때만 할당되어야 한다.  
실행 파일에서 데이터를 읽자마자 프로세스 시작 시점에 바로 스왑에 쓰는 방식은 lazy가 아니다.  
스왑 슬롯을 특정 페이지에 예약해 두는 방식은 사용해서는 안된다.

스왑 슬롯의 내용이 프레임에 다시 읽혀질 때, 해당 슬롯은 해제되어야 한다.

#### 요약

스왑 테이블은 스왑 슬롯의 사용 여부를 추적하는 자료구조이다.

- 페이지를 스왑 파티션으로 쫓아낼 때(페이지 교체 시), 빈 슬롯을 찾아 할당해야 하며,
- 페이지를 메모리로 다시 읽어오거나, 프로세스가 종료되면 해당 슬롯을 반납(해제)해야 한다.
- 게으른(lazy) 방식으로 할당해야 하며,
- 프로세스 시작 시 전체 데이터를 스왑으로 미리 저장하는 방식은 금지된다.

---

### Managing Memory Mapped Files

파일 시스템은 대부분 `read`와 `write` 시스템 콜을 사용해서 접근된다.  
두번째 방식은 `mmap` 시스템 콜을 사용해 파일을 가상 메모리 페이지에 "매핑"하는 것이다.  
이후 프로그램은 메모리 명령어를 사용해서 파일 데이터를 직접 다룰 수 있다.  
예를 들어, 파일 `foo`의 크기가 `0x1000` 바이트(4KB, 즉 한 페이지)라고 가정해보자.  
만약 `foo`가 메모리 주소 `0x5000`부터 매핑된다면, 주소 `0x5000`에서 `0x5fff`까지의 메모리 접근은 `foo`의 해당 바이트들에 접근하게 된다.

다음은 `mmap`을 사용해 파일을 콘솔에 출력하는 프로그램이다.  
이 프로그램은 명령줄에서 지정한 파일을 열고, 이를 가상 주소 `0x10000000`에 매핑한 뒤, 그 매핑된 데이터를 콘솔(`fd 1`)에 쓰고, 마지막으로 매핑을 해제한다.

```c
#include <stdio.h>
#include <syscall.h>
int main (int argc UNUSED, char *argv[])
{
  void *data = (void *) 0x10000000;                 /* Address at which to map. */
  int fd = open (argv[1]);                          /* Open file. */
  void *map = mmap (data, filesize (fd), 0, fd, 0); /* Map file. */
  write (1, data, filesize (fd));                   /* Write file to console. */
  munmap (map);                                     /* Unmap file (optional). */
  return 0;
}
```

너의 제출물은 메모리 매핑된 파일이 사용하는 메모리를 추적할 수 있어야 한다.  
이는 매핑된 영역에서 발생하는 페이지 폴트를 적절히 처리하고, 매핑된 파일이 프로세스의 다른 메모리 영역들과 겹치지 않도록 보장하기 위해 필요하다.
