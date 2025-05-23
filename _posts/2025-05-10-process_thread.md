---
title: "[Pintos 9주차 키워드] 프로세스와 스레드"
date: 2025-05-10 11:46:00 +09:00
categories: [KraftonJungle, keyword]
tags: [jungle]
pin: true
---

### 프로세스(Process)와 스레드(Thread)

프로세스는 실행 환경과 자원을 제공하는 컨테이너 역할을 하고,  
스레드는 실제 CPU를 사용해 코드를 하나하나 실행한다.

![프로세스와 스레드](/assets/img/process_thread.jpg)

프로세스 A는 단일 스레드이며, 프로세스 B는 멀티 스레드이다.

#### **프로세스 (Process)** 란?

- 프로그램은 실제 실행하기 전까지는 단순한 파일에 불과하다
- 프로그램을 실행하면 프로세스가 만들어지고 프로그램이 실행된다
- 운영체제 안에서 실행중인 프로그램을 **프로세스**라고 한다
  - 메모리에 적재되고 CPU 자원을 할당받아 프로그램이 실행되고 있는 상태이다

프로세스는 각각 독립된 메모리 영역(Code, Data, Heap, Stack)을 할당 받는다.

- 각 프로세스는 독립적인 메모리 공간을 갖고 있고, 운영체제에서 별도의 작업 단위로 분리해 관리된다
- 각 프로세스는 별도의 메모리 공간을 갖고 있기 때문에 서로 간섭하지 않는다
  - 그렇기 때문에 하나의 프로세스가 오류나더라도 다른 프로세스에는 영향을 미치지 않는다
  - 유튜브를 보며 네이버 블로그를 작성할 때, 유튜브에서 심각한 오류가 발생하면 유트브만 종료되고, 네이버 블로그는 종료되지않는다

> **프로세스의 메모리 구성**
>
> - Code 섹션 : 실행할 프로그램의 코드가 저장되는 부분
> - Data 섹션 : 전역 변수 및 정적 변수가 저장되는 부분
> - Heap (힙) : 동적으로 할당되는 메모리 영역
> - Stack (스택) : 메서드(함수) 호출 시 생성되는 지역 변수와 반환 주소가 저장되는 영역 (스레드에 포함됨)
>  
{: .prompt-tip }

<br>

동일한 프로그램을 여러 개의 프로세스로 생성하면, 그만큼 메모리를 차지하게 되고 CPU에서 할당받는 자원이 중복되게 된다.  
**스레드(Thread)** 는 이러한 프로세스 특성의 한계를 해결할 수 있다.

#### **스레드(Thread)** 란?

- 프로세스 내에서 동시에 실행되는 작업의 단위이다
- 프로세스가 제공하는 동일한 메모리 공간을 공유한다

한 프로세스 내에 **최소 하나**의 스레드가 존재해야한다. 그래야 프로그램이 실행될 수 있다.

- 단일 스레드 : 한 프로세스 내에 하나의 스레드만 존재
- 멀티 스레드 : 한 프로세스 내에 여러 스레드가 존재
  - 유튜브에서 vlog를 보면서, 댓글을 달거나 실시간 채팅을 함께 수행되어야 하는 경우에
  - 각각 다른 스레드가 동시에 수행하게 된다

> **스레드의 메모리 구성**
>
> - 공유 메모리 : 같은 프로세스의 Code 섹션, Data 섹션, Heap(메모리)은 모든 스레드가 공유함
> - 개별 Stack(스택) : 각 스레드는 자신의 스택을 갖고 있음
>
{: .prompt-tip }

---

| CPU 스케줄링 개념을 이해하려면 먼저 **멀티태스킹**과 **멀티프로세싱** 개념을 알고 있어야 한다.

### 프로세싱 발전 과정 - 멀티태스킹

초창기 컴퓨터는 `단일 프로세스` 시스템이었다.  
한번에 하나의 프로그램만 실행할 수 있었으며, 다른 프로그램을 실행하려면 현재 작업이 끝날 때까지 기다려야했다.

이 문제를 해결하기 위해 나온 개념이 `멀티프로그래밍`이다.  
여러 프로그램을 메모리에 올려놓고, 하나의 CPU가 번갈아 가며 프로그램을 실행시키는 방식이다.  
예를 들어, 프로세스1이 I/O(입출력)작업을 수행하는 동안 CPU는 놀지 않고 프로세스2를 실행한다.  
그러나 하나의 프로세스가 CPU를 오래 점유하면, 다른 프로세스는 그만큼 더 오래 기다려야 했다.

이 문제를 보완한 것이 **멀티태스킹(Multi Tasking)** 이다.  
우리가 유튜브로 음악을 들으며 인터넷 검색을 할 수 있는 것처럼  
각각의 작업을 아주 짧은 시간 단위로 번갈아 처리하여 응답 시간을 최소화한다.

CPU가 한 프로세스의 상태를 저장하고 다른 프로세스의 상태를 불러와 교체하는 과정을 `Context Switching`이라 한다.

> 🧐 **Context Switching**이란?  
> CPU 코어에서 실행 중이던 프로세스/스레드가 다른 프로세스/스레드로 교체되는 것
>
> - Process(프로세스)가 Thread(스레드)보다 Context Switching 비용이 많이 든다.  
>   - 그 이유는 Thread(스레드)는 Stack(스택)영역을 제외한 모든 메모리를 공유하기 때문에 Context Switching이 발생했을 때 Stack 영역만 변경하면 되기 때문이다.
>
> 🧐 그럼 왜 **Context Switching**이 필요할까?
>
> - 여러 프로세스와 스레드들이 공정하게 CPU 시간을 나눠 갖기 위해  
>   - 하나의 작업이 너무 오랫동안 CPU를 독점하지 않도록 해준다
> - 높은 우선순위의 작업은 빠르게 처리될 수 있도록 하기 위해
>
> CPU가 작업을 전환할 때 현재 작업의 상태를 저장하고 다음 작업의 상태를 복원하는 과정은 일정 시간이 소요되며 CPU 자원을 소모하게 된다. Context Switching이 빈번하게 발생하면 CPU가 실제 작업을 처리하는 시간보다 스위칭에 소요되는 시간이 많아질 수 있다.  
{: .prompt-tip }

<br>

**멀티태스킹** 기술 덕분에 하나의 컴퓨터 시스템이 동시에 여러 작업을 처리할 수 있게 되었고,  
이때 어떤 프로그램이 언제, 얼마 동안 CPU를 사용할지는 운영체제가 결정하게 되는데,  
이 과정을 **스케줄링(Scheduling)** 이라고 한다.

단순히 시간을 나누는 것이 아니라, CPU 자원을 최대한 효율적으로 활용하기 위해  
다양한 최적화 기법을 적용해 스케줄링이 이루어진다.

### 멀티프로세싱 (Multi Processing)

위에서 설명한 멀티태스킹은 하나의 CPU가 여러 작업을 번갈아 수행하는 방식이었다.  
그런데 최근 컴퓨터나 노트북은 CPU 코어의 수가 많아지면서, 물리적으로 여러 개의 작업을 동시에 수행할 수 있게 되었다.  
이를 **멀티프로세싱**이라 한다.

따라서 멀티프로세싱 시스템은 하나의 CPU 코어만을 사용하는 시스템 보다 동시에 더 많은 작업을 효율적으로 처리할 수 있다.

#### 멀티태스킹 vs 멀티프로세싱

멀티태스킹은 **사람 혼자서** 여러 작업을 빠르게 처리하는 것이라면  
멀티프로세싱은 **사람 여러명**이 각각의 작업을 처리하는 것이다.

**멀티태스킹**

- 단일 CPU에서 여러 개의 작업을 동시에 처리하는 것
- 하나의 CPU가 여러 작업들을 번갈아가며 처리하므로, 여러 개의 작업이 동시에 수행되는 것처럼 보이게 함

**멀티프로세싱**

- 여러 CPU 코어가 동시에 작업을 처리하는 것
- 단일 CPU 코어만을 사용하는 것보다 동시에 더 많은 작업 처리 가능함
