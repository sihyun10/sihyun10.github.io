---
title: "이메일 구독/취소 API 유효성 검증하기"
date: 2025-11-19 23:58:00 +09:00
categories: [Woowacourse, Open mission]
tags: [woowacourse]
pin: false
---

사용자 구독 및 구독 취소 로직을 구현했지만, 실제로 API 통신을 통한 테스트가 필요했다.

Spring Boot에서는 Java에서 직접 조건문을 작성하여 데이터를 검증하는 방식보다 훨씬 간편하게 **어노테이션**만으로 유효성 검증을 처리할 수 있다.

이메일 구독/구독 취소 API를 만들고, 이 과정에서 데이터 유효성 검증 흐름을 알아보자!

---

## 데이터 유효성 검증 흐름

Spring Boot에서 요청 데이터의 유효성 검증은 다음과 같은 순서로 진행된다.

- **클라이언트 요청**
  - 클라이언트가 `@RequestBody`, `@RequestParam`, `@PathVariable` 등을 통해 데이터를 전송한다.
- **컨트롤러 검증**
  - 컨트롤러 메서드에서 `@Valid` 또는 `@Validated`를 사용해 요청 데이터의 유효성을 검증한다.
    - 검증 성공: API는 정상적인 성공 응답을 반환한다.
    - 검증 실패: Spring Boot가 자동으로 `400 Bad Request`를 반환하며,  
      어떤 값이 잘못되었는지에 대한 오류 메시지를 응답에 담아 보낸다.
- **클라이언트 후속 처리**
  - 클라이언트는 응답(성공 또는 실패 메시지)을 보고 다음 입력이나 후속 처리를 진행한다.

<br>

### 의존성 추가

유효성 검증을 사용하려면 먼저 프로젝트에 의존성을 추가해야 한다.

```gradle
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

---

## 이메일 검증 : DTO 설정

요청 데이터의 유효성을 검사하기 위해 DTO에 검증 어노테이션을 설정한다.

```java
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequest {

    @NotBlank(message = "이메일은 필수 입력값입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
}
```

- `@NotBlank`
  - null, 빈 문자열, 공백 문자열 모두 허용하지 않음 (이메일은 필수 입력값)
- `@Email`
  - 이메일의 기본적인 형식(`@` 기호 포함 등)을 검사함

### Controller에서 @Valid 적용하기

DTO에 설정된 유효성 검증 조건이 실제로 작동하도록 컨트롤러 메서드에 `@Valid` 어노테이션을 적용한다.

```java
@Slf4j
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<String> subscribe(@Valid @RequestBody SubscriptionRequest request) {
        log.info("구독 요청 수신: {}", request.getEmail());
        subscriptionService.subscribe(request.getEmail());
        return ResponseEntity.ok("구독이 성공적으로 처리되었습니다.");
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<String> unsubscribe(@Valid @RequestBody SubscriptionRequest request) {
        log.info("구독 취소 요청 수신: {}", request.getEmail());
        subscriptionService.unsubscribe(request.getEmail());
        return ResponseEntity.ok("구독이 성공적으로 취소되었습니다.");
    }
}
```

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **@Valid 역할**
>
> - Java에서 유효성 검증을 위해 제공되는 어노테이션이다.
> - `@RequestBody`와 함께 사용될 때, JSON 형태로 전송받은 데이터(DTO)에 대해  
>   유효성 검증을 수행하도록 지시한다.
> - 이 어노테이션이 없으면 DTO 내부의 `@NotBlank`, `@Email` 등의 검증 조건이 작동하지 않는다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

Spring Boot는 `@Valid`를 통해 검증 실패 시 **자동으로** `400 Bad Request`와 함께 오류 메시지를 응답하기 때문에, 개발자가 직접 예외 처리 코드를 작성할 필요가 없어 코드가 간결해진다.

---

## Postman으로 성공 케이스 테스트해보기

Postman을 사용하여 "구독"과 "구독 취소"가 잘 작동하는지 확인해보았다.

> (참고) 테스트할 땐, 스케줄러 시간을 40초 단위로 실행되게끔 설정해두었다.

### 구독 요청 (성공 예시)

- URL

```
POST http://localhost:8080/api/subscriptions
```

- Body > raw > JSON

```json
{
  "email": "test@example.com"
}
```

**결과**

- 상태 코드 : 200 OK
- 응답 메시지: `구독이 성공적으로 처리되었습니다.`

![subscription_success](/assets/img/open_mission/subscription_success.png)  
![subscription_success_send](/assets/img/open_mission/subscription_success_send.png)

### (기존 구독자) 구독 취소 요청 (성공 예시)

- URL

```
POST http://localhost:8080/api/subscriptions/unsubscribe
```

- Body > raw > JSON

```json
{
  "email": "test@example.com"
}
```

**결과**

- 상태 코드 : 200 OK
- 응답 메시지 : `구독이 성공적으로 취소되었습니다.`

![subscription_cancel](/assets/img/open_mission/subscription_cancel.png)  
![postman_subscription_cancel](/assets/img/open_mission/postman_subscription_cancel.png)  
![subscription_cancel(1)](</assets/img/open_mission/subscription_cancel(1).png>)

---

## Postman으로 실패 케이스 테스트해보기

Postman을 사용하여 유효성 검증이 올바르게 작동하는지 확인했다.

### 구독 요청 (실패 예시)

- URL

```
POST http://localhost:8080/api/subscriptions
```

- Body > raw > JSON

```json
{
  "email": "hi"
}
```

**결과**

- 상태 코드 : 400 Bad Request
- 예외 메시지 : `올바른 이메일 형식이 아닙니다.`

![subscriptions_fail_result](/assets/img/open_mission/subscriptions_fail_result.png)

### 구독 취소 요청 (실패 예시)

- URL

```
POST http://localhost:8080/api/subscriptions/unsubscribe
```

- Body > raw > JSON

```json
{
  "email": "hi"
}
```

**결과**

- 상태 코드 : 400 Bad Request
- 예외 메시지 : `올바른 이메일 형식이 아닙니다.`

![unsubscribe_fail_result](/assets/img/open_mission/unsubscribe_fail_result.png)

---

## 🤔 구독한 사용자가 아닌데, 구독 취소를 가능하게 해줘도 될까?

![subscription_request](/assets/img/open_mission/subscription_request.png)

### DB에 없는 이메일로 취소해도 구독 취소가 가능하다

```json
{
  "email": "not@example.com"
}
```

**결과**

- 상태 코드 : 200 OK
- 응답 : `구독이 성공적으로 취소되었습니다.`

![subscription_request_OK](/assets/img/open_mission/subscription_request_OK.png)

실제로는 구독이 취소되지 않았음에도 **성공 응답(200 OK)이** 반환된다.

### 원인 분석

`unsubscribe()` 메서드를 보면 알 수 있다.

```java
public class SubscriptionService {
    @Transactional
    public void unsubscribe(String email) {
        // 이메일로 구독자 조회
        subscriberRepository.findByEmail(email).ifPresent(subscriber -> {
            // 구독자가 존재하고, 현재 활성 상태(active)이면
            if (subscriber.isActive()) {
                subscriber.deactivate(); // 비활성화 처리
                subscriberRepository.save(subscriber);
            }
        });
        // 이메일이 존재하지 않거나 비활성 상태면 아무 동작도 하지 않고 종료
    }
}
```

- **이메일이 존재하지 않으면?**
  - `ifPresent()` 내부 로직이 실행되지 않고 메서드가 아무 동작 없이 종료됨
- **컨트롤러 응답**
  - 컨트롤러는 서비스 메서드 종료 후 무조건 `"구독이 성공적으로 취소되었습니다."`라는 성공 응답을 반환함

### 이렇게 구현해도 괜찮을까?

나는 괜찮다고 생각한다.  
뉴스레터 서비스들을 보면 이 방식이 옳다고 느껴졌기 때문이다.

만약 존재하지 않는 이메일일 때 `"구독 기록이 없습니다."`라고 알려주게 된다면?  
악의적인 사용자가 API를 통해 실제 구독 중인 이메일 주소의 존재 여부를 쉽게 파악할 수 있게 되어 보안적으로 위험할 수 있다. (이메일 주소 유효성 노출)

내가 보는 뉴스레터 서비스들을 보았을때,  
구독한 사용자들에게 '구독 취소'가 활성화가 된다.  
쉽게 말하면 구독한 상태여야 구독 취소가 가능하다는 것이다.

![subscribed_status](/assets/img/open_mission/subscribed_status.png)

또한 구독하지 않은 사용자의 취소 요청은 실제 시스템에 영향을 주지 않는다.  
요청 이메일이 DB에 존재하고 활성 상태일 경우에만 `active = false` 처리가 되므로, 존재하지 않는 이메일의 요청은 아무 변화 없이 종료된다. 따라서 사용자에게는 `"취소 처리가 완료되었다"`는 통일된 응답을 제공하는 것이 서비스의 안정성과 보안 측면에서 좋다고 생각했다.

---

## 마무리하며

구독/구독 취소 API를 구현한 뒤, 실제로 Postman으로 요청을 보내보고, 스케줄러가 돌아가며 뉴스레터를 전송하는 흐름을 직접 확인해볼 수 있었다.

배운 점은 다음과 같다.

- Spring Boot의 유효성 검증만으로도 데이터 검증을 깔끔하게 처리할 수 있다
- 실제로 API 통신을 해보며 서비스 흐름을 검증하는 과정
- 사용자가 구독한 순간부터 다음 스케줄링 사이클에 맞춰 뉴스레터가 정상적으로 발송되는지 직접 확인함으로써, 구독 시점과 스케줄러의 동작이 어떻게 맞물려 동작하는지 이해하였다.
- 존재하지 않는 이메일의 구독 취소 요청에 대해 통일된 성공 응답을 주는 것이 적합한지 고민해보았다.

실제 서비스처럼 동작하는 과정을 보니 전체적으로 어떻게 동작하는지 더 이해가 잘 되는 느낌이었다.

특히 구독 시점에 따라 이메일이 바로 보내지는 게 아닌, 다음 스케줄 시간에 맞춰 함께 발송되는 구조를 실제로 확인할 수 있어 좋았다.

---

## 참고한 블로그 글

- [Spring Boot Validation 이해하기 : 데이터 유효성 검증](https://adjh54.tistory.com/77)
- [Spring Boot spring-boot-starter-validation](https://gaemi606.tistory.com/entry/Spring-Boot-ResponseBody-%EA%B0%81-%ED%95%AD%EB%AA%A9%EC%97%90-%ED%81%AC%EA%B8%B0-%ED%95%84%EC%88%98-%EA%B0%92-%EC%84%A4%EC%A0%95-spring-boot-starter-validation)
