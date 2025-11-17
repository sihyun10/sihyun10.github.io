---
title: "3명에서 10만 구독자로 확장하면서 마주친 문제들"
date: 2025-11-16 22:12:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

뉴스레터 서비스를 운영한다면 구독자가 3명뿐인 경우는 거의 없을 것이다.  
그렇다면 수만 명의 구독자가 있어도 지금 구현한 코드가 제대로 작동할까?

이 질문에 답을 얻기 위해, 구독자를 1,000명 ➔ 10,000명 ➔ 100,000명까지 증가시키며  
이메일 발송 속도와 전체 시스템 성능을 측정해보았다.

그리고 그 과정에서 예상하지 못한 문제와 해결 과정을 정리했다.

---

## 1. 1,000명 더미 데이터 생성 & 기본 성능 측정

먼저 MySQL에 1,000명의 구독자를 생성한 뒤,  
`NewsletterConsumer`에 실행 시간 측정을 추가하여 성능을 확인했다.

```sql
-- subscriber 테이블에 1,000명 더미 데이터 삽입
INSERT INTO subscriber (email, active)
SELECT
    CONCAT('testuser', numbers.n, '@example.com') AS email,
    TRUE AS active
FROM (
    SELECT a.N + b.N * 10 + c.N * 100 + 1 AS n
    FROM
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
    ORDER BY n
    LIMIT 1000
) numbers;
```

### 성능 결과 (1,000명)

```
[Consumer] ✅ 발송 완료 - 총 시간: 376ms, 이메일 발송 시간: 360ms
[Consumer] 📈 평균 발송 속도: 0.36ms/구독자
[Consumer] 🔮 성공: 1000 FAIL: 0 (성공률: 100.0%)
```

---

## 2. 1,000명에서 10,000명으로 증가

같은 방식으로 구독자를 10,000명까지 늘려서 측정해보았다.

### 성능 결과

```
[Consumer] ✅ 발송 완료 - 총 시간: 2306ms, 이메일 발송 시간: 2270ms
[Consumer] 📈 평균 발송 속도: 0.23ms/구독자
[Consumer] 🔮 성공: 10000 FAIL: 0 (성공률: 100.0%)
```

## 3. 10,000명에서 100,000명으로 증가

구독자를 100,000명까지 증가시킨 후 측정해보았다.

### 성능 결과

```
[Consumer] ✅ 발송 완료 - 총 시간: 28017ms, 이메일 발송 시간: 27911ms
[Consumer] 📈 평균 발송 속도: 0.28ms/구독자
[Consumer] 🔮 성공: 100000 FAIL: 0 (성공률: 100.0%)
```

<br>

### 구독자 수별로 성능 분석 결과

결과를 봤을 때, 충분히 빨랐다.

| 구독자 수 | 총 시간  | 이메일 발송 시간 | 평균 속도 | 성공률 |
| :-------- | :------- | :--------------- | :-------- | :----- |
| 1,000명   | 376ms    | 360ms            | 0.36ms    | 100%   |
| 10,000명  | 2,306ms  | 2,270ms          | 0.23ms    | 100%   |
| 100,000명 | 28,017ms | 27,911ms         | 0.28ms    | 100%   |

<br>

그런데 다시 100,000명 성능 측정을 하자 문제가 발생했다. 맥북 팬에서 소리가 나고, IntelliJ 화면이 멈추고, 터미널 입력도 안되고, 로그도 출력되다 중단되고, 결국 시스템 전체가 과부하가 걸려버렸다.

처음에는 잘 됐는데 두 번째부터는 계속 같은 문제가 반복되었다.  
따라서 이 과부하를 해결하기 위해 리팩토링을 진행하였다.

---

## parallelStream 내부에서 DB I/O를 100,000번 수행

100,000명의 구독자 각각에 대해  
`parallelStream` 내부에서 `messageRepository.save()`를 호출했다.

구독자가 100,000명이라면 DB I/O가 100,000번 병렬로 실행되는 구조였다.

### 해결: JDBC Batch Insert 도입

JDBC Batch Insert (벌크 삽입)을 사용하여 성능 최적화를 진행하였다.

- `parallelStream` 내부에서는 로그 객체만 생성하여 리스트에 저장
- 병렬 처리가 모두 끝난 뒤
  - `messageRepository.saveAll()`로 한 번에 벌크 저장

### Batch 활성화

Spring Data JPA를 사용할 때 하이버네이트가 내부적으로 JDBC의 배치 기능을 사용하도록 설정해야 한다.  
`application.yml` 파일에 다음과 같이 설정을 추가하였다.

```yaml
jpa:
  properties:
    hibernate:
      jdbc:
        batch_size: 50
        order_inserts: true
        order_updates: true
```

### NewsletterConsumer 리팩토링

`processEmail()`과 `saveMessageLog()`를 제거하고, 이메일 발송 후 로그 객체를 동기화된 리스트에 모은다.  
병렬 스트림이 완료된 후, `messageRepository.saveAll()`을 호출하여 대량의 로그를 배치 삽입한다.

```java
public class NewsletterConsumer {

    @RabbitListener(queues = QUEUE_NAME)
    @Transactional
    public void receiveMessage(NewsletterMessage message) {

        // 1. 병렬 처리 중 로그 객체를 안전하게 모으기 위한 동기화된 리스트 생성
        List<Message> messageLogs = Collections.synchronizedList(new ArrayList<>(subscribers.size()));

        // 병렬 처리로 동시 발송
        subscribers.parallelStream()
                .forEach(subscriber -> {
                    boolean success = false;
                    try {
                        // 2. 이메일 발송
                        success = emailService.sendEmail(subscriber.getEmail(), content);
                    } catch (Exception e) {
                        log.error("[Consumer] Failed to send email to {}", subscriber.getEmail(), e);
                    }

                    // 3. DB 저장을 위해 로그 객체만 생성하여 리스트에 추가
                    Message log = Message.builder()
                            .subscriber(subscriber)
                            .content(content)
                            .fileName(fileName)
                            .sendAt(LocalDateTime.now())
                            .status(success ? MessageStatus.SUCCESS : MessageStatus.FAILURE)
                            .build();

                    messageLogs.add(log);

                    if (success) {
                        successCount.incrementAndGet();
                    } else {
                        failCount.incrementAndGet();
                    }
                });

        // 4. 병렬 스트림이 완료된 후, 트랜잭션 내에서 한 번에 벌크 삽입
        messageRepository.saveAll(messageLogs);
    }
}
```

### 리팩토링 후 성능 결과

| 구독자 수 | DB Batch Insert 시간 | 총 시간 | 이메일 발송+배치 시간 | 평균 발송 속도 | 성공률 |
| :-------- | :------------------- | :------ | :-------------------- | :------------- | :----- |
| 1,000명   | 172ms                | 188ms   | 183ms                 | 0.18ms         | 100%   |
| 10,000명  | 1839ms               | 1925ms  | 1891ms                | 0.19ms         | 100%   |

리팩토링 이후 1,000명, 10,000명 발송에서는 성능이 이전보다 더 좋아졌지만,  
구독자가 100,000명으로 증가했을 때는 시스템이 과부하에 걸렸다.

---

## 원인 분석: 10만 구독자를 한 번에 메모리에 적재해서 그런게 아닐까?

```java
public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {
    List<Subscriber> findAllByActiveTrue();
}
```

이 한 줄이 구독자 100,000명을 JVM 힙 메모리에 한 번에 로딩하고 있었다.

따라서 구독자를 한 번에 100,000명을 가져오지 말고, '10,000명 단위로 잘라서 순차적으로 처리하면 어떨까?' 생각이 들었다. 그렇게 **페이징(Paging)을 도입**하기로 결정했다.

### 구독자 조회에 페이징(Paging) 적용

`Pageable`을 사용하여 필요한 만큼만 조회하는 방식으로 변경했다.

```java
public interface SubscriberRepository extends JpaRepository<Subscriber, Long> {

    Page<Subscriber> findAllByActiveTrue(Pageable pageable);
}
```

이제 10만명을 1만명씩 10번 나눠서 가져온다.

### `NewsletterConsumer` - 페이징 기반 구조로 리팩토링

- `PAGE_SIZE`만큼 구독자를 가져온다.
- 병렬로 이메일을 발송한다.
- 성공/실패 로그를 메시지 엔티티로 생성한다.
- 해당 페이지의 로그만 `Batch Insert`로 DB에 저장
- 다음 페이지로 넘긴다.

```java
public class NewsletterConsumer {

    // 한 번에 처리할 구독자 수 (10,000명)
    private static final int PAGE_SIZE = 10_000;

    public void receiveMessage(NewsletterMessage message) {

        int pageNumber = 0;
        boolean hasNext = true;

        // 1. Paging Loop 시작 : 구독자를 PAGE_SIZE 단위로 조회/처리
        while (hasNext) {
            Pageable pageable = PageRequest.of(pageNumber, PAGE_SIZE);
            Page<Subscriber> subscriberPage = subscriberRepository.findAllByActiveTrue(pageable);

            List<Subscriber> currentSubscribers = subscriberPage.getContent();

            if (currentSubscribers.isEmpty()) {
                break;
            }

            // 현재 페이지 로그 객체를 담을 동기화된 리스트
            List<Message> messageLogs = Collections.synchronizedList(new ArrayList<>(currentSubscribers.size()));

            // 2. 페이지별 병렬 처리
            currentSubscribers.parallelStream()
                    .forEach(subscriber -> {
                        boolean success = false;
                        try {
                            success = emailService.sendEmail(subscriber.getEmail(), content);
                        } catch (Exception e) {
                            log.error("[Consumer] Failed to send email to {}", subscriber.getEmail(), e);
                        }

                        // 로그 객체 생성
                        Message log = Message.builder()
                                .subscriber(subscriber)
                                .content(content)
                                .fileName(fileName)
                                .sendAt(LocalDateTime.now())
                                .status(success ? MessageStatus.SUCCESS : MessageStatus.FAILURE)
                                .build();

                        messageLogs.add(log);

                        if (success) {
                            successCount.incrementAndGet();
                        } else {
                            failCount.incrementAndGet();
                        }
                    });

            // 3. 페이지별 Batch Insert
            messageRepository.saveAll(messageLogs);

            // 다음 페이지로 이동
            pageNumber += 1;
            hasNext = subscriberPage.hasNext();
        }
    }
}
```

<br>

### Hibernate SQL 로그 비활성화

![hibernate_insert](/assets/img/open_mission/hibernate_insert.png)

`INSERT` 배치 작업이 실행될 때마다 `Hibernate` 로그가 수천 줄씩 출력되어 콘솔이 과부하되거나, IntelliJ 화면이 멈추는 현상에 영향이 있다고 생각했다. 또한 이 로그는 굳이 출력될 필요가 없다고 생각이 들었기 때문이다.

그래서 아래와 같이 SQL 로깅을 전부 비활성화했다.

- `format_sql`, `show-sql` ➔ `false`로 변경

```yaml
jpa:
  hibernate:
    ddl-auto: update
  properties:
    hibernate:
      format_sql: false
      jdbc:
        batch_size: 50
        order_inserts: true
        order_updates: true
  show-sql: false
```

### 성능 결과 (100,000명)

이제 시스템 과부하 없이 잘 측정되었다.

```
[Consumer] ✅ 발송 완료 - 총 시간: 16583ms
[Consumer] 📈 평균 처리 속도: 0.17ms/구독자
[Consumer] 🔮 성공: 100000 FAIL: 0 (성공률: 100.0%)
```

---

## parallelStream에서 보이는 onPool-worker 스레드의 정체

이메일 발송 테스트 중 로그를 확인하다 보면 `onPool-worker` 같은 스레드 이름을 볼 수 있었다.

```
2025-11-16T18:57:28.930+09:00  INFO 5234 --- [email-scheduler-server] [onPool-worker-1] c.e.s.e.newsletter.service.EmailService  : [Email Service] Newsletter has been sent to testuser95156@example.com
2025-11-16T18:57:28.930+09:00  INFO 5234 --- [email-scheduler-server] [onPool-worker-3] c.e.s.e.newsletter.service.EmailService  : [Email Service] Newsletter has been sent to testuser92646@example.com
2025-11-16T18:57:28.930+09:00  INFO 5234 --- [email-scheduler-server] [onPool-worker-4] c.e.s.e.newsletter.service.EmailService  : [Email Service] Newsletter has been sent to testuser97653@example.com
2025-11-16T18:57:28.930+09:00  INFO 5234 --- [email-scheduler-server] [onPool-worker-4] c.e.s.e.newsletter.service.EmailService  : [Email Service] Newsletter has been sent to testuser97654@example.com
```

이 스레드들은 `parallelStream()`을 사용할 때 내부적으로 동작하는  
`ForkJoinPool.commonPool()`의 `worker` 스레드들이다.

```java
currentSubscribers.parallelStream()
    .forEach(subscriber -> {
        // ... 이메일 발송 (I/O 작업) ...
    });
```

`parallelStream()`에 작업을 던지면,  
이 스레드 풀에 속한 여러 `worker` 스레드가 **동시에** 이메일 발송 작업을 나누어 처리하게 된다.

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 🤔 **왜 여러 스레드가 동시에 실행될까?**
>
> parallelStream은 크게 아래 로직으로 실행된다.
>
> 1. 리스트를 분할(split)
> 2. 여러 스레드(worker)가 나눠진 작업 병렬 처리
> 3. 결과를 병합(join)
{: .prompt-tip }

<!-- markdownlint-restore -->

따라서 `parallelStream()`은 CPU 코어 수에 따라 자연스럽게 여러 스레드가 동시에 실행된다.

---

## 트랜잭션 범위 분리

현재 `receiveMessage()` 메서드 전체에 `@Transactional`이 적용되어 있다.

```java
@Transactional
public void receiveMessage() {
}
```

이는 이메일 발송 성공 후 DB 로그 삽입이 실패할 경우, 전체 트랜잭션이 롤백되어 RabbitMQ 메시지 큐로 돌아가고 이미 발송된 이메일이 재발송될 위험이 있다.

이 문제를 해결하기 위해 DB 작업만 전담하는 서비스를 분리하여 트랜잭션 범위를 좁혔다.

### MessageLogService 생성

DB 로그 저장(배치 삽입) 로직만 담당하는 새로운 서비스를 생성한다.

```java
@Service
@RequiredArgsConstructor
public class MessageLogService {

    private final MessageRepository messageRepository;

    /**
     * 이 메서드에만 @Transactional을 적용하여 트랜잭션 범위를 로그 저장으로 한정
     */
    @Transactional
    public void saveLogsInBatch(List<Message> messageLogs) {
        if (!messageLogs.isEmpty()) {
            messageRepository.saveAll(messageLogs);
        }
    }
}
```

### NewsletterConsumer 수정

`@Transactional`을 제거하고, `MessageLogService`를 주입받아 로그 저장 시점에만 호출한다.

```java
public class NewsletterConsumer {

    private final MessageLogService messageLogService;

    @RabbitListener(queues = QUEUE_NAME)
    public void receiveMessage(NewsletterMessage message) {

            // 3. 페이지별 Batch Insert
            messageLogService.saveLogsInBatch(messageLogs);
    }
}
```

---

## receiveMessage 메서드 책임 분리하기

이 메서드 하나에 로깅, 페이지 관리, 병렬 처리, 로그 생성, 성공/실패 카운팅 등 다양한 책임을 가지고 있다.  
따라서 각 기능이 명확히 분리된 메서드로 추출하였다.

- 로깅 : `logStart()`, `logSubscriberCount()`, `logFinish()`
- 페이지 로딩 : `loadSubscriberPage()`
- 페이지 처리 : `processPage()`
- 핵심 로직 : `sendEmailSafely()`, `buildLog()`

```java
public class NewsletterConsumer {

    private final SubscriberRepository subscriberRepository;
    private final MessageLogService messageLogService;
    private final EmailService emailService;

    // 한 번에 처리할 구독자 수 (10,000명)
    private static final int PAGE_SIZE = 10_000;

    @RabbitListener(queues = QUEUE_NAME)
    public void receiveMessage(NewsletterMessage message) {
        long startTime = System.currentTimeMillis();

        logStart(message);
        long totalSubscribers = logSubscriberCount();

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger failCount = new AtomicInteger();

        processSubscribers(message, successCount, failCount);

        logFinish(startTime, totalSubscribers, successCount, failCount);
    }

    private void logStart(NewsletterMessage message) {
        log.info("[Consumer] 📨 뉴스레터 발송 시작 - 파일: {}", message.getFileName());
    }

    private long logSubscriberCount() {
        long count = subscriberRepository.count();
        log.info("[Consumer] 👥 총 구독자 수: {}", count);
        return count;
    }

    private void logFinish(long startTime, long total, AtomicInteger success, AtomicInteger fail) {
        long totalTime = System.currentTimeMillis() - startTime;

        log.info("[Consumer] ✅ 발송 완료 - 총 시간: {}ms", totalTime);
        log.info("[Consumer] 📈 평균 처리 속도: {}ms/구독자",
                String.format("%.2f", (double) totalTime / total));
        log.info("[Consumer] 🔮 성공: {} FAIL: {} (성공률: {}%)",
                success.get(),
                fail.get(),
                String.format("%.1f", success.get() * 100.0 / total));
    }

    // 전체 Paging 처리
    private void processSubscribers(
            NewsletterMessage message,
            AtomicInteger successCount,
            AtomicInteger failCount
    ) {
        int pageNumber = 0;

        while (true) {
            Page<Subscriber> subscriberPage = loadSubscriberPage(pageNumber);

            if (subscriberPage.getContent().isEmpty()) {
                break;
            }

            List<Message> logs = processPage(subscriberPage.getContent(), message, successCount, failCount);

            messageLogService.saveLogsInBatch(logs);

            if (!subscriberPage.hasNext()) {
                break;
            }
            pageNumber += 1;
        }
    }

    // 페이지 조회
    private Page<Subscriber> loadSubscriberPage(int pageNumber) {
        Pageable pageable = PageRequest.of(pageNumber, PAGE_SIZE);
        return subscriberRepository.findAllByActiveTrue(pageable);
    }

    // 페이지 처리 (병렬 이메일 발송 + 로그 생성)
    private List<Message> processPage(
            List<Subscriber> subscribers,
            NewsletterMessage message,
            AtomicInteger successCount,
            AtomicInteger failCount
    ) {
        List<Message> logs = Collections.synchronizedList(new ArrayList<>(subscribers.size()));

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

        return logs;
    }

    // 이메일 발송 (예외 안전 처리)
    private boolean sendEmailSafely(Subscriber subscriber, String content) {
        try {
            return emailService.sendEmail(subscriber.getEmail(), content);
        } catch (Exception e) {
            log.error("[Consumer] Failed to send email to {}", subscriber.getEmail(), e);
            return false;
        }
    }

    // Message 로그 객체 생성
    private Message buildLog(Subscriber subscriber, NewsletterMessage msg, boolean success) {
        return Message.builder()
                .subscriber(subscriber)
                .fileName(msg.getFileName())
                .content(msg.getContent())
                .sendAt(LocalDateTime.now())
                .status(success ? MessageStatus.SUCCESS : MessageStatus.FAILURE)
                .build();
    }
}
```

---

## 마무리하며

이번 성능 테스트는 개인적으로 굉장히 흥미로운 경험이었다.  
CPU를 이렇게 최대로 사용해본 것도, 맥북 팬에서 소리나는 것도 처음이었다. (솔직히 다시 겪고 싶지는 않다🥲)

그런데 더 놀라웠던 건 생각보다 처리 속도가 훨씬 빨랐다는 점이었다.  
100,000명이라는 숫자가 꽤 많다고 느꼈는데, 실제로 돌려보니 예상보다 훨씬 짧은 시간 안에 끝나버려서 "어? 이렇게 빨라?" 하는 느낌이었다.

![no_yes](/assets/img/open_mission/no_yes.jpeg)

테스트를 진행하면서 "왜 화면이 멈출까?", "로그가 많아서 그런가?", "연산을 많이 해서 그런가?", "코드 이슈인가?" 등등.. 안되면 '왜 안될까?', 잘 되면 '왜 잘될까?' 계속 이런 생각들이 떠올랐다.

비슷한 이슈를 겪은 분들의 블로그도 도움됐고,  
결국엔 지금 보이는 문제부터 고쳐가자. 이 단순한 접근이 효과적이었다.  
지금 생각해보면 SQL insert 로그 출력이 꽤 비용이 컸던 것 같다.  
어쨌든 잘 될 때조차 "근데 왜 잘 되는 거지?"라고 되묻는 시간이 많았던 것 같다.
