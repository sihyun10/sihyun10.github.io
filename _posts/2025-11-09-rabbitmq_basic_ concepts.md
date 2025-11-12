---
title: "RabbitMQ 기본 개념 및 동작 과정"
date: 2025-11-09 13:28:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

RabbitMQ가 무엇인지, 그리고 그 기반이 되는 AMQP 중심으로 글을 정리해보았습니다.

## 🐇 RabbitMQ를 왜 사용해야할까?

RabbitMQ는 AMQP(Advanced Message Queuing Protocol)를 구현한 오픈소스 메시지 브로커이다.  
조금 쉽게 말하면, 서비스 간에 데이터를 직접 주고받는 대신, 중간에서 메시지를 대신 전달하고 관리해주는 우체국이라고 생각하면 된다.

### RabbitMQ의 역할

- 비동기 처리
  - 생산자(Producer)는 메시지를 보내고 자신의 다음 작업을 진행할 수 있다.
  - 수신자(Consumer)가 메시지를 언제 처리할지는 신경 쓸 필요가 없다.
- 느슨한 결합
  - 서비스 A와 B는 서로의 존재를 몰라도 된다.
  - RabbitMQ라는 중간 매개체를 통해 통신하기 때문에, 서비스 간의 의존성이 크게 줄어든다.
- 안정성 및 신뢰성
  - 메시지를 큐에 보관하기 때문에, 수신자 서비스가 일시적으로 다운되더라도  
    메시지가 유실되지 않고 안전하게 보관된다.

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **[예시]**
>
> 쇼핑몰에서 주문이 발생하면 주문 서비스가 이메일 발송 서비스에 메시지를 보낸다.  
> 이때 직접 API를 호출하는 대신 RabbitMQ를 이용하면  
> 주문 서비스는 메시지를 보내자마자 다음 로직을 처리할 수 있고,  
> 이메일 서비스는 자신이 준비된 시점에 메시지를 처리할 수 있다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

---

## RabbitMQ의 핵심 : AMQP (Advanced Message Queuing Protocol)

RabbitMQ의 동작 원리는 AMQP에 기반한다.  
AMQP는 메시지 브로커가 메시지를 안정적이고 표준화된 방식으로 전달하고 관리하기 위한 프로토콜(규약)이다.

즉 메시지를 주고받는 방법에 대한 공통된 약속이라고 보면 된다.

### AMQP의 주요 특징

1. 표준화된 동작 방식 : 모든 브로커와 클라이언트는 동일한 프로토콜 규칙을 따른다.
2. 언어 독립성 : Java, Python, Go 등 어떤 언어로 구현해도 통신이 가능하다.
3. 신뢰성 보장 : 네트워크 장애나 서버 재시작 시에도 메시지가 유실되지 않는다.
4. 비동기 처리 : 메시지는 즉시 처리되지 않아도 되고, 소비자가 준비되면 순서대로 메시지가 전달된다.

---

## 메시지 처리의 4가지 핵심 구성 요소

AMQP는 메시지를 생산하고 소비하는 과정에서 네 가지 핵심 구성 요소를 사용하며, 이들이 메시지의 흐름을 결정한다.

![rabbitmq_operation_process](/assets/img/open_mission/rabbitmq_operation_process.png)

### 1. Producer (생산자)

- 메시지를 생성하여 Exchange로 전달한다.
- 메시지에는 Routing Key라는 태그가 붙는다.  
  이 키는 "이 메시지가 어디로 가야 하는지"를 알려주는 주소 같은 역할을 한다.

### 2. Exchange (교환기)

- Producer로부터 메시지를 받아 적절한 Queue로 라우팅하는 핵심 중개자이다.
- 메시지에 붙은 Routing Key와 Queue에 설정된 Binding Key 규칙에 따라 메시지를 보낼 큐를 결정한다.

### 3. Queue (큐)

- 메시지가 Consumer에게 전달될 때까지 임시로 저장하는 버퍼(Buffer) 역할을 한다.
- 기본적으로 FIFO(선입선출) 구조로 동작한다.

### 4. Consumer (소비자)

- Queue에 쌓인 메시지를 꺼내서 처리한다.
- 메시지를 정상적으로 처리하면 브로커에게 ACK(Acknowledgment) 신호를 보낸다.  
  ACK를 받지 못한 메시지는 RabbitMQ가 유실 방지를 위해 다른 Consumer에게 재전송 할 수 있다.

---

## Exchange 타입 : 메시지의 라우팅 규칙

Exchange는 메시지를 어떤 방식으로 Queue에 전달할지를 정의한다.  
RabbitMQ는 여러 가지 Exchange 타입을 제공하며, 상황에 따라 다르게 동작한다.

### 1. Direct Exchange

`Routing Key`가 `Binding Key`와 정확히 일치하는 큐에만 메시지를 전달한다. (Routing Key = Binding Key)  
➔ 일대일(one-to-one) 메시지 전달에 적합하다.

### 2. Fanout Exchange

Routing Key와 관계없이 Exchange에 바인딩된 모든 큐에 동일한 메시지를 복사해 전달한다.  
➔ 일대다(one-to-many), "브로드캐스트" 방식이다.

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **브로드캐스트 방식은 무엇인가?**
>
> 네트워크에 연결된 모든 장치에게 데이터를 동시에 전송하는 방식  
> - 참고 블로그 링크 : [메시지 전송방식 : 유니캐스트, 멀티캐스트, 브로드캐스트](https://buildgoodhabit.tistory.com/96){: target="\_blank"}
{: .prompt-tip }

<!-- markdownlint-restore -->

### 3. Topic Exchange

`*`, `#`와 같은 와일드카드를 사용해 패턴 매칭 기반 라우팅을 지원한다.  
예를 들어, `order.*` 패턴으로 `order.created`, `order.updated` 등의 메시지를 받을 수 있다.  
➔ 유연한 메시지 분류에 적합하다.

### 4. Headers Exchange

Routing Key 대신 메시지의 헤더(Header) 값을 기준으로 큐를 선택한다.  
➔ 다양한 메타데이터 기반의 라우팅이 가능하다.

<br>

![rabbitmq_exchange_type](/assets/img/open_mission/rabbitmq_exchange_type.png)

---

## Queue 속성 - 메시지 저장의 생명주기

`Queue`는 실제로 메시지를 보관하는 저장소이므로  
큐를 생성할 때 메시지의 생명주기와 보관 방식을 결정하는 속성을 정의한다.

| 속성        | 설명                                                                                                                                    |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| Name        | 큐 이름 (amq.로 시작하는 이름은 예약어)                                                                                                 |
| Durability  | `durable` : 브로커 서버가 재시작되어도 큐 유지되며, 메시지도 복구됨 / `transient` : 서버 재시작 시 큐가 사라지며, 메모리 기반의 임시 큐 |
| Auto-delete | 마지막 소비자가 큐에서 연결을 해제하면 큐를 자동으로 삭제                                                                               |
| Arguments   | TTL(메시지 유효 기간), 최대 메시지 개수 등 추가적인 정책을 설정 가능                                                                    |

## Dead Letter Queue (DLQ)

시스템 운영하다 보면 메시지 처리 시패는 언제든 발생할 수 있다.  
이때 메시지를 바로 버리는 대신, **Dead Letter Queue(DLQ)**로 옮겨 추적할 수 있다.

다음과 같은 경우에 메시지는 DLQ로 이동한다.

- 메시지 유효 기간(TTL) 만료
- 큐의 최대 길이에 도달해 메시지 거부
- 소비자로부터 NACK(부정 응답) 수신 및 재처리 횟수 초과

DLQ는 실패한 메시지를 분석하거나 재처리할 수 있는 기회를 제공해 시스템의 신뢰성을 한층 높여준다.

---

## 메시지 처리 흐름 요약

RabbitMQ의 전체 메시지 흐름을 한눈에 정리하면 다음과 같다.

```text
Producer가 메시지를 Exchange로 전송
Exchange가 Binding 규칙에 따라 적절한 Queue로 라우팅하여 전달
Queue가 메시지를 임시 보관
Consumer가 메시지를 가져와 처리
Consumer가 성공적으로 처리 후 Broker에 ACK 신호 전송
Broker는 ACK 수신 시 Queue에서 메시지를 제거
```

만약 ACK가 오지 않거나 오류가 발생하면  
RabbitMQ는 재전송을 시도하고 최종적으로 실패한 메시지는 DLQ로 이동할 수 있다.

---

## 마무리하며

RabbitMQ는 단순히 "메시지를 전달하는 도구"가 아니다.  
서비스 간 결합도를 낮추고, 비동기적이고 신뢰성 있는 아키텍처를 구축하기 위한 핵심 인프라다.

이번 글에서는 RabbitMQ의 기본 개념과 동작 원리를 중심으로 살펴봤다.  
다음 글에서는 실제로 Exchange와 Queue를 구성하고 메시지를 주고받는 실습을 진행해볼 예정이다.

---

## 참고한 블로그 글

- [RabbitMQ Exchanges, routing keys and bindings](https://www.cloudamqp.com/blog/part4-rabbitmq-for-beginners-exchanges-routing-keys-bindings.html){: target="\_blank"}
- [SpringBoot 공식문서 - AMQP](https://docs.spring.io/spring-boot/reference/messaging/amqp.html#messaging.amqp){: target="\_blank"}
- [RabbitMQ tutorial - Publish/Subscribe](https://www.rabbitmq.com/tutorials/tutorial-three-spring-amqp){: target="\_blank"}

**[개인 블로그 글]**

- [RabbitMQ 동작 이해하기](https://jonnung.dev/rabbitmq/2019/02/06/about-amqp-implementtation-of-rabbitmq/){: target="\_blank"}
- [RabbitMQ 돌아보기](https://nayoungs.tistory.com/entry/RabbitMQ-%ED%86%BA%EC%95%84%EB%B3%B4%EA%B8%B0){: target="\_blank"}
- [메세지 큐(Message Queue) 을 알아보자](https://velog.io/@choidongkuen/%EC%84%9C%EB%B2%84-%EB%A9%94%EC%84%B8%EC%A7%80-%ED%81%90Message-Queue-%EC%9D%84-%EC%95%8C%EC%95%84%EB%B3%B4%EC%9E%90){: target="\_blank"}
- [레빗엠큐 개념 및 동작방식, 실습](https://coding-start.tistory.com/371){: target="\_blank"}
