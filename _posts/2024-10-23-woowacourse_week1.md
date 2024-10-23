---
title: "[우테코 프리코스 1주차 회고] 문제 해결의 첫 걸음"
date: 2024-10-24 01:49:40 +09:00
categories: [Woowacourse]
tags: [woowacourse]
pin: true
image:
  path: /assets/img/woowacourse_week1.png
  alt: [우테코 7기 프리코스 1주차 회고]
---
  
프리코스를 진행하면서 느낀점, 어떤 고민들이 있었는지, 문제 해결 과정 등을 회고글에 담아보려한다.   

과제를 딱 받고, 처음 요구사항을 읽었을때, 까마득한 느낌을 받았다.  
글로 읽었을땐, `이렇게 하면 되겠는데~`했지만, 막상 머릿속으로 어떻게 구현해나갈지 상상하니,   
어디서부터 손대야할지 우왕좌왕했다.  

하지만 일단 go! 하면서  
- **기능을 구현하기 전 구현할 기능 목록을 정리**해 추가한다.  

라는 과제 진행 요구 사항을 보고 기능 목록을 정리하였다.  

그렇게 **문자열 덧셈 계산기** 구현 목록을 작성하게 되었다.   

<br>  

![프로그램 전체 흐름](/assets/img/full_flow_image.jpg)  

내가 생각했던 기능들을 `class`로 나누어 생각했다.  

1) 사용자의 입력 값 유효성 검사 기능 (`UserInputValidator`)  
2) 구분자를 기준으로 문자열을 나누어 숫자 추출하는 기능 (`DelimiterSplitter`)  
3) 더하는 기능 (`AddCalculator`)  

그렇게 class 별로 하나씩 구현해 나가던 중...  
나의 발목을 잡던 순간이 있었다.  

<br>

## [문제 발생] **CustomDelimiter**(커스텀 구분자) 인식 문제  

<!-- markdownlint-capture -->
<!-- markdownlint-disable --> 
> 기본 구분자(`,` 또는 `:`) 외에 커스텀 구분자를 지정할 수 있다.  
> 커스텀 구분자는 문자열 앞부분의 `//`와 `\n` 사이에 위치하는 문자를 커스텀 구분자로 사용한다.    
{: .prompt-tip }

<!-- markdownlint-restore -->

```java
//기능을 구현하며, Main코드에서 잘 작동하는지 체크하였는데, 오류를 맞닥뜨림
public class Application {
    public static void main(String[] args) {
        String input = Console.readLine();
        DelimiterSplitter splitter = new DelimiterSplitter(input);
        String[] splitResult = splitter.split(); //NumberFormatException 발생
        System.out.println(Arrays.toString(splitResult));
    }
}
```

이와 같이 `Console.readLine()`을 사용하여 사용자에게 입력값을 받을때, 커스텀 구분자 중 `\n`이 있기에 개행문자로 인식을 해서 커스텀 구분자가 제대로 구분이 되지않았었다.  

`뭐가 잘못된걸까..` 한참을 고민하다 `\n`을 사용자가 입력하면 텍스트 그 자체로 인식하게 하면 커스텀 구분자형식을 제대로 읽어들여서 `split()`을 할 수 있다고 생각했다.   

아래와 같은 방법을 사용하여 이 문제를 해결하였다.  

```java
String replacedInput = input.replace("\\n", "\n");
```

<br>

## 예외 처리 해결  
사용자가 공백이나 스페이스바가 많이 눌러지게 되어 아무값도 입력 안하고 입력되는 경우를 예외처리하고 있었다.   
그러던 중 java에서 문자열이 공백인지 알려주는 `isEmpty()`, `isBlank()`메서드들을 제공한다는 것을 알게 되었다.

**isEmpty() vs isBlank()**   
- isEmpty() : 문자열이 `""`, `null`인 경우 `true` 반환
- isBlank() : 문자열이 `""`, `"    "`, `null`인 경우 `true` 반환

`isBlank()`가 내가 원하는 예외처리에 알맞아 이 메서드를 쓰게 되었다.  
프리코스를 진행하며 새롭게 알게된 `isBlank()`메서드였다.  

<br>  

예외처리를 하면서 `IllegalArgumentException`에 대해서도 알게 되었다.  
(**기능 요구사항**에 이와 같이 **사용자가 잘못된 값을 입력할 경우 `IllegalArgumentException`을 발생시킨 후 애플리케이션은 종료되어야 한다.** 라고 있었기 때문이다.)  

이 예외는 메서드에 전달된 인수가 잘못된 경우 발생한다.  

1) 음수 입력  
2) 숫자 외 영어, 한글 입력  
3) 다른 구분자 입력     

이렇게 잘못된 값이 입력되게 되면 `IllegalArgumentException` 이 예외를 발생시키도록 하였다.  

<br>

## 새롭게 알게 된 사실
### String.matches()를 사용될때마다 Pattern 클래스 인스턴스가 생성됨  

정규식을 활용하여 사용자가 입력한 문자열을 검사할때, `String.matches()`를 사용하였다.  

```java
if (str.matches(".*-\\d+.*") || str.matches("//(.)\n(.*-\\d+.*)")) {
  throw new UserInputException("[계산 실패] 음수는 입력할 수 없습니다.");
}
```  

이 문제를 `Pattern` 객체를 캐싱해둔 다음 다시 객체가 생성되지 않도록 하였다.  
이제 몇번을 검사해도 Pattern 객체가 재생성되지 않는다는 장점이 있다.

```java
private static final Pattern NEGATIVE_NUMBER_PATTERN = Pattern.compile(".*-\\d+.*");

private static void validateNegativeNum(String str) {
  if (NEGATIVE_NUMBER_PATTERN.matcher(str).matches()) {
    throw new UserInputException("[계산 실패] 음수는 입력할 수 없습니다.");
  }
}
```

이때, 객체 생성을 많이 하게 되면 GC(`Garbage Collection`)의 대상이 되고,   
자연스레 성능도 좋지 않아진다는 것을 깨달았다.  

-----------------------------------------------------------

구현을 계속 해나가다보니, 이전에 작성했던 기능 목록과 프로그램 흐름도를 다시한번 생각해보게 되었다.   
`Main`코드에서 `DelimiterSplitter(구분자로 문자열 나누기)`, `AddCalculator(더하기)` 이 기능들을 알게 되기 때문이다.  

내가 사용자라면 입력값을 입력 후, 계산 결과값만 받고 싶을 테니까.  

그렇게 해서 `CalculatorService`클래스를 만들게 되었다.  
`Main`코드가 아닌 `CalculatorService` 이 클래스에서 대신 일을 해주는 것이다.  

바로 아래 그림과 같이 코드 흐름을 수정하였다.  

![변경한 프로그램 전체 흐름](/assets/img/full_flow_modify_image.jpg)   

<br> 

하지만 여기서 계속되는 고민이 있었다.  

단지 `Main`이 `CalculatorService`로 이름만 바꼈을 뿐이기에  
여전히 `CalculatorService` → 이 친구는 두 객체(`DelimiterSplitter`, `AddCalculator`)를 생성한다.   
즉 클래스 간 결합도가 끈끈해져있다.  

결합도가 높을수록 유연성이나 확장성에 안좋다고 알고있다.  

이부분에 있어선 코드리뷰를 받으며 해결책을 얻었다!  
바로 **의존성 주입**이다.  

클래스가 필요한 객체를 스스로 생성하지 않고, 외부에서 생성된 객체를 주입받아 사용하는 방식으로   
결합도를 낮추고, 의존성도 낮추는 것이다.

2주차 과제에는 이런 점을 유의하며 구현을 해나가자고 생각하게 되었다.    

------------------------------------------

## 1주차를 끝낸 후..  

1주차 과제를 하면서 스스로 코드를 작성하고, `이게 옳은걸까?`, `더 나은 코드가 있을텐데`하며 답이 없는 질문들을 던지다보니, 점점 내 코드에 의문점을 쌓아가며 작성해나갔던것같다. 이런 의문점들을 나는 코드리뷰에서 찾았던 것 같다.  

- 나와 다른 시선을 가진 분들의 의견을 듣는 것.  
- 더 나은 방식은 어떤것인지 알아가는 것.  

이 두가지를 코드리뷰를 통해 얻을 수 있었다. 하지만, 한꺼번에 많은 지식들이 머릿속으로 들어와 이걸 내가 다 흡수해서 코드에 녹여낼수있을지 잘 모르겠다. 찬찬히 2주차 과제를 진행하며 적용해보도록 노력해나간다면 점차 이전의 내 코드보단 나아지지않을까. 생각이 든다.  
