---
title: "객체 인스턴스가 단 1개만 생성되는 Singleton 컨테이너의 공유필드 문제"
date: 2024-03-21 21:25:09 +09:00
categories: [Study, Spring]
tags: [singleton, container, spring]
pin: true
---

스프링 기본 빈 등록방식은 '**싱글톤**' 방식이다.   
따라서 스프링 컨테이너는 객체 인스턴스를 싱글톤으로 관리해준다.  
싱글톤 방식에 대해 설명하기 앞서, 싱글톤 패턴에 대해 알고 넘어가자.  

## 싱글톤 패턴이란?    

객체 인스턴스가 단 1개만 생성되는 디자인 패턴이다.   

- 싱글톤 패턴 구현 코드    
`new SingletonPattern()`해서 객체를 미리 생성해두고 `getInstance()`해서 여러번 호출했을때, 똑같은 인스턴스값이 나오는지 확인해보자.

```java
public class SingletonPattern {
    private static SingletonPattern instance = new SingletonPattern();
    
    private SingletonPattern() {
        // 객체 생성 못하도록 막아준다
    }

    public static SingletonPattern getInstance() {
        return instance;
    }
}
```

```java
@Test
void singletonServiceTest() {
  SingletonPattern singletonPattern1 = SingletonPattern.getInstance();
  SingletonPattern singletonPattern2 = SingletonPattern.getInstance();
  
  Assertions.assertThat(singletonPattern1).isSameAs(singletonPattern2);
}
```

`singletonPattern1`, `singletonPattern2`는 같은 인스턴스 값이 나오는것을 확인할 수 있다.  


### 싱글톤 패턴 사용 목적    

Q. 같은 인스턴스값을 갖게 되는게 뭐가 좋지?  
1) **데이터 공유** : 하나의 값으로 전역에서 사용할 수 있기에 다른 클래스 인스턴스들과 데이터를 공유할 수 있다.    
2) **메모리 효율성** : 요청할때마다 계속 객체 인스턴스 값이 생성되는 것보다, 하나의 값만 딱 생성되는 것이므로 메모리 측면에서 봤을때 좋다. 훨씬 속도도 빨라지고, 메모리 낭비도 적기때문이다.    


### 싱글톤 패턴 단점  

위와 같은 좋은점도 있지만, 안티패턴이라 불리며 단점이 존재한다.    

- DIP, OCP 원칙 위반 : 클라이언트가 구현체에 의존하게 되므로 DIP를 위반하고 OCP도 위반할 가능성이 높음  
- 테스트 어려움 : 다른 클래스 인스턴스들과 데이터를 공유하는게 많아지면 결합도가 높아지면서 테스트가 어렵다.  


이러한 싱글톤 패턴의 특징을 가지며 단점들을 보완한 것이 '**스프링 컨테이너**'이다.   

### 스프링 컨테이너    

스프링 컨테이너는 객체를 싱글톤으로 유지하게 해줍니다.   
따라서 싱글톤 컨테이너 역할을 해주는데요.  

"객체 인스턴스가 딱 1개만 생성되어 공유도 유용해져 효율적인 재사용이 가능하다"  

--------------------------------

## 싱글톤 방식 주의할 점  

싱글톤 패턴이나 싱글톤 컨테이너를 사용할 때, 객체 인스턴스가 딱 1개만 생성되어 공유하기에 **상태를 stateful(유지) 하게 설계를 하면 안된다!**  

딱 1개 생성된 객체 인스턴스를 함께 사용하는 것이기에 필드를 공유하게 되면 심각한 장애를 발생시킬 수 있다.  

> 필드(Field)란?  
> - 클래스 내에 있는 변수를 의미한다.   
> - 선언 위치에 따라 클래스 변수(static 변수), 인스턴스 변수, 지역변수로 구분된다.  


왜 심각한 장애가 발생시키게 되는지 코드를 통해 알아보자.   

```java
public class SignUp {
    private String name; //공유 필드

    private static final SignUp instance = new SignUp();

    public static SignUp getInstance() {
        return instance;
    }

    private SignUp() {
    }

    public void join(String name) {
        this.name = name;
        System.out.println(name + "님 가입을 축하드립니다");
    }

    public String getName() {
        return name;
    }
}
```

```java
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SignUpTest {

    @Test
    @DisplayName("공유 필드를 사용할때 발생하는 문제")
    void SingUpTest() {
        SignUp member1 = SignUp.getInstance();
        SignUp member2 = SignUp.getInstance();

        member1.join("푸린");
        member2.join("시현");

        String member1Name = member1.getName();
        Assertions.assertThat(member1Name).isEqualTo("시현");
        //member1Name이 '푸린'이 아니라 '시현'으로 바뀌게 된다
    }
}
```

회원가입을 할때, 나는 '푸린'이로 가입했지만, '시현'이도 가입하고 있다고 가정하자.  
같은 객체 인스턴스 값을 공유하기에 '푸린'이는 '시현'이로 회원이름이 바뀌게 된다.  
잘못된 회원가입이 되는 것이다. 이건 심각한 장애이다.     
(*회원들이 많이 유입되는 웹사이트라면 이건 너무 큰 장애다.*)


### 원인  
- 똑같은 인스턴스 값을 공유해 사용하는데, 여러 회원이 동시에 같은 코드를 실행하는 경우  
- 본인의 의도와는 다른 회원이름으로 바뀌게 된다.  

따라서 **공유되는 필드**를 조심해야 한다!  

### 해결방안  
- **무상태**(Stateless)로 설계하자.
  - 특정 클라이언트에 의존적인 필드가 있으면 안됨
  - 특정 클라이언트가 값을 바꿀 수 있는 필드가 있으면 안됨
  - 가급적 읽기만 허용
  - 공유되지 않는 지역변수, 파라미터, ThreadLocal 등을 사용

<br>

Q. **지역변수를 사용**하면 왜 공유되지 않는가?     
- 지역변수란?  
  - 메서드 내 포함된 모든 변수   

메서드 내에서만 유효범위(Scope)를 가지기에 값이 공유되지않는다.

```java
public class SignUp {
    private static final SignUp instance = new SignUp();

    public static SignUp getInstance() {
        return instance;
    }

    private SignUp() {
    }

    public String join(String name) {
        String memberName = name; //지역변수
        System.out.println(name + "님 가입을 축하드립니다");
        return memberName;
    }
}
```

```java
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SignUpTest {

    @Test
    @DisplayName("지역변수 사용")
    void SingUpTest() {
        SignUp signUp1 = SignUp.getInstance();
        SignUp signUp2 = SignUp.getInstance();

        String member1 = signUp1.join("푸린");
        String member2 = signUp2.join("시현");

        Assertions.assertThat(member1).isEqualTo("푸린");
        Assertions.assertThat(member2).isEqualTo("시현");
    }
}
```
