---
title: "Pintos Project 1 : introduction"
date: 2025-05-12 11:46:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: true
---

카이스트 핀토스 과제 : [Project 1 : introduction](https://casys-kaist.github.io/pintos-kaist/project1/introduction.html)  
이 사이트에 작성된 내용을 바탕으로 작성한 글입니다.

---

#### Project1에서 봐야할 디렉토리 구조

- `threads/` : 처음부터 수정해야할 부분
- `devices/` : 키보드, 타이머, 디스크 등 I/O 장치와의 인터페이스를 처리
  - `timer.c` 파일에서 타이머(timer) 구현 수정해야함
  - 그 외의 코드(예: 키보드, 디스크 등)는 수정할 필요 없음
- `tests/` : 각 프로젝트에 대한 테스트
- `include/` : 헤더 파일의 소스 코드 (`*.h`)

#### Test

전체 테스트하려면 아래와 같은 명령어를 작성해주면 된다.

```
$ make check
```

테스트를 다시 실행할땐  
`make clean` 또는 `.output`을 직접 삭제해주는 방법이 있다.

```
$ make clean
```

디버깅 목적으로는 테스트 파일을 수정해도 괜찮지만,  
최종 채점 시에는 수정한 것이 아닌 원본 테스트를 사용한다.

나의 코드가 일반적인 상황에서도 잘 동작해야 하며,  
오직 주어진 테스트만 통과하도록 짜면 안된다.

#### pintos가 제대로 동작되는지 확인 (Project 1의 경우)

```
$ cd pintos-kaist
$ source ./activate
$ cd threads
$ make check
```

뭔가 한참 compile하고 test 프로그램이 돈 후에 다음 message가 나오면 정상

```
20 of 27 tests failed.
```

---

이제 본격적으로 **Project 1 : Threads** 부분 파헤쳐보기

이 과제는 기본적인 기능만 있는 스레드 시스템이 주어진다.  
기능을 확장하면서 동기화(`synchronization`) 문제에 대한 이해를 깊게 해라.

작업은 주로 `threads` 디렉토리에서 하게 되며,  
일부는 `devices` 디렉토리에서도 작업한다.  
컴파일은 `threads` 디렉토리에서 해야한다.

pintos는 이미 다음 기능을 구현해놓았다.

- thread creation & thread completion (스레드 생성 및 종료)
- simple scheduler to switch between threads (간단한 스케줄러 - 스레드 전환시킴)
- 동기화 기본 요소들
  - 세마포어(semaphore), 락(lock), 조건 변수(condition variable), 최적화 장벽(optimization barrier)

### Thread 동작 방식

스레드를 생성할 때는, 스케줄링될 새로운 `context`를 만드는 것이다.  
`thread_create()` 함수에 해당 스레드가 실행할 함수를 인자로 전달한다.  
이 스레드가 처음으로 실행되면, 그 함수의 시작 지점부터 실행을 시작한다.  
함수가 종료되면 스레드도 종료된다.

#### Scheduling & Context Switch

주어진 시간마다 정확히 하나의 스레드가 실행되고, 나머지 스레드는 `inactive`(비활성화)된다.  
스케줄러는 다음에 실행할 스레드를 결정한다.  
(특정 시간에 실행할 준비가 된 스레드가 없을 경우, `idle()`로 구현된 특수 `idle` 스레드가 실행된다)  
한 스레드가 다른 스레드가 작업을 수행할 때까지 기다려야 할 때 `context switch`를 강제할 수 있다.

`Context Switch`의 매커니즘은 `thread/thread.c`의 `thread_launch()`에 있다. (이해할 필요는 없다)  
➔ 현재 실행중인 스레드의 상태를 저장하고 새로 실행할 스레드의 상태를 복원한다.

<br>

### 어떤 파일을 중점적으로 봐야 하는지 알려주는 길잡이

**`threads` codes**

- `init.c`, `init.h` (커널 초기화)  
  커널의 메인 프로그램인 `main()`함수가 존재하며, `main()`을 검토하여 무엇이 초기화되는지 확인해라!  
  나중에 내가 초기화할 코드가 있다면 여기에 추가하면 된다.
- `thread.c`, `thread.h` (이 프로젝트의 핵심 파일)
- `malloc.c`, `malloc.h` (커널을 위한 `malloc()` 및 `free()` 구현)
- `interrupt.c`, `interrupt.h` (인터럽트 처리)
  - 인터럽트를 켜고 끄는 함수도 있다.
- `synch.c`, `synch.h` (동기화)
  - `semaphores`, `locks`, `condition variables`, and `optimization barriers`
  - Project 1 ~ 4 모두에서 동기화에 사용해야함

`thread.c`, `thread.h` : 핵심 구조체와 스케줄링 코드  
`init.c` : 커널이 초기화되는 흐름  
`synch.c`, `synch.h` : 세마포어나 락 등

위의 파일들을 중점적으로 봐야할 것 같다.

**`devices` codes**

- `timer.c`, `timer.h` (**수정해야할 파일**)  
  초당 100번 클릭하는 시스템 타이머이다.

**`lib` codes**

- `kernel/list.c`, `kernel/list.h` (이중 연결 리스트 구현)  
  Pintos 코드 전반에서 사용됨. project 1에서 우리가 직접 여러 곳에 사용하게 될 가능성이 높다.  
  시작하기 전에 이 코드를 훑어보는 것을 권장함 (특히 header file의 주석 부분)

<br>

### Synchronization (동기화)

적절한 동기화는 이러한 문제에 대한 해결책의 중요한 부분이다.  
interrupts를 off하면 모든 동기화 문제를 쉽게 해결할 수 있다.  
➔ 인터럽트가 off 되어있는 동안에는 동시성이 없기 때문에 `race condition`(경쟁 조건)이 발생할 가능성이 없다.  
따라서 모든 동기화 문제를 이런 식으로 해결하고 싶지만, 그렇지 않다.  
대신 `semaphores`(세마포어), `locks`(락), `condition variables`(조건 변수)를 사용해서 해결해라.

Pintos 프로젝트에서는, 인터럽트를 비활성화(`disabling interrupts`) 하는 것이 가장 적절한 해결책인 부분은  
`kernel thread`(커널 스레드)와 `interrupt handler`(인터럽트 핸들러)가 데이터를 공유할 때이다.  
왜냐하면 인터럽트 핸들러는 잠들 수 없기 때문에 락을 획득할 수 없다.  
즉, 커널 스레드와 인터럽트 핸들러 간에 공유되는 데이터는  
**커널 스레드 내에서 인터럽트를 꺼서 보호**해야만 한다.

이번 프로젝트에서는 인터럽트 핸들러로부터 일부 스레드 상태에 접근하는 정도만 요구된다.

- `alarm clock`(알람 시계) 기능에서는 타이머 인터럽트가 잠든 스레드들을 깨워야한다.
- `advanced scheduler`(고급 스케줄러) 기능에서는 타이머 인터럽트가 전역 및 스레드별 변수들에 접근해야한다.

커널 스레드에서 이러한 변수들에 접근할 때는,  
타이머 인터럽트가 개입하는 것을 막기 위해 인터럽트를 비활성화해야 한다.

인터럽트를 끌 때는, **가장 짧은 코드 구간에만** 적용 하도록 주의하자!  
➔ 그렇지 않다면 `timer ticks` 또는 `input events` 등 중요한 것들을 놓칠 수 있다.  
또한 인터럽트를 끄면 인터럽트 처리 지연 시간을 증가시켜, 시스템 반응 속도를 떨어뜨릴 수 있다.

나의 제출물에 `busy waiting`(바쁜 대기)이 없어야 한다!  
`thread_yield()`를 호출하는 `tight loop`는 `busy waiting`의 한 형태이다.

#### timer 코드에서 busy waiting(바쁜 대기)이 생기는 이유?

`busy_wait()`는 loop를 일정 횟수만큼 돌면서 인위적으로 지연(delay)을 발생시키는 함수로,  
CPU를 점유한 채 아무 작업도 하지 않고 루프만 반복하는 방식으로 동작한다.

```c
static void NO_INLINE
busy_wait (int64_t loops) {
  while (loops-- > 0)
    barrier ();
}
```

---

#### 최종 정리

Pintos Project 1에서는 `threads/thread.c`를 중심으로 스레드 생성과 스케줄링 동작을 이해해야 하며,  
**sleep**과 **wake up** 기능을 구현하기 위해 `devices/timer.c`를 분석하고 수정해야한다.
