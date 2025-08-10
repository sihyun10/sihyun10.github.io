---
title: "SQL 핵심 명령어, CRUD, 제약 조건"
date: 2025-08-10 15:51:00 +09:00
categories: [Study, Database]
tags: [database]
pin: true
---

`CREATE DATABASE` : 데이터베이스 생성하기

```sql
CREATE DATABASE my_closet;
```

- MySQL 서버 안에 `my_closet`이라는 이름의 독립된 데이터 공간이 생성된다.  
  앞으로 이 데이터베이스 안에 아바타 정보, 아바타 아이템 정보 테이블을 만들어 관리할 것이다.

`USE` : 작업할 데이터베이스 선택하기

```sql
USE my_closet;
```

- 지금부터 실행하는 모든 SQL 명령어는 `my_closet` 데이터베이스 안에서 동작한다.
- 데이터베이스를 생성한 직후, 또는 다른 DB로 전환할 때  
  반드시 `USE` 명령어로 작업 공간을 선택해야 한다.

`CREATE TABLE` : 테이블 설계하고 만들기

```sql
CREATE TABLE closet_avatar (
    closet_avatar_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    avatar_img VARCHAR(600) NOT NULL, -- 최대 600자 문자열
    created_at DATETIME NOT NULL
);
```

- 테이블의 구조를 정의하고 생성하는 명령어
- 어떤 열(Column)들로 구성될지, 각 열에는 어떤 종류의 데이터가 들어갈지를 명시해주어야함  

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> **데이터베이스 테이블에는 반드시 기본 키(PRIMARY KEY)가 있어야 한다.**  
{: .prompt-tip }

<!-- markdownlint-restore -->

<br>

`DESCRIBE` : 테이블 구조 확인하기

- 테이블이 어떤 열들로, 어떤 데이터 타입으로 구성되어 있는지 그 구조를 보여준다.
- `DESC`로 줄여서 사용할 수 있다.

```sql
DESC closet_avatar; -- 또는 DESCRIBE closet_avatar;
```

**[실행 결과]**

| Field            | Type         | Null | Key | Default | Extra          |
| :--------------- | :----------- | :--- | :-- | :------ | :------------- |
| closet_avatar_id | bigint       | NO   | PRI | NULL    | auto_increment |
| user_id          | bigint       | NO   |     | NULL    |                |
| avatar_img       | varchar(600) | NO   |     | NULL    |                |
| created_at       | datetime     | NO   |     | NULL    |                |

<br>

`SHOW DATABASES`, `SHOW TABLES` : 목록 보기

- 현재 DBMS 서버에 어떤 데이터베이스들이 있는지, 그리고 현재 선택된 데이터베이스(`my_closet`) 안에 어떤 테이블들이 있는지 목록을 보고 싶을 때 사용
- `SHOW DATABASES` : 현재 서버에 있는 모든 데이터베이스 목록 보여줌
- `SHOW TABLES` : 현재 선택된 데이터베이스 안에 어떤 테이블이 있는지 목록 보여줌

```sql
SHOW DATABASES;
```

**[실행 결과]**

| Database           |
| :----------------- |
| information_schema |
| mysql              |
| **my_closet**      |
| performance_schema |
| sys                |
| ...                |

<br>

```sql
SHOW TABLES;
```

**[실행 결과]**

| Tables_in_my_closet |
| :------------------ |
| closet_avatar       |

<br>

`DROP TABLE`, `DROP DATABASE` : 삭제하기

더 이상 필요 없는 테이블이나 데이터베이스를 삭제한다.  
`DROP` 명령어는 구조 자체를 완전히 삭제하므로 사용에 매우 신중해야 한다.

- `closet_avatar` 테이블을 데이터와 함께 영구적으로 삭제한다.

```sql
DROP TABLE closet_avatar;
```

- `my_closet` 데이터베이스 안의 모든 테이블과 데이터가 삭제된다.

```sql
DROP DATABASE my_closet;
```

<br>

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> `DROP` 명령어를 사용할 때는 조심해야한다.  
> 이 명령어는 되돌릴 수 없으니, 삭제 전 백업이 필수이며, 다시 재차 확인하기!
{: .prompt-danger }  

<!-- markdownlint-restore -->

<br>

**[정리]**

```sql
-- 데이터베이스 생성
CREATE DATABASE my_closet;

-- 데이터베이스 선택
USE my_closet;

-- 테이블 생성
CREATE TABLE closet_avatar (
    closet_avatar_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    avatar_img VARCHAR(600) NOT NULL,
    created_at DATETIME NOT NULL
);

-- 생성된 테이블 목록 확인
SHOW TABLES;
```

---

## 데이터를 넣고(Create), 읽고(Read), 수정하고(Update), 삭제하는(Delete) 방법

### `INSERT` : 데이터 추가 (Create)

`closet_avatar` 테이블에 새로운 행(Row)을 추가

```sql
INSERT INTO closet_avatar (user_id, avatar_img, created_at)
VALUES (101, 'https://example.com/avatar_101.png', '2025-08-10 14:30:00');
```

- `closet_avatar_id`는 `AUTO_INCREMENT`라서 직접 입력하지 않아도 자동으로 번호가 부여된다.

<br>

### `SELECT` : 데이터 조회 (Read)

모든 데이터를 보고 싶을 때 ➔ `*` 사용 (`*`는 "모든 열"을 의미)

```sql
SELECT * FROM closet_avatar;
```

**[실행 결과]**

| closet_avatar_id | user_id | avatar_img                         | created_at          |
| :--------------- | :------ | :--------------------------------- | :------------------ |
| 1                | 101     | https://example.com/avatar_101.png | 2025-08-10 14:30:00 |

- 특정 열(컬럼)만 조회하고 싶을 경우

```sql
SELECT user_id, avatar_img FROM closet_avatar;
```

**[실행 결과]**

| user_id | avatar_img                         |
| :------ | :--------------------------------- |
| 101     | https://example.com/avatar_101.png |

<br>

### `UPDATE` : 데이터 수정 (Update)

저장된 아바타 이미지 URL을 변경한다.

```sql
UPDATE closet_avatar
SET avatar_img = 'https://example.com/avatar_101_v2.png'
WHERE closet_avatar_id = 1;
```

- "`closet_avatar_id`가 `1`인 행의 `avatar_img`를 변경한다"
- `UPDATE` : 수정할 테이블 지정
- `SET` : 변경할 열(컬럼)과 새 값 지정
- `WHERE` : 수정할 행 선택 (없으면 전체 데이터가 바뀔 수 있으므로 주의!)

**[실행 결과]**

| closet_avatar_id | user_id | avatar_img                            | created_at          |
| :--------------- | :------ | :------------------------------------ | :------------------ |
| 1                | 101     | https://example.com/avatar_101_v2.png | 2025-08-10 14:30:00 |

<br>

### `DELETE` : 데이터 삭제 (Delete)

테이블에서 특정 행을 삭제

```sql
DELETE FROM closet_avatar
WHERE closet_avatar_id = 1;
```

- "`closet_avatar_id`가 `1`인 데이터를 삭제"
- `WHERE` 조건이 없으면 테이블의 모든 데이터가 삭제된다.

<br>  

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> `UPDATE`와 `DELETE` 명령어는 **WHERE** 절을 반드시 작성해야 한다!  
> 그렇지 않으면 의도치 않게 모든 데이터가 수정되거나 삭제된다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

---

## SQL 명령어 4종류 - DDL, DML, DCL, TCL

SQL 명령어는 크게 4가지로 나눌 수 있다.  
구조를 정의하는 **DDL**, 데이터를 조작하는 **DML**, 권한을 관리하는 **DCL**,  
트랜잭션을 제어해 작업의 일관성을 유지하는 **TCL**이 있다.

### 1. DDL (Data Definition Language, 데이터 정의어)

- 데이터베이스나 테이블 같은 구조를 만들고, 바꾸고, 없애는 역할
- 주요 명령어
  - `CREATE` : 데이터베이스나 테이블 생성
  - `ALTER` : 기존 테이블 구조 변경
  - `DROP` : 데이터베이스나 테이블 완전히 삭제

### 2. DML (Data Manipulation Language, 데이터 조작어)

- 테이블 안의 실제 데이터를 추가, 조회, 수정, 삭제
- 주요 명령어
  - `INSERT` : 데이터 추가
  - `SELECT` : 데이터 조회
  - `UPDATE` : 데이터 수정
  - `DELETE` : 데이터 삭제

### 3. DCL (Data Control Language, 데이터 제어어)

- 데이터 접근 권한을 주거나 회수하는 등, 데이터 보안 관련 권한을 제어
- 주요 명령어
  - `GRANT` : 특정 사용자에게 특정 작업 권한 부여
  - `REVOKE` : 특정 사용자에게서 권한 회수

### 4. TCL (Transaction Control Language, 트랜잭션 제어어)

- 여러 DML 작업을 하나의 '거래(트랜잭션)' 단위로 묶어서 관리

  - 모든 작업이 다 성공해야 저장
  - 하나라도 실패하면 전부 취소

- 주요 명령어
  - `COMMIT` : 지금까지의 변경 내용을 확정, 저장
  - `ROLLBACK` : 변경 내용을 취소하고 이전 상태로 복구

#### 🤔 **왜 TCL이 필요한가?** - 온라인 쇼핑 주문 처리 예제

1. 재고에서 주문한 옷 수량 차감
2. 고객의 주문 정보를 주문 내역 테이블에 저장

만약 첫 번째 작업만 성공하고 두 번째 작업이 실패하면,  
재고는 줄었지만 주문 기록이 남지 않아 주문이 처리되지 않은 상태가 된다.

이런 상황이 발생하면, 고객은 주문했는데 실제로는 주문이 안 된 것이고,  
쇼핑몰 입장에서도 재고 관리가 꼬여버려 큰 혼란이 생긴다.

그래서 이 두 작업을 하나의 '거래' 단위로 묶는 것이다.

- 둘 다 성공해야만 주문이 최종 확정되고 (`COMMIT`)
- 둘 중 하나라도 실패하면 처음 상태로 되돌려서 (`ROLLBACK`)  
  재고 수량도 주문 내역도 바뀌지 않도록 한다.

---

### 제약 조건

제약 조건은 데이터베이스 테이블에 "이런 규칙은 꼭 지켜야 해!"하고 강제로 적용하는 룰 같은 거다.  
이걸 설정하면 데이터가 잘못 들어가는 것을 막을 수 있어서, 데이터의 신뢰성을 지킬 수 있다.

#### `NOT NULL` : 반드시 값이 있어야 할 경우

- `NULL` 값을 허용하지 않는다.
- 데이터를 `INSERT`할 때 이 열에 꼭 값이 입력되어야 한다.

#### `UNIQUE` : 중복 금지

- 같은 값이 2개 이상 들어올 수 없다.
- `UNIQUE` vs `PRIMARY KEY` 차이점
  - `PRIMARY KEY` : 테이블 당 하나만 딱 존재할 수 있다.
    - 중복 불가(UNIQUE) + 빈 값 없음(NOT NULL)을 뜻함
  - `UNIQUE` : 여러 열에 붙일 수 있고, 빈 값(NULL)은 허용할 수도 있다.

#### `PRIMARY KEY (PK)` : 테이블 안에서 유일한 식별자

- 데이터 한 행(row)을 딱 구별하는 고유한 값
- 모든 테이블에 반드시 `PRIMARY KEY`가 있어야 한다!
- 보통 정수형 기본 키에 `AUTO_INCREMENT`를 붙여서, 데이터가 추가될 때마다 1씩 자동으로 번호가 올라가게 많이 쓴다.

#### `FOREIGN KEY (FK)` : 테이블 간의 관계 설정

- 한 테이블의 열이 다른 테이블의 기본 키를 가리키면서 두 테이블을 연결해준다.
- 이 제약 덕분에 '존재하지 않는 값'이 들어가는걸 막을 수 있다.
- 예를 들어, 주문 테이블에 들어가는 고객 ID는 반드시 고객 테이블에 있는 ID여야 한다.

#### `DEFAULT` : 기본값 자동 설정

- 데이터를 넣을 때 값을 안 넣으면 자동으로 기본값이 들어가게 하는 기능이다.
- 예를 들면, 회원 가입 날짜를 따로 안 넣어도 자동으로 '오늘 날짜'가 입력된다.

#### `CHECK` : 값 조건 걸기

- 어떤 열에 들어갈 값이 특정 조건을 만족해야 할 때 사용한다.
- 예를 들어, 나이 컬럼에는 18세 이상만 가능하게 하거나, 점수 컬럼에 0~100 사이 숫자만 허용
- 조건에 안 맞으면 데이터 삽입이나 수정이 안된다.

---

위 블로그 글은 `실전 데이터베이스 입문` 강의 내용을 바탕으로 작성되었습니다.

[출처] : (인프런 강의) [김영한의 실전 데이터베이스 입문 - 모든 IT인을 위한 SQL 첫걸음(SQL부터 차근차근)](https://www.inflearn.com/course/%EA%B9%80%EC%98%81%ED%95%9C-%EC%8B%A4%EC%A0%84-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%9E%85%EB%AC%B8)
