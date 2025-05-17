---
title: "Pintos Project 2 : introduction"
date: 2025-05-17 23:03:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

카이스트 핀토스 과제 : [Project 2 : introduction](https://casys-kaist.github.io/pintos-kaist/project2/introduction.html)  
이 사이트에 작성된 내용을 바탕으로 작성한 글입니다.

---

### Project 2 : User programs

기본 코드에서는 이미 `user programs`을 불러오고 실행하는 기능은 있지만, **I/O**(입출력)이나 상호작용은 아직 불가능하다.  
이번 프로젝트의 핵심은, `user programs`이 **시스템 콜**(System Calls)을 통해 OS와 상호작용할 수 있도록 할 것이다!  
주요 작업 디렉터리는 `userprog` 폴더지만, Pintos의 거의 모든 다른 부분과도 상호작용하게 될 것이다.

**project 2는 project 1 위에 구현되어야 한다**  
`project 1`의 코드가 `project 2`의 코드에 영향을 미치지 않지만, `project 1`의 테스트는 여전히 모두 통과해야한다.

또한 `project 2`에서 추가적인 도전 과제가 있다. (선택적인 구현)  
이 추가 과제는 `skeleton code`가 제공되지 않고, `test cases`만 제공된다.  
추가 과제를 테스트하려면 `userprog/Make.vars` 파일을 수정해야 한다.

마지막으로 주석에 `TODO`가 없다 하더라도, 그 코드가 수정 불가능하다는 것은 아니다.  
필요하다면 어떤 코드든 자유롭게 수정할 수 있다. (테스트 코드 제외)

---

### Background

지금까지 `Pintos`위에서 실행한 모든 코드는 운영 체제 커널의 일부였다.  
이전 과제의 테스트 코드도 모두 `kernel` 안에서 실행되었기 때문에, 시스템의 `privileged Area`에 접근할 수 있었다.  
운영체제 위에 `user programs`을 실행하기 시작하면 더 이상 사실이 아니다.

**여러 개의 프로세스**가 동시에 실행될 수 있다.  
단, 하나의 프로세스는 하나의 스레드만 가질 수 있고, 멀티 스레드는 지원하지 않는다.

`user programs`는 "내가 컴퓨터 전체를 사용하는 것처럼" 착각하게 만들어야 한다.  
따라서 여러 프로세스를 동시에 실행할 때, 메모리, 스케줄링, 상태 등을 잘 관리하여,  
`user programs`이 자기만의 독립적인 공간을 가진 것처럼 착각하도록 만들어야 한다.

`project 1`에서는 테스트 코드를 커널에 직접 컴파일했기 때문에, 커널 내의 특정 함수 인터페이스를 요구해야했다.  
이제부터는 `user programs`를 실행해서 `OS`를 테스트 할 것이다.  
이렇게 하면 훨씬 더 자유롭게 테스트 할 수 있다.

단, `user program` 인터페이스는 명세대로 맞춰야 하고, 그 외의 커널 코드는 자유롭게 구조를 바꾸거나 새로 작성해도 된다.

▶︎ **VM(가상 메모리) 관련 지시사항**

- 우리 코드는 절대 `#ifdef VM` 안에 작성하면 안됨
- `#ifdef VM` 블록은 **Project 3**에서 가상 메모리 서브시스템을 구현할 때 활성화될 예정
- `#ifdef VM`에 감싸진 코드는 **Project 3**에서 제외될 것이므로, VM이 없을때만 작동하는 코드이다.

본격적인 구현 전에 반드시 **동기화(Synchronization)** 와 **가상 주소(Virtual Address)** 관련 내용을 먼저 읽어봐라.  
➔ [동기화](https://casys-kaist.github.io/pintos-kaist/appendix/synchronization.html), [가상 주소](https://casys-kaist.github.io/pintos-kaist/appendix/virtual_address.html)

---

### Source Files

앞으로 진행하게 될 프로그래밍의 개요를 파악하는 가장 쉬운 방법은 작업하게 될 각 부분을 살펴보는 것입니다.  
`userprog` 디렉터리에는 파일 수는 적지만, 우리가 해야 할 대부분의 작업이 이곳에 집중되어 있다.

- `process.c`, `process.h`
  - `ELF` 바이너리를 로드하고 프로세스를 시작하는 코드
- `syscall.c`, `syscall.h`
  - 사용자 프로세스가 커널 기능에 접근하려고 할 때마다 시스템 콜을 호출해야 한다
  - 이는 `skeleton system call handler`이다.
  - 현재는 메시지를 출력하고 사용자 프로세스를 종료한다.
  - 이 프로젝트의 `part 2`에서는 시스템 콜에 필요한 다른 모든 작업을 수행하기 위해 코드를 추가할 예정
- `syscall-entry.S`
  - 시스템 콜 핸들러를 `bootstrap`하는 작은 어셈블리 코드
  - (이 코드를 이해할 필요 없음)
- `exception.c`, `exception.h`
  - 사용자 프로세스가 권한이 있거나 금지된 작업을 수행하면 커널에 `exception` 또는 `fault`로 커널에 `trap`된다.
  - 이 파일들은 예외를 처리한다.
  - 현재 모든 예외는 단순히 메시지를 출력하고 프로세스를 종료한다.
  - `Project 2`에서는 일부 경우 `page_fault()`함수를 수정할 수 있다.
- `gdt.c`, `gdt.h`
  - x86-64 구조는 세그먼트 기반이고, GDT는 사용중인 세그먼트를 정의하는 테이블이다
  - 이 파일은 GDT를 설정하며, 어떤 프로젝트에서도 우리가 이 파일을 수정할 필요는 없다
  - GDT 작동 방식에 관심이 있다면 코드를 읽어봐라
- `tss.c`, `tss.h`
  - `Task-State Segment`(TSS)는 x86 아키텍처에서 `task switching`에 사용됨
  - 하지만 x86-64에서 `task switching`이 더 이상 사용되지 않는다
  - 그래도 `TSS`는 `ring switching` 중에 스택 포인터를 찾기 위해 여전히 필요하다
  - 즉 사용자 프로세스가 인터럽트 핸들러에 들어가면, 하드웨어는 `tss`를 통해 커널 스택 포인터를 찾는다
  - 어떤 프로젝트에서도 이 파일을 수정할 필요 없다!

---

### Using the File System

이번 프로젝트에서는 `file system` 코드와 연동해야 한다.  
그 이유는 사용자 프로그램이 `file system`으로부터 로드되며,  
우리가 구현해야 할 많은 시스템 콜들이 `file system`과 관련되어있기 때문이다.

하지만 이번 프로젝트의 초점은 `file system`이 아니다!  
그래서 우리는 `filesys` 디렉터리에 간단하지만 완전한 기능을 갖춘 `file system`을 미리 제공해두었다.  
`filesys.h`, `file.h` 인터페이스를 확인해보아야하며,  
이를 통해 `file system`을 어떻게 사용하는지, 어떤 제약 사항이 존재하는지를 특히 잘 이해할 필요가 있다.

**이번 프로젝트에선 `file system`을 수정할 필요가 전혀 없다** (권장하지 않음)

지금 `file system` 루틴을 적절히 사용하는 방법을 익혀두면,  
`project 4`에서 파일 시스템을 직접 개선해야 할 때 훨씬 수월해질 것이다.

그때까지는 아래의 제약 사항들을 견뎌야한다:

#### 1. 내부 동기화가 없다 (`No internal synchronization`)

- 파일 시스템 자체에는 동기화가 구현되어 있지 않다
- 여러 프로세스가 동시에 접근하면 충돌이 발생할 수 있다
- 따라서 한 번에 하나의 프로세스만 파일 시스템 코드를 실행하도록 **동기화를 구현**해야 한다.

#### 2. 파일 크기는 생성 시점에 고정된다 (`File size is fixed at creation time`)

- 루트 디렉터리도 하나의 파일로 표현되므로, 생성할 수 있는 파일의 수 또한 제한적이다.

#### 3. 파일 데이터는 단일 범위로 할당된다 (`File data is allocated as a single extent`)

- 하나의 파일에 대한 데이터는 디스크 상의 연속된 영역에 저장된다
- 파일 시스템이 시간이 지남에 따라 외부 단편화가 심각한 문제가 될 수 있다

> **외부 단편화** (External Fragmentation) 란?
>
> - 남아있는 총 메모리 공간이 프로세스가 요청한 메모리 공간보다 크지만,  
>   남아있는 공간이 연속적이지 않아 사용할 수 없는 경우
> - 쪼개진 메모리 공간을 사용할 수 없어서 메모리 낭비가 발생한다

#### 4. 하위 디렉터리가 없다 (`No subdirectories`)

#### 5. 파일 이름은 최대 14자까지로 제한된다 (`File names are limited to 14 characters`)

#### 6. 시스템 충돌이 발생하면 디스크가 자동으로 복구할 수 없는 방식으로 손상될 수 있다.

- 게다가 파일 시스템 복구 도구도 제공되지 않는다

<br>

중요한 기능 중 하나가 포함되어 있다.

- 유닉스 계열의 의미 체계가 `filesys_remove()`로 구현되어 있다.
- 즉, 열려 있는 파일이 삭제되더라도, 그 파일을 열고 있는 스레드가 있는 한, 해당 파일은 계속 접근 가능하다.
- 모든 스레드가 해당 파일을 닫을 때까지 디스크 블록은 해제되지 않는다.
- 자세한 내용은 [Removing an Open File](https://casys-kaist.github.io/pintos-kaist/project2/FAQ.html) 항목을 참고해라!

> 🧐 **열린 파일이 삭제되면 어떤 일이 발생할까?**
>
> - 파일에 대해 표준 Unix 의미론(동작 방식)을 구현해야 한다
> - 어떤 파일이 삭제되더라도 그 파일에 대한 파일 디스크립터를 이미 가지고 있는 프로세스는  
>   계속 그 디스크립터를 사용할 수 있다
> - 즉, 해당 프로세스는 그 파일에 계속해서 읽기나 쓰기 작업을 할 수 있다
> - 파일은 이름을 잃게 되고, 다른 프로세스는 더 이상 그 파일을 열 수 없게 된다
> - 하지만 그 파일을 가리키는 모든 파일 디스크립터가 닫히거나, 시스템이 종료될 때까지,  
>   해당 파일은 계속 존재한다
{: .prompt-tip }

---

`project 1`에서 모든 테스트 프로그램이 커널 이미지에 이미 존재했던 것과 달리,  
사용자 공간(`user space`)에서 실행되는 테스트 프로그램을 Pintos 가상 머신에 직접 넣어야 한다.

우리가 제공하는 테스트 스크립트(예: `make check`)가 이 작업을 자동으로 처리해준다.  
따라서 대부분의 경우, 이를 이해할 필요가 없다.  
하지만 이 부분을 이해하고 있다면 개별 테스트 케이스를 실행할 때 큰 도움이 될 것이다.

Pintos 가상 머신에 파일을 넣으려면, 먼저 파일 시스템 파티션이 있는 `simulated disk`를 생성할 수 있어야한다.  
`pintos-mkdisk` 프로그램은 이 기능을 제공한다.  
`userprog/build` 디렉터리에서 `pintos-mkdisk filesys.dsk 2`를 실행한다.  
이 명령어는 `filesys.dsk`라는 이름의 2MB 크기의 Pintos 파일 시스템 파티션이 포함된 `simulated disk`를 생성한다.  
그 다음, `pintos` 명령어 뒤에 `--fs-disk filesys.dsk`를 넣어서 디스크를 지정해야한다.  
(단, 이 옵션은 반드시 `--`앞에 위치해야 한다.)

- 예 : `pintos --fs-disk filesys.disk --KERNEL_COMMANDS...`

`--`는 꼭 넣어야 하는데, 그 이유는 `--fs-disk`는 pintos 스크립트를 위한 것이지, 시뮬레이션 커널에 전달되는 옵션이 아니기 때문이다.

이후에는 커널 명령어 라인에 `-f -q`를 전달하여 파일 시스템 파티션을 포맷해야한다.

- 예 : `pintos SCRIPT_COMMANDS -- -f -q`

`-f` 옵션은 파일 시스템이 포맷되고,  
`-q` 옵션은 포맷이 완료되면 즉시 Pintos를 종료(`exit`) 하도록 만든다.

<br>

시뮬레이션된 파일 시스템의 안쪽과 바깥에 파일을 복사하는 방법이 필요하다.  
이를 위해 `pintos -p`(put)와 `-g`(get) 옵션을 사용한다.  
`file`을 Pintos 파일 시스템 안으로 복사하려면, `pintos -p file -- -q` 명령어를 사용해라.  
만약 이 파일을 새 이름 `newname`으로 저장하고 싶다면, 원래 파일명 뒤에 `:newname`을 붙여서 아래와 같이 실행해라.

- `pintos -p file:newname -- -q`

파일을 VM에서 꺼내올 때는, 위와 거의 같은 명령을 사용하되, `-p`대신 `-g`를 사용하면 된다.

- 예 : `pintos -g filename -- -q`

참고로, 이 명령어들은 커널 명령어에 `extract`와 `append`라는 특수 명령을 전달하고,  
"scratch"라는 특수한 가상 파티션을 통해 파일을 복사하는 방식으로 동작한다.  
혹시 자세한 구현 방식이 궁금하다면?  
`pintos` 스크립트와 `filesys/fsutil.c` 파일을 보면 이 기능이 내부적으로 어떻게 구현되어있는지 알 수 있다.

<br>

파일 시스템 파티션이 있는 디스크를 만들고, 파일 시스템을 포맷하고,  
이 프로젝트의 2번째 테스트 케이스인 `args-single` 프로그램을 새로운 디스크에 복사한 다음,  
이 프로그램을 인자 `onearg`와 함께 실행하는 전체 과정을 요약한 것이다.  
(단, 인자 전달 기능은 직접 구현하기 전까지는 작동하지 않는다)  
이미 테스트 케이스들은 빌드했고, 현재 디렉터리는 `userprog/build`라고 가정하자.

```
pintos-mkdisk filesys.dsk 10
pintos --fs-disk filesys.dsk -p tests/userprog/args-single:args-single -- -q -f run 'args-single onearg'
```

▶︎ **정리**

- `pintos-mkdisk filesys.dsk 10`
  - `filesys.dsk`라는 이름의 10MB 가상 디스크 파일을 생성함
  - 이 안에 Pintos용 파일 시스템 파티션이 생성된다
- `pintos --fs-disk filesys.dsk -p tests/userprog/args-single:args-single -- -q -f run 'args-single onearg'`
  - `--fs-disk filesys.dsk` : 위에서 만든 디스크를 사용하겠다는 뜻
  - `-p tests/userprog/args-single:args-single`
    - `tests/userprog/args-single` 파일을 가상 파일 시스템 안에 `args-single`이라는 이름으로 복사함
  - `-- -q -f` : `-f` 파일 시스템 포맷, `-q` 포맷 후 즉시 종료
  - `run 'args-single onearg'`
    - 프로그램 `args-single`을 인자 `onearg`와 함께 실행함
    - 단, 인자 전달 기능을 아직 구현하지 않았다면 작동하지 않음

만약 파일 시스템 디스크 파일(`filesys.dsk`)을 따로 보관하거나 나중에 살펴볼 생각이 없다면,
위의 4단계를 한 줄의 명령어로도 실행할 수 있다.  
`--filesys-size=n` 옵션은 약 nMB 크기의 임시 파일 시스템 파티션을 만들어  
Pintos 실행 도중에만 사용하고, 실행이 끝나면 자동으로 삭제된다.  
Pintos의 자동 테스트 `suite`도 이 방식을 많이 사용한다.

```
pintos --fs-disk=10 -p tests/userprog/args-single:args-single -- -q -f run 'args-single onearg'
```

---

### How User Programs Work - 사용자 프로그램이 어떻게 작동하는가

Pintos는 메모리에 적합하고 구현한 시스템 콜만 사용하는 한 일반적인 C 프로그램을 실행할 수 있다.  
특히, `malloc()`은 구현할 수 없다.  
왜냐하면 이 프로젝트에서 요구하는 시스템 콜 중 어느것도 메모리를 동적으로 할당하는 기능이 없기 때문이다.  
또한, Pintos는 부동 소수점(`floating point`) 연산을 사용하는 프로그램도 실행할 수 없다.  
커널이 스레드를 전환할 때, 프로세서의 부동 소수점 단위를 저장하고 복원하지 않기 때문이다.

Pintos는 `userprog/process.c`에 있는 로더(`loader`)를 이용해, ELF 실행 파일을 로드할 수 있다.  
ELF는 리눅스, `Solaris` 및 기타 여러 운영체제에서 객체파일, 공유 라이브러리 및 실행 파일에 사용되는 파일 포맷이다.

실제로 x86-64 ELF 실행 파일을 출력하는 어떤 컴파일러와 링커를 사용하여 Pintos용 프로그램을 생성할 수 있다.  
(우리는 잘 작동하는 컴파일러와 링커를 제공했다.)  
테스트 프로그램을 `simulated` 파일 시스템에 복사하기 전까지는 Pintos가 유용한 작업을 수행하지 못한다는 점을 깨달아야한다. 다양한 프로그램들을 파일 시스템에 복사하기 전까지는 흥미로운 작업을 수행할 수 없다.

디버깅을 하다보면 `filesys.dsk` 파일이 손상되거나 쓸모없게 될 수도 있으므로,  
처음 상태의 깨끗한 파일 시스템 디스크를 미리 만들어두고 필요할 때마다 복사해서 사용하는 것이 좋다.

---

### Virtual Memory Layout

Pintos에서 가상 메모리는 두 영역으로 나뉜다.  
: **사용자 가상 메모리**(`user virtual memory`), **커널 가상 메모리**(`kernel virtual memory`)

**사용자 가상 메모리**는 가상 주소 0부터 `KERN_BASE`까지의 범위를 가진다.  
`include/threads/vaddr.h`에 정의되어 있으며, 기본값은 `0x8004000000`이다.  
**커널 가상 메모리**는 나머지 가상 주소 공간을 차지한다.

**사용자 가상 메모리**는 프로세스마다 독립적으로 존재한다.  
커널이 하나의 프로세스에서 다른 프로세스로 전환할 때,  
프로세서의 페이지 디렉터리 베이스 레지스터를 변경함으로써 사용자 가상 주소 공간도 함께 전환된다.  
(참고: `thread/mmu.c`의 `pml4_activate()` 함수를 봐라)  
`struct thread` 구조체는 해당 프로세스의 페이지 테이블을 가리키는 포인터를 가지고 있다.

**커널 가상 메모리**는 전역적이다.  
어떤 사용자 프로세스나 커널 스레드가 실행 중이든 항상 동일한 방식으로 매핑된다.  
Pintos에서 커널 가상 메모리는 `KERN_BASE`에서 시작하여 물리 메모리와 1:1로 매핑된다.  
즉, 가상 주소 `KERN_BASE`는 물리 주소 0에 접근하고,  
가상 주소 `KERN_BASE + 0x1234`는 물리 주소 `0x1234`에 접근하며,  
이런 식으로 시스템의 물리 메모리 크기만큼 매핑된다.

사용자 프로그램은 자신의 사용자 가상 메모리에만 접근할 수 있다.  
커널 가상 메모리에 접근을 시도하면 `page fault`가 발생하며,  
이는 `userprog/exception.c`의 `page_fault()`함수에 의해 처리되고, 프로세스는 종료된다.  
(사용자가 커널 영역을 침범하면 강제로 죽는거다)

커널 스레드는 커널 가상 메모리뿐만 아니라, 실행 중인 사용자 가상 메모리에도 접근할 수 있다.  
하지만 커널에서도 매핑되지 않은 사용자 가상 주소에 접근하면 `page fault`가 발생한다.  
(커널이라 해도 존재하지 않는 주소는 접근할 수 없다는 의미이다)

---

### Typical Memory Layout - 일반적인 메모리 레이아웃

개념적으로, 각 프로세스는 사용자 가상 메모리를 자유롭게 원하는 방식으로 배치할 수 있다.  
하지만 실제로는 사용자 가상 메모리는 아래와 같은 방식으로 배치된다.

```
USER_STACK +----------------------------------+
           |             user stack           |
           |                 |                |
           |                 |                |
           |                 V                |
           |           grows downward         |
           |                                  |
           |                                  |
           |                                  |
           |                                  |
           |           grows upward           |
           |                 ^                |
           |                 |                |
           |                 |                |
           +----------------------------------+
           | uninitialized data segment (BSS) |
           +----------------------------------+
           |     initialized data segment     |
           +----------------------------------+
           |            code segment          |
 0x400000  +----------------------------------+
           |                                  |
           |                                  |
           |                                  |
           |                                  |
           |                                  |
       0   +----------------------------------+
```

이 프로젝트에서는 사용자 스택의 크기가 고정되어 있지만,  
`project 3`에서는 크기가 커질 수 있도록 허용된다.  
일반적으로 BSS 영역(초기화되지 않은 데이터 세그먼트)은 시스템 콜로 크기를 조절할 수 있지만,  
이번 프로젝트에서는 해당 기능을 구현할 필요는 없다.

Pintos의 code segment는 가상 주소 `0x400000` (약 4MB) 지점에서 시작한다.  
이 값은 Ubuntu에서 일반적으로 사용되는 값이며 큰 의미는 없다.

`linker`는 다양한 프로그램 세그먼트의 이름과 위치를 알려주는 "linker script"의 지시에 따라  
메모리에 사용자 프로그램의 레이아웃을 설정한다.  
"linker script"에 대해 더 알고 싶다면 `info ld` 명령어로 링커 메뉴얼의 "Scripts" 챕터를 참고해라.

특정 실행 파일의 레이아웃을 보려면 `-p` 옵션을 사용해 `odjdump`를 실행한다.

---

### Accessing User Memory - 사용자 메모리에 접근하기

시스템 콜을 수행할 때, 커널은 종종 사용자 프로그램이 제공하는 포인터를 통해 메모리에 접근해야한다.  
이 과정에서 커널은 매우 조심해야 한다.  
왜냐하면 사용자가 `null pointer`, 매핑되지 않은 가상 메모리 포인터, 또는 커널 가상 주소 공간 포인터를 전달할 수 있기 때문이다. 이러한 모든 잘못된 포인터는 커널이나 다른 실행중인 프로세스에 해를 끼치지 않고 거부되어야 하며, 해당 프로세스는 종료되고 그 자원은 회수되어야 한다.

이를 안전하게 처리하는 방법은 최소 2가지가 있다.

#### 첫 번째 방법

사용자가 제공한 포인터가 유효한지 먼저 확인한 뒤, 그 포인터를 역참조(`dereference`)하는 것이다.  
만약 이 방법을 선택했다면, `thread/mmu.c` 파일과 `include/threads/vaddr.h` 파일 안에 있는 함수들을 참고해라.  
이 방식은 가장 간단한 사용자 메모리 접근 방식이다.

#### 두 번째 방법

사용자 포인터가 **KERN_BASE**보다 아래를 가리키는지 확인한 후, 바로 역참조 하는 방식이다.  
이 방법에서는 유효하지 않은 사용자 포인터가 있을 경우 `page fault`가 발생하며,  
그걸 `userprog/exception.c`의 `page_fault()` 함수를 수정해서 처리해야한다.  
이 방식은 프로세서의 MMU를 활용하기 때문에 일반적으로 더 빠르며,  
리눅스를 포함한 실제 커널에서 주로 사용된다.

<br>

어느 경우든 리소스 누수(`leak`)가 없도록 주의해야 한다.  
예를 들어, 시스템 콜이 `lock`을 획득하거나 `malloc()`으로 메모리를 할당했다고 가정해보자.  
그 이후에 유효하지 않은 사용자 포인터를 만나더라도 락을 반드시 해제하거나 메모리 페이지를 해제해야한다.  
만약 역참조(`dereferencing`)하기 전에 사용자 포인터의 유효성을 검사하는 방법을 선택한다면,  
이 작업은 비교적 간단할 것이다.  
유효하지 않은 포인터로 인해 `page fault`가 발생하면  
메모리 접근에서 에러 코드를 반환할 방법이 없기에 처리하기가 더 어렵다.

그래서 두 번째 방법을 사용하고 싶다면 도움이 되는 코드를 제공하겠다.  
(`page fault` 상황에서도 안전하게 메모리 접근 가능하게 해줌)

```c
/* Reads a byte at user virtual address UADDR.
 * UADDR must be below KERN_BASE.
 * Returns the byte value if successful, -1 if a segfault
 * occurred. */
static int64_t
get_user (const uint8_t *uaddr) {
    int64_t result;
    __asm __volatile (
    "movabsq $done_get, %0\n"
    "movzbq %1, %0\n"
    "done_get:\n"
    : "=&a" (result) : "m" (*uaddr));
    return result;
}

/* Writes BYTE to user address UDST.
 * UDST must be below KERN_BASE.
 * Returns true if successful, false if a segfault occurred. */
static bool
put_user (uint8_t *udst, uint8_t byte) {
    int64_t error_code;
    __asm __volatile (
    "movabsq $done_put, %0\n"
    "movb %b2, %1\n"
    "done_put:\n"
    : "=&a" (error_code), "=m" (*udst) : "q" (byte));
    return error_code != -1;
}
```

- `get_user()` 함수
  - 사용자 가상 주소 `UADDR`에서 1바이트를 읽는다
  - `UADDR`은 `KERN_BASE`보다 작아야한다
  - 성공하면 `바이트 값`을 반환, 실패하면 `-1`을 반환
- `put_user()` 함수
  - 사용자 주소 `UDST`에 바이트 값을 쓴다
  - `UDST`는 `KERN_BASE`보다 작아야한다
  - 성공하면 `true`를 반환, 실패 시 `false`를 반환

이 함수들은 모두 사용자 주소가 이미 `KERN_BASE` 아래라고 가정한다.  
또한, 커널에서 `page fault`가 발생했을 때, `rax = -1`로 설정하고,  
이전 값을 `%rip`로 복사하도록 `page_fault()`함수를 수정했다고 가정한다.
