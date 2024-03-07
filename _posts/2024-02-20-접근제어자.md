---
title: "접근제어자를 잘 사용하는 것이 왜 중요할까?"
date: 2024-02-20 19:53:00 +09:00
categories: [Study, Java]
tags: [access modifier]
pin: true
---

|접근 제어자|설명|
|------|-----|
|private|모든 외부 호출 X|
|default|같은 패키지 호출 O|
|protected|같은 패키지, 다른 패키지(상속관계) 호출 O|
|public|모든 외부 호출 O|

<br>

## Q. 접근제어자를 잘 사용해야 하는 이유는 뭘까요?
### 본인 클래스 외부에서 특정 필드나 메서드에 접근 가능하거나 제한 시킬 수 있다.

즉, 내가 노력해서 만들어놓은 필드나 메서드에 접근을 가능하게 만든다면 다 무소용이 된다.  
그 이유는 내가 만들어둔것을 변경할 수 있기 때문이죠.

<br>

### 간단한 예제를 들어보겠습니다.
- 물탱크 상태는 직접 조작하지 못한다.  
(직접 조작하게 냅둔다면 고장이 날 수 있기 때문이다)
- 물을 채워 일정량(`30`이상)이 되면 에스프레소를 추출한다.

<br>

```java
public class Coffee {
    private int waterTankLevel;

    public void fillWaterTank(int amount) {
        waterTankLevel += amount;
        System.out.println("물의 양 " + amount + "만큼 채웠어요");
    }

    public void makeEspresso() {
        if (waterTankLevel >= 30) {
            waterTankLevel -= 30;
            System.out.println("에스프레소 추출");
        } else {
            System.out.println("물이 부족하므로 더 넣어주세요");
        }
    }
}
```

```java
public class CoffeeMain {
    public static void main(String[] args) {
        Coffee coffee = new Coffee();
        coffee.fillWaterTank(40);
        coffee.makeEspresso();
    }
}
```

#### 결과
```
물의 양 40만큼 채웠어요  
에스프레소 추출
```

<br>

#### `CoffeeMain`에서 `waterTankLevel`를 변경하려하면 컴파일 오류가 발생한다.  

```java
public class CoffeeMain {
    public static void main(String[] args) {
        Coffee coffee = new Coffee();
        coffee.waterTankLevel = 200; //컴파일 에러 발생
        //java: waterTankLevel has private access in test.Coffee
    }
}
```

`waterTankLevel`은 private 접근제어자로 되어있기때문에 변경이 불가능하다.  
외부에서 값을 바꿀 수 없도록 막아줄 수 있는게 **접근 제어자**이다.

------------------

예제로 보았듯 접근제어자를 잘 사용한다면 프로그램에 제약을 줄 수 있다.  
`private`, `public`만 예제로 들었지만, `default`, `protected`도 상황에 따라 잘 사용하면 된다.  

<br>

> private : 오직 본인의 클래스안에서만 접근가능하며, 모든 외부 호출을 막아준다.  
> default(생략가능) : 같은 패키지 안에서만 호출 가능하다.  
> protected : 위 default와 같지만, 추가로 패키지가 다르더라도 상속관계의 호출은 가능하다.  
> public : 모든 호출이 가능하다.