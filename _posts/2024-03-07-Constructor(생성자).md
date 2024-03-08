---
title: "Constructor 생성자에 대해 파헤쳐보자!"
date: 2024-03-08 15:36:00 +09:00
categories: [Study, Java]
tags: [constructor]
pin: true
image:
  path: /assets/img/constructor-introduce.jpg
  alt: 객체를 생성할 때, 자동으로 생성자를 호출해 객체를 초기화 시켜준다.
---

## 생성자는 왜 쓸까?

객체를 생성할때, **초기값을 설정** 하기위해 사용한다.  

그럼, 여기서 질문이 있을것이다.  
`왜? 초기값을 설정하지?`   

간단한 실생활 예시로 설명하겠다.    
손님이 카페에 가면 음료를 주문할 때의 상황을 떠올려주세요.

```java
public class Coffee {
    private final String menu;
    private final String payment;

    Coffee(String menu, String payment) {
        this.menu = menu;
        this.payment = payment;
    }

    void order() {
        System.out.println("메뉴는 " + menu + "이고, 결제는 " + payment + "로 합니다.");
    }
}
```

```java
public class CoffeeMain {
    public static void main(String[] args) {
        Coffee visitor = new Coffee("Americano", "creditCard");
        visitor.order();
    }
}
```
#### 실행 결과
```
메뉴는 Americano이고, 결제는 creditCard로 합니다.
```

- 손님이 주문할 음료와 결제수단(카드(`creditCard`), 현금(`cash`))을 필수로 입력해야한다.
- 그래야 결제를 하고, 음료를 받을 수 있다.

이처럼 `menu`, `payment` 멤버변수의 값을 넣어주어야하는데, 생성자를 사용하면 `Coffee coffee = new Coffee()` 객체를 생성할때, 바로 값을 할당해줄 수 있다.  
즉 생성자를 사용하면 필수값 입력을 보장해준다!

Q. 필수값 입력을 보장해준다구요?  
: 내가 정의한 생성자를 호출하지않으면 아래와 같은 컴파일 오류가 발생한다.  
따라서 필수로 입력하도록 해준다는것을 알 수 있다.

```java
java: constructor Coffee in class test.Coffee cannot be applied to given types;
  required: java.lang.String,java.lang.String
  found:    no arguments
  reason: actual and formal argument lists differ in length
```

<br>

### 생성자의 특징
- 생성자 이름은 클래스 이름과 같아야한다.
  - 클래스 이름이 `Coffee`이면 생성자 이름도 `Coffee`
- 생성자는 반환값이 없다.  

<br>

### 생성자 호출

아래와 같이 `new` 키워드를 사용해 객체를 생성했던 경험이 있을것이다. 
```java
public class Coffee {
    private String menu = "Americano";

    void order() {
      System.out.println(this.menu + "를 시켰습니다");
    }
}
```
```java
public class CoffeeMain {
    public static void main(String[] args) {
        Coffee coffee = new Coffee();
        coffee.order();
    }
}
```
이때, 자바 컴파일러가 자동으로 **기본 생성자**를 만들어준다.   

```java
public class Coffee {
    private String menu = "Americano";
    
    // 우리 눈에는 안보인다
    Coffee() {

    }
    ...
}
```

여기서 알 수 있다   
- 생성자는 반드시 호출된다
- 내가 정의한 생성자가 없더라도 기본생성자를 만들어준다

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->
> 직접 생성자를 정의한다면 **기본 생성자는 만들어지지 않는다!**
{: .prompt-danger }

<!-- markdownlint-restore -->

<br>

## 생성자 여러개 정의 가능

메서드 오버로딩처럼 생성자를 여러개 정의할 수 있다.  
그 이유는 매개변수를 다르게 설정할 수 있는 상황도 있기 때문이다.   
`(예시) 무조건 현금으로 하는 경우가 있다면, 메뉴명만 입력받으면 된다`

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->
> 메서드 오버로딩 : 메서드 이름이 같지만, 매개변수, 타입이 다르게 여러개 정의   
> 메서드 오버라이딩 : 상위 클래스의 메서드를 하위 클래스가 재정의  
{: .prompt-tip }

<!-- markdownlint-restore -->

```java
public class Coffee {
    private final String menu;
    private final String payment;

    Coffee(String menu) {
        this.menu = menu;
        this.payment = "cash";
    }
    
    Coffee(String menu, String payment) {
        this.menu = menu;
        this.payment = payment;
    }

    void order() {
        System.out.println("메뉴는 " + menu + "이고, 결제는 " + payment + "로 합니다.");
    }
}
```

```java
public class CoffeeMain {
    public static void main(String[] args) {
        Coffee visitor1 = new Coffee("Americano", "creditCard");
        visitor1.order();

        Coffee visitor2 = new Coffee("CafeLatte");
        visitor2.order();
    }
}
```
#### 실행 결과
```
메뉴는 Americano이고, 결제는 creditCard로 합니다.
메뉴는 CafeLatte이고, 결제는 cash로 합니다.
```
