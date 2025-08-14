---
title: "데이터 등록부터 수정, 삭제까지, DML 명령어 살펴보기"
date: 2025-08-14 13:57:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

## DML - 데이터 등록(INSERT)

새로운 회원이 가입하거나, 아바타를 만들거나, 상품을 등록하는 상황에서 `INSERT` 명령어를 쓰게 된다.  
우리가 만든 회원(`member`) 테이블과 옷장\_아바타(`closet_avatar`) 테이블을 예로 들어 `INSERT` 사용법에 대해 알아보자.

### INSERT 기본 문법

```
INSERT INTO 테이블명 (컬럼1, 컬럼2, ...)
VALUES (값1, 값2, ...);
```

- `테이블명`: 데이터를 추가할 테이블 이름
- `(컬럼1, 컬럼2, ...)`: 값을 넣고 싶은 열(컬럼) 목록
- `VALUES (값1, 값2, ...)`: 각 열에 삽입할 값
- 컬럼 목록을 생략하면 테이블 모든 열에 순서대로 값을 넣어야 함

#### [방법 1] 모든 열에 값 넣기

회원 가입 상황을 예로 들어보자.

`member` 테이블은 `user_id`가 `AUTO_INCREMENT`로 설정되어 있으므로,  
`NULL`을 넣거나 생략하면 자동으로 다음 번호가 들어간다.

```sql
INSERT INTO member VALUES(
  NULL,
  'sihyun@gmail.com',
  '이시현',
  '1990-04-23',
  'F',
  'password-123',
  FALSE,
  '010-1234-5678',
  FALSE,
  FALSE,
  'google',
  'USER'
);
```

- `user_id` : NULL로 두면 MySQL이 자동으로 번호 부여
- 모든 컬럼에 값을 넣어야 해서 쓸 내용이 많아지는 단점

**[실행 결과]**

```sql
SELECT * FROM member;
```

| user_id | email            | user_name | birth_date | gender | password     | password_expired | phone_num     | banned | withdraw | provider | role |
| :------ | :--------------- | :-------- | :--------- | :----- | :----------- | :--------------- | :------------ | :----- | :------- | :------- | :--- |
| 1       | sihyun@gmail.com | 이시현    | 1990-04-23 | F      | password-123 | 0                | 010-1234-5678 | 0      | 0        | google   | USER |

<br>

#### [방법 2] 필요한 컬럼만 선택해서 넣기

항상 모든 값을 다 입력하지 않아도 된다.  
예를 들어 `AUTO_INCREMENT`와 `DEFAULT`값이 설정된 열은 생략 가능하다.

```sql
INSERT INTO member (email, user_name, birth_date, password, phone_num, provider, role)
VALUES ('leesuman@gmail.com', '이수만', '1992-02-14', 'password-456', '010-9876-5432', 'google', 'USER');
```

- `user_id`는 자동 증가
- `gender`, `password_expired`, `banned`, `withdraw` 같은 DEFAULT 값이 있는 컬럼은 생략 가능
- 훨씬 간결하게 작성 가능

**[실행 결과]**

```sql
SELECT * FROM member;
```

| user_id | email              | user_name | birth_date | gender | password     | password_expired | phone_num     | banned | withdraw | provider | role |
| :------ | :----------------- | :-------- | :--------- | :----- | :----------- | :--------------- | :------------ | :----- | :------- | :------- | :--- |
| 1       | sihyun@gmail.com   | 이시현    | 1990-04-23 | F      | password-123 | 0                | 010-1234-5678 | 0      | 0        | google   | USER |
| 2       | leesuman@gmail.com | 이수만    | 1992-02-14 | M      | password-456 | 0                | 010-9876-5432 | 0      | 0        | google   | USER |

**[제약 조건 위반 시 INSERT 실패 예시]**  
예를 들어, `member.email`은 **UNIQUE** 이기에 같은 이메일을 넣으면 실패한다.

```sql
-- 중복된 이메일
INSERT INTO member (email, user_name, birth_date, password, phone_num, provider, role)
VALUES ('sihyun@gmail.com', '시현2', '1995-05-05', 'password-789', '010-2222-3333', 'google', 'USER');
-- Error: Duplicate entry 'sihyun@gmail.com' for key 'member.email'
```

<br>

#### [방법 3] 한 번에 여러 데이터 넣기

아바타를 한 번에 여러 개 등록할 수 있다.

```sql
INSERT INTO closet_avatar (user_id, avatar_img) VALUES
(1, 'avatar1.png'),
(1, 'avatar2.png'),
(2, 'avatar3.png');
```

- 쉼표(`,`)로 여러 행을 구분
- 단일 쿼리로 여러 레코드를 한 번에 등록할 수 있어 성능적으로도 유리

**[실행 결과]**

| closet_avatar_id | user_id | avatar_img  | created_at          |
| :--------------- | :------ | :---------- | :------------------ |
| 1                | 1       | avatar1.png | 2025-08-14 17:04:17 |
| 2                | 1       | avatar2.png | 2025-08-14 17:04:17 |
| 3                | 2       | avatar3.png | 2025-08-14 17:04:17 |

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **1. AUTO_INCREMENT 활용** : 기본키를 자동 부여하고 싶을 땐 NULL 입력 or 컬럼 생략  
> **2. DEFAULT 값 활용** : 컬럼마다 기본값을 넣어두면 필요한 값만 골라서 넣을 수 있음  
> **3. 여러 행 한 번에 등록** : 대량 데이터를 넣을 때는 한 번에 처리  
{: .prompt-tip }

<!-- markdownlint-restore -->

---

## DML - 데이터 수정(UPDATE)

회원이 닉네임을 바꾸거나, 상품 가격을 조정하거나, 아바타 이미지를 변경하는 상황에서 `UPDATE` 명령어를 사용한다.  
**이미 존재하는 데이터**를 조건에 맞게 수정할 수 있다.

### UPDATE 기본 문법

```
UPDATE 테이블명
SET 컬럼1 = 값1, 컬럼2 = 값2, ...
WHERE 조건;
```

- `테이블명`: 데이터를 변경할 대상 테이블
- `SET`: 수정할 컬럼(열)과 새 값 지정 (쉼표로 구분해 여러 개 가능)
- `WHERE`: 어떤 행(row)을 수정할지 결정
  - WHERE절에 **기본 키를 사용**하는 것을 강력히 권장!
    - 기본 키는 각 행을 고유하게 식별하므로, 의도치 않은 데이터 수정 위험이 적다
  - WHERE를 생략하면 모든 행이 수정되므로 매우 위험

### 회원 닉네임 변경

`member`테이블에서 `user_id`가 1번인 회원의 이름을 `이시현` ➔ `시현이`로 변경해보자.

```sql
UPDATE member
SET user_name = '시현이'
WHERE user_id = 1;
```

**변경 전 조회**

```sql
SELECT * FROM member WHERE user_id = 1;
```

| user_id | email            | user_name  | birth_date | gender | password     | password_expired | phone_num     | banned | withdraw | provider | role |
| :------ | :--------------- | :--------- | :--------- | :----- | :----------- | :--------------- | :------------ | :----- | :------- | :------- | :--- |
| 1       | sihyun@gmail.com | **이시현** | 1990-04-23 | F      | password-123 | 0                | 010-1234-5678 | 0      | 0        | google   | USER |

**변경 후 조회**

```sql
SELECT * FROM member WHERE user_id = 1;
```

| user_id | email            | user_name  | birth_date | gender | password     | password_expired | phone_num     | banned | withdraw | provider | role |
| :------ | :--------------- | :--------- | :--------- | :----- | :----------- | :--------------- | :------------ | :----- | :------- | :------- | :--- |
| 1       | sihyun@gmail.com | **시현이** | 1990-04-23 | F      | password-123 | 0                | 010-1234-5678 | 0      | 0        | google   | USER |

<br>

### 여러 값 한 번에 변경

먼저 `product`테이블에 데이터를 넣어준다.

```sql
INSERT INTO product (category_id, product_name, img1, price, brand)
VALUES
(1, '베이직 반팔 티셔츠', '/img/tshirt.jpg', 19900, 'TIO'),
(1, '데님 바지', '/img/jeans.jpg', 49000, 'TIO'),
(2, '경량 패딩', '/img/padding.jpg', 99000, 'TIO');
```

```sql
SELECT * FROM product;
```

| product_id | category_id | product_name       | img1             | img2 | img3 | img4 | img5 | content | price | sale | brand | created_at | deleted | wishlist_count | gender | popularity_score |
| :--------- | :---------- | :----------------- | :--------------- | :--- | :--- | :--- | :--- | :------ | :---- | :--- | :---- | :--------- | :------ | :------------- | :----- | :--------------- |
| 1          | 1           | 베이직 반팔 티셔츠 | /img/tshirt.jpg  | NULL | NULL | NULL | NULL | NULL    | 19900 | 0    | TIO   | 2025-08-14 | 0       | 0              | U      | 0                |
| 2          | 1           | 데님 바지          | /img/jeans.jpg   | NULL | NULL | NULL | NULL | NULL    | 49000 | 0    | TIO   | 2025-08-14 | 0       | 0              | U      | 0                |
| 3          | 2           | 경량 패딩          | /img/padding.jpg | NULL | NULL | NULL | NULL | NULL    | 99000 | 0    | TIO   | 2025-08-14 | 0       | 0              | U      | 0                |

<br>

`product`테이블에서 `product_id = 3`인 상품의 가격과 재고를 동시에 수정한다.

```sql
UPDATE product
SET price = 70000, brand = 'TTIO'
WHERE product_id = 3;
```

- `SET` 뒤에 변경할 컬럼과 값을 쉼표로 구분해 나열
- `WHERE` 조건으로 수정할 대상을 정확히 지정
  - 없으면 전체 데이터가 수정될 수 있음!
- 변경 전에는 `SELECT`문으로 대상 데이터를 먼저 확인하는 습관이 안전하다

**변경 후 조회**

```sql
SELECT * FROM product WHERE product_id = 3;
```

| product_id | category_id | product_name | img1             | img2 | img3 | img4 | img5 | content | price     | sale | brand    | created_at | deleted | wishlist_count | gender | popularity_score |
| :--------- | :---------- | :----------- | :--------------- | :--- | :--- | :--- | :--- | :------ | :-------- | :--- | :------- | :--------- | :------ | :------------- | :----- | :--------------- |
| 3          | 2           | 경량 패딩    | /img/padding.jpg | NULL | NULL | NULL | NULL | NULL    | **70000** | 0    | **TTIO** | 2025-08-14 | 0       | 0              | U      | 0                |

<br>

### WHERE 절을 빼면 생기는 참사

만약 조건을 빼먹으면, 모든 데이터가 수정된다.

```sql
UPDATE product
SET price = 1000; -- WHERE 없음
```

➔ 전체 상품 가격이 1000원이 되어버린다.

#### 안전하게 UPDATE 하는 습관

**1. 변경 전 SELECT로 (변경하고자 하는) 대상 확인**

```sql
SELECT * FROM product
WHERE product_id = 3;
```

**2. 확인 후 UPDATE 실행**

```sql
UPDATE product
SET price = 70000
WHERE product_id = 3;
```

---

## DML - 데이터 삭제(DELETE)

`DELETE FROM`은 테이블에서 행(row)을 삭제하는 명령어이다.  
UPDATE처럼 특정 조건(`WHERE`)을 지정해 일부 데이터만 삭제할 수도 있고,  
조건 없이 실행하면 테이블의 모든 데이터가 삭제된다.

### DELETE 기본 문법

```
DELETE FROM 테이블명
WHERE 조건;
```

- `테이블명`: 삭제할 대상이 있는 테이블
- `WHERE`: 삭제할 대상을 결정하는 조건
  - 조건을 빼면 전부 삭제되므로 매우 주의!
  - WHERE절에 **기본 키를 사용**하여 대상 행을 지정하는 것을 권장함

### 특정 회원 삭제하기

시나리오 : 회원 중 `user_id = 2`인 유저가 탈퇴를 요청했다고 가정하자.

**1단계 - 삭제 대상 먼저 확인**

```sql
SELECT * FROM member
WHERE user_id = 2;
```

- 탈퇴하려는 회원이 맞는지 데이터를 눈으로 확인한다.

**2단계 - DELETE 실행**

```sql
DELETE FROM member
WHERE user_id = 2;
```

이와 같은 형식으로 `DELETE` 명령어를 실행하면 되는데,  
현재 **외래 키(Foreign Key)** 제약 조건 때문에 오류가 발생한다.

```sql
Cannot delete or update a parent row: a foreign key constraint fails
(`my_closet`.`closet_avatar`, CONSTRAINT `fk_avatar_member` FOREIGN KEY (`user_id`) REFERENCES `member` (`user_id`))
```

- member 테이블의 `user_id`가 closet_avatar 테이블에서 외래 키로 참조되고 있음
- 외래 키는 부모 데이터(`member.user_id`)가 삭제되거나 변경될 때, 자식 테이블(closet_avatar)의 데이터 무결성을 해칠 수 있기 때문에 기본적으로 막음
- 즉, `user_id = 2` 회원의 아바타 데이터가 `closet_avatar`에 남아있는 상태라서, 부모(`member`)에서 해당 행을 지울 수 없는 것이다!

#### 해결 방법

**1. 자식 데이터 먼저 삭제**

`closet_avatar`에서 `user_id = 2` 데이터를 먼저 지운 뒤, `member`에서 삭제해야 함.

```sql
DELETE FROM closet_avatar
WHERE user_id = 2;

DELETE FROM member
WHERE user_id = 2;
```

**2. ON DELETE CASCADE 설정하기**

외래 키를 만들 때 `ON DELETE CASCADE`옵션을 주면, 부모 데이터 삭제 시 자동으로 자식 데이터도 삭제됨  
다만, 이건 설계 단계에서 신중히 결정해야 한다.

**3. ON DELETE SET NULL**

부모 데이터 삭제 시, 자식의 외래 키 값을 `NULL`로 변경하는 방식.  
(외래 키가 NULL 허용이어야 가능하다)

**[✔️ Tip]**

- 외래 키는 `참조 무결성`을 지키기 위해 기본적으로 부모 삭제를 막는다.
- 자식부터 삭제하거나, `CASCADE` / `SET NULL` 옵션을 설정해야 한다.
- 실무에서는 데이터 무결성 정책에 따라 `CASCADE`를 허용할지, 수동 삭제로 갈지 미리 결정한다.

#### WHERE 절의 중요성

`DELETE`는 `UPDATE`보다 더 파괴적이다.  
UPDATE는 잘못 변경하더라도 원래 값이 남아있을 가능성이 있지만,  
DELETE는 행 자체를 없애버려 복구가 훨씬 더 어렵다.  
➔ 백업을 해두지 않았다면 영구 손실인 격이다.

<br>

### DELETE vs TRUNCATE 차이

| 구분           | DELETE FROM table                             | TRUNCATE TABLE table                      |
| :------------- | :-------------------------------------------- | :---------------------------------------- |
| 종류           | DML (데이터 조작어)                           | DDL (데이터 정의어)                       |
| 처리방식       | 조건에 따라 선택 삭제 가능 (`WHERE` 사용)     | 테이블 전체를 한 번에 삭제 (`WHERE` 불가) |
| 속도           | 느림 (각 행 삭제를 기록)                      | 빠름                                      |
| AUTO_INCREMENT | 초기화되지 않음                               | 1부터 다시 시작                           |
| ROLLBACK       | 가능 (트랜잭션 내)                            | 불가능                                    |
| 언제 써야할까? | 특정 조건에 맞는 데이터만 삭제 (회원 탈퇴 등) | 테이블 내 데이터들을 완전히 비워야할 경우 |

---

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 이 글은 [**실전 데이터베이스 입문**] 강의 내용을 바탕으로 작성되었으며,  
> 예제는 제가 진행한 **TIO** 프로젝트의 데이터베이스 설계를 기반으로 설명하고 있습니다.
>
> 프로젝트 환경과 요구사항에 맞춰 구성된 예시이므로,  
> 실제 서비스 환경이나 다른 설계 방식과는 차이가 있을 수 있습니다.
{: .prompt-info }

<!-- markdownlint-restore -->

[출처] : (인프런 강의) [김영한의 실전 데이터베이스 입문 - 모든 IT인을 위한 SQL 첫걸음(SQL부터 차근차근)](https://www.inflearn.com/course/%EA%B9%80%EC%98%81%ED%95%9C-%EC%8B%A4%EC%A0%84-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%9E%85%EB%AC%B8)
