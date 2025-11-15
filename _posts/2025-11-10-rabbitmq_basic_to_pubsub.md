---
title: "[RabbitMQ 실습] 단일 Queue에서 Fanout Pub/Sub까지 구현하기"
date: 2025-11-10 23:58:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

`RabbitMQ`를 경험해본 적이 없어서, 기본 구조부터 `Pub/Sub`까지 하나씩 실습해보며 감을 익혀보고자 했다.

이번 글에서는 단일 `Queue` 기반 메시지 발송 흐름을 먼저 구현한 뒤, 이를 `Fanout Exchange` 기반의 `Pub/Sub` 구조로 확장해본 과정을 기록했다.

---

## RabbitMQ로 하나의 메시지 발송 사이클 만들기

- [x] 스케줄러가 메시지를 만들고 `Consumer`까지 도달하는 흐름 완성시키기
  - [x] `TopicExchange` 기반으로 단일 큐를 연결해 아래 그림의 흐름처럼 구현하기

![rabbitMQ_flow](/assets/img/open_mission/rabbitMQ_flow.png)

### RabbitMQ 설정

Spring이 RabbitMQ와 통신하려면 먼저 `Queue`, `Exchange`, `Binding`을 설정해야 한다.

```java
@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_NAME = "emailQueue";
    public static final String EXCHANGE_NAME = "emailExchange";
    public static final String ROUTING_KEY = "email.routing.key";

    @Bean
    public Queue emailQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public TopicExchange emailExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding binding(Queue emailQueue, TopicExchange emailExchange) {
        return BindingBuilder
                .bind(emailQueue)
                .to(emailExchange)
                .with(ROUTING_KEY);
    }
}
```

### Producer (메시지 생성 & 발행)

`RabbitTemplate`을 사용하여 `Exchange`로 메시지를 전달한다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendMessage(String message) {
        log.info("[Producer] 메시지 전송 중: {}", message);
        rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY, message);
    }
}
```

### Scheduler (주기적으로 메시지 발행)

10초마다 이메일 발송 요청 메시지를 자동 생성해 `Producer`에게 전달한다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class MessageScheduler {

    private final EmailProducer emailProducer;

    @Scheduled(fixedRate = 10000)
    public void sendEmailMessage() {
        String message = "[스케줄러] 이메일 발송 요청 📨";
        log.info("[스케줄러] 메시지 생성: {}", message);
        emailProducer.sendMessage(message);
    }
}
```

### Consumer (Queue의 메시지 수신)

```java
@Slf4j
@Component
public class EmailConsumer {

    @RabbitListener(queues = QUEUE_NAME)
    public void receiveMessage(String message) {
        log.info("[Consumer] 메시지 수신 완료: {}", message);
    }
}
```

<br>

### 실행 결과

실행해보면 아래와 같은 순서로 로그가 출력된다.

```
[스케줄러] 메시지 생성: ...
[Producer] 메시지 전송 중: ...
[Consumer] 메시지 수신 완료: ...
```

![rabbitMQ_flow_result](/assets/img/open_mission/rabbitMQ_flow_result.png)

단일 메시지 발송 사이클이 정상적으로 동작하는 것을 확인할 수 있었다.

---

## Fanout Exchange로 Pub/Sub 구조 실습하기

단일 `Consumer` 구조를 만들고 나니  
**여러 `Consumer`가 같은 메시지를 동시에 수신하게 만들 수 있을까?**라는 궁금증이 생겼다.

RabbitMQ에서는 이 구조를 `Fanout Exchange`로 구현할 수 있었다.

> 🤔 왜 `Fanout` 구조인가?
>
> 뉴스레터는 한 번 작성하면 여러 구독자에게 동시에 전달해야 하는 서비스이다.  
> RabbitMQ에서 이러한 브로드캐스트 패턴을 제공하는 것이 바로 Fanout Exchange다.

따라서 위에서 구현했던 `Topic Exchange에서 Fanout Exchange로 변환`해야 했다.  
일단, 이 두 친구의 차이점에 대해 짚고 넘어가자.

### Topic Exchange vs Fanout Exchange

- Topic Exchange
  - 메시지의 Routing key 기준으로 필터링하여 특정 큐만 수신
  - 각 Consumer가 관심 있는 주제만 필터링 가능
  - (예시) 주문 상태별 메시지 : `order.created`, `order.cancelled`

![rabbitMQ_flow](/assets/img/open_mission/rabbitMQ_flow.png)

- Fanout Exchange
  - 메시지를 라우팅 키와 상관없이 연결된 모든 큐로 복제
  - 메시지를 한번 발행하면 모든 Consumer가 동일한 메시지를 받는다.
  - 뉴스레터처럼 모든 구독자 브로드캐스트에 최적화

![fanout_pub_sub_flow](/assets/img/open_mission/fanout_pub_sub_flow.png)

> [RabbitMQ에서의 **Pub/Sub 구조**]
>
> - RabbitMQ의 `Pub/Sub(Publish/Subscribe)` 구조는 하나의 메시지를 여러 구독자(Consumer)에게 복제하여 전달하는 패턴이다.
> - 이 구조는 **Exchange**(교환기)라는 요소를 통해 메시지가 특정 큐로 라우팅되도록 하고, 각 소비자는 자신에게 맞는 큐에 바인딩하여 메시지를 받는다.
> - 출처: [RabbitMQ-Publish/Subscribe](https://www.rabbitmq.com/tutorials/tutorial-three-java){: target="\_blank"}

> [RabbitMQ에서의 **Pub/Sub 동작 방식**]
>
> 1. `Publisher`가 Fanout Exchange로 메시지를 보낸다.
> 2. `Exchange`는 해당 메시지를 연결된 모든 큐에 복제한다.
> 3. 각 큐는 `Consumer`에게 메시지를 전달한다.
> 4. `Consumer`는 메시지를 처리한 뒤 `ACK`를 보내면 큐에서 삭제된다.

---

### Fanout 기반 Config

큐 3개를 만들고 하나의 `Fanout Exchange`에 모두 바인딩했다.

```java
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "emailFanoutExchange";
    public static final String QUEUE_NAME_1 = "emailQueue1";
    public static final String QUEUE_NAME_2 = "emailQueue2";
    public static final String QUEUE_NAME_3 = "emailQueue3";

    @Bean
    public Queue emailQueue1() {
        return new Queue(QUEUE_NAME_1, true);
    }

    @Bean
    public Queue emailQueue2() {
        return new Queue(QUEUE_NAME_2, true);
    }

    @Bean
    public Queue emailQueue3() {
        return new Queue(QUEUE_NAME_3, true);
    }

    @Bean
    public FanoutExchange fanoutExchange() {
        return new FanoutExchange(EXCHANGE_NAME);
    }

    @Bean
    public Binding binding1(Queue emailQueue1, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(emailQueue1).to(fanoutExchange);
    }

    @Bean
    public Binding binding2(Queue emailQueue2, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(emailQueue2).to(fanoutExchange);
    }

    @Bean
    public Binding binding3(Queue emailQueue3, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(emailQueue3).to(fanoutExchange);
    }
}
```

### Producer (routing key 제거)

Fanout은 routing key를 사용하지 않는다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendMessage(String message) {
        log.info("[Producer] 메시지 전송 중: {}", message);
        rabbitTemplate.convertAndSend(EXCHANGE_NAME, "", message);
    }
}
```

### Consumer 3개 생성

```java
@Slf4j
@Component
public class EmailConsumer {

    @RabbitListener(queues = QUEUE_NAME_1)
    public void receiveMessage1(String message) {
        log.info("[Consumer-1] 📩 메시지 수신 완료: {}", message);
    }

    @RabbitListener(queues = QUEUE_NAME_2)
    public void receiveMessage2(String message) {
        log.info("[Consumer-2] 💌 메시지 수신 완료: {}", message);
    }

    @RabbitListener(queues = QUEUE_NAME_3)
    public void receiveMessage3(String message) {
        log.info("[Consumer-3] 📥 메시지 수신 완료: {}", message);
    }
}
```

<br>

### 실행 결과

메시지를 단 한 번 발행하면  
세 개의 큐에 동일한 메시지가 복제되고 각각의 `Consumer`가 동시에 동일한 메시지를 수신한다.

```
Consumer-1 ← 같은 메시지
Consumer-2 ← 같은 메시지
Consumer-3 ← 같은 메시지
```

이 구조는 "한 번 발송하면 모든 구독자에게 동시에 전달되는 뉴스레터"와 동일한 방식이다.

---

## Fanout 구조를 뉴스레터 관점에서 해석해보기

- Producer : 뉴스레터 작성자
- Fanout Exchange : 우체국 내 배포 시스템
- Queue : 구독자 개인의 '메일함'
- Consumer : 메일함을 열어 메시지를 확인하는 구독자

Producer는 단 한번만 발행하지만 Fanout은 메시지를 여러 Queue로 복제하여, 각 `Consumer`가 동일한 메시지를 받도록 한다. 이는 "한번 발행하면 여러 구독자에게 동시에 전달"해야 하는 뉴스레터와 동일한 구조라 생각한다.

---

## 회고

- 비동기 메시징 흐름을 코드로 직접 구현하며 구조를 이해할 수 있었다.
- `Exchange` 타입을 바꾸는 것만으로 다른 메시징 패턴을 구현할 수 있다는 점이 신기했다.
- 특히 `Fanout` 기반 `Pub/Sub` 구조는 뉴스레터 서비스에 적용 가능한 패턴이라 생각하였기에 코드를 작성하며 흥미로웠다.

단일 Queue에서 Fanout Pub/Sub까지 확장하는 과정을 통해  
"뉴스레터 발송 시스템을 어떻게 설계해야 할지"에 대한 감이 잡히기 시작했다.

### 다음 단계

구현을 진행하면서 한 가지 의문이 생겼다.

> `Consumer`가 늘어나면 `Queue`도 계속 늘려야 할까?

현재 구현된 내용으로 보면 Consumer를 하나 늘릴 때마다 Queue 역시 하나씩 늘어나는 형태가 된다.  
뉴스레터 서비스처럼 구독자 수가 많거나 발송량이 많은 상황에서는 이 방식이 과연 효율적인가?

이 부분들을 고려하며 뉴스레터 발송 시스템의 뼈대를 만들어보고자 한다.
