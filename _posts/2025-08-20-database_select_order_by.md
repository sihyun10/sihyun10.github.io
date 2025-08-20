---
title: "SELECT부터 정렬, 중복 제거까지, SQL 조회에 대해 알아보기"
date: 2025-08-20 23:36:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

## SQL 조회(SELECT) - 데이터 꺼내보기

데이터베이스는 결국 "필요한 데이터를 꺼내서" 쓰는 게 핵심이다.  
테이블에 저장된 데이터를 가져올 때 사용하는 가장 기본적인 명령어가 `SELECT`이다.

```sql
SELECT * FROM member;
```

- `SELECT` : 무엇을 가져올지 (열/컬럼)
- `FROM` : 어느 테이블에서 가져올지

`*` 는 "모든 열"을 의미한다.  
즉 위 구문은 `member` 테이블에 있는 모든 열의 값을 다 보여달라는 의미이다.

**[실행 결과]**

| user_id | email              | user_name | birth_date | gender | password     | password_expired | phone_num     | banned | withdraw | provider | role |
| :------ | :----------------- | :-------- | :--------- | :----- | :----------- | :--------------- | :------------ | :----- | :------- | :------- | :--- |
| 1       | sihyun@gmail.com   | 시현이    | 1990-04-23 | F      | password-123 | 0                | 010-1234-5678 | 0      | 0        | google   | USER |
| 2       | leesuman@gmail.com | 이수만    | 1992-02-14 | M      | password-456 | 0                | 010-9876-5432 | 0      | 0        | google   | USER |

### 🤔 왜 `SELECT *` 를 남발하면 안되는걸까?

- 성능 저하 : 불필요한 열까지 다 읽다보면 느려진다
- 가독성 저하 : 우리가 보고 싶은 건 몇 개 열 뿐인데 너무 많은 정보가 출력된다
- 보안/트래픽 낭비 : `password` 같은 민감한 값까지 다 나와 버릴 수 있다

➔ 실무에서는 꼭 필요한 열만 명시적으로 지정해서 조회한다

### 특정 열만 골라 조회

```sql
SELECT user_name, email, phone_num
FROM member;
```

`member` 테이블에서 이름, 이메일, 전화번호 **3가지만** 조회한다

**[실행 결과]**

| user_name | email              | phone_num     |
| :-------- | :----------------- | :------------ |
| 시현이    | sihyun@gmail.com   | 010-1234-5678 |
| 이수만    | leesuman@gmail.com | 010-9876-5432 |

### 결과에 별칭 붙이기 (AS)

```sql
SELECT user_name AS 이름, email AS 이메일, phone_num AS 전화번호
FROM member;
```

- 별칭을 붙이므로써, 어떤 데이터를 의미하는지 한눈에 파악이 가능하다

```sql
SELECT user_name 이름, email 이메일, phone_num 전화번호
FROM member;
```

- AS는 생략해도 되며, 열 이름이 겹치지 않게 구분할 때 많이 사용한다

**[실행 결과]**

| 이름   | 이메일             | 전화번호      |
| :----- | :----------------- | :------------ |
| 시현이 | sihyun@gmail.com   | 010-1234-5678 |
| 이수만 | leesuman@gmail.com | 010-9876-5432 |

---

## WHERE 절 - 원하는 조건만 필터링하기

`SELECT`는 데이터를 가져오는 명령어이지만,  
거기에 `WHERE`절이 붙으면 **필요한 데이터만 콕 집어서** 가져올 수 있다.

예를 들어, "성별이 F인 회원만 보고 싶다" 이런식으로 조건을 주어 필터링 할 수 있다.

### WHERE 기본형

```
SELECT 열목록
FROM 테이블명
WHERE 조건;
```

`WHERE` 절에는 보통 **비교 연산자**를 사용해서 조건을 만든다

| 연산자     | 의미      | 예시                      |
| :--------- | :-------- | :------------------------ |
| =          | 같다      | gender = 'F'              |
| != 또는 <> | 같지 않다 | banned != 1               |
| >          | 초과      | birth_date > '2000-01-01' |
| <          | 미만      | birth_date < '2000-01-01' |
| >=         | 이상      | wishlist_count >= 500     |

### 이메일이 특정 값과 정확히 일치하는 회원 찾기

```sql
SELECT *
FROM member
WHERE email = 'sihyun@gmail.com';
```

이메일 값과 정확히 일치하는 회원 정보만 보여준다.

**[실행 결과]**

| user_id | email            | user_name | birth_date | gender | password     | password_expired | phone_num     | banned | withdraw | provider | role |
| :------ | :--------------- | :-------- | :--------- | :----- | :----------- | :--------------- | :------------ | :----- | :------- | :------- | :--- |
| 1       | sihyun@gmail.com | 시현이    | 1990-04-23 | F      | password-123 | 0                | 010-1234-5678 | 0      | 0        | google   | USER |

### 남성 회원만 조회 (`gender = 'M'`)

```sql
SELECT user_id, user_name, gender
FROM member
WHERE gender = 'M';
```

**[실행 결과]**

| user_id | user_name | gender |
| :------ | :-------- | :----- |
| 2       | 이수만    | M      |

### 남성 회원이 아닌 사람 찾기 (!=)

```sql
SELECT user_name, gender
FROM member
WHERE gender != 'M';
```

**[실행 결과]**

| user_name | gender |
| :-------- | :----- |
| 시현이    | F      |

<br>

### 여러 조건 결합 - 논리 연산자 (AND/OR/NOT)

#### **AND 예시**

"남자이면서, banned = false 인 정상 회원만 조회" (`banned : 정지 여부`)

```sql
SELECT user_name, gender, banned
FROM member
WHERE gender = 'M' AND banned = false;
```

- `AND`는 둘 다 만족해야한다

**[실행 결과]**

| user_name | gender | banned |
| :-------- | :----- | :----- |
| 이수만    | M      | 0      |

#### **OR 예시**

"관리자이거나, 비밀번호 만료된 사람"

```sql
SELECT user_name, role, password_expired
FROM member
WHERE role = 'ADMIN' OR password_expired = true;
```

- OR은 둘 중 하나만 참이어도 조회된다

#### **NOT 예시**

"정지되지 않은(banned가 아닌) 회원만 조회"

```sql
SELECT user_name, banned
FROM member
WHERE NOT banned = true; -- 또는 WHERE banned = false;
```

**[실행 결과]**

| user_name | banned |
| :-------- | :----- |
| 시현이    | 0      |
| 이수만    | 0      |

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> WHERE 조건에 자주 쓰이는 컬럼은 **기본키**나 **인덱스** 컬럼일수록 조회가 훨씬 빠르다.  
> 인덱스는 일종의 '색인' 역할을 하기 때문에, 테이블을 처음부터 끝까지 다 훑지 않고도 원하는 데이터를 바로 찾아갈 수 있게 해준다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

---

## WHERE - 더 편리한 조건 검색

기본 `WHERE`은 `=` 또는 `>` 같은 단순 조건으로 필터링했지만,  
SQL에는 이런 조건들을 훨씬 간결하고 가독성 좋게 만들어주는 편리한 연산자들이 있다.

### 대표적으로 자주 쓰는 조건 연산자

| 기능             | 연산자          |
| :--------------- | :-------------- |
| 특정 범위        | BETWEEN A AND B |
| 목록/집합        | IN (...)        |
| 패턴 검색        | LIKE            |
| 값이 없는지 확인 | IS NULL         |

### BETWEEN : 특정 범위에 있는 값 조회

```sql
SELECT * FROM product
WHERE price >= 50000 AND price <= 100000;
```

위와 같은 방식을 BETWEEN으로 더 깔끔하게 작성할 수 있다.

```sql
SELECT * FROM product
WHERE price BETWEEN 50000 AND 100000;
```

➔ 최소값과 최대값을 포함하며, 눈으로 봐도 범위 조건이라는 게 바로 보인다.

**[실행 결과]**

| product_id | category_id | product_name | img1             | img2 | img3 | img4 | img5 | content | price | sale | brand | created_at | deleted | wishlist_count | gender | popularity_score |
| :--------- | :---------- | :----------- | :--------------- | :--- | :--- | :--- | :--- | :------ | :---- | :--- | :---- | :--------- | :------ | :------------- | :----- | :--------------- |
| 3          | 2           | 경량 패딩    | /img/padding.jpg | NULL | NULL | NULL | NULL | NULL    | 99000 | 0    | TTIO  | 2025-08-14 | 0       | 0              | U      | 0                |

**NOT BETWEEN : 특정 범위 제외**

```sql
SELECT * FROM product
WHERE price NOT BETWEEN 50000 AND 100000;
```

**[실행 결과]**

| product_id | category_id | product_name       | img1            | img2 | img3 | img4 | img5 | content | price | sale | brand | created_at | deleted | wishlist_count | gender | popularity_score |
| :--------- | :---------- | :----------------- | :-------------- | :--- | :--- | :--- | :--- | :------ | :---- | :--- | :---- | :--------- | :------ | :------------- | :----- | :--------------- |
| 1          | 1           | 베이직 반팔 티셔츠 | /img/tshirt.jpg | NULL | NULL | NULL | NULL | NULL    | 19900 | 0    | TIO   | 2025-08-14 | 0       | 0              | U      | 0                |
| 2          | 1           | 데님 바지          | /img/jeans.jpg  | NULL | NULL | NULL | NULL | NULL    | 49000 | 0    | TIO   | 2025-08-14 | 0       | 0              | U      | 0                |

<br>

### IN : 여러 값 중 하나와 일치하는 것 찾기

"브랜드가 'GUCCI', 'PRADA', 'TIO' 중 하나인 상품만 보고 싶다"

```sql
SELECT * FROM product
WHERE brand = 'GUCCI' OR brand = 'PRADA' OR brand = 'TIO';
```

OR로 쓰면 길어진다. 따라서 IN을 사용하면 훨씬 깔끔하다.

```sql
SELECT * FROM product
WHERE brand IN ('GUCCI', 'PRADA', 'TIO');
```

**NOT IN : 목록에 없는 값 찾기**

특정 브랜드를 제외하고 보고 싶을 때

```sql
SELECT * FROM product
WHERE brand NOT IN ('GUCCI', 'PRADA');
```

<br>

### LIKE : 패턴(문자열) 검색

LIKE는 모양이 비슷한 문자열을 찾을 때 사용한다.

"member 테이블에서 이메일이 `@naver.com`으로 끝나는 회원만 보고 싶다.

```sql
SELECT user_id, email
FROM member
WHERE email LIKE '%@naver.com';
```

- `%`는 어떤 문자든 0개 이상을 의미하는 와일드카드이다
- `계절%` ➔ 계절로 시작하는 단어 (예: 계절옷, 계절상품, ...)
- `%티셔츠%` ➔ 이름에 티셔츠가 들어가는 모든 상품

<br>

### IS NULL : 값이 없는(비어 있는) 데이터를 찾고 싶을 때

아직 이미지가 등록되지 않은 상품만 찾고 싶다 ➔ `img2`가 `NULL`인 상품

```sql
SELECT product_name, img2
FROM product
WHERE img2 IS NULL;
```

- NULL 비교에는 `= NULL` 쓰면 안 된다 ➔ `IS NULL` / `IS NOT NULL`

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 🤔 **왜 NULL 비교에는 = NULL을 쓰면 안될까?**
>
> SQL에서 NULL은 단순한 값(value)이 아니고, **값이 존재하지 않는다**를 의미하는 특수한 상태이다  
> 즉, NULL은 아무 값도 아닌 상태이기 때문에, 다른 값과 "비교"하는 (=, !=) 방식으로는 판단이 불가능하다
>
> (예시) `SELECT * FROM product WHERE img2 = NULL;`  
> 위 쿼리는 실제론 항상 `false` 취급돼서 아무것도 안나온다.  
> 왜냐면 NULL은 값이 없는데 그걸 비교하는 것 자체가 성립되지 않는다라고 SQL이 생각하기 때문이다.  
{: .prompt-warning }

<!-- markdownlint-restore -->

---

## ORDER BY - 결과를 정렬해주는 절

위에서 설명한 내용은 원하는 데이터를 뽑는 데 집중했다면,  
이제는 "그 결과를 어떤 순서로, 예쁘게 보여줄 것인가?"가 중요해진다.

대표적인 예:

- 가장 최근 가입한 회원 순으로 보기
- 가격이 낮은 상품부터, 또는 비싼 상품부터 보기
- 재고 많은 순 ➔ 그 안에서는 가격 낮은 순

### 기본 구조

```
SELECT 컬럼
FROM 테이블
WHERE 조건
ORDER BY 정렬기준 컬럼 [정렬방식];
```

- 정렬기준 컬럼: 어떤 값을 기준으로 위/아래를 정할지
- 정렬방식(옵션):
  - ASC : 오름차순 (작은값 ➔ 큰값)
  - DESC : 내림차순 (큰값 ➔ 작은값)

### 최근 가입자 순으로 보기 (`member` 테이블)

```sql
SELECT user_name, email, created_at
FROM member
ORDER BY created_at DESC;
```

➔ 가장 나중에 가입한 사람이 위에 올라온다 ("created_at" 컬럼 기준 내림차순)

### 가격 낮은순 상품 정렬 (`product` 테이블)

```sql
SELECT product_name, price
FROM product
ORDER BY price ASC;   -- ASC는 생략도 가능
```

### **다중 정렬**

"재고가 많은 순 ➔ 그 안에서는 가격이 낮은 순"

```sql
SELECT product_name, stock_quantity, price
FROM product
ORDER BY stock_quantity DESC, price ASC;
```

➔ 1순위: 재고 가장 많은 상품부터  
➔ 재고가 같으면 그들끼리 가격 낮은 순으로 정렬됨

---

## LIMIT - 결과 개수 제한하기

현실에서는 전체 데이터를 다 보여주는 경우보다, 상위 몇 개만 보거나 페이지당 몇 개씩 잘라서 보여주는 경우가 훨씬 많다.

`LIMIT`는 그걸 위해 존재한다.

```
SELECT 컬럼
FROM 테이블
ORDER BY 기준
LIMIT 개수;
```

### 가장 찜 수가 많은 상품 2개만 보여줄 경우

```sql
SELECT product_name, price
FROM product
ORDER BY wishlist_count DESC
LIMIT 2;
```

<br>

### 왜 정렬과 LIMIT이 필요할까?

- 사용자는 "순위"나 "정렬된 데이터"를 원함 (최근순, 인기순, 가장 저렴한 순서...)
- 전체 데이터를 한번에 가져오면 너무 느리고 무거움
  - LIMIT으로 필요한 만큼만 가져오고 페이지 나눔

따라서 데이터를 화면에 보여주기 위해 꼭 필요한 기본 기술이라고 할 수 있다.

---

## DISTINCT - 중복 제거하고 유일한 값만 보고 싶은 경우

데이터를 조회하다 보면 같은 값이 여러 번 반복되는 경우가 많다.  
예를 들어, 하나의 아바타가 모자, 신발, 가방 등 여러 상품을 착용하고 있고  
다른 아바타들도 같은 상품을 여러 번 착용했다면 `product_id`가 계속 중복되어 조회된다.

그럴 때 필요한 기능이 바로 **DISTINCT** - 중복을 제거하고 유일한 값만 남기는 것이다.

### 기본 사용법

```
SELECT DISTINCT 컬럼명
FROM 테이블;
```

### `closet_avatar_item` 테이블에서 UNIQUE한 상품 ID만 뽑기

```sql
SELECT DISTINCT product_id
FROM closet_avatar_item;
```

➔ 이 쿼리는 "현재 아바타들이 착용한 상품 중복 없이 보여줘"라는 의미이다.  
같은 상품(`product_id`)이 여러 번 착용되었더라도 결과엔 한 번만 나타난다.

### 어떤 아바타가 어떤 상품을 입었는지 **조합**으로 중복없이 보기

```sql
SELECT DISTINCT closet_avatar_id, product_id
FROM closet_avatar_item;
```

- `DISTINCT closet_avatar_id, product_id`는 이 두 컬럼을 **하나의 세트(묶음)**으로 보고
- 둘의 조합이 똑같이 반복되는 경우에만 중복으로 보고 제거한다

예를 들어, 아래와 같은 데이터가 있다면:

| closet_avatar_id | product_id |
| :--------------- | :--------- |
| 1                | 101        |
| 1                | 101        |
| 1                | 102        |
| 2                | 101        |
| 2                | 101        |

**[실행 결과]**

| closet_avatar_id | product_id |
| :--------------- | :--------- |
| 1                | 101        |
| 1                | 102        |
| 2                | 101        |

<br>

### 🤔 DISTINCT를 언제 쓸까?

- 회원 테이블에서 `role` 값이 어떤 것들로 구성되어있는지 알고 싶을 때
- 구매된 상품 카테고리는 총 몇 종류 있는지 파악할 때
- 아바타 테이블에서 지금까지 착용된 상품 종류가 몇 개나 되는지 확인할 때

즉, 특정 컬럼의 '고유한 값 목록'이나 '유형 개수'가 궁금할 때 DISTINCT를 쓰면 된다.

<br>

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
