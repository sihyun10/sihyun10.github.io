---
title: "메일 발송 기본 구조 잡기"
date: 2025-11-11 22:30:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

이전까지는 `RabbitMQ`의 메시지 큐 개념과 Spring Scheduler의 작동 원리를 파악했다면, 오늘은 실제 서비스에서 사용할 수 있는 '뉴스레터 발송 시스템의 기본 구조'를 구현하는 데 집중했다.

메시지 발행(Publish) ➔ 메시지 소비(Consume) ➔ 이메일 전송 ➔ 발송 기록 저장까지의 흐름을 완성하고, 안정적인 발송 및 로깅 처리를 목표로 했다.

---

## 오늘의 목표 🛠️

- [x] 뉴스레터 발송 시스템 기본 구조 설계
- [x] RabbitMQ Fanout Exchange 기반 메시지 전송 구현
- [x] 구독자 정보(`Subscriber`) 및 발송 이력(`Message`) DB 연동
- [x] `@Scheduled`를 이용한 자동 발송 테스트
- [x] 발송 결과를 로그 및 DB로 검증

---

## 전체 동작 흐름

- `NewsletterScheduler` : 10초마다 주기적으로 발행자(`Publisher`) 호출
- `NewsletterPublisher` : 뉴스레터 내용을 읽어 `RabbitMQ`의 **Fanout Exchange**로 메시지 전송
- `RabbitMQ` : 발행된 메시지를 Queue에 안전하게 보관
- `NewsletterConsumer` : Queue에서 메시지를 수신
- `Consumer` : DB의 활성 구독자를 조회 ➔ 각 구독자에게 이메일 발송 ➔ 발송 성공/실패 결과를 `Message` 테이블에 기록

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 🙆‍♀️ **10초마다 주기적으로 발송되도록 구현한 이유는?**
>
> 최종 목표는 매일 오전 8시 발송이지만, 개발 과정에서 흐름을 즉각적으로 확인하기 위해 10초 주기로 설정하여 테스트 효율성을 고려하였다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

---

## 주요 코드 구현 상세

### 1. RabbitMQ 설정 : Fanout Exchange 도입

```java
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "newsletter.exchange";
    public static final String QUEUE_NAME = "newsletter.queue";


    @Bean
    public FanoutExchange newsletterExchange() {
        return new FanoutExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue newsletterQueue() {
        return new Queue(QUEUE_NAME, true);
    }
}
```

<br>

### 2. Publisher - 메시지 발행

**Fanout Exchange**를 이용해 여러 큐로 동시에 뉴스레터 콘텐츠를 전송

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class
NewsletterPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishNewsletter() {
        try {
            String content = new String(
                    new ClassPathResource("newsletter.md").getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            rabbitTemplate.convertAndSend(EXCHANGE_NAME, "", content);
            log.info("[Publisher] Newsletter content has been published.");

        } catch (IOException e) {
            log.error("Failed to read newsletter content", e);
            throw new RuntimeException(e);
        }
    }
}
```

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> `FanoutExchange`에서는 라우팅 키가 필요 없기 때문에 `""` 빈 문자열로 처리한다.  
> 이는 Exchange가 모든 큐에 메시지를 "브로드캐스트"하는 방식으로 작동하기 때문이다.  
{: .prompt-tip }

<br>

### 3. Consumer - 메시지 수신과 이메일 발송

`Consumer`는 메시지를 수신한 뒤, 활성화된 구독자 목록을 DB에서 조회하고  
각 구독자에게 이메일을 발송한 뒤 발송 결과를 `Message` 테이블에 저장한다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class NewsletterConsumer {

    private final SubscriberRepository subscriberRepository;
    private final MessageRepository messageRepository;
    private final EmailService emailService;

    @RabbitListener(queues = "newsletter.queue")
    @Transactional
    public void receiveMessage(String messageContent) {
        log.info("[Consumer] Received newsletter content. Preparing to send to subscribers.");

        subscriberRepository.findAllByActiveTrue()
                .forEach(subscriber -> {
                    boolean success = emailService.sendEmail(subscriber.getEmail(), messageContent);
                    saveMessageLog(subscriber, messageContent, success);
                });

        log.info("[Consumer] Finished sending newsletters to all subscribers.");
    }

    private void saveMessageLog(Subscriber subscriber, String content, boolean success) {
        Message message = Message.builder()
                .subscriber(subscriber)
                .content(content)
                .sendAt(LocalDateTime.now())
                .status(success ? MessageStatus.SUCCESS : MessageStatus.FAILURE)
                .build();
        messageRepository.save(message);
    }
}
```

- `@Transactional`
  - 만약 발송 중 `DB` 관련 오류가 발생하면, 해당 메시지 처리 전체를 롤백하여 `RabbitMQ`가 재전송할 수 있도록 한다.

<br>

### 4. Scheduler - 발송 주기 제어

`@Scheduled(fixedRate = 10000)`을 사용하여 10초마다 자동 발송을 테스트했다.  
현재는 빠른 피드백을 위해 짧은 주기로 설정했지만, 실제 서비스에서는 특정 시간(예: 매일 08:00)으로 조정해야한다.

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class NewsletterScheduler {

    private final NewsletterPublisher publisher;

    @Scheduled(fixedRate = 10000)
    public void sendDailyNewsletter() {
        log.info("⏰ [Scheduler] 뉴스레터 발송 시작");
        publisher.publishNewsletter();
        log.info("☑️ [Scheduler] 뉴스레터 발송 완료");
    }
}
```

<br>

### 5. Message Entity - 발송 기록 저장

각 이메일 발송 결과를 `Message` 테이블에 기록하여  
구독자별 발송 내역을 볼 수 있도록 했다.

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriber_id")
    private Subscriber subscriber;

    @Lob
    private String content;

    private LocalDateTime sendAt;

    @Enumerated(EnumType.STRING)
    private MessageStatus status;

    public enum MessageStatus {
        SUCCESS, FAILURE
    }
}
```

---

## 실행 결과

- 로그 결과 캡쳐한 부분

![fanout_exchange_result(1)](</assets/img/open_mission/fanout_exchange_result(1).png>)  
![fanout_exchange_result(2)](</assets/img/open_mission/fanout_exchange_result(2).png>)  
![fanout_exchange_result(3)](</assets/img/open_mission/fanout_exchange_result(3).png>)

- 정리한 버전

```
⏰ [Scheduler] 뉴스레터 발송 시작
[Publisher] Newsletter content has been published.
☑️ [Scheduler] 뉴스레터 발송 완료
[Consumer] Received newsletter content. Preparing to send to subscribers.
[Email Service] Newsletter has been sent to user1@example.com
[Email Service] Newsletter has been sent to user2@example.com
[Email Service] Newsletter has been sent to user3@example.com
[Consumer] Finished sending newsletters to all subscribers.
```

### Sql에서 조회

```sql
SELECT * FROM message;
```

![fanout_exchange_sql_result](/assets/img/open_mission/fanout_exchange_sql_result.png)

`message` 테이블에서 각 구독자별로 발송 시각, 내용, 상태(`SUCCESS`)가 정상적으로 기록된 것을 확인했다.  
이를 통해 이메일 발송 흐름이 잘 동작하였음을 검증할 수 있었다.

---

## 마무리 및 회고

오늘은 메일 발송 서비스의 기본 뼈대를 구현하였지만, 아직 개선해야 할 부분들이 많이 남았다.

- Publisher 콘텐츠 동적 생성
  - 현재는 `newsletter.md` 파일의 고정된 내용을 전송하고 있다.  
    향후 동적으로 콘텐츠를 생성하거나 외부로부터 데이터를 받아 발행하도록 로직 개선하기
- Consumer의 처리 병목 현상
  - 현재 한 `Consumer`가 모든 구독자에게 순차적으로 메일을 전송하고 있어, 많은 구독자가 있을 경우 병목이 발생한다.
  - 멀티 `Consumer` 구조로 확장하거나, 다른 해결방식들도 고민해보기
- 발송 실패 처리 로직
  - 네트워크 오류로 발송이 실패했을 경우, 재시도 로직이나 `DLQ(Dead Letter Queue)`를 통한 안정적인 오류 처리가 필요하다.
- 구독 취소 처리
  - 구독 취소된 사용자는 더 이상 메일을 수신하지 않도록 로직 추가가 필요하다.

지금 생각나는 것만 해도 이렇게 많은데, 하나씩 순차적으로 궁금증을 해소해나갈 예정이다.
