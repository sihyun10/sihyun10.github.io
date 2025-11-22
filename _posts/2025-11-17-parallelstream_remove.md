---
title: "parallelStream을 제거한 이유"
date: 2025-11-17 01:30:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

뉴스레터 발송 기능을 구현하면서 처음에는 `parallelStream()`을 사용해 병렬 처리를 적용했었다.  
별도의 스레드풀이나 비동기 설정 없이 단 한 줄로 병렬 처리가 가능하다는 점이 매력적이었기 때문이다.

```java
subscribers.parallelStream()
        .forEach(subscriber -> {
            boolean success = sendEmailSafely(subscriber, message.getContent());

            logs.add(buildLog(subscriber, message, success));

            if (success) {
                successCount.incrementAndGet();
            } else {
                failCount.incrementAndGet();
            }
        });
```

하지만 현재 구조에서는 스케줄러가 정해진 시각에 실행될 때마다 하나의 `Consumer`를 통해 전체 발송을 처리하는 구조이기 때문에, 이 흐름 내부에서 `parallelStream`을 사용하는 것이 향후 확장 시 예측 불가능한 병목이나 스레드풀 경쟁을 만들 수 있다고 판단하였다.

이 글에서는 왜 `parallelStream`을 제거하기로 했는지, 병렬 처리 적용 여부를 어떤 기준으로 판단해야 하는지 정리하였다.

---

## parallelStream은 개발자가 통제할 수 없는 전역 공유 스레드풀을 사용한다.

`parallelStream`은 내부적으로 **ForkJoinPool.commonPool()**을 사용한다.  
이 풀은 "애플리케이션 전역에서 단 하나만 존재"하며, 다음과 같은 모든 작업이 공유하게 된다.

> 별도의 설정을 하지 않았기에 **하나의 스레드 풀은 모든 `parallelStream`이 공유하게 된다**

- 스케줄러 로직
- 다른 서비스 로직
- 향후 `parallelStream`을 사용하는 코드
- 외부 라이브러리 내부에서 사용하는 병렬 작업

현재 내 코드에서는 `parallelStream`을 사용하는 곳이 이 부분 하나뿐이라 당장 충돌 위험은 없다.  
하지만 향후 코드가 확장될수록, 전역 공유 스레드풀 기반의 병렬 작업은 예측 불가능성을 높일 수 있다.

특히 뉴스레터 구조처럼 "스케줄러가 특정 시점에 대량 작업을 수행하는 경우"에는  
공통 풀을 독점하거나, 다른 병렬 작업을 지연시키는 상황이 생길 수 있다.

---

## 부작용(side-effect)이 포함된 병렬 처리는 유지 보수 비용이 높아진다.

`parallelStream`은 기본적으로 순수 함수형 처리에 최적화되어 있다.  
반면 뉴스레터 발송 로직에는 여러 공유 자원이 포함되어 있다.

예를 들어

```java
logs.add(buildLog(subscriber, message, success));
successCount.incrementAndGet();
failCount.incrementAndGet();
```

이 연산들은 모두 공유 객체에 접근하는 구조이다.

현재는 `synchronizedList` 및 `AtomicInteger`로 문제 없이 동작하지만  
스레드 수가 늘어날수록 다음과 같은 비용이 증가하게 된다.

- 동기화 비용
- CAS 연산 반복 비용
- 리스트 접근 병목

지금은 괜찮지만, 병렬 처리 규모가 커질수록 유지보수성과 예측 가능성이 떨어진다.

---

## RabbitMQ가 이미 비동기 처리와 병렬성을 제공한다.

우리 시스템은 RabbitMQ 기반의 비동기 큐 처리 구조를 갖고 있다.

즉 메시지를 소비하는 순간 이미 비동기적으로 동작하는 환경이고,  
필요하다면 Consumer 스레드를 늘리는 방식으로 자연스러운 스케일아웃이 가능하다.

따라서 Consumer 내부에서 `parallelStream`으로 병렬화를 하는 것은  
비동기 메시지 구조와 중복된 병렬성을 생성하여 오히려 관리해야하는 것이 늘어날 수 있다.

---

## for-loop 기반의 순차 처리로 변경

결국 순차 for-loop가 더 예측 가능하고 관리하기 쉽다고 생각하였다.  
최종적으로 순차 루프 방식으로 코드를 변경했다.

```java
for (Subscriber subscriber : subscribers) {
    boolean success = sendEmailSafely(subscriber, message.getContent());

    logs.add(buildLog(subscriber, message, success));

    if (success) {
        successCount.incrementAndGet();
    } else {
        failCount.incrementAndGet();
    }
}
```

순차 처리의 장점은 다음과 같다.

- 전체 스레드풀 독점 위험이 없다.
- 스케줄러와 충돌 가능성이 없다.
- 공유 자원에 대해 Race Condition 걱정이 없다.
- I/O 작업에서는 병렬화 이점이 크지 않다.
- 유지 보수가 쉽고 의도 파악이 명확하다.

특히 지금 시스템의 규모에서는 순차 반복문만으로도 충분히 빠르다는 점이 결정적이었다.

---

## 마무리하며

`parallelStream`은 정말 매력적이고 간단하게 병렬 처리를 적용할 수 있다.  
하지만 전역 공유 스레드풀 사용, side-effect 처리, 향후 확장 시 충돌 가능성 등을 고려해 제거하였다.

물론 이것이 "parallelStream을 쓰면 안된다!"는 의미는 아니다.

내 경우에는 "예측 가능성과 안정성"을 선택했고,  
현재 서비스의 특성과 규모에는 순차 반복문이 더 적절하다고 판단하여 적용하였다.

---

## 참고한 블로그 글

- [What is Java Parallel Streams?](https://www.geeksforgeeks.org/java/what-is-java-parallel-streams/){: target="\_blank"}
- [Parallel Stream](https://today-hello.tistory.com/157){: target="\_blank"}
- [parallelStream 남용으로인한 장애경험기](https://multifrontgarden.tistory.com/254){: target="\_blank"}
- [parallelStream() 메서드 사용시 예상되는 문제점 및 해결방안](https://timotimo.tistory.com/80#google_vignette){: target="\_blank"}
- [Java의 멀티스레드와 동시성문제 간단 정리[4.CAS와 원자적연산]](https://velog.io/@onyx01/Java%EC%9D%98-%EB%A9%80%ED%8B%B0%EC%8A%A4%EB%A0%88%EB%93%9C%EC%99%80-%EB%8F%99%EC%8B%9C%EC%84%B1%EB%AC%B8%EC%A0%9C-%EA%B0%84%EB%8B%A8-%EC%A0%95%EB%A6%AC4.CAS%EC%99%80-%EC%9B%90%EC%9E%90%EC%A0%81%EC%97%B0%EC%82%B0){: target="\_blank"}
