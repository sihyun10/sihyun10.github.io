---
title: "@Scheduled 이해하기 - 내부 동작 원리와 스레드 관리"
date: 2025-11-08 23:05:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

스케줄링은 어떤 작업에 대해 지정된 기간 또는 시간에 동작하도록 하는 것이다.  

Spring에서 스케줄링 작업을 처리하기 위해 외부 라이브러리를 이용하거나  
Spring Boot에서 제공하는 `@Scheduled` 어노테이션을 이용하면 간단히 구현할 수 있다.

---

## `@Scheduled`란?

예를 들어, 매일 아침 8시에 자동으로 이메일을 보내고 싶다면  
아래와 같이 설정하면 된다.

```java
@Component
public class MessageScheduler {

    // 매일 오전 8시 정각 실행 (Cron 표현식)
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Seoul")
    public void sendScheduledMessage() {
        System.out.println("[스케줄러 동작] 이메일 발송 작업이 실행되었습니다!");
    }
}
```

- `@Scheduled`가 붙은 메서드는 Spring이 자동으로 호출한다.
- cron 표현식으로 "언제" 실행할지 설정한다.  
  (예: 0 0 9 \* \* \* ➔ 매일 오전 9시)
- `zone`을 지정하면 서버 시간대와 관계없이 일정하게 실행된다.

<br>

### 사용 예시 (10초마다 실행)

```java
@Slf4j
@Component
public class MessageScheduler {

    // 10초마다 실행
    @Scheduled(fixedRate = 10000)
    public void testScheduler() {
        log.info("[테스트] 스케줄러가 10초마다 실행됩니다.");
    }
}
```

스케줄링 기능을 동작시키기 위해  
애플리케이션 진입점에 `@EnableScheduling`을 추가해주면 된다.

```java
@SpringBootApplication
@EnableScheduling
public class EmailSchedulerServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmailSchedulerServerApplication.class, args);
    }
}
```

실행하면 아래와 같이 콘솔 로그에 찍히게 된다.

![fixedRate](/assets/img/test_scheduler_fixedRate.png)

---

## 그렇다면 내부에서는 무슨 일이 벌어지고 있는걸까?

단순히 `@Scheduled`를 붙였을 뿐인데, Spring은 어떻게 메서드의 실행 시점을 기억하고 주기적으로 실행시킬까?  
이 일을 담당하는 핵심 클래스는 **ScheduledAnnotationBeanPostProcessor** 이다.

실제 내부 동작 흐름을 살펴보자!

### 1. `@EnableScheduling` - 스케줄링 기능의 시작점

먼저 우리가 `@EnableScheduling`을 클래스에 붙이는 순간, Spring은 다음과 같은 일을 한다.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(SchedulingConfiguration.class)
public @interface EnableScheduling {

}
```

여기서 핵심은 `@Import(SchedulingConfiguration.class)`이다.  
Spring은 이 어노테이션을 읽고 `SchedulingConfiguration` 클래스를 설정으로 등록한다.

### 2. `SchedulingConfiguration` - 스케줄링 핵심 Bean 등록

```java
@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class SchedulingConfiguration {

	@Bean(name = TaskManagementConfigUtils.SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public ScheduledAnnotationBeanPostProcessor scheduledAnnotationProcessor() {
		return new ScheduledAnnotationBeanPostProcessor();
	}
}
```

핵심 클래스인 `ScheduledAnnotationBeanPostProcessor()`가 Bean으로 등록된다.  
이 메서드를 통해 모든 Bean을 스캔하면서 `@Scheduled`가 붙은 메서드를 찾는다.

### 3. ScheduledAnnotationBeanPostProcessor - 핵심 동작 흐름

- 모든 Bean을 스캔

![모든_bean_스캔](/assets/img/all_bean_scans.png)

`@Scheduled`가 붙은 메서드를 발견하면 annotatedMethods map에 저장한다.

- 스케줄링 작업으로 등록

스캔한 메서드들을 이용해 `processScheduled()`를 호출한다.

```java
annotatedMethods.forEach((method, scheduledAnnotations) ->
    scheduledAnnotations.forEach(scheduled -> processScheduled(scheduled, method, bean))
);
```

### processScheduled() - 주기 등록의 핵심 로직

"이 메서드를 언제, 어떤 방식으로 실행할지"를 결정한다.

![ScheduledTaskRegistrar](/assets/img/ScheduledTaskRegistrar.png)

`@Scheduled(fixedRate = 10000)`처럼 설정된 값에 따라,  
FixedRateTask, FixedDelayTask, CronTask 등의 객체로 감싸서  
ScheduledTaskRegistrar에 등록한다.

여기서 `ScheduledTaskRegistrar`는 스케줄링 작업을 실제로 실행할 TaskScheduler를 관리한다.

### TaskScheduler - 실제 실행 스레드 관리

Spring은 내부에서 `SingleThreadScheduledExecutor`를 사용해 **단일 스레드**로 스케줄링을 수행한다.

즉,

- 한 번에 하나의 스케줄 작업만 실행된다.
- 하나의 작업이 끝나야 다음 스케줄이 실행된다.

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **참고한 블로그 글**
>
> [스프링부트 Scheduler 정해진 시간마다 동작 시키는법](https://devpad.tistory.com/133#google_vignette){: target="\_blank"}  
> [@Scheduled를 이용한 스케쥴러 구현하기](https://velog.io/@developer_khj/Spring-Boot-Scheduler-Scheduled){: target="\_blank"}  
> [spring scheduler 작동 원리](https://velog.io/@sunaookamisiroko/spring-scheduler-%EC%9E%91%EB%8F%99-%EC%9B%90%EB%A6%AC){: target="\_blank"}  
{: .prompt-info }

<!-- markdownlint-restore -->

---

## 기본 스레드 동작 방식

단일 스레드로 스케줄을 관리하는데, 이는 어떻게 관리되는 방식일까?  
한 번에 하나의 스케줄만 실행한다고 생각하면 쉽다.

- 하나의 `@Scheduled` 메서드가 실행 중이라면  
  그게 끝날 때까지 다음 스케줄이 "대기"해야 한다.
- 동시에 여러 스케줄이 있더라고 **하나의 스레드**에서 순차적으로 실행된다.

### 예시

```java
@Slf4j
@Component
public class MessageScheduler {

    @Scheduled(fixedRate = 5000)
    public void testScheduler() throws InterruptedException {
        log.info("작업 시작");
        Thread.sleep(10000); // 10초 소요
        log.info("작업 끝");
    }
}
```

![singleThreadScheduling](/assets/img/sigle_thread_scheduling.png)

"5초마다 실행"으로 설정해두었지만, 실제로 10초마다 실행된다.  
이전 작업이 끝나야 다음 작업이 시작되기 때문이다.

---

## 병렬 실행은 불가능할까?

아니다. 가능하다.  
Spring에서는 스레드풀을 직접 지정하면 병렬로 실행되게 만들 수 있다.

**TaskScheduler**라는 Bean을 등록해서 스레드 개수를 조절할 수 있다.

```java
@Configuration
@EnableScheduling
public class SchedulerConfig {

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();

        scheduler.setPoolSize(3); // 최대 3개의 스레드로 동시 실행
        scheduler.setThreadNamePrefix("mail-scheduler-"); // 스레드 이름의 접두사를 "mail-scheduler-"로 설정
        scheduler.initialize();

        return scheduler;
    }
}
```

`@Scheduled` 메서드가 여러 개여도 서로 다른 스레드에서 동시에 실행된다.

### 예시

```
mail-scheduler-1 [INFO] 작업 A 시작
mail-scheduler-2 [INFO] 작업 B 시작
mail-scheduler-3 [INFO] 작업 C 시작
```

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **참고한 블로그 글**
>
> [@Scheduled 사용할 때 스레드 설정](https://dkswnkk.tistory.com/728){: target="\_blank"}  
{: .prompt-info }

<!-- markdownlint-restore -->

<br>

### fixedRate / fixedDelay / cron 차이

| 속성       | 의미                                     | 특징                                               |
| :--------- | :--------------------------------------- | :------------------------------------------------- |
| fixedRate  | 이전 실행 '시작 시점' 기준으로 주기 실행 | 병렬 실행 가능성 있음 (작업이 길다면 겹칠 수 있음) |
| fixedDelay | 이전 실행 '종료 시점' 기준으로 주기 실행 | 절대 겹치지 않음                                   |
| cron       | 특정 시간에 실행                         | 크론 표현식 기반, 정밀한 제어 가능                 |

---

## 마무리  

오늘은 Spring의 `@Scheduled`가 내부적으로 스케줄링 전용 스레드를 관리하고 실행 시점을 제어하는 구조라는 것을 알아보았다.

이제 단순히 로그를 찍어보는 게 아닌, 스케줄러가 특정 시점에 메시지를 생성하고, 그 메시지를 RabbitMQ를 통해 Queue ➔ Consumer로 전달하는 과정을 구현해볼 예정이다.

다음 글에서는 RabbitMQ와 스케줄러를 연동하여 실제 메시지를 발송하고 수신하는 흐름을 실습해보고자 한다.
