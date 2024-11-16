---
title: "[우테코 프리코스 4주차 회고] 기능구현 뫼비우스 띠에 갇힘"
date: 2024-11-15 00:47:00 +09:00
categories: [Woowacourse]
tags: [woowacourse]
pin: true
image:
  path: /assets/img/woowacourse_week4.png
  alt: [우테코 7기 프리코스 4주차 회고]
---

4주차 미션을 보고 처음으로 든 생각은 `이걸 어떻게 구현하지?`하며 처음 보는 요구사항에 많이 당황했었습니다.  
그래도 일단 부딪혀보자. 하며 무작정 뛰어 들었습니다.

그렇게 마주한 첫번째 벽은 **구현에 필요한 상품 목록과 행사 목록을 파일 입출력을 통해 불러온다.** 였습니다.

일단 불러와야 기능구현을 시작할 수 있을 것 같아 파일 입출력에 대해 검색해보았습니다.

java에서 파일 입출력 기능을 제공해주는 것들에  
`FileReader`, `Scanner`, `BufferedReader` 등이 있는데, 전 `BufferedReader`를 활용하였습니다.

### BufferedReader

버퍼를 사용하여 파일을 한 번에 한 줄씩 읽을 수 있습니다.

여기서 버퍼의 개념은 다음과 같습니다.

- 데이터를 한 곳에서 다른 한 곳으로 전송하는 동안 일시적으로 그 데이터를 보관하는 메모리 영역

쉽게 얘기하자면 데이터 하나 하나씩 전달하는 것이 아닌 한뭉탱이로 전달하는 방식이라 오히려 더 빠르다는 것입니다.

#### BufferedReader 사용법

- 선언
  - `BufferedReader reader = new BufferedReader(new FileReader(PRODUCTS_FILE_PATH))`
- 한 줄씩 읽기
  - `String line = reader.readLine()`
- 꼭 예외처리 해주기 (전 try ~ catch를 사용하였습니다)
  - try ~ catch 사용
  - throws IOException 사용

```java
public class DataFileReader {
    private static final String PRODUCTS_FILE_PATH = "src/main/resources/products.md";

    public static List<Product> readProducts(Map<String, Promotion> promotions) {
        List<Product> products = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(PRODUCTS_FILE_PATH))) {
            String line;
            reader.readLine(); //첫 문장 넘어가기
            while ((line = reader.readLine()) != null) {
                addProduct(products, line, promotions);
            }
        } catch (IOException e) {
            System.out.println("[ERROR] 상품 목록 파일을 읽는데에 실패하였습니다.");
        }
        return products;
    }

    //...
}
```

#### 주의할 점

`readLine()` 반환 타입이 `String`이라는 점입니다.  
따라서 `String`이 아닌 다른 타입으로 반환받고 싶다면 형변환을 해주어야합니다.

```java
//readLine() 기능
    public String readLine() throws IOException {
        return readLine(false, null);
    }
```

#### 돌아보며..

`BufferedReader`를 사용하여 데이터들을 가져와줬습니다!  
근데 데이터에 작성되어져있지않지만, 출력형식에는 출력되어야하는 부분이 있었습니다.  
바로 재고가 없는 경우인데요!

```
- 오렌지주스 1,800원 재고 없음
- 탄산수 1,200원 재고 없음
```

오렌지 주스와 탄산수는 상품명과 가격을 출력해주되 재고없음 또한 출력이 되어져야했습니다.

```
오렌지주스,1800,0,null
탄산수,1200,0,null
```

이런식으로 전 `/products.md`파일에 값을 수정하였습니다.  
`quantity`값이 `0`인 경우는 `재고 없음`으로 출력되게끔 하기 위해서였죠...  
또한 입출력 요구사항에 **내용의 형식을 유지한다면 값은 수정할 수 있다.** 로 작성되어져있었기 때문입니다.

하지만 본인 스스로 `.md`파일에 있는 값을 수정하는 것이 아니라, 파일을 읽어올때 되게끔 했어야했던거죠.  
이 부분에 있어서 다시 한번 구현해볼 때, 생각해볼 부분입니다.

**[참고한 블로그 글]**

- [[Java] 📚 BufferedReader / BufferedWriter를 활용한 빠른 입출력](https://livebyfaith117.tistory.com/108)
- [[Java] 텍스트 파일 읽기 ( FileReader, BufferedReader, Scanner, Files )](https://hianna.tistory.com/587)
- [[Java/자바] BufferedReader를 사용한 파일 읽기](https://seoulitelab.tistory.com/entry/Java%EC%9E%90%EB%B0%94-BufferedReader%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%9C-%ED%8C%8C%EC%9D%BC-%EC%9D%BD%EA%B8%B0)
- [[JAVA] 버퍼란? BufferedReader/Writer란? + 예제](https://onlyfor-me-blog.tistory.com/368)

---

### 재고관리와 프로모션 할인 기능

저는 재고관리 기능과 프로모션 할인 기능이 밀접하게 관련이 있다고 생각했습니다.

![재고관리와 프로모션 할인 기능](/assets/img/inventory_promotion_function.jpg)

1. 사용자가 구매할 상품명과 수량을 입력
2. 해당 상품이 프로모션 할인 상품인지? 아닌지? 확인  
   2-1. `promotion`값이 `null`이 아니고, `promotion` 기간 내에 포함하는지 확인
3. **`promotion`값이 `null`이 아니고, 프로모션 기간 내에 포함**  
   3-1. 사용자가 구매할 수량만큼 프로모션 재고 수량이 있는지 체크  
   3-2. 프로모션 재고 수량이 있음  
   3-3. 고객이 해당 수량만큼 가져오지 않았을 경우, 혜택에 대한 안내 메시지 출력  
   3-4. `Y`라면 수량 추가 후 할인 적용. `N`라면 할인없이 계산
4. **`promotion`값이 `null`이 아니고, 프로모션 기간 내에 포함**  
   4-1. 사용자가 구매할 수량만큼 프로모션 재고 수량이 있는지 체크  
   4-2. 프로모션 재고 수량이 부족함  
   4-3. 일부 수량을 정가로 결제해야함을 안내 메시지 출력  
   4-4. `Y`라면 일반 재고에서 결제, `N`라면 할인이 안되는 일부 수량은 제외 후 결제
5. **`promotion`값이 `null`이 아니고, 프로모션 기간 내에 포함 X**  
   5-1. 일반 재고 계산으로 처리

<br>

**일반 재고 계산** - 사용자가 구매할 수량만큼 일반 재고 수량이 있는지 확인

1. 일반 재고 수량 >= 사용자가 구매할 수량 : 계산 진행 (재고 차감)
2. 일반 재고 수량 < 사용자가 구매할 수량 : 재고 수량 초과함을 안내하고 다시 입력받음

따라서 저는 프로모션 할인이 제공되었을때 재고관리 기능이 쓰이고,  
일반적인 경우도 재고관리 기능이 쓰이므로, 둘이 밀접하다고 생각하였습니다.

왜냐하면 재고 차감이라든지 재고 부족한 경우 처리 기능이 **재고관리** 이 친구가 담당해야한다고 생각했기 때문입니다.

#### 부딪힌 문제점들

- 프로모션 재고 수량 체크  
  프로모션 재고 수량을 체크할 때, 정확한 재고 수량을 못 불러오는 문제
- 일반 재고와 프로모션 재고 수량 관리를 못한 점
- 한 클래스가 너무 많은 기능을 가지고 있음

밀접하게 관련이 있다고 생각이 들어 2개의 기능을 함께 구현했었습니다.  
그러다보니 `Promotion`은 프로모션 기능을 담당해야하는데, 어느새 보면 재고 계산 기능 또한 포함되어져있고, 재고 계산 기능에서는 프로모션에 관한 기능도 작성되어져버리는 그런 상황까지 와버린 것입니다.

또한, 피드백으로 주신 점을 지키려고 하다보니 더욱더 어려웠습니다.

- 객체는 객체답게 사용한다.
- 필드의 수를 줄이기 위해 노력한다.

`Product`와 `Promotion` 클래스가 있는데, 너무 많은 메서드가 생성이 되었고,  
서로 너무 밀접하게 관련이 되어져버리고, 필드 수도 늘어나고...  
바로 총체적인 난국이었죠.

점점 제가 무슨 코드를 짜고있는지 모르는 상황까지 오게 되어버린겁니다.

설계의 중요성을 깨달았고, 다른 방식으로 풀어봐야겠다고 생각하였습니다.  
꼭 4주차 과제의 이 기능들은 구현해보고자 합니다.

---

### 멤버십 할인 기능

- 멤버십 회원은 프로모션 미적용 금액의 30%를 할인받는다.
- 프로모션 적용 후 남은 금액에 대해 멤버십 할인을 적용한다.
- 멤버십 할인의 최대 한도는 8,000원이다.

```java
import camp.nextstep.edu.missionutils.Console;

public class MembershipDiscountManager {
    private static final double DISCOUNT_RATE = 0.3;
    private static final int MAX_DISCOUNT_AMOUNT = 8000;

    public boolean isMembershipDiscountApplicable() {
        System.out.println("멤버십 할인을 받으시겠습니까? (Y/N");
        String response = Console.readLine().toUpperCase();
        return response.equals("Y");
    }

    private int calculateDiscount(int amountAfterPromotion) {
        if (amountAfterPromotion <= 0) {
            return 0;
        }
        int discount = (int) (amountAfterPromotion * DISCOUNT_RATE);
        return Math.min(discount, MAX_DISCOUNT_AMOUNT);
    }

    public int applyMembershipDiscount(int amountAfterPromotion) {
        if (!isMembershipDiscountApplicable()) {
            return 0;
        }
        return calculateDiscount(amountAfterPromotion);
    }
}
```

1. 사용자에게 멤버십 할인 적용 여부를 입력 받는다.  
   1-1. 할인을 적용(`Y`)한다면 멤버십 할인 진행  
   1-2. 할인을 적용하지 않는다(`N`)면 멤버십 할인 진행 x

2. 멤버십 할인 최대한도는 8,000원이다.  
   `Math.min(discount, MAX_DISCOUNT_AMOUNT)`해줌으로써, 만약 할인 값이 최대한도를 넘으면 최대한도까지만 할인이 되도록 해주었다.

---

### 4주차를 끝낸 후

구현을 하면 할수록 코드가 복잡해지고, 나 조차 이해가 안되는 상황에 맞닥뜨렸다.  
다시 지우고 또 지우고 또 지우고 하며 이게 아닌데..하는 순간을 많이 마주쳤다.  
`구현해보자` → `왜 안되는거지?` → `이렇게는 될까?` → `안돌아가네` → `그럼 이렇게?`하며 뫼뵈우스의 띠에 갇힌것처럼 계속 이 상황이 반복되었었다.

**재고관리**, **프로모션할인** 기능 구현이 막혀있다보니 앞으로 나아갈 수가 없었다.  
그래서 일단 **멤버십 할인**기능으로 넘어가 구현했었었는데, 다시 돌아와도 계속 막혀있었다.

그렇게 시간은 어김없이 흘렀고, 제출일이 다가왔다.  
망연자실한 상태로 제출에 의의를 두자.하며 제출했다.

시간이 야속했고, 구현을 못해내는 내 자신에게도 화가났다.

그렇지만 내가 좋아하는 말이 있다.  
`그냥 해. 안되면 울어. 그리고 다시해`

현재 내 부족함에 대해 마주보게 됐고 이제 남은 시간을 어떻게 보낼지에 더 집중해보자라고 생각이 바뀌었다.

#### 다음 단계 목표

우선순위별로 세워보았고, 다음과 같다.

- 1주차 ~ 4주차 미션 다시 구현해보기

  - 코드리뷰 + 우테코 피드백 + 요구사항들을 최대한 반영
  - 프로그램의 전체 그림을 보는데에 눈 기르기

- 예외 처리 꼼꼼히 해보기
- 테스트코드 작성 해보기
- 위의 것들이 다 되었다면 5시간 제한을 두고 풀어보기

<br>

이미 과제 제출은 끝났고, 1차 합격자 발표까지 후회없이 시간을 보내고자 한다.  
그렇다면 어떤 결과가 나오든 이 시간동안 얻은 경험들이 값질 것이라 생각한다.  
계속해서 성장해나가는 내 모습이 자랑스럽고, 이걸 경험할 수 있게 해준 우테코에도 감사하다.

그럼 끝까지 화이팅해보자!
