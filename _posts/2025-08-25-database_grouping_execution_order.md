---
title: "SQL 집계 함수와 GROUP BY, HAVING, 실행 순서 정리"
date: 2025-08-25 23:06:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

먼저, 들어가기에 앞서 데이터를 세팅해놓고 시작하겠습니다.  
이전에 생성한 테이블을 초기화 시킨 후, 데이터를 삽입해보겠습니다.

### 데이터 세팅 (초기화 & INSERT)

```sql
SET FOREIGN_KEY_CHECKS = 0; -- 비활성화
-- 테이블 초기화 (데이터 삭제 & AUTO_INCREMENT 초기화)
TRUNCATE TABLE closet_avatar_item;
TRUNCATE TABLE product;
TRUNCATE TABLE closet_avatar;
TRUNCATE TABLE member;
SET FOREIGN_KEY_CHECKS = 1; -- 활성화

-- 회원 데이터
INSERT INTO member (email, user_name, birth_date, gender, password, phone_num, provider, role)
VALUES
('alice@example.com', '앨리스', '1995-06-01', 'F', 'pw123!', '010-1234-5678', 'google', 'USER'),
('bob@example.com',   '밥',     '1990-03-15', 'M', 'pw456!', '010-2345-6789', 'google', 'USER'),
('carol@example.com', '캐롤',   '2000-11-20', 'F', 'pw789!', '010-3456-7890', 'google', 'USER');

-- 옷장 아바타
INSERT INTO closet_avatar (user_id, avatar_img)
VALUES
(1, 'avatar1.png'),
(2, 'avatar2.png'),
(3, 'avatar3.png');

-- 상품
INSERT INTO product
(category_id, product_name, img1, price, sale, brand, gender, popularity_score)
VALUES
(1, '화이트 티셔츠', '/images/white_tshirt.jpg', 19900, 10, '베이직브랜드', 'U', 120),
(1, '블랙 티셔츠', '/images/black_tshirt.jpg', 21900, 0, '베이직브랜드', 'M', 95),
(2, '데님 팬츠', '/images/denim_pants.jpg', 49900, 20, '데님스타일', 'U', 210),
(2, '슬랙스', '/images/slacks.jpg', 59900, 0, '오피스룩', 'M', 80),
(3, '레더 자켓', '/images/leather_jacket.jpg', 129000, 30, '럭셔리핏', 'U', 300),
(3, '후드 집업', '/images/hood_zipup.jpg', 59000, 10, '스트릿무드', 'F', 150);

-- 옷장 아바타 착용 아이템
INSERT INTO closet_avatar_item (closet_avatar_id, product_id)
VALUES
(1, 1), -- 앨리스: 화이트 티셔츠
(1, 2), -- 앨리스: 블랙 티셔츠
(2, 3), -- 밥: 데님 팬츠
(2, 6), -- 밥: 후드 집업
(3, 5); -- 캐롤: 레더 자켓
```

- member ➔ 회원 정보
- closet_avatar ➔ 회원별 (옷장)아바타 정보
- closet_avatar_item ➔ (옷장)아바타가 착용한 상품 정보
- product ➔ 상품 정보

---

## 집계와 그룹핑

- "지금 회원이 총 몇명이지?"
- "카테고리별로 상품이 얼마나 팔렸지?"
- "착용한 아이템 중 가장 인기 있는 브랜드는 무엇인지?"

이처럼 데이터를 집계해서 요약하고, 특정 기준으로 묶어(`Grouping`) 분석해야할 수 있다.  
SQL에서는 이를 도와주는 **집계 함수**와 **GROUP BY** 절을 제공한다.

### 전체 데이터 건수 : COUNT()

회원이 총 몇 명인지, 아바타가 몇 개 생성되었는지 등을 확인할 수 있다.

```sql
SELECT COUNT(*) AS total_members
FROM member;
```

**실행 결과**

| total_members |
| :------------ |
| 3             |

- `COUNT(*)`는 NULL 여부와 상관없이 전체 행 개수를 센다
  - 즉, 컬럼 값이 NULL이어도 무조건 카운트한다
- `COUNT(컬럼)`은 NULL 제외, 실제 값이 있는 행만 센다

### 카테고리별 상품 개수 : GROUP BY

각 카테고리(`category_id`)에 몇 개의 상품이 있는지 집계

```sql
SELECT
  category_id,
  COUNT(*) AS product_count
FROM product
GROUP BY category_id;
```

**실행 결과**

| category_id | product_count |
| :---------- | :------------ |
| 1           | 2             |
| 2           | 2             |
| 3           | 2             |

➔ 상의 2벌, 하의 2벌, 아우터 2벌  
각 카테고리별로 몇 개의 상품이 있는지 확인할 수 있다.

### 합계와 평균 : SUM(), AVG()

카테고리별 상품 합계와 평균을 구할 수 있다.

```sql
SELECT
  category_id,
  SUM(price) AS total_price,
  AVG(price) AS avg_price
FROM product
GROUP BY category_id;
```

**실행 결과**

| category_id | total_price | avg_price  |
| :---------- | :---------- | :--------- |
| 1           | 41800       | 20900.0000 |
| 2           | 109800      | 54900.0000 |
| 3           | 188000      | 94000.0000 |

- 상의 카테고리 : 합계 41,800원, 평균 20,900원
- 하의 카테고리 : 합계 109,800원, 평균 54,900원
- 아우터 카테고리 : 합계 188,000원, 평균 94,000원

### 최대값과 최소값 : MAX(), MIN()

우리 서비스에서 가장 비싼 상품과 가장 저렴한 상품을 찾을 수 있다.

```sql
SELECT
  MAX(price) AS most_expensive,
  MIN(price) AS cheapest
FROM product;
```

**실행 결과**

| most_expensive | cheapest |
| :------------- | :------- |
| 129000         | 19900    |

- 가장 비싼 상품은 레더 자켓 (129,000원)
- 가장 저렴한 상품은 화이트 티셔츠 (19,900원)

### 아바타별 착용 아이템 수

한 아바타가 몇 개의 아이템을 착용했는지 집계

```sql
SELECT
  closet_avatar_id,
  COUNT(*) AS item_count
FROM closet_avatar_item
GROUP BY closet_avatar_id;
```

**실행 결과**

| closet_avatar_id | item_count |
| :--------------- | :--------- |
| 1                | 2          |
| 2                | 2          |
| 3                | 1          |

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> `COUNT(*)`는 해당 그룹의 행(row) 개수를 모두 센다.  
> `COUNT(avatar_item_id)`는 `avatar_item_id`값이 NULL이 아닐 때만 센다.  
> 하지만 `avatar_item_id`는 **PRIMARY KEY**라서 NULL이 될 수 없다.  
> 따라서 `COUNT(avatar_item_id)`를 써도 문제는 없지만, `COUNT(*)`를 쓰는 게 더 명확하다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

<br>

### 회원별 착용 브랜드 수 : DISTINCT

"회원이 몇 개의 브랜드를 입고 있을까?"라는 질문을 해보겠습니다.

단순히 몇 개의 아이템을 입었는지가 아니라, 브랜드의 종류를 세는 게 목적이다.  
예를 들어, `밥` 회원이 '베이직브랜드'의 티셔츠 2개와 '데님스타일'의 바지를 입고 있다면,  
총 아이템 수는 3개지만 브랜드 수는 2개여야한다.

이를 위해 **DISTINCT**를 사용한다.  
**DISTINCT**는 중복을 제거하는 키워드이다.

```sql
SELECT
  m.user_name,
  COUNT(DISTINCT p.brand) AS brand_count
FROM member m
JOIN closet_avatar ca ON m.user_id = ca.user_id
JOIN closet_avatar_item cai ON ca.closet_avatar_id = cai.closet_avatar_id
JOIN product p ON cai.product_id = p.product_id
GROUP BY m.user_name;
```

**실행 결과**

| user_name | brand_count |
| :-------- | :---------- |
| 밥        | 2           |
| 앨리스    | 1           |
| 캐롤      | 1           |

<br>

- **JOIN** : 여러 테이블을 연결해서 필요한 데이터를 가져오기
  - 회원 정보는 member 테이블, 상품 정보는 product 테이블에 흩어져 있다.
  - 그런데 회원이 어떤 상품을 입었는지 알기 위해서는 중간 테이블을 거쳐야 한다.
    - closet_avatar : 회원별 아바타 정보
    - closet_avatar_item : 아바타가 착용한 상품 정보
  - 그래서 회원 ➔ 아바타 ➔ 착용 아이템 ➔ 상품 순으로 테이블을 연결해야 한다.
  - 이처럼 여러 테이블을 연결해서 필요한 정보를 가져오는 문법이 바로 **JOIN**이다.
    - 지금은 테이블을 연결하는 문법이다~ 정도로만 이해하고 넘어가자.
- **COUNT(DISTINCT p.brand)** : 중복 제거 후 개수 세기
  - 특정 회원이 입은 상품의 브랜드를 **중복 없이** 세어준다.
  - 예를 들어, 한 회원이 같은 브랜드의 티셔츠를 10개 입고 있어도, 브랜드 수는 1로만 카운트된다.

<br>

### HAVING으로 그룹 필터링하기

이번에는 "아이템을 2개 이상 입힌 회원"만 골라보고 싶다.  
그럴 때 바로 HAVING 절을 사용한다.

```sql
SELECT
  m.user_name,
  COUNT(*) AS item_count
FROM member m
JOIN closet_avatar ca ON m.user_id = ca.user_id
JOIN closet_avatar_item cai ON ca.closet_avatar_id = cai.closet_avatar_id
GROUP BY m.user_name
HAVING COUNT(*) >= 2;
```

| user_name | item_count |
| :-------- | :--------- |
| 앨리스    | 2          |
| 밥        | 2          |

- `GROUP BY m.user_name`으로 회원별로 아이템을 묶는다.
- `COUNT(*)`로 각 회원이 착용한 아이템 개수를 센다.
- `HAVING COUNT(*) >= 2`로 그룹화된 결과를 기준으로 2개 이상 입힌 회원만 남긴다.

#### WHERE vs HAVING

둘 다 "조건"을 걸어 데이터를 거르는 역할을 하지만, 언제 적용되는지가 다르다.

WHERE는 그룹핑 전, 개별 행을 필터링할 때 사용하며,  
HAVING은 그룹으로 묶은 결과를 필터링할 때 사용한다.

쉽게 말해,  
WHERE는 `입장 전 티켓 검사`하는 것과 같다. 조건에 맞지 않으면 입장 자체가 불가한 것이고,  
HAVING은 `입장 후 점수 확인`하는 것과 같다. 이미 들어온 사람들 중 조건을 충족하는 그룹만 남긴다.

예를 들어, "가격이 10만원 이상인 상품만" 그룹화하고, 그 그룹에서 2건 이상 팔린 카테고리만 보고 싶다면?

```sql
SELECT
  category,
  COUNT(*) AS premium_order_count
FROM order_stat
WHERE price >= 100000 -- 가격 조건으로 먼저 필터링
GROUP BY category -- 카테고리별 그룹화
HAVING COUNT(*) >= 2; -- 2건 이상 팔린 그룹만 선택
```

---

### SQL 쿼리의 논리적 실행 순서

SQL은 우리가 작성한 순서대로 실행되지 않는다.  
그렇다면 어떤 순서로 실행되는지 알아보자.

쉽게 이해하기 위해, **뮤지컬 무대 공연을 준비하고 올리는 과정**으로 비유해보자.

#### 1. FROM : "어떤 배우들을 무대에 불러오지?"

먼저 공연에 참여할 배우(테이블과 데이터)를 데려온다.

#### 2. WHERE : "오디션에서 탈락한 사람은 제외하자"

참가 조건에 맞지 않는 배우(행)는 이 단계에서 제외된다.

#### 3. GROUP BY : "역할별로 팀을 나눈다"

남은 배우들을 역할(컬럼)에 따라 조별로 묶는다.

#### 4. HAVING : "팀 중에서 자격 있는 팀만 무대에 선다"

팀이 꾸려진 뒤, 조건(최소 3명 이상)이 충족되지 않으면 무대에 못 오른다.

#### 5. SELECT : "무대 위에서 관객에게 보여줄 장면만 고른다"

모든 준비가 끝난 후, 관객에게 보여줄 정보(컬럼)만 선택한다.  

#### 6. ORDER BY : "출연 순서를 정렬한다"

무대에 오른 배우들을 인기 순, 실력순 등 원하는 기준대로 줄을 세운다.

#### 7. LIMIT : "무대 앞줄 몇 명만 스포트라이트를 받는다"

최종적으로 필요한 수만큼만 결과에 포함시킨다. 

<br>

예를 들어, 쿼리로 표현하자면 다음과 같다.

```sql
SELECT
  actor_name, -- 5단계 SELECT (무대에서 보여줄 이름)
  COUNT(*) AS line_count
FROM stage_actor -- 1단계 FROM (무대에 데려올 전체 배우)
WHERE audition_pass = TRUE -- 2단계 WHERE (오디션 합격자만)
GROUP BY actor_name -- 3단계 GROUP BY (배우별 그룹)
HAVING COUNT(*) >= 2 -- 4단계 HAVING (대사가 2개 이상인 배우만)
ORDER BY line_count DESC -- 6단계 ORDER BY (대사 많은 순으로 정렬)
LIMIT 3; -- 7단계 LIMIT (앞줄 spotlight 3명만)
```

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
