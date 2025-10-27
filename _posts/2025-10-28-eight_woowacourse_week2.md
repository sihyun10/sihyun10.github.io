---
title: "[우테코 프리코스 2주차 회고] 한 객체에 너무 많은 일을 맡기지 않기"
date: 2025-10-28 00:02:00 +09:00
categories: [Woowacourse]
tags: [woowacourse]
pin: true
image:
  path: /assets/img/eight_woowacourse_week2.PNG
  alt: [우테코 8기 프리코스 2주차 회고]
---

## 피드백을 기반으로 한 2주차 과제 진행

우테코에서 받은 공식 피드백과 코드 리뷰를 통해 얻은 피드백들을 잊지 않기 위해 메모지에 정리해두었다.  
매일 과제를 진행할 때마다 그 메모를 옆에 두고, 내가 어떤 부분을 더 신경 써야 하는지 계속 확인했다.

![예외처리_피드백](/assets/img/exception_feedback.png)

![피드백_memo](/assets/img/feedback_memo.jpeg)

이번 주차에서는 특히 **단일 역할을 수행하는 작은 함수로 분리하기**에 집중했다.  
"이 함수가 무엇을 하는지 이름만 봐도 알 수 있도록 하기" → 이걸 목표로 삼았다.  
짧고 명확한 함수, 읽는 사람이 곧바로 이해할 수 있는 코드.  
그게 이번 주 내가 가장 지키고 싶었던 원칙이었다.

---

## 🌱 일간 회고

## 10/21(화) ~ 10/22(수) 1일차

- [x] 코드리뷰 진행 및 피드백 반영 방향 고민하기

이번 주는 과제가 공개되자마자 바로 시작하지 못했다.  
21일 하루 동안 무려 11분의 코드리뷰를 하느라 하루가 꽉 찼기 때문이다.

하루 종일 다른 사람들의 코드를 보면서 정말 다양한 구조와 접근 방식을 접했다.  
누군가는 절차적으로, 누군가는 객체지향적으로.  
각자의 생각이 녹아져 있는 코드를 보면서 "정답이 없다는 게 이런 거구나"를 체감했다.

그럼에도 불구하고 흐름이 잘 보이는 코드는 확실히 읽기 편했다.  
'깔끔하다'는 건 단순히 짧은 코드가 아니라, 이해하기 쉬운 구조라는 걸 새삼 느꼈다.

나도 평소에 코드를 짜기 전에 전체 흐름을 시각적으로 정리하곤 한다.  
그림을 그려보면 머릿속에서 구조가 명확해지고, 다른 사람에게도 쉽게 설명할 수 있다.  
그런데 이번에 리뷰어 분께서 "코드 흐름이 잘 보인다"는 말을 해주셔서 정말 기뻤다.  
내가 신경 쓰고 있던 부분을 다른 사람이 알아봐줬다는 건, 큰 보람이었다.

다음 날에는 반대로 내가 받은 리뷰들을 하나씩 읽어보며  
'놓친 부분이 무엇이었는지', '왜 그렇게 피드백을 주셨는지'를 곰곰이 생각해봤다.

특히 기억에 남은 건

- 메서드명은 **동사** 또는 동사구로 짓기
- 이해하기 어려운 축약 변수명 피하기

이 두 가지였다.  
기본적인 규칙이지만, 실제로는 자주 놓치는 부분이라 "앞으로 놓치지 말자"는 생각이 들었다.

코드 리뷰를 통해 나와 다른 시각의 코드를 보는 경험을 많이 했다.  
그 덕분에 내 코드가 더 나아질 수 있는 방향을 알게 되었다.

---

## 10/23(목) 2일차

- [x] 기능 명세 작성
- [x] 주요 기능 구현
  - [x] 자동차의 전진 로직 (Car)
  - [x] 자동차 집합의 관리 (Cars)
  - [x] 우승자 계산 (Winners)

1주차와 동일하게 **기능 명세 작성** ➔ **기능 구현** 순서로 진행했다.  
다만 이번엔 객체 이름과 책임을 좀 더 구체적으로 정의한 뒤 명세서를 작성했다.  
(물론 구현하면서 조금씩 수정되긴 했지만, 큰 방향을 잡는 데는 도움이 컸다.)

![초반_기능_명세_흐름](/assets/img/racing_car_game.jpg)

전체 흐름을 머릿속에 그리는 데 시간이 꽤 걸렸다.  
요구사항이 늘어날수록 프로그램의 구조를 한눈에 떠올리는 게 어려워졌다.  
그래서 자연스럽게 이런 질문을 계속 하게 됐다.

> "이 책임은 어디에 두는 게 맞을까?"  
> "이 객체가 이 일을 맡는 게 자연스러울까?"

이 과정이 반복되면서 설계를 다듬는 힘이 조금씩 길러졌다.

또 하나 느낀 건, 명세를 구체적으로 작성해두면 구현이 훨씬 수월해진다는 점이었다.  
기능 하나하나를 작게 쪼개 두니까 흐름이 명확해지고 어디서부터 손대야 할지도 분명해졌다.  
그 덕분에 주요 기능 3가지를 차근차근 완성할 수 있었다.

---

## 10/24(금) 3일차

- [x] 사용자 입력 처리 기능 구현
  - [x] 자동차 이름 입력 및 검증
  - [x] 시도 횟수 입력 및 검증
- [x] 입력값을 기반으로 실제 경주를 진행하는 `RacingCarGame` 로직 구현

오늘은 사용자 입력 처리와 검증 로직에 집중했다.

**1. 예외 메시지 관리**

기존에는 단순히 상수 클래스로 예외 메시지를 관리했지만,  
이번엔 `enum`을 활용한 예외 메시지 관리 방식으로 변경했다.

- 참고한 블로그 링크
  - [왜 enum이 상수 클래스보다 더 좋은건데??](https://zangsu.tistory.com/69){: target="\_blank"}

이 방법의 장점은 다음과 같다.

- 관련 메시지를 한 곳에서 명확하게 관리할 수 있다.
- 타입 안정성을 제공하여 잘못된 메시지나 상수값이 들어가는 것을 방지할 수 있다.

**2. 테스트 코드 개선**

`@Nested`와 `@ParameterizedTest`를 활용하여 다양한 입력값을 한 번에 검증할 수 있도록 구성했다.

- 참고한 블로그 링크
  - [Junit 5 User Guide - Nested Test](https://docs.junit.org/current/user-guide/#writing-tests-nested){: target="\_blank"}
  - [JUnit 5 에서 @Nested 와 @DisplayName 으로 가독성 있는 테스트 코드 작성하기](https://bcp0109.tistory.com/297){: target="\_blank"}

```java
@ParameterizedTest
@ValueSource(strings = {"p", "pobii"})
@DisplayName("5자 이하일 경우 통과")
void 이름_5자_이하_통과(String input) {
    List<String> names = List.of(input, "woni");
    RacingCarValidator.validate(names);
}
```

이 방식의 장점은 명확했다.

- `@ValueSource`를 통해 여러 테스트 케이스를 한 번에 검증할 수 있다.
- `@Nested`로 테스트 묶음을 구성하면, 결과를 볼 때 "어떤 기능을 테스트하고 있는지" 명확히 구분된다.

덕분에 같은 검증 로직을 여러 경우에 대해 훨씬 빠르고 효율적으로 테스트할 수 있었다.

![파라미터 테스트 결과](/assets/img/parameter_test_ex.png)

---

## 10/25(토) 4일차

- [x] InputValidator 구현
- [x] 전체 로직 흐름 정리
- [x] RacingCarGame이 전체 흐름만 제어하도록 리팩토링
  - [x] 입력, 검증, 진행, 출력은 다른 객체에게 위임

<br>

### 입력값 검증 책임의 필요성

기존에는 시도 횟수만 별도의 `RacingCountValidator`로 검증하고,  
자동차 이름 입력은 그대로 `RacingCarParser`로 넘어갔다.  
즉, 잘못된 입력이 들어와도 이를 잡아주는 구조가 아니었다.

이 문제를 해결하기 위해 **InputValidator**를 새로 구현했다.  
이 클래스는 단순히 형식을 검사하는 데서 그치지 않고,  
사용자의 작은 실수를 허용하고 입력값을 정제하는 책임까지 맡는다.

예를 들어, 쉼표 사이에 빈 항목이 있거나 불필요한 공백이 있어도  
프로그램이 중단되지 않도록 자동으로 걸러내도록 했다.  
이는 "사용자의 작은 실수는 시스템이 너그럽게 받아주는 게 좋지 않을까?"라는 고민에서 출발했다.

이 과정을 통해 깨달았다.  
기능 요구사항에 없더라도 사용자 경험 관점에서의 개선은 충분히 의미가 있다.

### 책임 중심으로 본 구조 리팩토링 ⚒️

전체 흐름을 다시 정리하면서, 각 객체가 맡고 있는 책임을 하나씩 점검했다.

그 중 `RacingCarGame`은 입력, 검증, 로직, 출력까지 모든 일을 하고 있었다.  
그래서 역할에 따라 책임을 나누기로 했다.

- `GameInitializer` : 입력 요청 및 검증, `Cars` 초기화
- `RaceService` : 비즈니스 로직 수행 및 출력 관리
- `RacingCarGame` : 전체 프로그램 흐름 제어 (Controller 역할)

```java
public class RacingCarGame {

    private final InputView inputView = new InputView();
    private final OutputView outputView = new OutputView();
    private final RandomNumberGenerator generator = new RandomNumberGenerator();

    private final GameInitializer initializer = new GameInitializer(inputView, outputView);
    private final RaceService raceService = new RaceService(generator, outputView);

    public void start() {
        Cars cars = initializer.createCars();
        int tryCount = initializer.createTryCount();

        Winners winners = raceService.play(cars, tryCount);
        outputView.printWinners(winners);
    }
}
```

이렇게 구조를 나누니 클래스 간 의존 관계가 훨씬 명확해졌다.  
"무엇을 할지 결정하는 객체"와 "어떻게 할지 수행하는 객체"가 분리되면서 코드의 흐름이 읽기 편해졌다.

### 🚗 Cars의 자율성과 책임에 대한 고민

`RaceService`가 경주 과정을 너무 세세하게 지시한다는 점이 눈에 띄었다.  
그래서 "경주를 수행하는 주체는 RaceService가 아니라 Cars여야 한다"는 방향으로 리팩토링했다.

`Cars`가 스스로 주어진 횟수만큼 이동하고, 경주가 끝나면 우승자를 계산하는 구조로 변경했다.  
즉, `Cars`가 자동차들의 집합이라면, 그 집합이 어떻게 경주를 수행할지도 알고 있어야 한다고 생각했기 때문이다.

하지만 다시 고민이 생겼다. `Cars`는 "경주를 수행해라~"는 명령을 받는 존재이지 스스로 "이제 경주를 시작해야겠다"고 판단하는 존재는 아니다. 다시 말해 경주를 제어하는 책임은 상위 객체가 가져야 하고, `Cars`는 단지 "주어진 명령에 따라 자동차들을 움직이는 역할"에 집중해야 한다는 생각이 들었다.

이후 리팩토링 과정에서 이부분에 대해 다시 고민해보고자 한다.

### 전략 패턴 적용의 확장 가능성

마지막으로 **움직임 판단 로직에 전략 패턴**을 도입했다.

현재는 랜덤 이동 로직 하나뿐이지만, 앞으로 이동 조건이 달라질 수 있다는 가능성을 염두에 두고 구조를 확장했다.

처음엔 "하나뿐인데 굳이 인터페이스로 뺄 필요가 있을까?"라는 의문도 들었다. 하지만 이렇게 해두니, "이 친구에게 시키면 알아서 판단해주겠지"라는 식으로 이동 방식의 구체적인 구현에 의존하지 않는 코드가 만들어졌다.

`MoveStrategy`를 통해 "어떻게 움직일지"가 아니라, "움직임 판단을 누구에게 맡길지"만 결정하면 전체 흐름이 자연스럽게 이어지게 되었다.

### 느낀 점

오늘은 하루 종일 "이 객체가 정말 이 책임을 가져야 할까?"라는 질문을 반복했다.  
리팩토링의 목적이 단순히 코드를 고치는 것이 아닌, 객체가 스스로의 역할을 제대로 수행하게 만드는 것이라는 걸 다시 한 번 깨달았다.

또한 기능 요구사항을 넘어서 사용자의 실수와 경험까지 고려한 로직을 추가하면서 기술적 완성도와 사용자 중심 사고의 균형에 대해서도 많이 고민하게 되었다.

---

## 10/26(일) 5일차

- [x] 의존성 주입 방식 고민 및 구조 점검

오늘은 전체 구조를 돌아보며 의존성 주입을 어떤 방식으로 적용할지 고민헀다.

현재 구조에서 `RacingCarGame`은 모든 객체를 직접 `new`로 생성하고,  
필요한 의존성을 생성자 파라미터로 주입해주는 **조립자** 역할을 맡고 있다.  
내가 알고 있던 `AppConfig`가 하는 일을 `RacingCarGame`이 수행하고 있는 셈이다.

```java
public class RacingCarGame {

    private final InputView inputView = new InputView();
    private final OutputView outputView = new OutputView();
    private final MoveStrategy strategy = new RandomMoveStrategy();

    private final GameInitializer initializer = new GameInitializer(inputView, outputView);
    private final RaceService raceService = new RaceService(strategy, outputView);

    public void start() {
        Cars cars = initializer.createCars();
        int tryCount = initializer.createTryCount();
        Winners winners = raceService.play(cars, tryCount);
        outputView.printWinners(winners);
    }
}
```

```java
public class Application {
    public static void main(String[] args) {
        RacingCarGame racingCarGame = new RacingCarGame();
        racingCarGame.start();
    }
}
```

**🤔 왜 AppConfig를 별도로 두지 않아도 괜찮다고 생각했는가?**

- `RacingCarGame`이 프로그램의 진입점이기 때문
  - `Application.main()`에서 단 한 번 생성되고, 그 안에서 필요한 의존성을 한 번씩만 조립한다.
  - 실행 시점에 한 번만 객체를 만들고, 게임 종료 시 함께 소멸되므로 별도의 전역 관리가 불필요하다.
- 게임은 한 번만 실행된다
  - 요청이 반복적으로 들어오지 않기 때문에 매번 초기화하는 비용이 문제되지 않는다.

**🔒 명시적 주입을 강제하기**

생성자 파라미터로 주입받도록 설계하였다.

```java
public class GameInitializer {

    private final InputView inputView;
    private final OutputView outputView;

    public GameInitializer(InputView inputView, OutputView outputView) {
        this.inputView = inputView;
        this.outputView = outputView;
    }
}
```

```java
public class RaceService {

    private final MoveStrategy strategy;
    private final OutputView outputView;

    public RaceService(MoveStrategy strategy, OutputView outputView) {
        this.strategy = strategy;
        this.outputView = outputView;
    }
}
```

- `final`과 함께 사용하여 한번 설정된 의존성을 변경되지 않게 설정하여 **객체의 불변성 보장**
- 객체 생성 시 **필수로 필요한 의존성을 전달**해야 하여 의존성 누락이나 잘못된 의존성 설정 방지
- 클래스의 의존성이 명시적으로 드러나기 때문에 **코드의 가독성**을 높임

---

## 10/27(월) 6일차

- [x] `Cars`와 `RaceService` 역할 분리 및 책임 재정의

지난번에 `Cars`가 스스로 경주를 수행하고, 우승자까지 계산하는 구조였다.  
당시에는 자동차 집합이 스스로 움직이는 게 자연스럽다고 생각했지만,  
시간이 지나 코드를 다시 보니 `Cars`가 너무 많은 책임을 지고 있다는 생각이 들었다.

**🚗 Cars의 역할 다시 보기**

기존 `Cars`의 `race()` 메서드는 다음과 같았다.

```java
public Winners race(int tryCount, MoveStrategy strategy, OutputView outputView) {
    for (int i = 0; i < tryCount; i++) {
        moveAll(strategy);
        outputView.printRoundResult(this);
    }
    return findWinners();
}
```

이 메서드는 다음 세 가지 일을 하고 있다.

1. 자동차 이동 (`moveAll()`)
2. 출력 처리 (`outputView.printRoundResult()`)
3. 우승자 계산 (`findWinners()`)

`Cars`가 자동차 관리, 경주 진행, 출력까지 모두 책임지고 있는 상태이다.

**리팩토링 방향**

Cars는 자동차 집합을 관리하는 객체로서  
자동차를 움직이거나 현재 상태를 기반으로 우승자를 계산하는 행위까지만 담당하도록 변경했다.

```java
public class Cars {

    private final List<Car> cars;

    public Cars(List<String> names) {
        this.cars = names.stream()
                .map(Car::new)
                .collect(Collectors.toList());
    }

    public void raceOnce(MoveStrategy strategy) {
        cars.forEach(car -> car.move(strategy));
    }

    public Winners findWinners() {
        int maxDistance = findMaxDistance();
        return new Winners(findCarsAt(maxDistance));
    }

    private int findMaxDistance() {
        return cars.stream()
                .mapToInt(Car::getDistance)
                .max()
                .orElse(0);
    }

    private List<Car> findCarsAt(int distance) {
        return cars.stream()
                .filter(car -> car.getDistance() == distance)
                .collect(Collectors.toList());
    }

    public void forEachCar(Consumer<Car> action) {
        cars.forEach(action);
    }
}
```

출력 로직은 `Cars`가 담당할 책임이 아니다.  
이를 `RaceService`로 옮겨서 게임의 진행 흐름을 담당하도록 분리했다.

```java
public class RaceService {

    private final MoveStrategy strategy;
    private final OutputView outputView;

    public RaceService(MoveStrategy strategy, OutputView outputView) {
        this.strategy = strategy;
        this.outputView = outputView;
    }

    public Winners play(Cars cars, int tryCount) {
        outputView.printPlayResultMessage();

        for (int i = 0; i < tryCount; i++) {
            cars.raceOnce(strategy);
            outputView.printRoundResult(cars);
        }

        return cars.findWinners();
    }
}
```

---

### **[최종]** 자동차 경주 게임 전체 흐름

![최종_자동차_경주_게임_흐름](/assets/img/final_racing_car_game.jpg)

사용자가 자동차 이름과 시도 횟수를 입력한다.  
`RacingCarGame`이 입력을 받아 전체 경주를 진행한다.

1. `GameInitializer`가 입력을 받아 `Cars`와 `tryCount`를 생성한다.
2. `RaceService`가 `Cars`와 `MoveStrategy`를 이용해 경주를 반복 실행한다.
3. 각 라운드마다 `Cars.raceOne()`으로 자동차를 이동하고, 이동 결과를 `OutputView`로 출력한다.
4. 모든 라운드가 끝나면 `Cars.findWinners()`가 최종 우승자를 계산한다.
5. `RacingCarGame`이 `OutputView`를 통해 최종 우승자를 출력한다.

---

이번 2주차 과제를 진행하면서 **객체의 책임이란 무엇일까?** 를 깊이 고민한 시간이었다.  
한 객체가 너무 많은 일을 하고 있지는 않은지 이 역할이 정말 이 객체의 몫이 맞는지 계속 되묻게 되었다.

또 그동안 무심코 사용하던 `static` 키워드에 대해서도 돌아보게 되었다.  
`static` 키워드를 사용하면 객체를 생성하지 않아도 클래스 이름만으로 바로 메서드를 호출할 수 있어서 편리하다고 생각했다. 어디서든 손쉽게 불러 쓸 수 있었기 때문에 효율적이라고 느꼈다.

하지만 곧 이런 방식이 객체의 역할을 흐리게 만든다는 문제를 느꼈다. 메서드가 누구의 책임인지가 모호해지고, 객체가 스스로 해야 할 일을 외부의 정적 메서드에 의존하게 되었기 때문이다. 따라서 검증 클래스의 `static` 메서드를 모두 제거하고, 각 객체가 **자신이 다루는 데이터에 대한 검증을 스스로 수행하도록** 구조를 변경하였다.

---

- 깃허브 링크 : [java-racingcar-8](https://github.com/sihyun10/java-racingcar-8/tree/sihyun10){: target="\_blank"}
