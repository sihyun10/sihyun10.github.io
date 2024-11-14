---
title: "[우테코 프리코스 3주차 회고] 급박했던 예외처리"
date: 2024-11-05 10:49:00 +09:00
categories: [Woowacourse]
tags: [woowacourse]
pin: true
image:
  path: /assets/img/woowacourse_week3.png
  alt: [우테코 7기 프리코스 3주차 회고]
---

2주차 과제에서 테스트코드를 작성하지 못했었어서 3주차에는 작은 기능이라도 테스트해보고자 했으며, **일급컬렉션**과 **enum**에 대해 공부한 후 코드에 적용해보았다. 그 과정 속에 배웠던 점과 아쉬운점에 대해 회고록을 남기고 싶다.

### [코드리뷰를 통해 배운점들]

- 일급 컬렉션 활용
- 비즈니스 로직에 대한 테스트 작성
- 검증 역할을 위한 클래스를 굳이 분리할 필요가 있는가?
  - 도메인 클래스에서 처리하는건 어떨까?
- `view`는 `model`에 의존하면 안되는가? (생각해볼 부분)
  - +) MVC패턴에서 `view`는 `Controller`에 종속되어선 안됨

### [우테코 피드백과 과제 요구사항]

- 한 메서드가 한 가지 기능만 담당하게 한다.
  - 15라인이 넘지 않도록 구현해보자.
- 테스트를 작성하는 이유에 대해 본인의 경험을 토대로 정리해본다.
- 처음부터 큰 단위의 테스트를 만들지 않는다.
  - 문제를 작게 나누어 핵심 기능부터 작게 테스트를 만들어 가는 것이 효과적이다.
- 구현한 기능에 대한 단위 테스트를 작성한다. 단, UI로직은 제외

### [내가 세운 3주차 목표]

- `enum` 활용하기
- 작은 단위부터 테스트 해보기

이번 3주차에 세운 목표도 최대한 지키고자 하였고, 코드리뷰와 우테코에서 주신 피드백과 요구사항들을 고려하며 3주차 과제를 진행했습니다. 그럼 이제 과제를 진행하며 겪었던 일과 새롭게 배운 개념에 대해 얘기해보고자 합니다.

---

2주차 코드리뷰 중 2번이나 들었던 이야기가 `일급 컬렉션을 써보는 것은 어떨까요?`였습니다.  
**일급 컬렉션**에 대해 들어보지 못했기에 3주차 과제를 진행하기전에 구글링을 하며 개념을 익혔습니다.

### 일급 컬렉션이란?

간단하게 말하면 특정 컬렉션을 감싸고(`Wrapping`) 다른 멤버 변수가 없는 상태로 설계된 클래스입니다.

설명보단 코드로 보여주는게 더 빠를거 같아 코드를 같이 봅시다.

```java
public class Lotto {
    private final List<Integer> numbers;

    public Lotto(List<Integer> numbers) {
        validate(numbers);
        this.numbers = numbers;
    }

    private void validate(List<Integer> numbers) {
        if (numbers.size() != 6) {
            throw new IllegalArgumentException("[ERROR] 로또 번호는 6개여야 합니다.");
        }
    }

    // TODO: 추가 기능 구현
}
```

이 `Lotto` 클래스를 사용해 구현하며, `numbers`이외의 필드는 추가할 수 없다는 요구사항이 있었습니다.

**일급 컬렉션**을 공부하고 나서, 이 코드를 보니 `엇! 이 코드는 일급 컬렉션이네`하며 반가웠습니다.

저는 아래와 같이 구현하였습니다.

```java
public class Lotto {
    private static final int LOTTO_NUMBERS_SIZE = 6;
    private static final int LOTTO_NUMBER_MIN = 1;
    private static final int LOTTO_NUMBER_MAX = 45;

    private final List<Integer> numbers;

    public Lotto(List<Integer> numbers) {
        validate(numbers);
        Collections.sort(numbers);
        this.numbers = numbers;
    }

    private void validate(List<Integer> numbers) {
        validateSize(numbers);
        validateDuplicate(numbers);
        validateRange(numbers);
    }

    private void validateSize(List<Integer> numbers) {
        if (numbers.size() != LOTTO_NUMBERS_SIZE) {
            throw new IllegalArgumentException("[ERROR] 로또 번호는" + LOTTO_NUMBERS_SIZE + "개여야 합니다.");
        }
    }

    private void validateDuplicate(List<Integer> numbers) {
        Set<Integer> nonDuplicateNumbers = new HashSet<>(numbers);
        if (nonDuplicateNumbers.size() != LOTTO_NUMBERS_SIZE) {
            throw new IllegalArgumentException("[ERROR] 로또 번호는 중복될 수 없습니다.");
        }
    }

    private void validateRange(List<Integer> numbers) {
        for (Integer number : numbers) {
            if (isInValidNumber(number)) {
                throw new IllegalArgumentException(
                        "[ERROR] 로또 번호는 " + LOTTO_NUMBER_MIN + " 이상 " + LOTTO_NUMBER_MAX + " 이하여야 합니다.");
            }
        }
    }

    private boolean isInValidNumber(Integer number) {
        return number < LOTTO_NUMBER_MIN || number > LOTTO_NUMBER_MAX;
    }
}
```

`Lotto`클래스는 로또 번호를 `numbers`컬렉션으로 관리하면서 유효성 검증과 오름차순 정렬 로직을 포함하고 있습니다. 컬렉션을 감싸고 필요한 로직을 구현함으로써 **무결성**유지, **응집도**증가, **불변성**이 유지됩니다.

1. `Lotto` 객체가 생성될 때, 항상 `1~45`범위의 `6`개의 중복없는 숫자이며 오름차순으로 정렬되도록 보장해줍니다.
2. 유효성 검증, 정렬 로직이 한 클래스에 작성되어있어 응집도가 증가합니다.
3. `Lotto`클래스는 단순히 값을 저장하고 외부에서 직접 수정이 불가능하여 불변성이 유지됩니다.

이렇게 저는 이번 3주차 과제에선 **일급컬렉션** 개념을 되새기며 적용해보았습니다.

이 개념을 공부하면서 이해가 쏙쏙 되게 해주었던 향로님 블로그 글도 공유드립니다!  
출처 : [일급 컬렉션의 소개와 써야할 이유](https://jojoldu.tistory.com/412)

<br>

### Enum으로 관리 (로또 당첨 기준과 금액)

**로또 당첨 기준과 금액**을 관리하기 위해 `Enum`을 사용했습니다.  
`Enum`은 허용 가능한 값들을 제한 가능하며, 각 값에 특정 의미를 부여할 수 있습니다.

`Enum`을 사용함으로써 얻은 이점에 대해 얘기해보고자합니다.

> 1등 : 6개 번호 일치 / 2,000,000,000원  
> 2등 : 5개 번호 + 보너스 번호 일치 / 30,000,000원  
> 3등 : 5개 번호 일치 / 1,500,000원  
> 4등 : 4개 번호 일치 / 50,000원  
> 5등 : 3개 번호 일치 / 5,000원

```java
public enum LottoPrize {
    FIFTH(3, false, 5_000),
    FOURTH(4, false, 50_000),
    THIRD(5, false, 1_500_000),
    SECOND(5, true, 30_000_000),
    FIRST(6, false, 2_000_000_000);

    private final int matchCount;
    private final boolean bonusMatch;
    private final int prizeAmount;

    LottoPrize(int matchCount, boolean bonusMatch, int prizeAmount) {
        this.matchCount = matchCount;
        this.bonusMatch = bonusMatch;
        this.prizeAmount = prizeAmount;
    }

    //...
}
```

- **타입 안전성**  
  1등부터 5등까지의 당첨 기준과 금액을 명확하게 정의하고, 다른 값이 입력될 경우를 막아주고 타입 안전성을 보장할 수 있습니다. 즉 1~5등 외에 다른 당첨 기준이 사용될 수가 없다는 것입니다.

#### 아쉬운점

- 당첨되지 않은 경우도 `enum`으로 관리했다면 어땠을까?

  코드 리뷰를 남겨드리며, 당첨되지 않은 경우도 관리해주신 것을 보고 `나도 그랬다면 모든 당첨 결과를 관리할 수 있었을텐데`하며 아쉬움이 남았습니다.

<br>

### 작은 단위부터 테스트해보기

이번 3주차에는 중요 기능들을 구현한 후에 테스트코드를 바로 작성하여 검증을 하였습니다.

- `LottoTest` : 올바른 로또 번호를 가지는지 테스트

  - 유효한 경우 예외를 잘 발생시키는지

- `LottoTicketGroupTest` : 여러 장의 로또 티켓이 잘 저장되는지 테스트

- `WinningPrizeTest` : 당첨 내역이 정확히 일치하는지 테스트

> 보너스 번호 일치 여부 문제점 발견  
> 당첨번호 일치 + 보너스 번호 일치 → `bonusMatch`를 시킴
>
> (문제점) 3개 번호 일치 + 보너스 번호 일치하면 `bonusMatch`가 되어버림  
> (수정) 5개 번호 일치 + 보너스 번호 일치 → `bonusMatch`가 됨  
{: .prompt-warning }

- `WinningStatisticsTest` : 수익률 계산 값이 잘 출력되는지 테스트

이와 같이 테스트를 진행했고, 그 과정 속에서 제 코드의 오류 부분도 찾아냈었습니다. 옳게 돌아간다고 생각했던 코드가 제대로 돌아가지 않는 상황을 마주치게 되자 테스트코드의 소중함을 깨닫게 되었습니다.

테스트코드를 짜서 확인받지 않았더라면 전 올바르지 않은 로직으로 진행했을테니까요.

테스트 코드를 짜면서 느꼈던 점은 일일히 `Main`에서 실행시켜보며 여러가지 경우를 확인해보지 않아도 바로 기능을 구현 후 테스트 코드를 짜서 맞게 기능구현을 한건지 확인해 볼 수 있어 좋았습니다.  
하지만 무언갈 테스트하려할때, 어떤 테스트 코드를 짜는게 알맞을지 아직은 어려운것 같아 점차 알맞은 테스트 코드를 짜나가고 싶어졌습니다.

<br>

### 전체적인 로또 발매기 프로그램 흐름도

제가 구현한 로또 발매기 프로그램 흐름도는 다음과 같습니다.

![프로그램 전체 흐름](/assets/img/lotto_machine_full_flow_image.jpg)

---

### 3주차를 끝낸 후

이번 3주차 목표였던 작은 단위부터 테스트해보기는 잘 달성하였다고 생각합니다. 아직 테스트코드에 대해서 낯설고 어렵지만, 제가 작성한 주요 기능들을 테스트해봄으로써 제 코드의 확신과 안정감을 얻게 되었습니다. 그 경험이 신기했고, 앞으로도 테스트코드를 잘 활용할 수 있도록 손에 익혀야겠다고 생각이 들었습니다.

다음으로 `enum`활용하기는 아쉬운 부분도 있었고, 예외 메시지도 `enum`으로 관리하면 좋겠다는 생각이 들었습니다. 하지만 이번 3주차 과제를 진행하며 기능구현에 시간을 많이 쏟는 바람에 예외처리를 제대로 진행하지못했고, 제출이 얼마남지 않은 시간에 급하게 예외처리를 진행했었습니다. 그러다보니, 예외처리 구현이 제대로 되지 않았고, 테스트코드도 통과되지 못했습니다😭

테스트코드가 통과되지못하면 0점인데,, 시간 분배를 못한 제 자신도 반성해야겠죠ㅠㅠ  
제출한 뒤, 너무 아쉬움이 컸고, 제 자신이 미웠습니다.  
하지만 이미 제출하였고 돌이킬수없기에 4주차 과제에 온전히 몰입하고자 합니다.

이번 3주차 과제도 순식간에 후딱 지나가버린것같아요. 마지막까지 화이팅해서 잘 마무리하겠습니다!
