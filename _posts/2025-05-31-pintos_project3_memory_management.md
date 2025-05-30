---
title: "[설명] Pintos Project 3 : Memory Management"
date: 2025-05-31 03:09:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

### Memory Management

가상 메모리 시스템을 지원하려면, 가상 페이지와 물리적 프레임을 효과적으로 관리해야 한다.  
즉, 어떤 (가상 또는 물리적) 메모리 영역이 사용 중인지, 어떤 용도로 사용되는지, 누가 사용하는지를 계속 추적해야 한다는 의미이다. 먼저 `supplemental page table`을 다루고, 그 다음으로 물리 프레임을 다루게 될 것이다.  
이해를 돕기 위해, 우리는 `page`는 가상 페이지를, `frame`은 물리 페이지를 의미하는 용어로 사용한다.

---

### Page Structure and Operations

#### struct page

`include/vm/vm.h`에 정의된 `page`는 가상 메모리에서 하나의 페이지를 나타내는 구조체이다.  
이 구조체는 우리가 해당 페이지에 대해 알아야 할 모든 필수 정보를 저장한다.  
현재 템플릿에서 이 구조체는 아래와 같은 형태이다:

```c
struct page {
  const struct page_operations *operations;
  void *va;              /* Address in terms of user space */
  struct frame *frame;   /* Back reference for frame */

  union {
    struct uninit_page uninit;
    struct anon_page anon;
    struct file_page file;
#ifdef EFILESYS
    struct page_cache page_cache;
#endif
  };
};
```

이 구조체에는 페이지 연산(아래 참조), 가상 주소, 물리적 프레임이 있다.  
또한, 이 구조체는 `union` 필드를 가지고 있다.  
`union`은 하나의 메모리 공간에 서로 다른 타입의 데이터를 저장할 수 있게 해주는 특수한 자료형이다.  
이 `union`에는 여러 멤버가 있지만, 한 번에 오직 하나의 멤버만 값을 가질 수 있다.  
이는 시스템의 페이지가 `uninit_page`, `anon_page`, `file_page`, `page_cache` 중 하나가 될 수 있다는 뜻이다.  
예를 들어, 페이지가 익명 페이지인 경우에는, 해당 페이지 구조체는 `struct anon_page anon` 필드를 멤버 중 하나로 가지게 된다.  
`anon_page`는 익명 페이지에 대해 우리가 유지해야 할 모든 필수 정보를 담고 있게 된다.

---

### Page Operations

위에서 설명했듯이, 그리고 `include/vm/vm.h`에 정의된 것처럼, 하나의 페이지는 `VM_UNINIT`, `VM_ANON`, 또는 `VM_FILE` 중 하나일 수 있다.  
하나의 페이지에 대해 수행해야 할 작업에는 `swapping in`, `swapping out`, 그리고 페이지 제거(`destroy`) 등이 있다.  
이러한 작업들에 대해 페이지의 타입마다 필요한 절차와 작업이 다르다.  
다시 말해서, `VM_ANON` 페이지와 `VM_FILE` 페이지는 각각 다른 `destroy` 함수를 호출해야 한다.  
한 가지 방법은 함수마다 `switch-case` 문법을 사용하여 각 경우를 처리하는 것이다.  
이를 처리하기 위해 객체지향 프로그래밍의 "클래스 상속" 개념을 도입한다.  
물론 C 언어에는 클래스나 상속이 없지만, 실제 운영체제 코드(`Linux`)에서처럼 이 개념을 함수 포인터로 구현한다.

함수 포인터는 지금까지 배운 다른 포인터처럼, 메모리 안의 함수(실행 가능한 코드)를 가리키는 포인터이다.  
함수 포인터는 런타임 값에 따라 별도의 검사 없이 특정 함수를 간단히 호출할 수 있게 해줘서 유용하다.  
우리의 경우, 코드에서는 `destroy(page)`만 호출하면 충분하며, 컴파일러는 페이지 타입에 따라 적절한 `destroy`함수를 함수 포인터를 통해 호출한다.

`page_operations` 구조체는 `include/vm/vm.h`에 정의되어 있다.  
이 구조체는 3개의 함수 포인터를 포함한 함수 테이블이라고 생각하면 된다.

```c
struct page_operations {
  bool (*swap_in) (struct page *, void *);
  bool (*swap_out) (struct page *);
  void (*destroy) (struct page *);
  enum vm_type type;
};
```

이제 `page_operation` 구조체가 어디에서 사용되는지 살펴보자.  
`include/vm/vm.h`에 있는 `struct page`를 보면 `operations`라는 필드를 가지고 있는 것을 알 수 있다.  
`vm/file.c` 파일로 가보면, 함수들 정의 전에 `file_ops`라는 `page_operations` 구조체가 선언되어 있는 것을 볼 수 있다.  
이것은 파일 기반 페이지를 위한 함수 포인터 테이블이다.

`.destroy` 필드는 `file_backed_destroy`라는 값을 가지고 있으며, 이는 페이지를 제거하는 함수이며 같은 파일 내에 정의되어 있다.

이제 `file_backed_destroy`가 함수 포인터 인터페이스를 통해 어떻게 호출되는지 이해해보자.  
`vm/vm.c`에서 `vm_dealloc_page (page)`가 호출되고, 이 페이지가 파일 기반 페이지(`VM_FILE`)라고 가정해보자.  
이 함수 내부에서는 `destroy (page)`가 호출된다.  
`destroy(page)`는 `include/vm/vm.h`에 다음과 같이 매크로로 정의되어 있다.

```c
#define destroy(page) if ((page)->operations->destroy) (page)->operations->destroy (page)
```

이 매크로는 `destroy()`를 호출하는 것이 실제로는 `(page)->operations->destroy (page)`를 실행하는 것임을 나타낸다. 즉, 해당 `destroy`함수는 페이지 구조체로부터 가져온 것이다.

해당 페이지가 `VM_FILE` 타입이므로, `.destroy` 필드는 `file_backed_destroy`를 가리키고 있다.  
결과적으로 파일 기반 페이지에 대한 `destroy` 작업이 수행된다.

---

### Implement Supplemental Page Table

이 시점에서, Pintos는 메모리의 가상 주소와 물리 주소 간의 매핑을 관리하기 위해 `pml4`라는 페이지 테이블을 가지고 있다. 하지만, 이것만으로는 충분하지 않다. 이전 섹션에서 설명했듯이, 페이지 폴트 처리와 자원 관리를 위해 각 페이지에 대한 추가 정보를 저장할 `supplemental page table`이 필요하다.  
따라서 프로젝트 3의 첫 번째 작업으로 `supplemental page table`의 기본 기능들을 구현할 것을 권장한다.

**`vm/vm.c` 파일에 보조 페이지 테이블 관리 기능을 구현해라.**

먼저, Pintos에서 `supplemental page table`을 어떤 방식으로 설계할지 결정해야한다.  
설계를 마친 후에는, 아래의 세 함수를 여러분의 설계 방식에 맞추어 직접 구현해야 한다.

```c
void supplemental_page_table_init (struct supplemental_page_table *spt);
```

이 함수는 `supplemental page table`을 초기화한다.  
어떤 데이터 구조를 `supplemental page table`에 사용할지는 여러분이 직접 선택할 수 있다.  
이 함수는 새로운 프로세스가 시작될 때(`initd`)나 프로세스가 fork될 때(`__do_fork`) 호출된다.(모두 `userprog/process.c`에 있음)

```c
struct page *spt_find_page (struct supplemental_page_table *spt, void *va);
```

해당 `supplemental_page_table`에서 `va`(가상 주소)에 해당하는 `struct page`를 찾아 반환한다.  
찾지 못하면 `NULL`을 반환한다.

```c
bool spt_insert_page (struct supplemental_page_table *spt, struct page *page);
```

지정된 `supplemental_page_table`에 `struct page`를 삽입한다.  
이 함수는 이미 해당 가상 주소가 테이블에 존재하지 않는지 확인한 후 삽입해야 한다.

---

### Frame Management

이제부터는, 모든 페이지가 단순히 메모리 생성 시의 메타데이터만 저장하는 것이 아니다.  
따라서, 물리 메모리를 관리하기 위한 별도의 방식이 필요하다.  
`include/vm/vm.h`에는 물리 메모리를 나타내는 `struct frame` 구조체가 존재한다.  
현재 이 구조체는 아래와 같은 형태이다.

```c
/* The representation of "frame" */
struct frame {
  void *kva;
  struct page *page;
};
```

이 구조체에는 두 개의 필드만 있다.  
`kva`는 커널 가상 주소이고,  
`page`는 해당 프레임에 매핑된 `page` 구조체이다.

프레임 관리 기능을 구현하면서, 필요한 필드를 자유롭게 추가해도 된다.

<br>

**이제 아래 함수들을 `vm/vm.c`에 구현해야한다**

```c
static struct frame *vm_get_frame (void);
```

`palloc_get_page`를 호출하여 유저 풀에서 새로운 물리 페이지를 할당한다.  
페이지를 성공적으로 얻었으면, 그에 해당하는 프레임(`struct frame`)도 할당하고 초기화한 뒤 반환한다.  
`vm_get_frame`을 구현한 이후에는, 모든 사용자 공간 페이지(`PALLOC_USER`)는 이 함수를 통해서만 할당해야한다.  
할당에 실패할 경우를 대비해 지금은 `swap out` 처리를 하지 않아도 된다.  
그 대신, `PANIC ("todo")`와 같은 메시지를 출력하면서 종료하도록 표시만 해두면 된다.

```c
bool vm_do_claim_page (struct page *page);
```

이 함수는 해당 페이지에 물리 프레임을 할당(`claim`)하는 역할을 한다.  
먼저 `vm_get_frame`을 호출하여 프레임을 확보한다.  
(이 부분은 템플릿에서 이미 구현되어 있다.)

그 다음, `MMU`(Memory Management Unit)를 설정해야 한다.
즉, 가상 주소에서 물리 주소로의 매핑을 페이지 테이블에 추가해야 한다는 의미다.  
반환값은 이 작업이 성공했는지를 나타내야 한다.

```c
bool vm_claim_page (void *va);
```

`va`(가상 주소)에 해당하는 페이지를 할당(`claim`)하는 함수이다.  
먼저 `va`에 해당하는 `page`를 찾아낸 뒤, `vm_do_claim_page`를 호출하여 할당한다.
