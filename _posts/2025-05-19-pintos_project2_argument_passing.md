---
title: "[설명] Pintos Project 2 : Argument Passing"
date: 2025-05-19 17:03:00 +09:00
categories: [KraftonJungle]
tags: [jungle]
pin: false
---

### Argument Passing

`process_exec()`에서 사용자 프로그램을 위한 인자 설정

### x86-64 호출 규약 (`Calling Covention`)

이 섹션은 64bit Unix 시스템에서의 일반적인 함수 호출 방식  
즉 x86-64 호출 규약의 핵심적인 사항들을 요약한 것이다.

호출 규약의 동작 방식은 다음과 같다.

➀ 사용자 레벨의 애플리케이션은 함수 인자를 다음 순서의 정수 레지스터에 저장하여 전달한다.

- `%rdi`, `%rsi`, `%rdx`, `%rcx`, `%r8`, `%r9`

➁ 호출자(`caller`)는 다음 명령어의 주소(즉, 리턴할 위치)를 스택에 푸시한 뒤,  
피호출자(`callee`)의 첫 번째 명령어로 점프한다.

- 이 동작은 하나의 x86-64 명령어인 `CALL`로 처리된다
- 즉, `CALL` 명령은 자동으로 `return address`를 스택에 `push`한 후 점프한다

➂ 피호출자(`callee`)가 실행된다.

➃ return 값이 있는 경우, 그 값을 `RAX` 레지스터에 저장한다.

➄ 피호출자는 스택에서 return 주소를 팝(`pop`)하고, 그 위치로 점프하면서 함수 실행을 종료한다.

- `RET` 명령어가 이 작업을 한다.

#### 예시로 이해하기

```c
int f(int a, int b, int c);
```

위 함수를 다음과 같이 호출할 경우

```c
f(1, 2, 3);
```

호출 당시 피호출자 `f()`입장에서의 스택 및 레지스터 상태는 다음과 같다.

```
                             +----------------+
stack pointer --> 0x4747fe70 | return address |
                             +----------------+

레지스터 상태:
RDI: 0x0000000000000001 (a = 1)
RSI: 0x0000000000000002 (b = 2)
RDX: 0x0000000000000003 (c = 3)
```

호출 직후, 함수 안에서 볼 수 있는 상태이다.  
`return address`는 스택에 저장되어있고, 인자들은 레지스터로 전달되어 있다.

---

### Program Startup Details (프로그램 시작 세부 사항)

Pintos 사용자 프로그램용 C 라이브러리는 `lib/user/entry.c`에 있는 `_start()`를 사용자 프로그램의 진입점(`entry point`)으로 지정한다.  
이 함수는 사용자 프로그램을 실행할 때 `main()`을 호출하고, 종료되면 자동으로 `exit()`을 호출한다.

```c
void
_start (int argc, char *argv[]) {
  exit (main (argc, argv));
}
```

커널은 사용자 프로그램이 실행을 시작하기 전에 초기 함수에 대한 인자들을 레지스터에 넣어야 한다.  
이 인자들은 일반적인 호출 규칙과 동일한 방식으로 전달된다.

다음 예시 명령어에 대한 인자들을 처리하는 방법을 고려해봐라.

```
/bin/ls -l foo bar
```

➀ 명령어를 단어로 나눈다.

- `/bin/ls`, `-l`, `foo`, `bar`

➁ 이 단어들을 스택 맨 상단에 배치한다.

- 순서는 중요하지 않다. (왜냐면 포인터를 통해 참조되기 때문이다)

➂ 각 문자열의 주소와 `null pointer sentinel`을 오른쪽에서 왼쪽(`right-to-left`)으로 스택에 push 한다.

- 이들은 `argv`의 요소들이다
- `null pointer sentinel`은 `argv[argc]`가 null 포인터가 되도록 보장하는데, 이는 C 표준에서 요구된다
- 이 순서는 `argv[0]`이 가장 낮은 가상 주소에 있도록 보장한다
- 워드 정렬 접근이 비정렬 접근보다 더 빠르므로, 최상의 성능을 위해 첫 번째 푸시 전에는 스택 포인터를 8의 배수로 내린다

➃ `%rsi`레지스터를 `argv`(=`argv[0]`의 주소)로 지정하고, `%rdi`를 `argc`로 설정한다.

➄ 마지막으로 가짜 리턴 주소를 푸시한다.

- 진입 함수가 실제로 반환되지는 않지만,
- 그 함수의 스택 프레임은 다른 모든 함수들과 동일한 구조를 가져야 한다.

아래 표는 사용자 프로그램이 시작되기 바로 직전 스택과 관련 레지스터의 상태를 보여준다.  
스택은 아래 방향으로 성장(`grow down`)한다는 것에 유의해라!

| Address    | Name           | Data        | Type         |
| :--------- | :------------- | :---------- | :----------- |
| 0x4747fffc | argv[3][...]   | 'bar\0'     | char[4]      |
| 0x4747fff8 | argv[2][...]   | 'foo\0'     | char[4]      |
| 0x4747fff5 | argv[1][...]   | '-l\0'      | char[3]      |
| 0x4747ffed | argv[0][...]   | '/bin/ls\0' | char[8]      |
| 0x4747ffe8 | word-align     | 0           | uint8_t[]    |
| 0x4747ffe0 | argv[4]        | 0           | char \*      |
| 0x4747ffd8 | argv[3]        | 0x4747fffc  | char \*      |
| 0x4747ffd0 | argv[2]        | 0x4747fff8  | char \*      |
| 0x4747ffc8 | argv[1]        | 0x4747fff5  | char \*      |
| 0x4747ffc0 | argv[0]        | 0x4747ffed  | char \*      |
| 0x4747ffb8 | return address | 0           | void (\*) () |

<br>

| 레지스터 | 값                            |
| :------- | :---------------------------- |
| RDI      | 4 (argc)                      |
| RSI      | 0x4747ffc0 (argv의 시작 주소) |

이 예제에서 스택 포인터는 `0x4747ffb8`로 초기화된다.  
코드에서는 `include/threads/vaddr.h`에 정의된 `USER_STACK`에서 스택을 시작해야 한다.

인자 전달 코드를 디버깅 할 때는 `<stdio.h>`에 선언된 비표준 함수(`hex_dump()`)가 유용할 수 있다.

---

### Implement the argument passing - 인자 전달을 구현해라

현재는 `process_exec()`는 새 프로세스에 인자를 전달하는 기능을 지원하지 않는다.  
이 기능을 구현하려면, `process_exec()`가 단순히 프로그램 이름만 받는 대신,  
공백을 기준으로 문자열을 나눠 각 단어로 구분하도록 확장해야 한다.

예 : `process_exec("grep foo bar")`  
`grep`은 실행할 프로그램, `foo`, `bar`은 프로그램에 전달할 인자들이다.

첫 번째 단어는 프로그램 이름이고, 두 번째 단어부터는 첫 번째 인자, 그 다음은 두 번째 인자, 이런식이다.  
예 : `argv[0] = "grep"`, `argv[1] = "foo"`, `argv[2] = "bar"`, `argc = 3`

다시 말해, `process_exec("grep foo bar")`는 `"grep"`을 실행하면서 `"foo"`와 `"bar"`라는 두 개의 인자를 전달해야 한다.

> 사용자는 단순 문자열을 입력하지만, 내부적으로는 문자열을 잘라서 프로그램과 인자들을 구분하고, 이들을 스택에 적절히 배치한 후 실행되도록 만들어야 한다.

명령어 줄 안에서 여러 개의 공백은 하나의 공백과 동일하게 처리되어야 하므로,  
`process_exec("grep foo bar")`는 기존 예제와 동일하게 간주된다.

명령어 줄 인자 길이에 대해서는 합리적인 제한을 둘 수 있다.  
예를 들어, 인자들이 한 페이지(4KB) 안에 들어오도록 제한할 수 있다.  
(별도로, `pintos` 유틸리티가 커널에 전달할 수 있는 명령줄 인자에는 128 byte 제한이 있다.)

인자 문자열은 원하는 방식으로 파싱해도 된다.  
구현이 어려울 경우, `strtok_r()`를 참고해라.  
이 함수는 `include/lib/string.h`에 정의되어있고, `lib/string.c`에 자세한 주석과 함께 구현되어 있다.  
더 자세한 정보는 `man strtok_r` 명령어를 통해 확인할 수 있다.  
(`man` 명령어로 함수 설명서를 볼 수 있다.)

---

#### strtok_r()

이 함수는 문자열을 구분자를 기준으로 토큰(부분 문자열)으로 나누는 **재진입 가능** 토크나이저(`tokenizer`)이다.

```c
char *
strtok_r (char *s, const char *delimiters, char **save_ptr) {
  char *token; // 토큰의 시작 위치를 저장할 포인터

  ASSERT (delimiters != NULL);
  ASSERT (save_ptr != NULL);

  /* If S is nonnull, start from it.
  If S is null, start from saved position. */
  if (s == NULL)
    s = *save_ptr;
  ASSERT (s != NULL);

  /* 현재 위치(*s)가 구분자에 속하면 넘김 (연속된 구분자를 건너띔)
  만약 \0까지 도달했다면, 남은 토큰이 없음로 NULL을 반환함 */
  while (strchr (delimiters, *s) != NULL) {
    if (*s == '\0') {
      *save_ptr = s;
      return NULL;
    }

    s++;
  }

  token = s; // 토큰의 시작 위치를 저장
  while (strchr (delimiters, *s) == NULL)
    s++;
  if (*s != '\0') {
    *s = '\0';
    *save_ptr = s + 1;
  } else
    *save_ptr = s;
  return token;
}
```

- `strtok_r()`는 문자열을 주어진 구분자 기준으로 안전하게 분할 가능한 함수다
- 상태를 `save_ptr`에 저장하므로 여러번 호출해도 안정적이다
- 문자열을 직접 수정하며(`\0`으로 끊음), 리턴 값은 각 토큰의 시작 위치이다
- 공백이 연속돼도 문제 없이 건너띈다
