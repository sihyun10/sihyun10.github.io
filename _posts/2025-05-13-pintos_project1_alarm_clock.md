---
title: "Pintos Project 1 : Alarm Clock"
date: 2025-05-13 02:23:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: true
---

카이스트 핀토스 과제 : [Project 1 : Alarm Clock](https://casys-kaist.github.io/pintos-kaist/project1/alarm_clock.html)  
이제 첫 번째 과제인 **Alarm Clock**을 해결해나가보자!

---

### Alarm Clock

`devices/timer.c`에 정의된 `timer_sleep()`을 다시 구현해라.  
현재 제공된 구현은 동작은 하지만 **busy waiting**을 사용한다.  
현재 시간을 계속 확인하고, 충분한 시간이 지날 때까지 `thread_yield()`를 호출하면서 반복 루프를 돈다.  
**busy waiting**를 피하기 위해 재구현해라.

```c
void timer_sleep (int64_t ticks);
```

이 함수는 지정된 `ticks`만큼 시간이 흐를 때까지 호출한 스레드의 실행을 suspend(중단)한다.  
시스템이 `idle` 상태가 아니라면, 정확히 `x` ticks가 지난 정확한 시점에 깨어날 필요는 없다.  
단지 그 스레드가 충분히 기다린 후에 ready queue에 넣기만 하면 된다.

`timer_sleep()` 함수는 실시간으로 동작하는 스레드에 유용하다.  
예를 들어, 커서를 1초마다 깜빡이게 하는 작업 같은 데에 사용할 수 있다.

`timer_sleep()`함수의 인자는 밀리초 또는 다른 단위가 아닌, 타이머 틱(`tick`) 수로 주어진다.

초당 몇 개의 tick이 있는지는 `TIMER_FREQ`라는 매크로로 정의되며,  
이 매크로는 `devices/timer.h`에 있다.

```
#define TIMER_FREQ 100
```

기본 값은 초당 **100틱** 이다. (1초당 tick이 100번 돈다는 의미)  
이 값을 변경하는 것은 권장하지 않는다.  
그 이유는 많은 테스트가 실패할 가능성이 높기 때문이다.

밀리초, 마이크로초, 나노초 단위로 잠들 수 있도록  
`timer_msleep()`, `timer_usleep()`, `timer_nsleep()` 같은 별도의 함수들도 존재한다.  
하지만 이 함수들은 필요할 때 자동으로 `timer_sleep()`을 호출한다.  
이 함수들은 수정할 필요가 없다.

---

### 과제에 들어가기에 앞서 알아두어야 할 내용

"어떤 작업을 언제 실행시킬까?"를 결정하는 스케줄러(`Scheduler`)가 있다.  
이 스케줄러가 움직이기 위해서는 시간을 체크해주는 시계가 필요하다.  
그 역할을 해주는 것이 바로 **Timer(타이머)** 라는 하드웨어 장치다.

> Q. Timer는 어떻게 작동할까?
>
> 타이머는 일정한 시간 간격으로 신호를 보낸다. 이거를 **타이머 인터럽트**라고 한다.  
> 그러면 운영체제는 "어, 시간 됐네? 지금 작업을 멈추고 다른 작업에게 CPU를 넘겨야지"라고 판단한다.  
> 이때 스케줄러가 실행되고, 다음 작업에게 CPU를 넘겨주게된다.  
> 이걸 **선점 스케줄링**이라한다.

> Q. **Timer interrupt**가 발생함으로써 장점은?
>
> 타이머 인터럽트가 발생할 때마다, 제어권이 운영체제로 넘어가기 때문에  
> 운영체제는 사용자 프로그램이 비정상적으로 작동하는 경우라도 해당 프로그램을 적절히 처리할 수 있게 된다.

#### 선점 스케줄링 vs 비선점 스케줄링

- 선점 스케줄링 : 운영체제가 강제로 현재 작업을 멈추게 하고, 다른 작업으로 바꾼다
- 비선점 스케줄링 : 작업이 스스로 끝날 때까지 운영체제가 기다린다

`timer`는 똑같은 간격으로 계속 `interrupt`를 발생시키고,  
스케줄러가 그 타이밍에 맞게 스레드를 바꿔준다.

#### 동작 방식은 어떻게 될까?

- 특정 시간 뒤에 작업을 다시 하고 싶은 경우

어떤 스레드가 "나 3초 자고 일어날게"하면은  
운영체제는 "이 친구는 3초 뒤에 깨워야지"하고 기억해둔다.

이때 타이머가 울릴때마다 운영체제는 확인한다.  
"자고있는 친구들 중에 일어날 시간이 된 친구가 있나?"  
있으면 깨우고, 없다면 무시하고 지나간다.

- 선점 스케줄링

스레드에게 CPU를 너무 오래 쓰게 하면 안되니까, 얼마나 쓸지 제한을 둔다.  
타이머가 울릴때마다 지금 스레드가 시간 초과했는지 확인 후,  
시간이 다 됐다면 멈추고 다음 스레드로 바꿔준다.

타이머는 항상 일정 시간마다 울리는데, 그때마다 아래의 내용을 확인한다.

`깨워야 하는 시간이 되었는지, 현재 실행 중인 스레드가 너무 오래 CPU를 쓰는지`  
해당하면 스레드를 깨워주거나 교체하고, 아니면 그냥 아무 일도 안하고 지나간다.

#### 프로세스의 상태

![프로세스의 상태](/assets/img/process_state.jpg)

---

### 목표

알람 기능을 **sleep**과 **wake up** 방식으로 재구현하는 것이다.

프로세스를 **sleep** 시키고 정해진 시간 이후에 알람을 통해 깨우는 방식으로  
알람이 울리기 전까지는 조건 만족 여부를 체크하지 않고 푹 자도록 해준다.

---

### 본격적으로 코드를 뜯어보며 현재 코드의 전반적인 흐름 파악하기

#### **thread.h**, **thread.c** 파일 코드

```c
enum thread_status
{
  THREAD_RUNNING, /* Running thread. */
  THREAD_READY,   /* Not running but ready to run. */
  THREAD_BLOCKED, /* Waiting for an event to trigger. */
  THREAD_DYING    /* About to be destroyed. */
};
```

- 스레드의 4가지 상태
  - THREAD_RUNNING (실행) : 해당 스레드가 현재 CPU를 점유하고 실제로 명령어 실행 중
  - THREAD_READY (준비) : CPU에서 지금 실행 중은 아니지만, 실행할 준비가 되어 있음
  - THREAD_BLOCKED (대기)
  - THREAD_DYING (종료)

<br>

```c
void thread_block(void); // 스레드 상태를 BLOCKED로 변환 후에 재움
void thread_unblock(struct thread *); // 스레드 상태를 READY로 변환 후에 깨움
```

```c
void thread_block(void)
{
  ASSERT(!intr_context());
  ASSERT(intr_get_level() == INTR_OFF); // 반드시 인터럽트가 꺼진 상태에서 호출해야한다
  thread_current()->status = THREAD_BLOCKED; // 현재 스레드 상태를 BLOCKED로 변경
  schedule(); // 스케줄러를 호출해 CPU를 다른 스레드에게 넘김
}
```

```c
void thread_unblock(struct thread *t)
{
  enum intr_level old_level;

  ASSERT(is_thread(t));

  old_level = intr_disable();
  ASSERT(t->status == THREAD_BLOCKED);
  list_push_back(&ready_list, &t->elem); // ready_list에 추가 ➔ CPU 할당 받을 수 있음
  t->status = THREAD_READY; // 상태 갱신함 (Ready 상태로)
  intr_set_level(old_level);
}
```

|        함수        | 이전 상태 | 이후 상태 |     설명      |
| :----------------: | :-------: | :-------: | :-----------: |
|  `thread_block()`  | `RUNNING` | `BLOCKED` | 스레드 잠재움 |
| `thread_unblock()` | `BLOCKED` |  `READY`  |  스레드 깨움  |

<br>

#### **timer.c** 파일 코드

```c
void timer_init(void)
{
  /* 8254 input frequency divided by TIMER_FREQ, rounded to
     nearest. */
  uint16_t count = (1193180 + TIMER_FREQ / 2) / TIMER_FREQ;
  outb(0x43, 0x34); /* CW: counter 0, LSB then MSB, mode 2, binary. */
  outb(0x40, count & 0xff);
  outb(0x40, count >> 8);

  intr_register_ext(0x20, timer_interrupt, "8254 Timer");
}
// 0x20번 인터럽트가 발생할때 timer_interrupt()가 호출되도록 설정
```

```c
/* Timer interrupt handler. */
static void
timer_interrupt(struct intr_frame *args UNUSED)
{
  ticks++;
  thread_tick();
}
```

`timer_interrupt()`함수는 매 틱마다 실행되는 함수다.

```c
/* Suspends execution for approximately TICKS timer ticks. */
void timer_sleep(int64_t ticks)
{
  int64_t start = timer_ticks(); // 언제부터 잠자기 시작했는지를 나타낸다

  ASSERT(intr_get_level() == INTR_ON);

  while (timer_elapsed(start) < ticks)
    thread_yield();
}
```

현재 실행중인 스레드를 약 `ticks`만큼 잠재워주는 함수이다.  
하지만 실제로 잠드는(block)것이 아닌, `ticks`가 다 찰 때까지  
계속 `thread_yield()`로 CPU를 다른 스레드에 양보하며 반복적으로 확인한다.  
즉, **busy wait** 방식이다.

---

### 구현 아이디어

- `timer_sleep(int64_t ticks)`
  - 현재 thread를 주어진 시간 동안 sleep 시킨다
- OS가 계속 `timer_ticks()`값을 체크하면서 해당 시간이 지나면 깨운다
- blocked 상태로 전환하여 잠재운다

먼저 `sleep_list` 만들어야한다.  
재워둬야할 스레드를 저장할 리스트가 필요하기 때문이다.  
근데 이 리스트 안에 "언제 깨워야 하는지"에 대한 정보. 즉 일어나야할 `tick`정보도 포함되어있어야한다.

`timer_sleep(int64_t ticks)`함수를 수정해야한다.  
**busy wait** 없이 재워야할 스레드는 재워줘야한다.  
➔ `thread_block()`을 호출해 현재 스레드를 `THREAD_BLOCKED`상태로 전환하여 재움

그렇다면 깨워줘야할 누군가도 있어야한다.  
이때, `timer_interrupt()` 이 함수는 매번 `ticks++`해주고 있다.  
즉 매 틱마다 호출되기에 `sleep_list`를 확인하며 일어나야할 시간이 다 된 친구들을 깨워주면 됨  
➔ `thread_unblock()`을 호출해 현재 스레드를 `THREAD_READY`상태로 전환해줌

---

### 실제 구현해보기

#### 1. `sleeping_list` 생성

재운 스레드들을 관리해주는 리스트가 있어야한다.  
깨어나야 할 tick 시간을 저장할 필드(`wakeup_tick`) 추가도 해야한다.  
그래야 언제 깨워줄지 알 수 있기때문이다.

```c
// devices/timer.c
static struct list sleeping_list; // 재운 스레드 관리해주는 리스트
```

```c
// devices/timer.c
void timer_init(void)
{
  //...
  list_init(&sleeping_list); //초기화
}
```

```c
// include/threads/thread.h
struct thread
{
  //...
  int64_t wakeup_tick; // 일어나야할 시간
}
```

#### 2. `timer_sleep()` 함수 수정하기 - 편하게 잘 수 있도록 해주기

언제 깨어나야 하는지에 대한 `wakeup_tick`값을 설정해주고,  
`sleeping_list`에 삽입하고 `thread_block()`함수를 호출해 재워주는 **sleep 함수**를 구현

- `timer_sleep()` 함수를 호출했을 때, 현재 스레드를 `sleeping_list`에 추가 후, `thread_block()` 호출
- 일어나야할 친구들을 오름차순으로 정렬 후에 삽입함으로써, 맨 앞에서부터 필요한 만큼만 깨울 수 있다.

```c
// devices/timer.c
void timer_sleep(int64_t ticks)
{
  int64_t start = timer_ticks();
  int64_t wakeup_tick = start + ticks; // 언제 깨어날지

  ASSERT(intr_get_level() == INTR_ON);

  thread_current()->wakeup_tick = wakeup_tick; // 깨어날 시각 저장
  enum intr_level old_level = intr_disable();  // 인터럽트 비활성화 시킴

  // 일어나야할 친구들을 오름차순으로 정렬 후에 삽입
  list_insert_ordered(&sleeping_list, &thread_current()->elem, earlier_wake_up, NULL);

  thread_block();            // 현재 스레드 block 시킴 (깨울때까지 잠들어있도록)
  intr_set_level(old_level); // 인터럽트 원래대로 복구 시킴
}
```

`earlier_wake_up()`함수는 두 스레드를 비교하여 더 일찍 깨어나야할 스레드가 앞으로 올 수 있도록 정렬시켜준다.

```c
// threads/thread.h 파일에 선언
bool earlier_wake_up(const struct list_elem *a, const struct list_elem *b, void *aux);
```

```c
// threads/thread.c
bool earlier_wake_up(const struct list_elem *a, const struct list_elem *b, void *aux UNUSED)
{
  struct thread *thread_a = list_entry(a, struct thread, elem);
  struct thread *thread_b = list_entry(b, struct thread, elem);

  return thread_a->wakeup_tick < thread_b->wakeup_tick;
}
```

wakeup_tick(일어나야할 시간)을 비교해서 **더 작은 쪽**(= 더 빨리 깨어나야 하는 스레드)이  
앞에 오도록 `true/false`를 반환한다.

이 함수 덕분에 `sleeping_list`에 오름차순으로 정렬 후에 삽입 가능하다.

#### 3. `timer_interrupt()`함수에서 깨워주는 기능을 추가

`ticks++`를 수행한 후, `sleeping_list`를 순회하며  
`wakeup_tick <= ticks`인 스레드를 깨워준다.  
깨운 스레드는 `sleeping_list`에서 제거한다.

`sleeping_list`가 오름차순 정렬되어있기 때문에  
앞에서부터 확인하면서 조건(`wakeup_tick <= ticks`)이 맞으면 바로 깨워준다.

```c
// devices/timer.c
static void
timer_interrupt(struct intr_frame *args UNUSED)
{
  ticks++;
  thread_tick();

  check_sleeping_threads(); // 각 스레드의 깨어날 시간 체크하는 함수
}
```

```c
// devices/timer.c
static void check_sleeping_threads(void)
{
  while (!list_empty(&sleeping_list))
  {
    struct list_elem *e = list_front(&sleeping_list); // 첫 번째 스레드
    struct thread *t = list_entry(e, struct thread, elem); // 스레드 정보 추출함

    // 스레드가 깨어날 시간인지 확인함
    if (t->wakeup_tick <= ticks)
    {
      list_pop_front(&sleeping_list); // 깨어날 스레드 리스트에서 제거
      thread_unblock(t); // unblock() 해줌 ➔ 깨워줌
    }
    else
    {
      break;
    }
  }
}
```

`break`문은 리스트에서 아직 깨어나면 안되는 스레드가 처음 발견되면 그 이후로 더 이상 순회하지 않는다.

---

#### 마무리

구현한 **alarm_clock** 동작 흐름에 대해 간단한 예제를 들어 그림으로 정리해보았다.

![alarm_clock 동작 흐름](/assets/img/alarm_clock.jpg)
