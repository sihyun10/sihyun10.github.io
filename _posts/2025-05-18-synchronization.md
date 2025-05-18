---
title: "Synchronization (동기화)"
date: 2025-05-18 23:40:00 +09:00
categories: [KraftonJungle, keyword]
tags: [jungle]
pin: false
---

`project 2`를 본격적으로 구현하기 전에 짚고 넘어갔음 하는 개념에 **동기화**와 **가상 주소**가 있었다.  
따라서 구현하기 전에 먼저 **동기화** 개념을 짚고 넘어가자.

### Synchronization (동기화)

스레드 간의 자원 공유가 신중하고 통제된 방식으로 처리되지 않으면, 보통 결과는 엉망이 된다.  
운영체제 커널의 경우, 자원 공유에 오류가 생기면 전체 시스템이 다운될 수 있다.  
Pintos는 이러한 문제를 해결하기 위해 여러 가지 동기화 기본 도구를 제공한다.

### Disabling Interrupts - 인터럽트 비활성화

가장 단순하고 원시적인 동기화 방법은 **인터럽트를 비활성화**하는 것이다.  
즉, CPU가 인터럽트에 응답하지 않도록 일시적으로 막는 것이다.  
인터럽트가 꺼져 있으면, 타이머 인터럽트에 의해 스레드 선점이 발생하지 않기 때문에  
다른 스레드가 현재 실행 중인 스레드를 강제로 중단시킬 수 없다.  
인터럽트가 정상적으로 켜져 있다면, 실행 중인 스레드는 언제든지 다른 스레드에 의해 중단될 수 있다.

참고로, 이것은 Pintos가 **선점 가능한 커널**(`preemptible kernel`)임을 의미한다.  
즉, 커널 스레드는 언제든지 선점될 수 있다는 뜻이다.

기존 Unix 시스템은 **선점 불가능한 커널**이었으며,  
이는 커널 스레드가 명시적으로 스케줄러를 호출하는 시점에만 선점 될 수 있다는 뜻이다.  
(`user programs`는 두 모델 모두에서 언제든지 선점 될 수 있다.)  
예상할 수 있듯이, 선점 가능한 커널은 더 명시적인 동기화를 요구한다.

인터럽트 상태를 직접 설정해야 하는 경우는 거의 없다.  
대부분의 경우, 이후에 설명할 다른 동기화 기본 도구들을 사용해야 한다.  
인터럽트를 비활성화해야 할 주된 이유는 커널 스레드를 외부 인터럽트 핸들러와 동기화하기 위함인데,  
이 핸들러들은 잠들 수 없고, 따라서 대부분의 다른 동기화 방법을 사용할 수 없다.

일부 외부 인터럽트는 인터럽트를 꺼도 지연시킬 수 없다.  
이러한 인터럽트는 **마스크 불가능 인터럽트**(NMI)라고 하며,  
긴급한 상황(예: 컴퓨터에 불이 났을 때)에만 사용하도록 되어 있다.  
Pintos는 **마스크 불가능 인터럽트**를 처리하지 않는다!

<br>

`include/threads/interrupt.h` 파일에 인터럽트를 비활성화하고 활성화하는 유형과 함수들이 있다.

```c
enum intr_level;
```

- `intr_level`은 `INTR_OFF` 또는 `INTR_ON` 중 하나이며,  
  인터럽트가 비활성화되었거나 활성화되었음을 나타낸다

```c
enum intr_level intr_get_level (void)
```

- 현재 인터럽트 상태를 반환해준다.

```c
enum intr_level intr_set_level (enum intr_level level);
```

- `level`의 값에 따라 인터럽트를 켜거나 끄는 함수이다.  
  함수를 호출하기 전의 인터럽트 상태를 반환한다.

```c
enum intr_level intr_enable (void);
```

- 인터럽트를 켜는 함수이다.  
  이전의 인터럽트 상태를 반환해준다.

```c
enum intr_level intr_disable (void);
```

- 인터럽트를 끄는 함수이다.  
  이전의 인터럽트 상태를 반환해준다.

---

### Semaphores (세마포어)

세마포어는 음이 아닌 정수와 이를 원자적으로 조작하는 두 개의 연산자로 구성된다.  
(**원자적**이라는 말은, 시작되면 중간에 중단되지 않고 완전히 수행된다는 의미다)

- "Down" 또는 "P"
  - 세마포어 값이 양수가 될 때까지 기다린 후, 그 값을 -1 감소시키는 동작을 수행함
- "Up" 또는 "V"
  - 세마포어 값을 +1 증가시키고, 기다리고 있는 스레드가 있다면 그 중 하나를 깨운다 (wake up)

세마포어를 **0으로 초기화**하면,  
정확히 한 번 발생하는 이벤트를 기다리는 용도로 사용할 수 있다.  
예를 들어, 스레드 A가 스레드 B를 시작하고,  
B가 어떤 작업이 끝났다고 알릴 때까지 기다리려고 한다고 가정해보자.

A는 0으로 초기화된 세마포어를 생성하고,  
이 세마포어를 B에게 넘겨준 뒤,  
자신은 이 세마포어에 대해 **down** 연산을 수행한다.  
즉, A는 B의 작업 완료 신호가 올 때까지 기다리게 되는 것이다.

B가 작업을 끝내면,  
세마포어에 **up** 연산을 수행해서 A를 깨운다.  
이 방식은 A가 먼저 **down**을 하든, B가 먼저 **up**을 하든 상관없이 잘 작동한다.  
즉, 두 스레드 중 누가 먼저 실행되든 결과적으로 동기화가 보장된다.

```c
struct semaphore sema;

/* Thread A */
void threadA (void) {
  sema_down (&sema);
}

/* Thread B */
void threadB (void) {
  sema_up (&sema);
}

/* main function */
void main (void) {
  sema_init (&sema, 0); // sema를 0으로 초기화
  thread_create ("threadA", PRI_MIN, threadA, NULL);
  thread_create ("threadB", PRI_MIN, threadB, NULL);
}
```

이 예제에서 `thread A`는 `sema_down()`에서 실행을 멈추고,  
`thread B`가 `sema_up()`을 호출할 때까지 기다린다.

세마포어를 **1**로 초기화하면, 보통 자원 접근 제어에 사용된다.  
자원을 사용하기 전에 **down**을 호출해서 세마포어를 **0**으로 만들고,  
작업이 끝나면 **up**을 호출해서 다시 **1**로 만든다.  
(그래야 다른 스레드가 자원을 사용 가능하게 된다.)  
이러한 경우에는 이후에 설명할 **lock**을 사용하는게 더 적합할 수 있다.

세마포어는 **1**보다 큰 값으로도 초기화할 수 있지만, 거의 사용되지 않는다.

<br>

Pintos의 세마포어 타입과 관련 연산들은 `include/threads/synch.h`에 정의되어 있다.

```c
struct semaphore;
```

- 세마포어를 나타내는 구조체이다.

```c
void sema_init (struct semaphore *sema, unsigned value);
```

- `sema`를 주어진 초기값(`value`)으로 초기화해서 새로운 세마포어로 만든다.

```c
void sema_down (struct semaphore *sema);
```

- `sema`에 대해 **down** 또는 **P** 연산을 수행한다.
  - 값이 양수가 될 때까지 기다렸다가 -1 감소 시킨다.

```c
bool sema_try_down (struct semaphore *sema);
```

- `sema`에 대해 대기 없이 **down** 또는 **P** 연산을 실행하려 함
  - `sema`가 성공적으로 감소하면 **true**를 반환
  - 이미 0이면 `false`를 반환하고 아무 일도 안함
  - 짧은 시간 안에 반복 호출하는 건 CPU 자원을 낭비하므로,  
    `sema_down()` 사용하거나 다른 방법을 추천함

```c
void sema_up (struct semaphore *sema);
```

`sema`에 대해 **up** 또는 **V** 연산을 실행하여 값을 +1 증가시킨다.  
만약 기다리던 스레드가 있다면 그 중 하나를 깨운다.

대부분의 동기화 원시 도구들과는 달리, `sema_up()`함수는 외부 인터럽트 핸들러 내부에서 호출될 수 있다.  
Why? `sema_up()`은 단순히 세마포어 값을 증가시키고, 대기 중인 스레드가 있으면 깨우는 역할만 하기 때문에,  
인터럽트 핸들러 내부에서 안전하게 호출 가능하다.

<br>

세마포어는 내부적으로 인터럽트를 비활성화하는 기능과 스레드를 차단 및 차단 헤제하는 기능(`thread_block()` 및 `thread_unblock()`)
으로 구성되어 있다. 각 세마포어는 `lib/kernel/list.c`에 구현된 연결 리스트를 사용하여 대기 중인 스레드들의 리스트를 유지한다.

---

### Locks (락)

`lock`은 초기 값이 **1**인 세마포어와 같다.  
`lock`에서 **up**에 해당하는 동작을 `release`라고 하고, **down**에 해당하는 동작을 `acquire`라고 한다.

세마포어와 비교했을 때, `lock`은 하나의 추가적인 제약이 있다.  
**`lock`을 획득한 스레드만 그 `lock`을 해제할 수 있다!**  
(이 제약 덕분에 `lock`은 자원 소유자가 명확해지고, 실수로 다른 스레드가 자원을 해제하는 일을 방지 가능하다)

Pintos에서의 `lock`은 재귀적이지 않다.  
즉, 현재 `lock`을 보유한 스레드가 다시 그 `lock`을 획득하려고 하면 오류가 발생한다.

<br>

`lock`의 타입과 함수들은 `include/threads/synch.h` 파일에 정의되어 있다.

```c
struct lock;
```

`lock`을 나타내는 구조체이다.

```c
void lock_init (struct lock *lock);
```

`lock`을 새 `lock`으로 초기화한다.  
이 `lock`은 처음에는 어떤 스레드도 소유하지 않는다.

```c
void lock_acquire (struct lock *lock);
```

현재 스레드를 위해 `lock`을 획득한다.  
필요한 경우, 다른 스레드가 `lock`을 해제할 때까지 기다린다.

```c
bool lock_try_acquire (struct lock *lock);
```

현재 스레드가 대기하지 않고 `lock`을 획득하려 시도한다.  
`lock`을 성공적으로 획득하면 `true`를 반환  
이미 다른 스레드가 소유하고 있으면 `false`를 반환  
이 함수를 반복문 안에서 계속 호출하는 것은 CPU 시간을 낭비하므로, `lock_acquire()`를 사용하는 것이 좋다.

```c
void lock_release (struct lock *lock);
```

`lock`을 해제한다.  
이 `lock`은 반드시 현재 스레드가 소유하고 있어야 한다.

```c
bool lock_held_by_current_thread (const struct lock *lock):
```

현재 실행 중인 스레드가 해당 `lock`을 소유하고 있으면 `true`를 반환, 그렇지 않으면 `false`반환  
임의의 스레드가 `lock`을 소유하고 있는지를 확인하는 함수는 제공되지 않는데,  
이는 그 결과가 반환된 직후 바로 바뀔 수 있기 때문이다.

---

### Monitors

모니터는 세마포어나 `lock`보다 더 고수준의 동기화 방식이다.  
모니터는 동기화 되는 데이터, 모니터 락이라 불리는 락, 하나 이상의 조건 변수로 구성된다.  
스레드가 보호된 데이터에 접근하기 전에, 먼저 `monitor lock`을 획득한다.  
이때 스레드는 "모니터 안에 있다(in the monitor)"라고 말한다.  
모니터 안에 있는 동안, 스레드는 보호된 모든 데이터를 자유롭게 검사하거나 수정할 수 있다.  
보호된 데이터에 대한 접근이 끝나면, 스레드는 모니터 락을 해제한다.

조건 변수는 모니터 안의 코드가 어떤 조건이 참이 될 때까지 기다릴 수 있도록 해준다.  
각 조건 변수는 하나의 추상적인 조건과 관련이 있다.  
예를 들어, '처리할 데이터가 도착했다' 또는 '사용자의 마지막 키 입력 후 10초 이상 경과했다' 같은 조건이다.

모니터 안의 코드가 어떤 조건이 참이 되기를 기다려야 할 때,  
해당 조건 변수에서 **wait**를 호출하여 락을 해제하고 조건이 신호를 받을 때까지 기다린다.

반면, 어떤 스레드가 조건을 참으로 만드는 작업을 수행한 경우,  
해당 조건 변수에 대해 **signal**을 호출하여 대기 중인 스레드 하나를 깨우거나,  
**broadcast**를 호출하여 모든 대기 중인 스레드를 깨운다.

- `cond_signal()` : 하나의 대기 스레드만 깨움
- `cond_broadcast()` : 모든 대기 중인 스레드 깨움

<br>

조건 변수의 유형과 함수들은 `include/threads/synch.h`에 선언되어있다.

```c
struct condition;
```

조건 변수를 나타내는 구조체이다.

```c
void cond_init (struct condition *cond);
```

`cond`를 새로운 조건 변수로 초기화한다.

```c
void cond_wait (struct condition *cond, struct lock *lock);
```

`lock`(모니터 락)을 원자적으로 해제하고, 다른 코드에서 `cond`가 **signal**될 때까지 기다린다.  
`cond`가 **signal**되면, `lock`을 다시 획득한 후 함수에서 반환된다.  
**이 함수를 호출하기 전에 반드시 `lock`을 획득하고 있어야 한다.**  
`signal`을 보내는 것과 `wait`에서 깨어나는 것은 원자적인 작업이 아니다.  
(`signal`을 보낸다고 해서 바로 깨어나는게 아니며, 다른 스레드가 먼저 깰 수도 있고, 선행 작업 중일 수도 있다)

따라서 일반적으로 `cond_wait()`을 호출한 쪽에서는 `wait`에서 깬 뒤에도 조건을 다시 확인하고,  
필요하다면 다시 `wait`해야 한다.

```c
void cond_signal (struct condition *cond, struct lock *lock);
```

`cond`에서 대기 중인 스레드가 있다면, 이 함수는 그 중 하나를 깨운다.  
대기 중인 스레드가 없다면 아무 작업도 하지 않고 반환된다.  
이 함수를 호출하기 전에도 반드시 **lock**을 잡고 있어야 한다.

```c
void cond_broadcast (struct condition *cond, struct lock *lock);
```

`cond`에서 대기 중인 모든 스레드를 깨운다.  
이 함수도 호출 전 반드시 `lock`을 획득하고 있어야 한다.

---

### Monitor Example

모니터의 전형적인 예시는, 하나 이상의 "생산자"(`producer`) 스레드가 문자를 쓰고,  
하나 이상의 "소비자"(`consumer`) 스레드가 문자를 읽어들이는 **버퍼**를 다루는 것이다.

- 생산자는 데이터를 만들어 버퍼에 넣고, 소비자는 버퍼에서 데이터를 꺼내서 처리함
- 이 버퍼는 공유자원이기 때문에, 동시에 접근하지 않도록 모니터를 이용해 동기화해야함

이를 구현하기 위해서는, 모니터 락 외에도 두 개의 조건 변수가 필요한데,  
이를 `not_full`과 `not_empty`라고 부를 것이다.

- `not_full` : 버퍼가 가득 차지 않았다는 조건 ➔ 생산자가 기다릴지 판단할 조건
- `not_empty` : 버퍼가 비어 있지 않다는 조건 ➔ 소비자가 기다릴지 판단할 조건

```c
  char buf[BUF_SIZE];     /* Buffer. */
  size_t n = 0;         /* 0 <= n <= BUF SIZE: # of characters in buffer. */
  size_t head = 0;        /* buf index of next char to write (mod BUF SIZE). */
  size_t tail = 0;         /* buf index of next char to read (mod BUF SIZE). */
  struct lock lock;         /* Monitor lock. */
  struct condition not_empty; /* Signaled when the buffer is not empty. */
  struct condition not_full;     /* Signaled when the buffer is not full. */

  ...initialize the locks and condition variables...

  void put (char ch) {
    lock_acquire (&lock);
    while (n == BUF_SIZE)    /* Can't add to buf as long as it's full. */
      cond_wait (&not_full, &lock);
    buf[head++ % BUF_SIZE] = ch;    /* Add ch to buf. */
    n++;
    cond_signal (&not_empty, &lock);    /* buf can't be empty anymore. */
    lock_release (&lock);
  }

  char get (void) {
    char ch;
    lock_acquire (&lock);
    while (n == 0)        /* Can't read buf as long as it's empty. */
      cond_wait (&not_empty, &lock);
    ch = buf[tail++ % BUF_SIZE];    /* Get ch from buf. */
    n--;
    cond_signal (&not_full, &lock);    /* buf can't be full anymore. */
    lock_release (&lock);
  }
```

`BUF_SIZE`는 `SIZE_MAX + 1`을 정확히 나누어야 위 코드가 완전히 올바르게 작동한다.  
그렇지 않으면 `head`가 다시 0으로 `wrap around`될 때 문제가 발생할 수 있다.  
실제로는 `BUF_SIZE`는 보통 2의 거듭제곱 값을 사용한다.

---

### 모니터 실생활 예시 - 빵집 사장님과 손님

#### 가정

- 사장님은 오븐에서 빵을 구워서 진열대에 올려둔다
- 손님은 진열대에서 빵을 집어간다
- 진열대에는 최대 10개의 빵만 올려둘 수 있다. (`BUF_SIZE = 10`)
- 사장님은 진열대가 꽉 차면 더 이상 빵을 못 올린다
- 손님은 진열대가 비어있으면 빵을 못 집어간다

#### 빵집 사장님 - put()

- 사장님은 lock을 잠그고, 진열대가 꽉 찼는지 확인한다
- 진열대가 가득 찼다면, 손님이 하나 집어갈 때까지 기다려야 한다 (`cond_wait()`)
- 비게 된다면, 빵을 하나 구워서 진열대에 올림
- 그리고 손님에게 "이제 빵 있어요~"하고 알려준다 (`cond_signal()`)
- 마지막으로 lock을 풀어준다 (`lock_release()`)

#### 손님 - get()

- 손님은 lock을 잠그고, 진열대에 빵이 있는지 확인한다
- 진열대가 비어있으면, 사장님이 빵을 올릴 때까지 기다려야 한다 (`cond_wait()`)
- 빵이 올라오면, 진열대에서 빵을 하나 집어가고, 개수를 줄인다
- 그리고 사장님에게 "이제 자리 있어요~"하고 알려준다 (`cond_signal()`)
- 마지막으로 lock을 풀어준다 (`lock_release()`)

---

출처 : [Synchronization](https://casys-kaist.github.io/pintos-kaist/appendix/synchronization.html)
