---
title: "메일 반복 발송 문제 해결 과정"
date: 2025-11-14 22:12:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

처음에는 단순히 `newsletter.md` 파일 하나만을 가지고 구독자들에게 순차적으로 이메일을 보내도록 구성해두었다. 기능 자체는 문제없이 작동하였지만, 문제점이 있었다.

![fanout_exchange_sql_result](/assets/img/open_mission/fanout_exchange_sql_result.png)

위의 이미지처럼 항상 동일한 뉴스레터 파일만 계속 발송된다는 점이다.  
만약 실제 서비스라면 사용자 입장에서는 매번 같은 내용의 뉴스레터를 받게 되는 꼴이다.  
한번 보낸 파일이면 그만 보내야하는데, 계속 보내진다는 점이 문제점이었다.

그래서 자연스럽게 다음과 같은 목표를 세우게 되었다.

- 여러 개의 `.md` 파일들을 준비해두고, **한 번에 하나씩 순차적으로 발송**되도록 만들기
- 준비된 모든 파일을 다 보내고 나면, **더 이상 뉴스레터를 발송하지 않도록** 만들기

단순히 파일 몇 개 더 만들어서 발송시키면 되겠지. 생각했지만,  
실제로는 생각보다 어려웠고, 이 간단해 보이던 개선 작업에 이틀이나 시간이 걸렸다.

이번 글에서는 이 과정을 진행하면서 마주했던 문제들과 그 문제들을 어떻게 해결해 나갔는지, 그리고 그 과정에서 배운 점들을 정리해보고자 한다.

---

## 문제 1 : RabbitMQ에서 HashMap 역직렬화 오류 발생

`Publisher` 에서 다음과 같이 HashMap 형태로 메시지를 전송했다.

```java
Map<String, String> message = new HashMap<>();
message.put("fileName", nextFileName);
message.put("content", content);
rabbitTemplate.convertAndSend(EXCHANGE_NAME, "", message);
```

그러자 `Consumer` 쪽에서 역직렬화 오류가 발생했다.

### 원인

`HashMap`은 기본 Java 객체 직렬화 방식인 Java Serialization을 사용하는데, 이는 보안상 취약점이 있어 Spring AMQP가 기본적으로 차단한다. 따라서 신뢰할 수 있는 형식인 `JSON`을 사용하여 메시지를 주고받도록 설정해야 한다.

### 해결

**1. JSON 메시지 컨버터 적용**

```java
@Bean
public Jackson2JsonMessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
}

@Bean
public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    RabbitTemplate template = new RabbitTemplate(connectionFactory);
    template.setMessageConverter(messageConverter());
    return template;
}
```

**2. DTO 클래스 생성**

```java
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterMessage {
    private String fileName;
    private String content;
}
```

**3. Publisher/Consumer 모두 DTO 기반으로 전송・수신하도록 수정**

```java
// NewsletterPublisher
NewsletterMessage message = new NewsletterMessage(nextFileName, content);
rabbitTemplate.convertAndSend(EXCHANGE_NAME, "", message);

// NewsletterConsumer
@RabbitListener(queues = QUEUE_NAME)
@Transactional
public void receiveMessage(NewsletterMessage message) {
  // ...
}
```

<br>

> **참고한 블로그**
>
> [객체 직렬화 & 역직렬화](https://defyuil.tistory.com/m/163){: target="\_blank"}  
> [RabbitMQ message 직렬화 문제 해결](https://ddong-kka.tistory.com/26){: target="\_blank"}

---

## 문제 2 : 뉴스레터가 끝없이 반복 발송되는 버그

`newsletter_01` ➔ `newsletter_02` ➔ `newsletter_03`까지 잘 보냈지만  
모든 파일을 다 보낸 뒤에도 다시 `newsletter_01`부터 반복 발송되었다.

![infinite_repetition_problem](/assets/img/open_mission/infinite_repetition_problem.png)

### 원인

- `determineNextNewsletterFile()` 메서드의 `orElse` 로직

```java
private String determineNextNewsletterFile(List<String> newsletterFiles) {
    return messageRepository.findLastSentFileName()
            .map(lastSent -> {
                int currentIndex = newsletterFiles.indexOf(lastSent);
                int nextIndex = currentIndex + 1;
                if (nextIndex >= newsletterFiles.size()) {
                    return null; // 모든 파일 전송 완료
                }
                return newsletterFiles.get(nextIndex);
            })
            .orElse(newsletterFiles.get(0)); // 문제 : null을 반환해도 첫번째 파일로 대체됨
}
```

모든 파일이 끝났을 때 분명 `return null`을 해두었는데  
`orElse`가 이를 감지하고 다시 첫 번째 파일을 반환해버린 것이 원인이었다.

여기서 중요한 점은 `Optional.map()` 내부에서 `null`을 반환하면 그 값이 그대로 전달되지 않고 `Optional.empty()`로 변환된다는 점이다. "null을 반환했으니까 이제 보낼 파일 없어"라고 구현한 내 의도와는 다르게 `Optional` 입장에서는 "값이 없네. 그럼 빈 `Optional`이구나"라고 판단해버린 것이다.

그 결과 빈 `Optional`이 생성되고, `orElse()`가 실행되면서 `newsletterFiles.get(0)`이 기본값으로 반환되어 3번째 파일까지 발송된 후 다시 첫 번째 파일로 되돌아가는 무한 루프가 발생하게 되었다.

### 해결과정

디버깅 로그를 촘촘히 찍어보면서 흐름을 추적해보았고,  
문제가 `orElse`에 있다는 사실을 확인한 뒤, `orElse` 로직을 제거하였다.

```java
private String determineNextNewsletterFile(List<String> newsletterFiles) {
    Optional<String> lastSentOpt = messageRepository.findLastSentFileName();
    log.info("🔍 [Debug] 사용 가능한 파일들: {}", newsletterFiles);
    log.info("🔍 [Debug] 마지막 발송 파일: {}", lastSentOpt.orElse("없음"));
    return messageRepository.findLastSentFileName()
            .map(lastSent -> {
                int currentIndex = newsletterFiles.indexOf(lastSent);
                log.info("🔍 [Debug] 마지막 파일의 인덱스: {}", currentIndex);

                int nextIndex = currentIndex + 1;
                log.info("🔍 [Debug] 다음 인덱스: {}, 전체 파일 수: {}", nextIndex, newsletterFiles.size());
                if (nextIndex >= newsletterFiles.size()) {
                    log.info("🔍 [Debug] 모든 파일 전송 완료!");
                    return null;
                }
                String nextFile = newsletterFiles.get(nextIndex);
                log.info("🔍 [Debug] 다음 발송 파일: {}", nextFile);
                return nextFile;
            })
            .orElse(newsletterFiles.get(0));
}
```

- 디버깅 결과
  - 모든 파일을 전송했음에도 불구하고 다시 `newsletter_01.md` 파일 전송함

```
🔍 [Debug] 마지막 발송 파일: newsletter_03.md
🔍 [Debug] 마지막 파일의 인덱스: 2
🔍 [Debug] 다음 인덱스: 3, 전체 파일 수: 3
🔍 [Debug] 모든 파일 전송 완료!
📨 [Publisher] Sent newsletter file: newsletter_01.md  // 문제 발견!
```

### 해결 코드

초기 값만 `Optional`로 처리하고,  
이후는 명확한 조건문 로직으로 처리하도록 변경하였다.

```java
private String determineNextNewsletterFile(List<String> newsletterFiles) {
    Optional<String> lastSentOpt = messageRepository.findLastSentFileName();

    if (lastSentOpt.isEmpty()) {
        // 첫 실행 시 첫 번째 뉴스레터 발송
        return newsletterFiles.get(0);
    }

    String lastSent = lastSentOpt.get();
    int currentIndex = newsletterFiles.indexOf(lastSent);

    int nextIndex = currentIndex + 1;

    if (nextIndex >= newsletterFiles.size()) {
        return null; // 모든 뉴스레터 전송 완료
    }

    return newsletterFiles.get(nextIndex);
}
```

### 결과

이제 더 이상 반복 발송 문제는 발생하지 않았다.

![debug_success_infinite_repetition_problem](/assets/img/open_mission/debug_success_infinite_repetition_problem.png)

---

## 문제 3 : 스케줄러 로그가 계속 찍히는 문제

모든 뉴스레터 발송이 완료된 이후에도 10초마다 계속 아래와 같이 로그를 출력하고 있었다.

![scheduler_log_problem](/assets/img/open_mission/scheduler_log_problem.png)

```
⏰ [Scheduler] 뉴스레터 발송 시작
모든 뉴스레터를 전송 완료했습니다.

⏰ [Scheduler] 뉴스레터 발송 시작 // 반복...
```

스케줄러는 계속 동작해야하는게 맞지만, 발송할 뉴스레터가 없을 때는 조용히 기다리는 게 맞다고 생각이 들었다.  
그렇기에 현재 로그 출력되는 부분이 불필요하다 느꼈다.

### 해결

보낼 뉴스레터가 있을 때만 로그를 찍도록 수정해주었다.

```java
public class NewsletterScheduler {

    private final NewsletterPublisher publisher;

    @Scheduled(fixedRate = 10000) // 테스트용 스케줄러 : 개발/테스트 시 빠르게 확인하기 위해 사용 (10초 간격)
    public void sendDailyNewsletter() {
        boolean hasNewsletter = publisher.publishNewsletter();

        if (hasNewsletter) {
            log.info("📡 [Scheduler] 뉴스레터를 Exchange에 전송했습니다");
        }
        // 보낼 뉴스레터가 없으면 조용히 대기
    }
}
```

스케줄러는 항상 실행되지만 보낼 뉴스레터가 없으면 조용히 대기한다.  
이렇게 한 이유는 실제 서비스는 발송대기 상태일 때 불필요한 로그가 남으면 헷갈리기 때문이다.

---

## 최종 구현 결과

1. `newsletter_01.md` ➔ 발송 및 전송 로그
2. `newsletter_02.md` ➔ 발송 및 전송 로그
3. `newsletter_03.md` ➔ 발송 및 전송 로그
4. 모든 파일 발송 완료 ➔ 스케줄러는 조용한 대기로 전환

![successLog_sending_sequentially](/assets/img/open_mission/successLog_sending_sequentially.png)

![success_sending_message_sequentially](/assets/img/open_mission/success_sending_message_sequentially.png)

---

## 마무리 및 회고

단일 파일 전송이 잘 동작하는걸 확인했으니 여러 파일들을 준비해 놓고 순차적으로 전송되도록 만들기만 하면 되겠다며 처음엔 단순하게 생각했었다.

하지만 막상 구현을 시작하고 보니, 내가 기대한 결과와 실제 동작이 다르게 흘러가는 상황을 여러 번 마주했다.  
갑자기 로그가 안 찍힌다든지, 정상적으로 보이던 흐름이 다시 반복되기 시작한다든지...  
작은 문제 같아 보여도 원인을 찾지 못하면 쉽게 해결되지 않는다는 걸 많이 느꼈다.

그래도 디버깅 로그를 따라가며 문제의 지점들을 찾았고,  
결국 내 의도대로 순서대로 전송되고 마지막 파일 이후에는 전송되지 않도록 흐름을 완성해냈다.  
생각보다 오래 걸렸지만, 제대로 동작하는 화면을 보니 그만큼 더 뿌듯했다.

이제 다음으로 해보고 싶은 건, 현재 3명뿐인 구독자를 1,000명 수준으로 늘려서 테스트해보는 것이다.  
현실의 뉴스레터 서비스라면 몇 명이 아니라 수백, 수천 명에게 발송되는 것이 자연스러우니,  
그 규모에서도 안정적으로 메시지가 전달되는지 확인해보고 싶다.
