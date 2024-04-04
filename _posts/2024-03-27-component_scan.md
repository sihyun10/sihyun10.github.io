---
title: "자동으로 스프링 빈을 등록해주는 컴포넌트 스캔 기능"
date: 2024-03-27 22:30:34 +09:00
categories: [Study, Spring]
tags: [componentScan]
pin: true
---

### 컴포넌트 스캔이란?

자바코드의 `@Bean`, XML의 `<bean>` 등 설정정보에 직접 등록할 스프링 빈을 작성해주었다면 **컴포넌트 스캔**은 설정정보에 작성하지않아도 자동으로 스프링 빈을 등록해준다.

컴포넌트 스캔을 하기위해선 설정 정보에 `@ComponentScan`을 붙여주면 된다.  
그럼 `@Component` 애노테이션이 붙은 클래스들을 스캔해 스프링 빈으로 등록해준다.

```java
@Configuration
@ComponentScan
public class AppConfig {
}
```

> Q. `@Configuration` 애노테이션은 왜 붙여주는 걸까요?  
> 스프링 설정 정보에 위 애노테이션을 적어줘야 바이트코드를 조작하는 CGLIB 기술을 사용해 **싱글톤을 보장**하게 해주기 때문이다. 즉 스프링빈이 싱글톤을 유지하도록 한다.

<br>

- 스프링 빈으로 등록할 클래스들한테 `@Component` 애노테이션을 붙여주자.
- 이렇게 `@Component`가 붙은 클래스들을 스캔해서 스프링 빈으로 등록한다.

```java
//예제 코드
@Component
public class MemberServiceImpl implements MemberService {
  ...
}
```

- 현재 `AppConfig` 설정정보 코드에는 의존관계를 명시해주는 코드가 하나도 없다.  
  의존관계를 주입받게하려면 코드에 `@Autowired`를 붙여주면 된다.
- `@Autowired`를 보고 스프링 컨테이너가 해당되는 스프링 빈을 찾아 의존관계를 자동으로 주입시켜준다.

```java
//예제 코드
@Component
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Autowired
    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
    ...
}
```

위와 같이 `@Autowired`를 생성자에 붙여서 의존관계를 주입받게 할 수 있다.  
(_의존관계 주입방법에 대해선 다양한 방법이 있는데, 일단 위와 같이 생성자로 의존관계를 주입받게 할 수 있다고 알고 넘어가자_)

<br>

- 스프링 빈 이름은 클래스명에서 맨 앞글자만 소문자를 사용
  - ex) `memberServiceImpl`로 빈 이름이 등록됨
- 스프링 빈 이름을 직접 지정할 수 있다.
  - ex) `@Component("xxx")` <- 본인이 지정하고 싶은 이름으로 변경가능

---

### 컴포넌트 스캔 범위

```java
@Configuration
@ComponentScan(basePackages = "hello.core")
public class AppConfig {
}
```

`@ComponentScan(basePackages = "~~")` **basePackages** 에다가 시작위치를 본인이 지정하여 이 패키지 위치부터 컴포넌트 스캔을 해주세요~ 할 수 있다. (_시작위치를 여러개 작성할 수도 있다_)

따로 시작위치를 지정하지 않으면 `@ComponentScan`이 붙어있는 클래스의 package 위치부터 컴포넌트 스캔을 해준다.

따라서 컴포넌트 스캔의 시작위치를 따로 지정하기보단, 설정 정보 클래스(`AppConfig.class`)를 프로젝트 최상단에 위치시키는 것을 추천한다! 그럼 거기서부터 자동으로 컴포넌트 스캔을 해준다.

<br>

**Q. 프로젝트 최상단은 어디를 뜻할까요?**

스프링 부트의 시작 위치인 `@SpringBootApplication` 애노테이션이 붙어있는 패키지 위치에 설정 정보 클래스를 위치시키면 된다.

```java
package hello.core; //패키지 위치

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(CoreApplication.class, args);
	}

}
```

```java
package hello.core; //설정정보 클래스의 패키지 위치

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan
public class AppConfig {
}
```

---

### 컴포넌트 스캔 동작 과정

다시한번 컴포넌트 스캔이 어떻게 동작되는지 정리해보자.     

1) `@Component`가 붙어있는 클래스들을 스프링 빈으로 등록한다.  
  1-1) 스프링 컨테이너에 빈 이름과 빈 객체 값이 저장된다.  
2) `@Autowired` 의존관계를 자동 주입해준다.  
  2-1) 스프링 컨테이너가 해당되는 스프링 빈을 찾아 의존관계를 자동 주입해준다.  

이때, `basePackages` 설정이 있다면 그 위치부터 컴포넌트 스캔을 하며,  
적혀있지 않다면 `@ComponentScan`이 붙어있는 곳부터 컴포넌트 스캔을 한다.  


---

### 빈 이름 등록 할때의 발생할 수 있는 문제점

빈 이름이 등록될때, 똑같은 빈 이름이 있을 수 있다.  
2가지 경우가 있는데, 어떻게 되는지 알아보자.  

- **자동 빈 등록 vs 자동 빈 등록**     
컴포넌트 스캔을 사용하여 자동으로 스프링 빈을 등록해주는데, 똑같은 이름이 있을 수 있다.  
이 경우 오류가 발생한다.   

```java
@Component("service")
public class MemberServiceImpl implements MemberService {
  ...
}

@Component("service")
public class OrderServiceImpl implements OrderService {
  ...
}
```

```
org.springframework.context.annotation.ConflictingBeanDefinitionException: Annotation-specified bean name 'service' for bean class [hello.core.order.OrderServiceImpl] conflicts with existing, non-compatible bean definition of same name and class [hello.core.member.MemberServiceImpl]
```

두개의 클래스 빈 이름이 'service'로 같기 때문에 `ConflictingBeanDefinitionException`예외가 발생하는것을 볼 수 있다.   

<br>

- **수동 빈 등록 vs 자동 빈 등록**   
수동으로 빈 등록하는것과 자동으로 빈 등록을 같이 사용할 수 있다.  
이때, 빈 이름이 같을 수 있다.    


```java
// 자동 빈 등록될때, 빈 이름이 'rateDiscountPolicy'로 등록된다.
@Component
public class RateDiscountPolicy implements DiscountPolicy {
  ...
}
```

```java
// 수동 빈 등록으로 빈 이름을 똑같이 작성
public class AppConfig {

    @Bean(name = "rateDiscountPolicy")
    DiscountPolicy discountPolicy() {
        return new RateDiscountPolicy(); 
    }
}
```

```
Overriding bean definition for bean 'rateDiscountPolicy' ...
```

위와 같이 로그에 찍히게 된다.  
수동 빈 등록한것이 우선권을 가지며, Overriding해서 수동빈이 등록되게 된다.  

스프링 부트에서는 수동 빈 등록과 자동 빈 등록에서 위와 같은 현상이 발생하게 되면 에러가 나도록 해준다!

```java
@SpringBootApplication
public class CoreApplication {
	public static void main(String[] args) {
		SpringApplication.run(CoreApplication.class, args);
	}
}
```

스프링 부트를 실행하면 프로그램이 실행되지않고 아래와 같이 에러를 뱉는다.

```
Action:

Consider renaming one of the beans or enabling overriding by setting spring.main.allow-bean-definition-overriding=true
```

이와같이 스프링 부트를 사용함으로써, 만약 수동 빈 등록 vs 자동 빈 등록이 충돌하게 되면 에러를 발생시켜 버그가 발생하지 않도록 해준다.  

---------------------------------

[출처] : (인프런 강의) [김영한 - 스프링 핵심 원리 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8/dashboard)  

위의 글에 작성된 코드 예제들도 강의 내용에서 다루는 코드를 사용하였습니다.  