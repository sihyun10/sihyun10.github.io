---
title: "[우테코 프리코스 2주차 회고] 테스트코드, 너 누군데?"
date: 2024-11-01 01:49:00 +09:00
categories: [Woowacourse]
tags: [woowacourse]
pin: true
image:
  path: /assets/img/woowacourse_week2.png
  alt: [우테코 7기 프리코스 2주차 회고]
---

지난 1주차를 진행 후, 많은 분들께 코드 리뷰를 받았었고, 우테코에서 피드백도 주셨다.  
이것들을 정리해둔 뒤, 과제에 적용하려 노력했고, **최대한 지키자!** 하는 목표를 세우고 2주차 과제를 진행했다.

<br>

### [리뷰를 통해 배운점들]

1. `stream`을 사용한다면 한줄에 `.`하나만 찍기  
   1-1) 가독성이 더 좋아짐
2. `view` 적용해보기 _(입력하거나 출력할때 보여주는 화면)_
3. **상수(static final)** 처리해야 할 부분 생각하며 코드 작성  
   3-1) 매직 넘버 → **상수**로 작성  
   3-2) 에러 메시지 → **상수**로 작성
4. 메서드 이름 → 동사, 동사구로
5. 클래스에 `static`변수 → `인스턴스`변수 순서로 선언

### [우테코 피드백과 과제 요구사항]

1. 배열 대신 컬렉션 사용
2. 커밋 메시지 의미있게 작성
3. 변수, 함수(메서드), 클래스의 이름을 통해 의도 드러내기
4. 여러 역할 수행하는 큰 함수 → 단일 역할을 수행하는 작은 함수로 분리

리뷰와 우테코 피드백, 과제 요구사항은 코드를 작성해나가며 놓치지 않기위해
작성해두고 코드구현을 시작했었다.

### [내가 세운 2주차 목표]

1. 기능 목록 세세히 작성하기
2. 자바 코드 컨벤션 지키기

**이거는 꼭 지키자!** 하며 세웠던 2주차 목표였다.

그럼 2주차때는 어떤점이 개선되었고, 반성할 부분에 대해 이야기해보고자 한다.

<br>

## 자바 코드 컨벤션 적용

막상 적용해나가려하니, 너무 많은 조건들이 있었기에 `이 조건들을 잘 지킬 수 있는 방법이 없을까?`하며 생각하다가 `IntelliJ`의 `Code Style`에서 쉽게 적용시킬 수 있는 방법을 알려주신 블로그를 찾게 되었다.

그 블로그를 보고 바로 제 IntelliJ에도 적용시켜주었고,  
제가 놓칠 수 있는 부분을 잡아줌으로써 안심하고 코드를 짜내려갔었었다.

```
Editer - Code Style - Java 선택
⚙ 선택 → Import Scheme 선택
IntelliJ IDEA code style XML
다운로드한 WootecoStyle 적용
(Enable EditorConfig support 체크 유무 확인)

Tools - Action on Save 선택
Reformat Code, Optimize imports 체크
```

- 참고한 블로그 링크 : [[IntelliJ] 코드 스타일 설정](https://velog.io/@pgmjun/IntelliJ-%EC%BD%94%EB%93%9C-%EC%8A%A4%ED%83%80%EC%9D%BC%EC%9D%84-%EC%84%A4%EC%A0%95%ED%95%B4%EB%B3%B4%EC%9E%90-feat.%EC%9A%B0%ED%85%8C%EC%BD%94)

<br>

## view (inputView,outputView)

`view`는 사용자에게 보여주는 화면이라고 생각하면 된다고 리뷰해주신 분께서 그러셨다.  
이 점을 기억하면서 `view`를 `inputView`(입력하는 화면), `outputView`(보여주는 화면)으로 나누어 구현해주었다.

1. `inputView`구현  
   사용자에게 자동차 이름을 입력받고, 값을 저장하는 메서드 `getCarNames()`  
   사용자에게 시도횟수 입력받고, 값을 저장하는 메서드 `getNumberOfAttempts()`

2. `outputView`구현  
   자동차 경주 게임 각 라운드 별로 결과 출력해주는 `printRoundResult(List<Car> cars)`  
   최종 우승자 출력해주는 `printWinners(List<String> winners)`

데이터를 파라미터로 받아서 그 값에 따라 결과를 보여주도록 구현해주었다.

> Q. `view`에서 `model` 내부 로직이 그대로 노출되는것이 맞을까?  
> 저 같은 경우는 `view`의 주요 목적은 데이터를 화면에 뿌려주는(=보여주는) 역할이라 생각했기에 `model`이 가진 데이터를 전달받아 출력만 해주는건 괜찮지 않을까? 생각하였습니다.  
{: .prompt-tip }

<br>

## 매직넘버 → 상수로, 에러메시지 → 상수로 (+ 출력 메시지)

- 매직넘버 → 상수로  
   이 미션 요구사항을 아는 사람들은 이 숫자만 봐도 알 수 있겠지만,  
   처음 보는 사람들은 `매직넘버`이기에 의미를 빠르게 파악할 수 없다.  
   매직 넘버를 상수로 작성해줌으로써, 숫자에 의미를 부여해주었다.

```java
//전진하는 조건이 0~9 사이의 무작위 값을 구한 후, 그 값이 4이상일때
public class RacingGame {
    private static final int MIN_RANDOM_VALUE = 0;
    private static final int MAX_RANDOM_VALUE = 9;

    public void implement() {
        for (Car car : participatingCars) {
            int randomValue = Randoms.pickNumberInRange(MIN_RANDOM_VALUE, MAX_RANDOM_VALUE);
            car.move(randomValue);
        }
    }
}
```

- 에러메시지 → 상수로  
   어떤 에러 메시지인지 알 수 있도록 상수명에 의미를 담았다.  
   어떤 상황에서 예외가 터지게 된다면 상수명만 봐도 `아! 이래서!!`라고 알 수 있게 되었다.

```java
public class CarNameValidator {
    public static final String CAR_NAME_EMPTY_ERROR = "자동차 이름을 입력해주세요.";
    public static final String CAR_NAME_DELIMITER_ERROR = "자동차 이름은 쉼표(,)를 기준으로 구분하여야합니다.";
    public static final String CAR_NAME_LENGTH_ERROR = "각 자동차 이름은 1자 이상 5자 이하로 입력해주어야합니다.";
}

public class MoveCountValidator {
    public static final String ATTEMPTS_EMPTY_ERROR = "이동횟수를 입력해주세요.";
    public static final String ATTEMPTS_ZERO_ERROR = "이동횟수는 1번 이상이어야합니다.";
    public static final String ATTEMPTS_NEGATIVE_ERROR = "이동횟수는 음수가 될 수 없습니다.";
    public static final String ATTEMPTS_NUMBER_ERROR = "이동횟수는 숫자로만 입력가능합니다.";
}
```

끝나고나니, 아쉬운 점이 보였었다.

```java
    private static void checkNameLength(String name) {
        if (name.isBlank() || name.length() > 5) {
            throw new CarNameException(CAR_NAME_LENGTH_ERROR);
        }
    }
```

`CarNameException`(자동차 이름 예외)를 `throw`하면서 메시지를 담는데,  
예외클래스명이 확실한데, 굳이 상수명에 `CAR_NAME_LENGTH_ERROR`라고 해줄 필요가 없지 않을까? 라는 생각이 들었다.

`throw new CarNameException(LENGTH_ERROR)`라고 했어도 자동차 이름 길이가 잘못되서 이 예외를 던지는 구나.하고 알 수 있기 때문이다.

### 개선점

이번 2주차 코드리뷰를 통해, `enum`을 활용하여 관리하는건 어떨까요?라는 이야기를 들었다.  
게다가 3주차 프로그래밍 요구사항에 `Enum`을 적용하여 프로그램을 구현한다고 되어있었기에 3주차 과제에선 `enum`을 활용하여 상수를 관리하여 개선해보고자 한다!

<br>

## 커밋 메시지 의미있게 작성하기 실패..😢

```
feat(결과 출력) : 게임 진행상태, 최종 우승자 출력한다.
refactor(코드 구조 개선) : 유효성 검사 폴더를 새로 생성
```

예시로 내가 `commit`했던 2개의 메시지를 가져왔다.  
이 2개의 메시지를 아래의 형식으로 했다면 어땠을까?

```
feat(OutputView) : 게임 진행상태와 최종 우승자 출력
refactor(Validator) : 사용자 입력 유효성 검사 로직 분리
```

훨씬 더 어떤 작업을 하였는지 눈에 잘 들어온다.  
따라서 3주차에는 커밋 메시지 제목에는 위와같은 형식으로 작성하고자 한다.

> **git 커밋 메시지** : 제목은 `명령문`으로, 본문은 `평서문`으로 작성  
> 본문은 `어떻게`보다 `무엇을`, `왜`에 맞춰 작성  
{: .prompt-tip }

<br>

## 테스트 코드 작성

사용자가 잘못된 값을 입력하면 옳은 예외를 발생시키고 있는지 확인해보는 테스트코드를 작성하였다.

참고한 링크는 다음과 같다. _(우테코에서 제공해주신 자료)_

- [AssertJ Exception](https://www.baeldung.com/assertj-exception-assertion) : 예외 테스트를 하는 방법 (`assertThatThrownBy()`)
- [Parameterized Tests](https://www.baeldung.com/parameterized-tests-junit-5) : 여러 값을 테스트해볼 수 있다. (`@ParameterizedTest` 어노테이션)

```java
assertThatThrownBy(() -> {
    List<String> list = Arrays.asList("String one", "String two");
    list.get(2);
}).isInstanceOf(IndexOutOfBoundsException.class)
  .hasMessageContaining("Index: 2, Size: 2");
```

```java
@ParameterizedTest
@NullAndEmptySource
@ValueSource(strings = {"  ", "\t", "\n"})
void isBlank_ShouldReturnTrueForAllTypesOfBlankStrings(String input) {
    assertTrue(Strings.isBlank(input));
}
```

링크에 있었던 위 코드들을 참고하여 테스트 코드를 짰었다.  
저는 사용자 입력값 유효성 검증에 많은 시간을 쏟았기에 이걸 테스트 해보고 싶어 작성했었다.  

돌이켜보니, 핵심기능을 전혀 테스트해보지 못했다는 것이다.  
프로그램의 핵심 기능들이 잘 돌아가는지도 중요한데 말이죠😥

<br>

아직도 테스트코드가 낯설고 어렵게만 느껴지지만,  
테스트코드를 돌려봄으로써 내 코드에 확신을 가지게 되고, 틀린부분을 바로 캐치할 수 있어 좋은 것 같습니다.

테스트코드와 하루빨리 친해지고 싶습니다.  
그러려면 우테코에서 주신 피드백처럼 **작은 단위의 테스트**부터 차근차근 확장해나가는 것이 좋다고 생각이 들었습니다.

`테스트코드 너 나랑 친해지자..`

남은 3주차, 4주차 과제를 진행하며 `작은 단위 테스트`를 잘 작성해나가보고자 합니다!

---

## 2주차를 끝낸 후..

벌써 중간까지 달려온 우테코 과제  
시간이 너무 빨리 지나간다는 생각이 들지만, 코드를 구현하며 알아가는 부분. 코드리뷰를 하며 새롭게 배운 점들. 우테코에서 주는 피드백. 등등으로 배워가는것에 즐거움을 느낀다.

하지만, 너무 많은 지식들이 한꺼번에 머릿속으로 들어오다보니 혼란스러운건 사실이다.  
배워야하는 지식이 너무 많은 것 같다. 반대로 생각하자면 이걸 공부함으로써 내가 더 성장할 수 있는게 아닐까?하는 생각도 든다.

앞으로 남은 3,4주차 과제들도 화이팅해보자!  
아쉬웠던 부분들은 고쳐나가고, 과제 요구사항들도 잘 지키도록 노력하자!

<br>

3주차 과제에 이루고 싶은 목표는 다음과 같다.

- enum활용하기
- 작은 단위부터 테스트 해보기

2주차에 아쉬웠던 부분들을 3주차에 적용해보고, 위의 목표도 이루도록 노력하겠습니다.
