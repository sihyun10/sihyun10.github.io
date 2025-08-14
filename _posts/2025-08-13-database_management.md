---
title: "테이블 생성부터 변경, 삭제까지, DDL 명령어 살펴보기"
date: 2025-08-13 12:38:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

## DDL - 테이블 생성

**옷장 아바타 서비스**의 데이터베이스 테이블을 설계해보자.  
이 서비스는 사용자가 아바타에 옷을 입히고, 마음에 든다면 옷장에 저장하고, 상품을 관리할 수 있는 플랫폼이다.

### 1. 요구사항 분석

옷장 아바타 서비스의 기본 요구사항은 다음과 같다.

- 회원 (`member`)
  - 회원 고유 ID, 이메일, 닉네임, 비밀번호, 생년월일, 성별, 전화번호, 가입일, 계정 상태(정지, 탈퇴) 등을 관리
  - 소셜 로그인(구글) 및 일반 이메일 가입을 지원
  - 비밀번호 만료 정책과 권한(`role`)을 관리
- 아바타 (`closet_avatar`)
  - 각 회원은 자신의 아바타 이미지를 보유
  - 생성시각(`created_at`)이 저장되어야함
- 아바타 착용 아이템 (`closet_avatar_item`)
  - 아바타가 착용 중인 아이템 정보를 저장
  - 어떤 아바타가 어떤 상품을 착용하고 있는지 관리
- 상품 (`product`)
  - 상품 ID, 카테고리, 이름, 이미지(최대 5장), 설명, 가격, 할인율, 브랜드 정보를 관리
  - 찜 수(`wishlist_count`), 성별 구분, 인기 점수(`popularity_score`)를 관리
  - 삭제 여부(`deleted`)로 상품 상태를 구분

### 2. 테이블 설계 및 생성

#### 2.1 회원 테이블 (`member`)

```sql
CREATE TABLE member (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '회원 고유 ID',
    email VARCHAR(320) NOT NULL UNIQUE COMMENT '소셜 연동 또는 이메일 가입',
    user_name VARCHAR(15) NOT NULL COMMENT '닉네임: ^[가-힣a-zA-Z0-9]{2,16}$',
    birth_date DATE NOT NULL COMMENT '생년월일 기반 나이 계산 가능',
    gender VARCHAR(1) NOT NULL DEFAULT 'M' COMMENT 'M - 남성, F - 여성',
    password VARCHAR(150) NOT NULL COMMENT '영문, 숫자, 특수문자 포함 8자 이상',
    password_expired BOOLEAN NOT NULL DEFAULT FALSE COMMENT '비밀번호 만료 여부',
    phone_num VARCHAR(18) NOT NULL COMMENT '전화번호 형식 ^01[016789]-?\\d{3,4}-?\\d{4}$',
    banned BOOLEAN NOT NULL DEFAULT FALSE COMMENT '정지 여부',
    withdraw BOOLEAN NOT NULL DEFAULT FALSE COMMENT '탈퇴 여부',
    provider VARCHAR(50) NOT NULL COMMENT '로그인 제공자(google)',
    role VARCHAR(50) NOT NULL COMMENT '권한(ENUM 형태 관리)'
);
```

- **AUTO_INCREMENT**로 `user_id` 자동 증가
- 이메일은 `UNIQUE` 제약 조건 적용 (유일해야함)
- 성별 기본값 `M` (남성)
- Boolean 컬럼은 서비스 로직에서 상태 관리 기능

<br>

#### 2.2 아바타 테이블 (`closet_avatar`)

```sql
CREATE TABLE closet_avatar (
    closet_avatar_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '아바타 ID',
    user_id BIGINT NOT NULL COMMENT '회원 ID',
    avatar_img VARCHAR(600) NOT NULL COMMENT '아바타 이미지 경로',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_avatar_member FOREIGN KEY (user_id)
        REFERENCES member(user_id)
);
```

- 외래 키(`FOREIGN KEY`)로 `member` 테이블의 `user_id`와 연결
- 아바타 생성 시각은 기본값 `CURRENT_TIMESTAMP`

<br>

#### 2.3 상품 테이블 (`product`)

```sql
CREATE TABLE product (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '상품 ID',
    category_id INT NOT NULL COMMENT '카테고리 ID',
    product_name VARCHAR(150) NOT NULL COMMENT '상품명',
    img1 VARCHAR(600) NOT NULL COMMENT '대표 이미지',
    img2 VARCHAR(600),
    img3 VARCHAR(600),
    img4 VARCHAR(600),
    img5 VARCHAR(600),
    content VARCHAR(1500),
    price INT NOT NULL,
    sale INT NOT NULL DEFAULT 0 COMMENT '할인율',
    brand VARCHAR(150) NOT NULL,
    created_at DATE DEFAULT (CURRENT_DATE),
    deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
    wishlist_count INT NOT NULL DEFAULT 0 COMMENT '찜 수',
    gender VARCHAR(10) NOT NULL DEFAULT 'U' COMMENT 'U, F, M',
    popularity_score INT NOT NULL DEFAULT 0 COMMENT '인기 점수'
);
```

- 상품 이미지는 최대 5장 (`img1` ~ `img5`)
- 찜 수 (`wishlist_count`), 인기 점수 (`popularity_score`)는 서비스에서 업데이트
- 성별 구분 : `U`(공용), `M`(남성), `F`(여성)

<br>

#### 2.4 아바타 착용 아이템 테이블 (`closet_avatar_item`)

```sql
CREATE TABLE closet_avatar_item (
    avatar_item_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '아바타 착용 아이템 ID',
    closet_avatar_id BIGINT NOT NULL COMMENT '아바타 ID',
    product_id BIGINT NOT NULL COMMENT '상품 ID',
    CONSTRAINT fk_item_avatar FOREIGN KEY (closet_avatar_id)
        REFERENCES closet_avatar(closet_avatar_id),
    CONSTRAINT fk_item_product FOREIGN KEY (product_id)
        REFERENCES product(product_id)
);
```

- 어떤 아바타가 어떤 상품을 착용하는지 관리
- 두 개의 외래 키를 통해 **아바타 ↔︎ 상품 관계**를 명확히 정의

<br>

### 외래 키 제약조건 (FOREIGN KEY)

데이터베이스에서 **외래 키 제약조건**은 두 테이블 사이에 **관계(Relationship)**를 설정해 주는 규칙이다.  
쉽게 말해, "이 값은 반드시 저 테이블에 실제로 존재하는 값이어야한다."라는 약속을 만드는 것이다.

**기본 문법**

```
CONSTRAINT [제약조건_이름]
FOREIGN KEY ([자식_테이블_컬럼명])
REFERENCES [부모_테이블명]([부모_테이블_컬럼명])
[ON DELETE 옵션] [ON UPDATE 옵션]
```

#### 1. closet_avatar ➔ member

```sql
CREATE TABLE closet_avatar (
    closet_avatar_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '아바타 ID',
    user_id BIGINT NOT NULL COMMENT '회원 ID',
    avatar_img VARCHAR(600) NOT NULL COMMENT '아바타 이미지 경로',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_avatar_member FOREIGN KEY (user_id)
        REFERENCES member(user_id)
);
```

- `fk_avatar_member` : `closet_avatar`의 `user_id`는 반드시 member 테이블에 존재하는 `user_id`여야 한다.
- 즉, 존재하지 않는 회원 ID로는 아바타를 만들 수 없다.

#### 2. closet_avatar_item ➔ closet_avatar, product

```sql
CREATE TABLE closet_avatar_item (
    avatar_item_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '아바타 착용 아이템 ID',
    closet_avatar_id BIGINT NOT NULL COMMENT '아바타 ID',
    product_id BIGINT NOT NULL COMMENT '상품 ID',
    CONSTRAINT fk_item_avatar FOREIGN KEY (closet_avatar_id)
        REFERENCES closet_avatar(closet_avatar_id),
    CONSTRAINT fk_item_product FOREIGN KEY (product_id)
        REFERENCES product(product_id)
);
```

- `fk_item_avatar` : `closet_avatar_item`의 `closet_avatar_id`는 반드시 `closet_avatar`에 존재해야한다.
  - 없는 아바타에 아이템을 입히는 일은 불가능하기 때문이다.
- `fk_item_product` : `product_id`는 반드시 product 테이블에 존재해야한다.
  - 판매하지 않는 상품을 아바타에 착용시킬 수 없기 때문이다.

#### [외래 키 제약조건의 핵심 역할]

**1. 데이터 무결성 보장**  
잘못된 참조(없는 회원, 없는 상품)를 사전에 차단해준다.

**2. 관계 명확화**  
테이블 간의 연결 구조를 ERD나 테이블 설계만 봐도 파악할 수 있다.

**3. 삭제/변경 시 안정성**  
부모 테이블 데이터가 삭제/변경될 때 자식 데이터 처리 방식을 `ON DELETE`, `ON UPDATE` 옵션으로 제어할 수 있다.

#### **"ON DELETE / ON UPDATE" 옵션**

외래 키에는 부모 테이블의 값이 바뀌거나 삭제될 때 자식 테이블에 어떤 동작을 할지 정할 수 있는 옵션이 있다.

예시: `ON DELETE`

```sql
CONSTRAINT fk_item_product FOREIGN KEY (product_id)
    REFERENCES product(product_id)
    ON DELETE CASCADE
```

- CASCADE : 부모 데이터가 삭제되면 자식 데이터도 자동으로 삭제 ➔ 데이터 무결성 유지
  - 예: 상품이 삭제되면, 그 상품을 착용한 아바타 아이템도 삭제
- SET NULL : 부모 데이터가 삭제되면 자식 컬럼 값을 NULL로 변경
  - 참조는 없어지지만 레코드(행)는 그대로 남음
- RESTRICT / NO ACTION : 부모 데이터 삭제 불가 (기본값)

예시 : `ON UPDATE`

```sql
CONSTRAINT fk_item_product FOREIGN KEY (product_id)
    REFERENCES product(product_id)
    ON UPDATE CASCADE
```

- CASCADE : 부모 키가 바뀌면 **자식 테이블의 값도** 자동 변경
  - 예: 부모 테이블(product)의 product_id가 101 ➔ 200으로 바뀌면
  - 자동으로 자식 테이블(closet_avatar_item)의 product_id 값도 200으로 바뀐다.
- RESTRICT / NO ACTION : 부모 키 변경 불가 (기본값)

<br>

### 3. 테이블 관계 구조

- 회원(`member`) 1 -- N 아바타(`closet_avatar`)
- 아바타(`closet_avatar`) 1 -- N 착용 아이템(`closet_avatar_item`)
- 상품(`product`) 1 -- N 착용 아이템(`closet_avatar_item`)

"어떤 회원이 어떤 아바타로 어떤 상품을 착용하고 있는지" 알 수 있다.

---

### MySQL 워크벤치로 ERD 만들기

![my_closet ERD 그림](/assets/img/my_closet_ERD.png)

우리가 설계한 **아바타 기반 쇼핑몰**의 데이터베이스는 크게 4가지 테이블로 구성됩니다.

#### 1. 회원(`member`)과 아바타(`closet_avatar`)의 관계

- 한 명의 회원(1)은 여러 개의 아바타(N)를 가질 수 있다.

```scss
member (1) -----< closet_avatar (N)
```

#### 2. 아바타(`closet_avatar`)와 착용 아이템(`closet_avatar_item`)의 관계

- 하나의 아바타(1)는 여러 개의 착용 아이템(N)을 가질 수 있다.
- 하나의 아바타가 상의, 하의 등 동시에 착용할 수 있다.

```scss
closet_avatar (1) -----< closet_avatar_item (N)
```

#### 3. 상품(`product`)과 착용 아이템(`closet_avatar_item`)의 관계

- 하나의 상품(1)은 여러 착용 아이템(N)에 등장할 수 있다.
- ex) 같은 상의 상품이 다른 여러 아바타에 착용될 수 있기 때문이다.

```scss
product (1) -----< closet_avatar_item (N)
```

---

## DDL - 테이블 변경 (ALTER TABLE), 테이블 제거 (DROP TABLE)

기능이 늘어나거나 요구사항이 바뀌게 되면  
기존 테이블에 **컬럼**을 추가하거나 변경, 삭제하는 상황이 올 것이다.  
이럴 때 사용하는 명령어가 바로 **ALTER TABLE**이다.

### 열 추가 - `ADD COLUMN`

예를 들어, 아바타(`closet_avatar`) 테이블에 "아바타 이름"을 추가한다고 가정해보자.

```sql
ALTER TABLE closet_avatar
ADD COLUMN avatar_name VARCHAR(100) NOT NULL DEFAULT '기본 아바타';
```

- `DESC closet_avatar`로 확인하면 `avatar_name` 열(컬럼)이 추가된 것을 확인 가능하다.

### 열 데이터 타입 변경 - `MODIFY COLUMN`

아바타 이름의 길이를 늘려야 할 경우

```sql
ALTER TABLE closet_avatar
MODIFY COLUMN avatar_name VARCHAR(200) NOT NULL DEFAULT '기본 아바타';
```

- `DESC closet_avatar`로 확인하면 `avatar_name`의 길이는 200으로 변경되어있다.

### 열 삭제 - `DROP COLUMN`

아바타 이름 기능이 필요 없어진 경우

```sql
ALTER TABLE closet_avatar
DROP COLUMN avatar_name;
```

- `DESC closet_avatar`로 확인하면 해당 컬럼이 삭제되어있다.

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 최신 MySQL 버전에서는 열 추가는 거의 실시간으로 적용되지만,  
> 열 삭제나 데이터 타입 변경은 서비스에 영향을 줄 수 있으므로 신중히 진행해야 한다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

---

## DROP TABLE vs TRUNCATE TABLE

"이 테이블을 다 비워야할지, 아니면 아예 없애버릴지" 고민을 할 수 있다.  
이때 사용할 수 있는 2가지 명령어가 바로 **DROP TABLE**, **TRUNCATE TABLE** 이다.  
이 둘은 비슷해 보이지만, 차이가 있다.

### DROP TABLE

```sql
DROP TABLE closet_avatar;
```

- `closet_avatar` 라는 테이블 자체를 삭제
- 안에 있던 데이터뿐만 아니라 테이블 구조, 컬럼, 제약조건까지 다 사라짐
- 다시 쓰고 싶으면 처음부터 `CREATE TABLE`을 해야한다.

### TRUNCATE TABLE

```sql
TRUNCATE TABLE closet_avatar;
```

- 테이블은 그대로 두고, 데이터만 싹 비움
- 구조나 제약조건은 건드리지 않음
- 바로 새로운 데이터를 넣을 수 있음

### DROP vs TRUNCATE

| 구분                    | DROP                                     | TRUNCATE                                  |
| :---------------------- | :--------------------------------------- | :---------------------------------------- |
| 목적                    | 테이블 자체(구조 + 데이터)를 완전히 삭제 | 테이블 구조는 유지, 안의 데이터만 싹 지움 |
| 속도                    | 빠름 (테이블 자체 제거)                  | 빠름 (데이터 초기화 방식)                 |
| `AUTO_INCREMENT` 초기화 | 테이블 삭제이므로 의미 없음              | 초기화됨                                  |
| 다시 사용 가능 여부     | CREATE TABLE부터 다시 해야 함            | 바로 INSERT 가능 (구조가 그대로 남음)     |
| 외래 키 제약            | 참조 당하면 실행 불가                    | 참조 당하면 실행 불가                     |
| 비유                    | 옷장 자체를 철거해버림                   | 옷장은 남기고 안에 있는 옷만 버림         |

<br>

![DROP과 TRUNCATE의 차이점](/assets/img/truncate_drop.jpg)

### 🤔 외래 키(`Foreign Key`) 제약에 걸리면?

아바타 테이블을 다른 테이블이 참조하고 있다면, `DROP` 이나 `TRUNCATE`가 바로 실행되지 않는다.

```sql
DROP TABLE closet_avatar;
-- Error: 다른 테이블에서 참조 중이어서 삭제 불가
```

```sql
TRUNCATE TABLE closet_avatar;
-- Error: 외래 키 제약 때문에 전체 비우기 불가
```

이거는 무결성을 지키기 위해서인데,  
만약 참조 중인 데이터를 날려버리면 "없는 아바타를 가리키는 착용 아이템" 같은 이상한 상황이 생기기 때문이다.

### [참고] 외래 키 무시하고 실행하기 (주의!)

```sql
SET FOREIGN_KEY_CHECKS = 0; -- 외래 키 체크 끄기
TRUNCATE TABLE closet_avatar;
SET FOREIGN_KEY_CHECKS = 1; -- 다시 켜기
```

- 정말 필요할 때만 사용해야 한다.
- 이걸 끄면 데이터 무결성이 깨질 수 있다.
- DB 접속이 끊기면 설정은 원래대로 돌아간다.

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
