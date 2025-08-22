---
title: "SQL 데이터 가공 방법"
date: 2025-08-22 20:56:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

## 데이터 가공하기 - 산술 연산

서비스를 운영하다 보면 단순히 데이터베이스에 저장된 값만 보는 것이 아니라,  
그 값을 조합하고 계산해서 더 유용한 정보로 가공해야 하는 경우가 많다.

예를 들어,

- 아바타가 지금 착용한 아이템의 총 가격은 얼마일까?
- 상품 가격에서 할인율을 적용하려면 최종 판매가는 얼마일까?

SQL에서는 산술 연산을 `SELECT`문 안에서 쉽게 처리할 수 있다.

### 아바타가 입고 있는 아이템 총액 구하기

아바타(`closet_avatar`)가 착용한 아이템들이 `closet_avatar_item` 테이블에 저장되어있고, 각 아이템의 가격은 `product` 테이블에 있다.

그럼 아바타별로 총합을 계산해보자.

```sql
SELECT
    ca.closet_avatar_id,
    SUM(p.price) AS total_value
FROM closet_avatar ca
JOIN closet_avatar_item cai
    ON ca.closet_avatar_id = cai.closet_avatar_id
JOIN product p
    ON cai.product_id = p.product_id
GROUP BY ca.closet_avatar_id;
```

**[실행 결과]**

| closet_avatar_id | total_value |
| :--------------- | :---------- |
| 1                | 138900      |
| 2                | 119000      |
| 3                | 70000       |

각 아바타가 입고 있는 아이템들의 가격 합계(`total_value`)를 알 수 있다.

<br>

### 할인된 가격 구하기

상품 테이블(`product`)에는 할인율(`sale`) 컬럼이 있다.  
할인율이 있다면 "실제 판매가"는 **할인율을 적용한 값**이어야한다.

```sql
SELECT
    product_name,
    price,
    sale,
    price - (price * sale / 100) AS final_price
FROM product;
```

따라서 이 최종 판매가(`final_price`)를 기준으로 상품 판매가 되도록 한다.

---

## 문자열 가공하기

문자열을 어떻게 보여줄 것인지도 중요하다.

예를 들어,

- 고객 정보 페이지에서 닉네임 (이메일) 형태로 보여주고 싶을 때
- 상품 상세 페이지에 브랜드 - 상품명 형식으로 노출하고 싶을 때
- 상품명 검색을 위해 대소문자를 통일해야할 때

### CONCAT() - 문자열 합치기

회원의 닉네임과 이메일을 보기 좋게 합쳐서 보여주고 싶다면?

```sql
SELECT
  CONCAT(user_name, ' (', email, ')') AS user_info
FROM member;
```

| user_info                 |
| :------------------------ |
| 시현이 (sihyun@gmail.com) |
| 이수만 (lee@gmail.com)    |

### CONCAT_WS() - 구분자와 함께 합치기

`CONCAT_WS(separator, string1, string2, ...)`  
첫 번째 인자로 구분자를 주면, 각 문자열 사이에 자동으로 넣어준다.

상품을 [브랜드 - 상품명] 형식으로 보여주고 싶으면?

```sql
SELECT
  CONCAT_WS(' - ', brand, product_name) AS product_summary
FROM product;
```

| product_summary          |
| :----------------------- |
| TIO - 베이직 반팔 티셔츠 |
| TIO - 데님 바지          |
| TTIO - 경량 패딩         |

### 대소문자 변환 : UPPER(), LOWER()

`product`테이블에 아래와 같은 상품명이 있다고 가정해보자.

- Nike Air Max
- adidas SuperStar
- GUCCI Bag

사용자가 검색할 때 전부 소문자로 `nike`라고 입력할 수도 있고, 대문자로 `NIKE`라고 입력할 수도 있다.  
SQL에서 기본적으로 문자열 비교는 대소문자를 구분하기 때문에, `WHERE product_name LIKE '%nike%'`라고 하면 원하는 결과가 안 나올 수 있다.

이럴 땐, 검색 조건과 데이터 모두를 동일한 대소문자로 변환해서 비교하면 된다!

```sql
SELECT product_name
FROM product
WHERE LOWER(product_name) LIKE LOWER('%nike%');
```

### 문자열 길이 확인 : LENGTH(), CHAR_LENGTH()

회원 닉네임이 너무 짧거나 길면 제약을 줄 수 있다.  
이때, 문자열 길이를 확인하면 된다.

```sql
SELECT
  user_name,
  CHAR_LENGTH(user_name) AS name_length,
  LENGTH(user_name) AS byte_length
FROM member;
```

| user_name | name_length | byte_length |
| :-------- | :---------- | :---------- |
| 시현이    | 3           | 9           |
| 이수만    | 3           | 9           |

- `CHAR_LENGTH()` : 글자 수
- `LENGTH()` : 바이트 수 (UTF-8 ➔ 한글 3 byte)

---

## NULL 값 처리하기

상품(`product`) 테이블의 `content` 컬럼(상품 설명)에 값이 없을 수 있다.

예를 들어, 테이블에 데이터가 다음과 같다고 하자.

```
product_id | product_name     | content
----------------------------------------------
1          | 베이직 반팔 티셔츠   | 여름철 필수 반팔 티셔츠
2          | 데님 바지          | NULL
3          | 경량 패딩          | 가볍고 따뜻한 패딩
```

상품 설명에 값이 없다면 "추가 정보를 준비하고 있습니다" 등 안내 문구를 대신 보여주는 것이 낫다.  
이때, NULL 처리 함수를 사용한다.

### IFNULL() - NULL 값을 다른 값으로 대체

```
IFNULL(표현식1, 표현식2)
```

- 표현식1 : NULL 여부 검사할 컬럼
- 표현식2 : NULL일 경우 대신 반환할 값

값이 있으면 그대로 보여주고, 없다면 지정한 값으로 바꿔준다.

```sql
SELECT
  product_name,
  IFNULL(content, '추가 정보를 준비하고 있습니다') AS description
FROM product;
```

| product_name       | description                   |
| :----------------- | :---------------------------- |
| 베이직 반팔 티셔츠 | 여름철 필수 반팔 티셔츠       |
| 데님 바지          | 추가 정보를 준비하고 있습니다 |
| 경량 패딩          | 가볍고 따뜻한 패딩            |

### COALESCE() - 여러 후보 중 첫번째 값 선택

여러 개 후보 중에서 가장 먼저 NULL이 아닌 값을 골라주는 함수이다.

예를 들어, `product`테이블을 보면  
상품마다 대표 이미지(`img1`)이 있지만, 경우에 따라 `img2`, `img3`, ... 보조 이미지가 없을 수도 있다.

그런데 만약 대표 이미지가 비어있다면? img2, img3 중에서 보여줄 수 있으면 좋다.  
(**[주의]** `img1`컬럼은 NULL이 아니어야한다는 조건 때문에 NULL일수는 없다.)

이럴 때, `COALESCE()`함수를 사용하면 된다.

```sql
SELECT
  product_name,
  COALESCE(img1, img2, img3, '/img/default.jpg') AS display_img
FROM product;
```

- `img1`이 있으면 그걸 사용
- `img1`이 NULL이고 `img2`가 있으면 `img2` 사용
- `img1`, `img2`가 NULL이고 `img3`가 있으면 `img3` 사용
- 세 개 다 없으면 `/img/default.jpg`(기본 이미지) 사용

이 기능을 통해 상품 페이지의 이미지가 빈 이미지로 뜨는 일 없이, 항상 뭔가 하나는 노출되게 할 수 있다.

---

## 조건부 가공 (CASE WHEN)

조건에 따라 값을 가공할 수 있다.

예를 들어, 할인율이 있으면 ➔ 할인 중, 할인율이 없으면 ➔ 정상가 같은 안내 텍스트를 노출할 수 있다.

```sql
SELECT
  product_name,
  price,
  CASE
    WHEN sale > 0 THEN CONCAT(sale, '% 할인 중')
    ELSE '정상가'
  END AS sale_info
FROM product;
```

## 날짜, 시간 가공

날짜 함수(`DATE_FORMAT`, `YEAR`, `MONTH` 등)를 활용해서 나이 계산을 할 수 있다.

예를 들어, 회원 테이블(`member`)에 `birth_date` 컬럼이 있는데,  
회원의 생일에서 현재 연도를 빼서 나이를 계산할 수 있다.  
(정확히 하려면 월, 일까지 비교해야하지만, 이 예제는 간단하게 연도로만 계산)

```sql
SELECT
  user_name,
  YEAR(CURDATE()) - YEAR(birth_date) AS age
FROM member;
```

---

## 주의할 점 : 가공한 컬럼은 "조회용"일 뿐

가공된 값은 `SELECT`에서 보기 위한 용도로 쓰이는 거지, 실제 DB에 저장되는 것은 아니다.

SQL에서 SELECT 문으로 산술 연산이나 문자열 가공을 해서 만든 컬럼들은 **DB에 실제로 저장되는 컬럼이 아니다**  
쿼리를 실행할 때 계산되어 결과로 반환되는 값일 뿐이다.

"왜 테이블에 컬럼이 안 생기지?"하는 의문이 생길 수 있기 때문이다.

#### Tip : 조회용으로 가공된 컬럼을 웹사이트 화면에 반영할 수 있다.

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> SELECT에서 계산된 가공 컬럼은 DB에 저장되지 않으며, 데이터가 많을 경우 조회 성능에 영향을 줄 수 있다.  
{: .prompt-warning }

<!-- markdownlint-restore -->

**[서버에서 쿼리 실행 후 바로 사용]**

예를 들어 java, python 등 DB에 쿼리를 날리면:

```sql
SELECT
    product_name,
    price,
    sale,
    price - (price * sale / 100) AS final_price
FROM product;
```

DB가 반환하는 각 행에는 `product_name`, `price`, `sale`, `final_price` 값이 포함된다.  
서버 코드는 이 `final_price`를 API 응답, JSON 데이터 등으로 내려줄 수 있다.

```json
[
  {"product_name": "베이직 티셔츠", "price": 19900, "sale": 10, "final_price": 17910},
  {"product_name": "데님 바지", "price": 49000, "sale": 0, "final_price": 49000}
]
```

프론트엔드에서 별도의 계산 없이 이 데이터를 기반으로 바로 화면에 표시 가능하다.

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
