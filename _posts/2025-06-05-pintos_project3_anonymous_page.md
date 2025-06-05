---
title: "[설명] Pintos Project 3 : Anonymous Page"
date: 2025-06-05 01:59:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

### Anonymous Page

이 프로젝트의 이 부분에서는 **익명 페이지**(`anonymous page`)라고 불리는, 디스크에 기반하지 않는 이미지를 구현할 것이다.

익명 매핑(`anonymous mapping`)은 뒷받침하는 파일이나 장치가 없다.  
파일 기반 페이지와 달리 명명된 파일 소스가 없기 때문에 익명이다.  
익명 페이지는 실행 파일에서 **스택**이나 **힙**과 같은 용도로 사용된다.

익명 페이지를 기술하기 위한 구조체는 `include/vm/anon.h`에 있는 `anon_page`이다.

```c
struct anon_page {
};
```

이 구조체는 현재 비어 있지만, 구현하면서 익명 페이지의 필요한 정보나 상태를 저장하기 위해 멤버를 추가할 수 있다.  
또한, 페이지의 일반적인 정보를 포함하고 있는 `include/vm/page.h`의 `struct page`를 참조해라.  
익명 페이지의 경우, `struct anon_page anon`이 페이지 구조체(`struct page`)안에 포함되어있다는 점에 유의해라.

---

### Page Initialization with Lazy Loading (지연 로딩을 통한 페이지 초기화)

**지연 로딩**(`Lazy Loading`)은 메모리 로딩이 실제로 필요할 때까지 연기되는 설계 방식이다.  
페이지는 할당되었으며, 해당하는 페이지 구조체는 존재하지만, 전용 물리 프레임은 없고 실제 내용도 아직 로딩되지 않은 상태입니다. 내용은 실제로 필요할 때만 로드될 것이며, 이는 페이지 폴트(`page fault`)에 의해 신호된다.

3가지 페이지 타입이 있기 때문에, 각 페이지마다 초기화 루틴이 다르다.  
아래 섹션들에서 다시 설명되겠지만, 여기서는 **페이지 초기화 흐름의 상위 레벨** 개요를 제공한다.

먼저, 커널이 새로운 페이지 요청을 받으면 `vm_alloc_page_with_initializer`함수가 호출된다.  
`initializer`는 페이지 구조체를 할당하고, 해당 페이지 타입에 따라 적절한 `initializer`를 설정함으로써 새로운 페이지를 초기화하며, 제어권을 사용자 프로그램으로 돌려줄 것이다.  
사용자 프로그램이 실행됨에 따라, 어느 시점에 프로그램이 자신이 소유하고 있다고 믿는 페이지에 접근하려고 하지만, 아직 페이지에 내용이 없기 때문에 페이지 폴트가 발생한다.  
폴트 처리 절차 중에 `uninit_initialize`가 호출되고, 이전에 설정한 `initializer`를 호출한다.  
익명 페이지의 경우, `initializer`는 `anon_initializer`가 될 것이고, 파일 기반 페이지의 경우, `file_backed_initializer`가 될 것이다.

페이지는 초기화(`initialize`) -> (페이지 폴트(`page_fault`) -> 지연 로드(`lazy-load`) -> 스왑 인(`swap-in`) -> 스왑 아웃(`swap-out`) -> ...) -> **제거(`destroy`)**의 생명 주기(life cycle)를 가질 수 있다. 생명 주기의 각 전환마다 필요한 절차는 페이지 타입(또는 `VM_TYPE`)에 따라 달라지며, 이전 단락은 초기화에 대한 예시였다.

이 프로젝트에서는 페이지 타입마다 이러한 전환 과정을 구현하게 된다.

---

### Lazy Loading for Executable (실행 파일을 위한 지연 로딩)

지연 로딩에서는 프로세스가 실행을 시작할 때, 즉시 필요한 메모리 부분만 주 메모리(`main memory`)에 로드된다.  
이는 모든 바이너리 이미지(`binary image`)를 한 번에 메모리로 로드하는 즉시 로딩(`eager loading`)보다 오버헤드(`overhead`)를 줄일 수 있다.

지연 로딩을 지원하기 위해, `include/vm/vm.h`에 `VM_UNINIT`이라는 페이지 타입을 도입한다.  
모든 페이지는 처음에 `VM_UNINIT` 페이지로 생성된다.  
또한, 초기화되지 않은 페이지를 위한 페이지 구조체인 `struct uninit_page`를 `include/vm/uninit.h`에 제공한다.  
초기화되지 않은 페이지를 생성하고, 초기화하고, 제거하는 함수들은 `include/vm/uninit.c`에 있다.  
이 함수들을 나중에 완성해야 할 것이다.

페이지 폴트 발생 시, 페이지 폴트 핸들러(`userprog/exception.c`의 `page_fault`)는 `vm/vm.c`의 `vm_try_handle_fault`로 제어권을 넘긴다.  
이 함수(`vm_try_handle_fault`)는 먼저 유효한 페이지 폴트인지 확인한다. 여기서 유효하다는 것은, 접근이 잘못된 주소에 의한 폴트를 의미한다.  
그것이 `bogus` 폴트라면, 페이지에 일부 내용을 로드하고 사용자 프로그램에 제어를 다시 넘긴다.

`bogus` 페이지 폴트에는 3가지 경우가 있다: 지연 로드된 페이지, 스왑 아웃된 페이지, 그리고 쓰기 보호된 페이지  
지금은 첫 번째 경우인 **지연 로드된 페이지**만 살펴보자.  
만약 `lazy loading`을 위한 페이지 폴트라면, 커널은 이전에 `vm_alloc_page_with_initializer`에서 설정한 `initializer` 중 하나를 호출하여 세그먼트를 지연 로드한다.

`userprog/process.c`에 있는 `lazy_load_segment`를 구현해야 할 것이다!

**`vm_alloc_page_with_initializer()`를 구현해라.**  
전달된 `vm_type`에 따라 적절한 `initializer`를 가져와서 `uninit_new`를 호출해야 한다.

---

```c
bool vm_alloc_page_with_initializer (enum vm_type type, void *va,
        bool writable, vm_initializer *init, void *aux);
```

> 주어진 타입으로 초기화되지 않은 페이지를 생성한다.  
> `uninit`페이지의 `swap_in`핸들러는 타입에 따라 페이지를 자동으로 초기화하고, 주어진 `AUX`와 함께 `INIT`을 호출한다.  
> 페이지 구조체를 얻으면, 해당 페이지를 프로세스의 **보조 페이지 테이블**(spt)에 삽입해야 한다.  
> `vm.h`에 정의된 `VM_TYPE` 매크로를 사용하면 편리하다.

페이지 폴트 핸들러는 호출 체인(`call chain`)을 따라가서, `swap_in`을 호출할 때 최종적으로 `uninit_initialize`에 도달한다. 우리는 이에 대한 완전한 구현을 제공한다.  
하지만 여러분의 설계에 따라 `uninit_initialize`를 수정해야 할 수도 있다.

<br>

```c
static bool uninit_initialize (struct page *page, void *kva);
```

> 첫 번째 폴트 발생 시 페이지를 초기화한다.  
> 템플릿 코드는 먼저 `vm_initializer`와 `aux`를 가져와서, 함수 포인터를 통해 해당 `page_initializer`를 호출한다.  
> 여러분의 설계에 따라 함수를 수정해야 할 수도 있다.

`vm/anon.c`에 있는 `vm_anon_init`와 `anon_initializer`를 필요에 따라 수정할 수 있다.

<br>

```c
void vm_anon_init (void);
```

> 익명 페이지 서브시스템을 초기화한다.  
> 이 함수에서 익명 페이지와 관련된 모든 것을 설정할 수 있다.

<br>

```c
bool anon_initializer (struct page *page, enum vm_type type, void *kva);
```

> 이 함수는 먼저 `page->operations`에 익명 페이지를 위한 핸들러를 설정한다.  
> 현재 비어있는 구조체인 `anon_page`에 일부 정보를 업데이트해야 할 수도 있다.  
> 이 함수는 익명 페이지(즉, `VM_ANON`)를 위한 `initializer`로 사용된다.

**`userprog/process.c`에 있는 `load_segment`와 `lazy_load_segment`를 구현해라.**  
실행 파일로부터 세그먼트 로딩을 구현해라.  
이 모든 페이지들은 지연 로드되어야 한다. 즉, 커널이 이들에 대한 페이지 폴트를 가로챌 때만 로드되어야 한다.

프로그램 로더의 핵심 부분인 `userprog/process.c`의 `load_segment` 안에 있는 루프를 수정해야 할 것이다.  
루프를 돌때마다, `vm_alloc_page_with_initializer`를 호출하여 '대기 중인 페이지 객체'를 생성한다.  
페이지 폴트가 발생했을 때, 비로소 세그먼트가 파일에서 실제로 로드된다.

<br>

```c
static bool load_segment (struct file *file, off_t ofs, uint8_t *upage,
        uint32_t read_bytes, uint32_t zero_bytes, bool writable);
```

> 현재 코드는 메인 루프 내에서 파일로부터 읽을 바이트 수와 0으로 채울 바이트 수를 계산한다.  
> 그런 다음, `vm_alloc_page_with_initializer`를 호출하여 대기 중인 객체를 생성한다.  
> `vm_alloc_page_with_initializer`에 제공할 `aux`인자로 보조 값을 설정해야한다.  
> 바이너리 로딩에 필요한 정보를 포함하는 구조체를 생성할 수도 있다.

<br>

```c
static bool lazy_load_segment (struct page *page, void *aux);
```

> `load_segment`에서 `lazy_load_segment`가 `vm_alloc_page_with_initializer`의 네 번째 인자로 제공된다는 것을 눈치챘을 것이다.  
> 이 함수는 실행 파일 페이지의 `initializer`이며, 페이지 폴트 발생 시 호출된다.  
> 이 함수는 `page` 구조체와 `aux`를 인자로 받는다.  
> `aux`는 `load_segment`에서 설정한 정보이다.  
> 이 정보를 사용하여 세그먼트를 읽을 파일을 찾고, 궁극적으로 세그먼트를 메모리로 읽어 들여야한다.

<br>

#### **스택 할당 및 `vm_try_handle_fault` 수정**

`userprog/process.c`에 있는 `setup_stack`을 수정하여 스택 할당을 새로운 메모리 관리 시스템에 맞게 조정해야 한다.  
첫 번째 스택 페이지는 지연 로드될 필요가 없다.  
로드 시점에 명령줄 인자와 함께 할당하고 초기화할 수 있으며, 페이지 폴트 발생을 기다릴 필요가 없다.  
스택을 식별하는 방법을 제공해야 할 수도 있다.  
페이지를 표시하기 위해 `vm/vm.h`의 `vm_type`에 있는 보조 마커(예: `VM_MARKER_0`)를 사용할 수도 있다.

마지막으로, `vm_try_handle_fault` 함수를 수정하여 `spt_find_page`를 통해 보조 페이지 테이블(`spt`)을 참조함으로써 폴트 발생 주소에 해당하는 페이지 구조체를 찾아내라.

모든 요구사항을 구현한 후에는, `fork`를 제외한 `project 2`의 모든 테스트가 통과되어야한다.

---

### Supplemental Page Table - Revisit (재방문)

이제 복사 및 정리 연산을 지원하기 위해 보조 페이지 테이블 인터페이스를 다시 살펴보자.  
이러한 연산은 프로세스를 생성할 때(특히 자식 프로세스를 생성할 때) 또는 제거할 때 필요하다.  
자세한 내용은 아래에 설명되어 있다. 이 시점에서 보조 페이지 테이블을 다시 살펴보는 이유는 여러분이 위에서 구현한 일부 초기화 함수들을 사용하고 싶을 수 있기 때문이다.

**`vm/vm.c`에 `supplemental_page_table_copy`와 `supplemental_page_table_kill`을 구현해라.**

---

```c
bool supplemental_page_table_copy (struct supplemental_page_table *dst,
    struct supplemental_page_table *src);
```

> `src`로부터 `dst`로 보조 페이지 테이블을 복사한다.  
> 이것은 자식 프로세스가 부모의 실행 컨텍스트를 상속받아야 할 때(즉, `fork()`) 사용된다.  
> `src`의 보조 페이지 테이블에 있는 각 페이지를 반복하면서, `dst`의 보조 페이지 테이블에 해당 엔트리의 정확한 복사본을 만들어라. 초기화 되지 않은 페이지를 할당하고, 즉시 claim 해야 한다.

<br>

```c
void supplemental_page_table_kill (struct supplemental_page_table *spt);
```

> 보조 페이지 테이블이 보유했던 모든 리소스를 해제한다.  
> 이 함수는 프로세스가 종료될 때(`userprog/process.c`의 `process_exit()`) 호출된다.  
> 페이지 엔트리들을 반복하면서 테이블에 있는 페이지들에 대해 `destroy(page)`를 호출해야한다.  
> 이 함수에서는 실제 페이지 테이블(`pml4`)과 물리 메모리(`palloc`된 메모리)에 대해서는 걱정할 필요가 없다.  
> 호출자가 보조 페이지 테이블이 정리된 후에 그것들을 정리할 것이다.

---

### Page Cleanup (페이지 정리)

**`vm/uninit.c`에 `uninit_destory`를, `vm/anon.c`에 `anon_destroy`를 구현해라.**

이것은 초기화되지 않은 페이지의 `destroy` 연산을 위한 핸들러이다.  
초기화되지 않은 페이지가 다른 페이지 객체로 변환되더라도, 프로세스가 종료될 때 여전히 `uninit` 페이지가 존재할 수 있다.

```c
static void uninit_destroy (struct page *page);
```

> 페이지 구조체가 보유했던 리소스를 해제한다.  
> 페이지의 `vm` 타입을 확인하고, 그에 따라 처리해야 할 수도 있다.

현재로서는 익명 페이지만 처리할 수 있다.  
나중에 이 함수를 다시 방문하여 `file-backed` 페이지를 정리해야 할 것이다.

<br>

```c
static void anon_destroy (struct page *page);
```

> 익명 페이지가 보유했던 리소스를 해제한다.  
> 페이지 구조체를 명시적으로 해제할 필요는 없다. 호출자가 이를 수행해야 한다.

이제 `project 2`의 모든 테스트가 통과되어야 한다.
