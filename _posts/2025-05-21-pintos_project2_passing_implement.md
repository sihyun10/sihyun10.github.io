---
title: "[구현] Pintos Project 2 : Argument Passing"
date: 2025-05-21 10:54:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

과제 설명은 이 [링크](https://sihyun10.github.io/posts/pintos_project2_argument_passing/)에 정리해 두었다.  
그럼 이제 `Argument Passing` 기능 구현해나가보자!

### 목표

유저 프로그램 실행 시 인자로 전달되는 문자열을 유저 프로그램에 전달하는 기능이다.

- 커맨드 라인 파싱
  - `strtok_r()`을 이용해 공백 기준으로 문자열 분리
  - 프로그램 이름(`argv[0]`)과 인자(`argv[1], ...`) 분리
  - 인자를 스택에 삽입
- `hex_dump` 호출로 스택 상태 디버깅 하기

---

🧐 `Argument Passing`을 구현하기 전에 **Pintos**는 유저 프로그램을 어떻게 실행하는지 알아보자.

### 유저 프로그램 실행 흐름

유저가 `run args-single onearg`처럼 프로그램과 인자를 전달했을 때,  
**Pintos** 내부에서 어떤 함수들이 호출되고, 어떤 흐름으로 `argument`가 전달되는지 알아보자.

**main** 프로그램의 일부분 코드를 보면 `run_actions()`  
여기서부터 유저 프로그램이 실행된다.

```c
// threads/init.c
/* Pintos main program. */
int
main (void) {
  /* Run actions specified on kernel command line. */
  run_actions (argv);
}
```

이 흐름을 따라가보자.

```c
// threads/init.c/run_actions(char **argv)
static const struct action actions[] = {
  {"run", 2, run_task},
  // ... 생략
};
```

`"run"` 명령이 들어오면, 최소 2개의 인자 (`"run"` + `"프로그램 이름"`)가 있는지 검증한 뒤,  
해당 유저 프로그램을 실행하기 위해 `run_task()`함수가 호출된다.

```c
// threads/init.c
/* Runs the task specified in ARGV[1]. */
static void
run_task (char **argv) {
  const char *task = argv[1]; //실행할 프로그램 이름을 argv[1]에서 가져온다

  printf ("Executing '%s':\n", task);
#ifdef USERPROG
  if (thread_tests){
    run_test (task);
  } else {
    process_wait (process_create_initd (task));
  }
#else
  run_test (task);
#endif
  printf ("Execution of '%s' complete.\n", task);
}
```

`run_task()`함수는 실제로 커맨드라인에서 입력받은 유저 프로그램 실행 요청을 수행하는 핵심 진입점이다.

`run_task()`함수는 `argv[1]`에서 실행할 유저 프로그램의 이름을 가져와서  
`process_create_initd()`을 통해 유저 프로그램을 위한 커널 스레드를 생성한다.

```c
// userprog/process.c
tid_t process_create_initd(const char *file_name)
{
  char *fn_copy;
  tid_t tid;

  /* Make a copy of FILE_NAME.
   * Otherwise there's a race between the caller and load(). */
  fn_copy = palloc_get_page(0);
  if (fn_copy == NULL)
    return TID_ERROR;
  strlcpy(fn_copy, file_name, PGSIZE);

  /* Create a new thread to execute FILE_NAME. */
  tid = thread_create(file_name, PRI_DEFAULT, initd, fn_copy);
  if (tid == TID_ERROR)
    palloc_free_page(fn_copy);
  return tid;
}
```

`file_name`이라는 문자열을 기반으로, 유저 프로그램을 실행하는 스레드를 생성한다.

- 문자열 복사
  - `file_name`을 `fn_copy`라는 새 공간에 복사한다
  - 나중에 스레드가 이 문자열을 사용할 수 있도록 메모리 한 페이지를 따로 확보해주는거다
- 스레드 만들기
  - `thread_create()`를 호출해서 새로운 스레드를 하나 만든다
  - 이 스레드는 `initd()`함수에서 시작하고, 복사해둔 문자열을 들고 시작
- 결과 반환
  - 새로 만든 스레드의 ID를 반환

진짜 유저 프로그램 실행은 `initd()` 함수부터 시작된다고 보면 된다.

```c
// userprog/process.c
static void
initd(void *f_name)
{
#ifdef VM
  supplemental_page_table_init(&thread_current()->spt);
#endif

  process_init();

  if (process_exec(f_name) < 0)
    PANIC("Fail to launch initd\n");
  NOT_REACHED();
}
```

`process_exec()`는 유저 프로그램을 로딩하고 실행하는 함수이다.  
여기서부터 ELF파일을 로딩하고, 유저 스택을 생성하며, `argument`도 전달할 준비를 한다.  
정상적으로 실행되면 현재 커널 스레드는 유저 프로그램으로 전환된다.

> **유저 프로그램 실행 흐름 요약**
>
> `main()` ➔ `run_actions()` ➔ `run_task()` ➔ `process_create_initd()` ➔ `thread_create()` ➔ `initd()` ➔ `process_exec()`

```c
// userprog/process.c
int
process_exec (void *f_name) {
  /* And then load the binary */
  success = load (file_name, &_if);
}
```

현재는 `f_name`에 `"args-single hello pintos"`와 같이 전체 문자열이 전달되고 있는데,  
`load()`함수는 실제로 실행 파일 이름(`"args-single"`)만 필요하다.  
`strtok_r()`함수를 활용해 파일 이름만 추출해서 `load()`에 넘겨주어야한다.

<br>

### 구현 아이디어

`file_name`에서 프로그램 이름과 인자들을 `strtok_r()`로 분리하고,  
프로그램 이름은 `load()`에 전달한 다음에  
나머지 인자들은 스택 위에 `argv` 형태로 push 하여 인자 전달을 구현해야한다.

---

### 1단계 : Argument Parsing (인자 분리) - `strtok_r()` 활용

```c
// 1. file_name 복사본 할당
char *fn_copy = palloc_get_page(0);
if (fn_copy == NULL)
  return -1;

strlcpy(fn_copy, file_name, PGSIZE);

// 2. 토큰 분리 (strtok_r)
char *argv[64];
int argc = 0;
char *save_ptr;
char *token = strtok_r(fn_copy, " ", &save_ptr);
if (token == NULL)
{
  palloc_free_page(fn_copy);
  return -1;
}
argv[argc++] = token;

while ((token = strtok_r(NULL, " ", &save_ptr)) != NULL)
  argv[argc++] = token;
```

`strtok_r()`를 활용해 공백 `" "`을 기준으로 문자열을 분리한다.  
첫 번째 토큰은 프로그램 이름이므로 `argv[0]`에 저장한다.  
나머지 값들은 순서대로 `argv[1], argv[2], ...`에 저장되어 전체 인자 배열이 만들어진다.  
`argc`를 선언하여 총 인자 개수도 저장시킨다.

```
file_name = args-single hello pintos
```

- argv[0] : `"args-single"` (실행할 프로그램 이름)
- argv[1] : `"hello"`
- argv[2] : `"pintos"`
- argc : 3

### 2단계 : load 호출 시 프로그램 이름 넘기기

`load()`함수는 유저 프로그램의 실행 파일을 메모리에 로딩하는 역할을 한다.  
따라서 `load()`에 넘기는 문자열은 실행할 파일 이름만 있어야한다.

```c
success = load(argv[0], &_if);
```

`argv[0]` 프로그램 이름을 `load()`함수에 넘겨서  
해당 프로그램을 메모리에 올린다.

### 3단계 : 사용자 스택에 인자들 push - `argument_stack()`

직접 사용자 스택에 인자들을 push해주어야한다.  
`rsp` 갱신해서 사용자 프로그램이 사용할 스택을 완성시킨다!  
또한 `rdi = argc`, `rsi = argv` 레지스터 설정해준다.

```c
void argument_stack(char **argv, int argc, struct intr_frame *if_)
{
  void *rsp = (void *)if_->rsp;
  char *arg_addresses[64];

  // 1. 각 인자를 문자열 형태로 스택에 올림 (뒤에서부터)
  for (int i = argc - 1; i >= 0; i--)
  {
    size_t len = strlen(argv[i]) + 1; // \0 포함한 길이
    rsp -= len;
    memcpy(rsp, argv[i], len);
    arg_addresses[i] = rsp; // 이후 argv 배열 생성 시 주소 사용
  }

  // 2. word align (rsp가 8의 배수가 되도록 맞추기)
  uintptr_t rsp_uint = (uintptr_t)rsp;
  size_t padding = rsp_uint % 8;
  if (padding)
  {
    rsp -= padding;
    memset(rsp, 0, padding); // 패딩 부분을 0으로 채움
  }

  // 3. argv[i] 주소들 스택에 push
  rsp -= sizeof(char *); // argv[argc] = NULL
  memset(rsp, 0, sizeof(char *));

  for (int i = argc - 1; i >= 0; i--)
  {
    rsp -= sizeof(char *);
    memcpy(rsp, &arg_addresses[i], sizeof(char *));
  }

  // 4. argv 주소 (char **argv) 저장
  char **argv_addr = (char **)rsp;

  // 5. argc 저장
  rsp -= sizeof(int);
  *(int *)rsp = argc;

  // 6. return address (dummy 0)
  rsp -= sizeof(void *);
  *(void **)rsp = 0;

  // 7. 최종 RSP 갱신
  if_->rsp = (uint64_t)rsp;

  // 8. rdi = argc, rsi = argv 주소 설정
  if_->R.rdi = argc;
  if_->R.rsi = (uint64_t)argv_addr;
}
```

> 스택은 높은 주소에서 낮은 주소로 이동하며 삽입한다

![user_stack](/assets/img/user_stack.jpg){:style="border:1px solid #eaeaea; border-radius: 7px; padding: 0px;" }

그림으로 나타내면 다음과 같다.

### 4단계 : 유저 프로그램 시작하기

`do_iret(&_if);` 함수는 지금까지 준비한 `intr_frame`구조체를 기반으로  
CPU 제어권을 유저 모드로 넘겨 유저 프로그램 실행을 시작한다.

```c
do_iret(&_if);
NOT_REACHED(); // 정상적으로 유저프로그램에 진입하게 되면 여기로 다시 돌아오지 않는다
```

`do_iret()` 호출 이후에는 커널 모드로 복귀하지 않고, 유저 모드에서 프로그램이 실행된다.  
만약 `NOT_REACHED()`가 실행된다면 이는 비정상적인 상황이다.

---

#### 추가적으로 해주어야하는 부분

```c
// userprog/process.c/process_wait(tid_t child_tid UNUSED)
int process_wait(tid_t child_tid UNUSED)
{
  for (int i = 0; i < 200000000; i++)
  {
  }
  return -1;
}
```

`process_wait()`함수에 무한루프를 넣어주어야한다.  
아직 구현되지 않은 상태에서 부모 프로세스가 자식 프로세스 종료를 기다리는 동기화를 보장하지 않으면,  
시스템이 예상치 못한 상태에 빠질 수 있기 때문이다.  
따라서 정상적인 실행 흐름을 유지하기 위해 임시로 무한 루프를 넣어둔다.

```c
// threads/thread.c/thread_test_preemption(void)
void thread_test_preemption(void)
{
  if (!list_empty(&ready_list) &&
      thread_current()->priority <
          list_entry(list_front(&ready_list), struct thread, elem)->priority)
    if (!intr_context())
      thread_yield();
}
```

`if (!intr_context())`를 넣어주어야한다.  
현재 CPU가 인터럽트 컨텍스트일때, `thread_yield()`를 호출하면 시스템이 불안정해질 수 있기 때문이다.

테스트 중에 이 부분이 없다면 스케줄링 요청이 잘못 발생하여 정상 실행이 되지 않기에 추가해주어야한다.

---

### hex_dump() 함수

`hex_dump()`함수를 활용해 사용자 스택에 인자들이 제대로 쌓였는지 확인해보자.

`argument_stack()`함수는 사용자 스택에 인자들을 쌓는 작업을 수행하기 때문에,  
`argument_stack()`호출 이후에 `hex_dump()`함수를 호출해야 스택 상태를 확인할 수 있다.

```c
// userprog/process.c/process_exec(void *)
  argument_stack(argv, argc, &_if);

  hex_dump(_if.rsp, (void *)_if.rsp, USER_STACK - _if.rsp, true);
```

---

### Argument Passing 출력 결과

![argument_passing_result](/assets/img/argument_passing_result.jpg){:style="max-width: 80%; height: auto; border:1px solid #eaeaea; border-radius: 7px; padding: 0px;" }

순차적으로 `args-none`, `args-single`, `args-multiple`, `args-many`, `args-dbl-space`  
이렇게 `hex_dump()`의 출력 결과이다.
