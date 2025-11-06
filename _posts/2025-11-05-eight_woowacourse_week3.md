---
title: "[우테코 프리코스 3주차 회고] 피드백을 내껄로 만들자"
date: 2025-11-05 23:05:00 +09:00
categories: [Woowacourse]
tags: [woowacourse]
pin: true
---

## 내가 작성한 코드의 잘못된 부분을 빠르게 흡수하자.

1~2주차 동안 코드를 작성하고 리뷰를 받으며 느낀 점이 있다.  
나와 다른 시각을 가진 사람이 많다는 것, 그리고 더 나은 방식은 언제나 존재한다는 것이다.  
리뷰를 받는 순간에는 아쉬운 부분도 있었지만, 결국 그 피드백 덕분에 내 코드는 조금씩 성장할 수 있었다.

이번 3주차 과제를 진행하면서 내가 가장 집중했던 부분은  
바로 **Service 계층이 View에 의존하면 안된다**는 점이었다.  
이건 단순한 구조 문제가 아니라, 프로그램의 전체적인 의존성 방향과 책임 분리의 핵심이라는 걸 깨달았다.

처음에는 솔직히 "왜 의존시키면 안되지?"라는 의문점이 있었다.  
그래서 이 내용을 스터디 시간에 함께 나누고 싶은 주제로 가져가 보기로 했다.

![2주차_스터디_주제](/assets/img/wooteco_study_topic.png)

스터디원 분들과 이야기를 나누면서 **GRASP 패턴**의 Controller 개념에 대해서도 알게 되었다.

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **GRASP 패턴의 Controller**  
> 사용자 입력을 받아 처리하고 시스템의 흐름을 조절하는 책임을 가진 클래스에게 해당 패턴을 적용한다.  
> 주로 사용자 인터페이스 이벤트나 시스템의 흐름을 제어하는 데 사용된다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

service는 비즈니스 로직을 담당하는 친구인데, 입/출력까지 신경쓰게 하는 건 그 친구의 책임이 아니라는 점을 명확히 이해할 수 있었다.

+) 여담으로, 리뷰에서도 많은 분들이 "**Service 계층이 View를 의존하게 하면 안된다**"라는 피드백을 주셨다.  
이 피드백이 이번 주 리팩토링의 출발점이 되었다.

![2주차_피드백](/assets/img/week_2_feedback.jpg)

---

## 과제를 진행하며 지키고자 했던 부분들

- 검증은 검증 주체가 직접 수행하도록 하자.
- service 계층의 역할과 view의 의존성을 조심하자.
- Application에서 모든 의존관계를 주입시키자.
- 우테코의 공통 피드백을 반영하자.
  - 한 메서드는 한 가지 일만 하도록 (15라인 이내)
  - indent depth는 3을 넘지 않도록 하기

이렇게 정해두고 3주차 과제를 진행했다.  
이제 이 기준들을 실제로 코드에 어떻게 녹여냈는지 구체적으로 이야기해보려 한다.

---

## 검증은 검증 주체가 직접 수행하도록 하자

이전 과제에서는 `validator` 패키지에 검증 로직을 모아두고, 입력을 받으면 그 검증 함수를 호출하는 방식으로 구현했다. 하지만 코드리뷰를 통해 중요한 피드백을 받았다.  
검증을 외부에 두면 그 도메인 객체를 사용하는 다른 개발자가 검증을 호출하는 것을 잊을 수 있고,  
결국 검증이 누락된 채 도메인 객체가 사용될 위험이 있다는 점이었다.  
사람은 흔히 "이 객체는 이미 유효한 상태일 것"이라고 가정하기 쉽기 때문이다.

그래서 나는 이번 과제에서 다음과 같이 구현했다.  
도메인 객체가 생성될 때 스스로 유효성 검사를 거쳐 **항상 유효한 상태의 객체**만 만들어지도록 변경했다.

- `PurchaseAmount`
  - 금액의 규칙(0 아님, 음수 아님, 단위로 나누어떨어짐)을 검증

```java
public class PurchaseAmount {

    private final int amount;

    public PurchaseAmount(String inputAmount) {
        validateEmpty(inputAmount);

        int parsedAmount = parseToInt(inputAmount);
        validateAmountRules(parsedAmount);
        this.amount = parsedAmount;
    }

    private void validateAmountRules(int amount) {
        validateZero(amount);
        validateNegative(amount);
        validateDivisible(amount);
    }
}
```

- `WinningNumbers`
  - 입력 문자열을 파싱해 Lotto로 만들고, 로또 규칙(크기, 중복 범위)을 Lotto 내부에서 검증

```java
public class WinningNumbers {

    private final Lotto lotto;

    public WinningNumbers(String input) {
        validateInput(input);
        List<Integer> numbers = parseNumbers(input);
        this.lotto = new Lotto(numbers);
    }

    private void validateInput(String input) {
        validateNotBlank(input);
        validateDelimiter(input);
        validateNumericValues(input);
    }
}
```

- `BonusNumber`
  - 범위 검사와 당첨번호와의 중복 검사 수행

```java
public class BonusNumber {

    private final int number;

    public BonusNumber(String input, WinningNumbers winningNumbers) {
        validateInput(input);
        this.number = parseNumber(input);
        validateRange();
        validateDuplicate(winningNumbers);
    }
}
```

이 방식의 장점은 분명했다.

도메인 객체는 생성된 순간부터 '검증 완료된 객체'이기에, 다른 코드가 해당 객체를 사용할 때 추가 검증 없이 안전하게 다룰 수 있었다.

하지만 돌아보니 이 구조에도 아쉬움이 남았다. 그 이유는 다음과 같다.

![2주차_피드백](/assets/img/lotto_game_domain.jpg)

<br>

**1. 중복된 입력 포맷 검증이 여러 곳에 반복되었다.**

- "빈 값인지", "숫자 형식인지" 같은 기본적인 포맷 검증이 여러 생성자에서 중복으로 구현되어 있다.
- 같은 검증 로직이 여기저기 흩어지니 유지보수 측면에서 안 좋은 코드라 생각이 들었다.

**2. 에러 메시지가 모호하게 중복되었다.**

- `WinningNumbers`와 `Lotto`가 사실상 같은 '로또 형식'을 다루는 친구들인데, 포맷 검증과 도메인 검증이 섞이면서 비슷한 상황에 대해 미묘하게 다른 메시지들이 나왔다.
- 결과적으로 "어디서 에러가 발생했는지"가 불명확해지는 순간이 있었다.

지금 구현은 안전하긴 했지만, 더 깔끔하게 만들려면 **검증 책임을 역할에 맞게 분리**하는 편이 좋겠다는 결론을 내렸다. 실제 리팩토링을 다시 하게 된다면 다음과 같은 원칙을 적용할 것이다.

- 입력 포맷 검증(빈 값, 숫자 형식 등)은 View에서 다룬다.
- 도메인 불변식(크기, 중복, 범위, 비즈니스 규칙 등)은 도메인 객체가 책임진다.
  - 도메인은 자신만의 규칙을 검증해 항상 유효한 상태를 보장한다.

이번 구현을 통해 "도메인 객체가 스스로 유효성을 보장해야 안전하다"는 점을 체감했지만, 다시 돌아보니 "입력 검증과 도메인 검증을 역할에 맞게 분리하면 더 명확하고 유지보수 하기 쉽다"는 것도 깨달았다.

---

## service 계층의 역할과 view의 의존성을 조심하자

이번 과제를 진행하면서 **Service 계층이 View에 의존하지 않도록 하는 구조의 중요성**을 많이 느꼈다.  
이전에는 Service 안에서 사용자 입력을 받는 코드가 섞여 있었다.  
하지만 그렇게 되면 Service가 비즈니스 로직 뿐만 아니라 입출력까지 책임지게 되고, 결국 Service가 View와 강하게 결합되어 책임이 불명확해지고, 테스트 용이성이 떨어지게 된다.

그래서 구조를 다음과 같이 변경했다.

```java
public class LottoController {

    private final InputView inputView;
    private final OutputView outputView;
    private final LottoGameService lottoGameService;

    public LottoController(InputView inputView, OutputView outputView, LottoGameService lottoGameService) {
        this.inputView = inputView;
        this.outputView = outputView;
        this.lottoGameService = lottoGameService;
    }

    public void start() {
        List<Lotto> purchased = requestPurchase();
        WinningNumbers winningNumbers = requestWinningNumbers();
        BonusNumber bonusNumber = requestBonusNumber(winningNumbers);

        LottoGameResult result = lottoGameService.generateResult(purchased, winningNumbers, bonusNumber);
        outputView.printLottoResult(result.rankCounts(), result.profitRate());
    }
}
```

```java
public class LottoGameService {

    private final LottoPurchaseService purchaseService;
    private final LottoResultService resultService;

    public LottoGameService(LottoPurchaseService purchaseService, LottoResultService resultService) {
        this.purchaseService = purchaseService;
        this.resultService = resultService;
    }

    public List<Lotto> purchaseLotto(String amount) {
        return purchaseService.purchase(amount);
    }

    public LottoGameResult generateResult(List<Lotto> purchased,
                                          WinningNumbers winningNumbers,
                                          BonusNumber bonusNumber) {
        return resultService.generateResult(purchased, winningNumbers, bonusNumber);
    }
}
```

이 구조의 핵심은 Controller와 Service의 역할 분리다.

- Controller
  - 프로그램의 흐름을 제어하고, 사용자와의 입출력을 담당한다.  
    입력값을 받고, 그 값을 Service로 전달하며, 처리 결과를 View로 출력한다.
- Service
  - 오로지 비즈니스 로직에만 집중한다.  
    "로또 구매", "당첨 결과 계산", "수익률 산출" 같은 도메인 로직을 수행하며, 어떤 입력이 들어오든 일관된 로직을 보장한다.

이렇게 나누고 나니, 구조적으로 훨씬 깔끔해졌다.

Service는 View나 콘솔 입력에 대해 전혀 알 필요가 없기 때문에, 테스트할 때도 입출력 없이 순수하게 로직만 검증할 수 있었다. 또한 Controller는 입력과 출력의 흐름에만 집중하므로, 전체 프로그램의 진행 구조를 한눈에 파악하기 쉬워졌다.

---

## Application에서 모든 의존관계를 주입시키자

이번 과제에서는 의존성 주입 구조를 조금 더 명확하게 정리했다.  
이전에는 Controller 내부에서 직접 객체를 생성했는데, 이 방식은 문제가 있다는 걸 깨달았다.

![controller_주입방식_피드백](</assets/img/week_2_feedback(2).jpg>)

피드백을 바탕으로 코드를 다음과 같이 수정했다.

```java
public class Application {
    public static void main(String[] args) {
        InputView inputView = new InputView();
        OutputView outputView = new OutputView();
        LottoNumberGenerator numberGenerator = new LottoNumberGenerator();
        LottoResultCalculator resultCalculator = new LottoResultCalculator();
        LottoPurchaseService purchaseService = new LottoPurchaseService(numberGenerator);
        LottoResultService resultService = new LottoResultService(resultCalculator);
        LottoGameService gameService = new LottoGameService(purchaseService, resultService);
        LottoController controller = new LottoController(inputView, outputView, gameService);

        controller.start();
    }
}
```

이렇게 구조를 바꾸고 나니, 각 클래스가 오직 자신의 역할에만 집중할 수 있게 되었다.  
객체 간의 관계가 한눈에 보이기 시작했고, 책임의 경계가 뚜렷해졌다.

이제 Application은 프로그램 실행을 위한 환경을 조립하는 역할을 맡고,  
Controller는 흐름을 제어하며, Service는 비즈니스 로직을 담당한다.  
자연스럽게 책임이 분리되면서 코드의 가독성과 유지보수성도 훨씬 좋아졌다.

<br>

근데 이번 3주차 코드리뷰에서 이런 피드백을 받았다.

> 👦🏻 : "의존성 생성을 Application에서 직접 하기보다는  
> 객체 생성을 전담하는 별도의 구성 클래스(AppConfig)로 분리하면 어떨까요?"

이 조언을 듣고 많은 생각을 했다.  
AppConfig를 두면 객체 생성과 의존 관계 설정을 한곳에 모을 수 있어서 유지보수가 훨씬 편리해진다.  
예를 들어, 특정 서비스의 구현체를 교체해야 한다면 AppConfig 내부 코드만 수정하면 된다.

하지만 한편으로는 이런 생각도 들었다.  
AppConfig가 하는 일이 결국 Application과 동일한 역할 아닌가?  
굳이 두 개의 클래스로 나눌 필요가 있을까?

<br>

결국 지금의 내 결론은 이렇다.

"프로젝트의 규모가 작다면 `Application`에서 직접 의존성을 주입해도 충분하다.  
하지만 규모가 커지고 의존성이 복잡해질수록 객체 생성을 전담하는 AppConfig 같은 설정 클래스를 두는 편이 유지보수에 유리하다."

---

## 우테코의 공통 피드백을 반영하자

우테코의 공통 피드백과 프로그래밍 요구사항을 최대한 지키려고 노력했다.  
하지만 완벽하게 지켜내진 못했다 😭

그 중 하나가 바로 아래 코드였다.

```java
public enum Rank {

    private static Rank getRank(int matchCount, boolean bonusMatch) {
        if (matchCount == 6) {
            return FIRST;
        }
        if (matchCount == 5 && bonusMatch) {
            return SECOND;
        }
        if (matchCount == 5) {
            return THIRD;
        }
        if (matchCount == 4) {
            return FOURTH;
        }
        if (matchCount == 3) {
            return FIFTH;
        }
        return NONE;
    }
}
```

바로 `Rank` 클래스의 순위 판정 로직이다.  
`matchCount`와 `bonusMatch` 값을 기반으로 등수를 판단하는데  
보시다시피 15줄이 훌쩍 넘는다. (요구사항 못 지킴🥲)

사실 이걸 구현하면서 "이 방식 말고 다른 방법이 있을까?" 싶었는데,  
도저히 떠오르지가 않았다.

<br>

그런데 3주차 코드리뷰를 받으며 완전히 새로운 접근법을 배웠다.  
리뷰어 분께서 보여주신 방식은 바로 **Enum의 다형성을 활용하는 방법**이었다.

![override_방식](/assets/img/week_3_feedback.png)

이 방식은 if문이 사라지고,  
각 순위가 스스로 자신의 조건을 정의하도록 설계되어 있다.

덕분에 `getRank()`처럼 조건문이 필요없고, 각 상수의 책임이 명확해진다.

이 코드를 보며 '아, Enum도 이렇게 객체처럼 다형성을 가질 수 있구나'라는 걸 실감했다.  
결국 내가 놓쳤던 건 단순히 '조건문을 줄이는 기법'이 아닌, 객체가 스스로의 행동을 정의하도록 만드는 설계적 사고였다.

---

## 마무리

3주차 과제를 진행하면서 느낀 점이 많았다.  
이전 주차들보다 훨씬 신경 써야 할 부분이 많아졌고, 우테코의 공통 피드백과 요구사항을 지키기 위해 한 줄 한줄을 더 신경써서 작성하게 되었다.

그 과정에서 코드 설계에 대한 고민도 달라졌다.  
'책임이 명확한 코드'를 쓰기 위해 계속해서 스스로에게 질문을 던졌다.  
지난 몇 주간 받은 소중한 코드리뷰들 덕분이다.  
이 자리를 빌려 제 코드를 봐주신 리뷰어분들께 진심으로 감사드린다💗

<br>

그래서인지 이번 과제가 끝난 후에는,  
나도 다른 사람들의 코드를 더 많이 보고 싶다는 생각이 들었다.  
다양한 시각을 접할수록 내 코드의 방향도 넓어진다는 걸 느꼈기 때문이다.

![3주차_코드리뷰_인원](/assets/img/code_review_people.png)

이틀 동안 무려 20분의 코드리뷰를 진행했다.  
(솔직히 말하면.. 하루 종일 다른 사람의 코드를 보는 건 꽤 힘들었다 🥲)

그래도 덕분에 다른 사람들의 설계 방식, 깔끔한 폴더 구조, 읽기 좋은 코드 스타일, 정성스러운 README 등 정말 많은 걸 배웠다.

<br>

이제 남은 건 오픈 미션이다.  
무슨 주제로 할지 오랫동안 고민했지만, 드디어 방향을 정했다.  
그 이야기는 다음 블로그 글에서 다뤄볼 예정이다.

3주차 과제는 잠시 털어두고, 마지막 미션에 집중하려 한다.  
끝까지 최선을 다해, 후회 없는 프리코스를 마무리하고 싶다.

---

- 깃허브 링크 : [java-lotto-8](https://github.com/sihyun10/java-lotto-8){: target="\_blank"}
