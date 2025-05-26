---
title: "Pintos Project 2 : System Calls (1)"
date: 2025-05-25 23:04:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

Pintos Project 2의 `argument_passing` 구현에 이어서 `User Memory Access`파트로 왔다.  
이 부분은 시스템 콜 구현에 있어서 사용자 메모리 공간에 접근하는 방법을 안전하게 구현해야하는 파트이다.

### User Memory Access

시스템 콜을 구현하기 위해서는 사용자 가상 주소 공간의 데이터를 읽고 쓰는 방법을 제공해야한다.  
시스템 콜의 인자를 가져올 때는 이 기능이 꼭 필요하지 않다.  
하지만 시스템 콜 인자로 주어진 포인터에서 데이터를 **읽을 때**는 반드시 이 기능을 통해 프록시해야한다.  
이건 약간 까다로울 수 있다. 만약 사용자가 잘못된 포인터, 커널 메모리를 가리키는 포인터, 해당 영역 중 하나에 부분적으로 블록을 입력하면 어떻게 될까?  
이런 경우에는 해당 사용자 프로세스를 종료시켜야 한다.

참고 : [pintos_project2_introduction에서 Accessing User Memory 파트 부분](https://sihyun10.github.io/posts/pintos_project2_intro/#accessing-user-memory---%EC%82%AC%EC%9A%A9%EC%9E%90-%EB%A9%94%EB%AA%A8%EB%A6%AC%EC%97%90-%EC%A0%91%EA%B7%BC%ED%95%98%EA%B8%B0)

---

### System Calls

시스템 콜 인프라(기반 구조)를 구현해라.  
`userprog/syscall.c` 파일에 시스템 콜 핸들러를 구현하시오.  
우리가 제공하는 기본 구현은 프로세스를 종료하여 시스템 콜을 처리한다.  
시스템 콜 번호를 먼저 가져온 다음, 시스템 콜 인자들을 읽어오고, 알맞은 작업을 수행해야 한다.

#### System Call Details

첫번째 프로젝트에서는 운영체제가 사용자 프로그램으로부터 제어권을 다시 얻는 한 가지 방법인,  
타이머와 I/O 장치에서 발생하는 인터럽트를 다뤘었다.  
이러한 인터럽트는 CPU 외부의 장치에 의해 발생하므로 **외부 인터럽트**(`external interrupt`)라고 부른다.

운영체제는 프로그램 코드에서 발생하는 이벤트인 **소프트웨어 예외**(`software exception`)도 처리한다.  
예외는 **page fault**(페이지 폴트) 또는 **0으로 나누기** 같은 오류가 발생할 수 있다.  
예외는 사용자 프로그램이 운영체제에게 **시스템 콜**을 요청하는 수단이기도 한다!

전통적인 `x86` 아키텍처에서는 시스템 콜이 다른 소프트웨어 예외와 동일하게 처리되었다.  
그러나 `x86-64`에서는 제조사들이 시스템 콜 전용 명령어인 `syscall`을 도입했다.  
이것은 시스템 콜 핸들러를 빠르게 호출하는 방법을 제공한다.

요즘은 `x86-64`에서 시스템 콜을 호출하는 데에 `syscall` 명령어가 가장 일반적으로 사용된다.  
Pintos에서는 사용자 프로그램이 시스템 콜을 수행하기 위해 `syscall` 명령어를 호출한다.  
시스템 콜 번호와 추가 인자들은 일반적인 규칙에 따라 레지스터에 저장된 뒤, `syscall` 명령어를 호출해야한다.  
단, 예외 사항이 2가지 있다.

- `%rax`는 **시스템 콜 번호**이다.
- 4번째 인자는 `%rcx`가 아니라, `%r10`에 들어간다.

따라서 시스템 콜 핸들러인 `syscall_handler()`가 제어를 넘겨받을 때,  
시스템 콜 번호는 `rax`에 있고, 인자들은 `%rdi`, `%rsi`, `%rdx`, `%r10`, `%r8`, `%r9` 순서로 전달된다.

호출자의 레지스터 값들은 `struct intr_frame`을 통해 접근할 수 있다.  
(`struct intr_frame`은 커널 스택에 존재한다)

`x86-64`에서는 함수의 반환값을 `RAX` 레지스터에 저장하는 것이 관례이다.  
반환값이 있는 시스템 콜은 `struct intr_frame`의 `rax` 멤버를 수정해서 값을 반환할 수 있다.

---

### Implement the following system calls - 다음의 시스템 콜들을 구현해라!

유저 프로그램에서 시스템 콜을 사용할 수 있도록 정의된 인터페이스 헤더는 `include/lib/user/syscall.h` 여기에 정의되어있다.  
이 헤더 파일(그리고 `include/lib/user` 안의 다른 모든 헤더 파일들)은 유저 프로그램만을 위한 것이다.  
각각의 시스템 콜에 대한 고유한 번호는 `include/lib/syscall-nr.h` 파일에 정의되어있다.

### halt()

```c
void halt (void);
```

`power_off()`를 호출하여 Pintos를 종료한다.  
(이 함수는 `src/include/threads/init.h`에 선언되어 있다.)  
이 함수는 가능한 한 거의 사용하지 않아야 한다.  
왜냐하면 이를 호출하면 데드락(교착 상태)과 같은 문제 상황에 대한 정보를 잃게 될 수 있기 때문이다.

#### **[구현]**

```c
#include "threads/init.h" // power_off() 사용하기 위해

void halt(void)
{
  power_off();
}
```

```c
// syscall_handler()에 추가
  case SYS_HALT:
    halt();
    break;
```

---

### exit()

```c
void exit (int status);
```

현재 실행 중인 유저 프로그램을 종료시키고,  
`status` 값을 커널에 반환한다.  
만약 이 프로세스의 부모가 자식의 종료를 기다리고 있다면,  
해당 부모는 이 `status` 값을 반환받게 된다.  
관례적으로 `0`은 성공을, **0이 아닌 값**은 에러를 나타낸다.

#### **[구현]**

`exit_status`를 `thread` 구조체에 필드로 추가해준다.  
자식 프로세스가 종료된 뒤, 종료 상태를 부모 프로세스에게 알려야 하기 때문이다.

```c
// include/threads/thread.h
#ifdef USERPROG
  /* Owned by userprog/process.c. */
  uint64_t *pml4; /* Page map level 4 */
  int exit_status;
```

```c
void exit(int status)
{
  struct thread *curr = thread_current();
  curr->exit_status = status;
  printf("%s: exit(%d)\n", curr->name, curr->exit_status);
  thread_exit();
}
```

현재 실행 중인 스레드(프로세스)를 가져온 후에  
종료 상태 코드를 현재 스레드에 저장한다.  
종료 로그 출력하고, 현재 스레드(프로세스)를 종료한다.

```c
// syscall_handler()에 추가
  case SYS_EXIT:
    exit((int)f->R.rdi);
    break;
```

---

### create()

```c
bool create (const char *file, unsigned initial_size);
```

`file`이라는 이름의 새로운 파일을 생성하며, 이 파일의 초기 크기는 `initial_size` 바이트이다.  
파일 생성에 성공하면 `true`를 반환하고, 실패하면 `false`를 반환한다.  
파일을 새로 생성하는 작업은 파일을 여는 작업과는 다르다.  
새로 생성된 파일을 열기 위해서는 별도의 `open` 시스템 콜을 호출해야한다.

#### **[구현]**

```c
#include "filesys/filesys.h"
#include "threads/vaddr.h"

static void check_address(const void *addr)
{
  if (is_kernel_vaddr(addr) || addr == NULL)
    exit(-1);

  if (pml4_get_page(thread_current()->pml4, addr) == NULL)
    exit(-1);
}

bool create(const char *file, unsigned initial_size)
{
  check_address(file);
  return filesys_create(file, initial_size);
}
```

`create()` 시스템 콜은 사용자 프로그램이 요청한 이름, 크기로 새로운 파일을 생성하는 기능이다.  
`check_address()`으로 확인한 뒤, 파일을 생성한다.

- `check_address(const void *addr)`
  - 커널 주소인지 체크
  - 주소가 NULL인지 체크
  - 현재 프로세스의 페이지 테이블에 매핑되어있는지 확인

```c
// syscall_handler()에 추가
  case SYS_CREATE:
    f->R.rax = create(f->R.rdi, f->R.rsi);
    break;
```

#### (참고)

```c
int process_wait(tid_t child_tid UNUSED)
{
  for (int i = 0; i < 600000000; i++)
  {
  }
  return -1;
}
```

`500000000` ➔ `600000000`으로 숫자를 증가시켰다.  
부모 프로세스가 자식 프로세스가 완전히 종료되기 전에 먼저 죽을 수 있기에  
여유로운 시간을 제공해주어야하는데, `500000000`은 숫자가 적었나보다.  
이렇게 바꿔주니 테스트 통과가 되었다.

---

### remove()

```c
bool remove (const char *file);
```

`file`이라는 이름의 파일을 삭제한다.  
삭제에 성공하면 `true`를, 실패하면 `false`를 반환한다.  
파일이 열려 있든 닫혀 있든 관계없이 삭제가 가능하다.  
열려 있는 파일을 삭제해도, 그 파일을 즉시 닫지는 않는다.

> 🧐 **열린 파일이 삭제되면 어떤 일이 발생할까?**
>
> - 파일에 대해 표준 Unix 의미론(동작 방식)을 구현해야 한다
> - 어떤 파일이 삭제되더라도 그 파일에 대한 파일 디스크립터를 이미 가지고 있는 프로세스는  
>   **계속 그 디스크립터를 사용**할 수 있다
> - 즉, 해당 프로세스는 그 파일에 계속해서 읽기나 쓰기 작업을 할 수 있다
> - 파일은 이름을 잃게 되고, 다른 프로세스는 더 이상 그 파일을 열 수 없게 된다
> - 하지만 그 파일을 가리키는 모든 파일 디스크립터가 닫히거나, 시스템이 종료될 때까지,  
>    해당 파일은 계속 존재한다
>   {: .prompt-tip }

#### **[구현]**

```c
bool remove(const char *file)
{
  check_string(file);
  return filesys_remove(file);
}
```

`remove()` 시스템 콜은 주어진 **이름**의 파일을 찾아서 제거한다.  
실제 삭제되는건 아니다!

```c
// syscall_handler()에 추가
  case SYS_REMOVE:
    f->R.rax = remove(f->R.rdi);
    break;
```
