---
title: "내부 조인(INNER JOIN) 이해하기"
date: 2025-09-06 17:43:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

들어가기 앞서, 학습에 활용할 예제 데이터를 미리 세팅을 해봅시다.  
(학습용 예제이므로 단순하게 구성했습니다.)

## 시나리오: 대학 수강 시스템

### 비즈니스 규칙

1. 학생(Student): 여러 과목을 수강할 수 있다.
2. 과목(Course): 여러 학생이 등록할 수 있다.
3. 각 과목은 1명의 교수(Professor)가 담당한다.
4. 교수는 여러 과목을 강의할 수 있다.

### 테이블 상세 요구사항

#### 1. 학생 테이블 (`Student`)

| 컬럼명       | 데이터 타입   | 제약 조건              | 설명           |
| :----------- | :------------ | :--------------------- | :------------- |
| `student_id` | `INT`         | `PK`, `AUTO_INCREMENT` | 학생 고유 번호 |
| `name`       | `VARCHAR(50)` | `NOT NULL`             | 학생 이름      |
| `major`      | `VARCHAR(50)` | NULL 허용              | 전공           |

#### 2. 교수 테이블 (`Professor`)

| 컬럼명         | 데이터 타입   | 제약 조건              | 설명           |
| :------------- | :------------ | :--------------------- | :------------- |
| `professor_id` | `INT`         | `PK`, `AUTO_INCREMENT` | 교수 고유 번호 |
| `name`         | `VARCHAR(50)` | `NOT NULL`             | 교수 이름      |
| `department`   | `VARCHAR(50)` | NULL 허용              | 소속 학과      |

#### 3. 강의 테이블 (`Course`)

| 컬럼명         | 데이터 타입    | 제약 조건              | 설명           |
| :------------- | :------------- | :--------------------- | :------------- |
| `course_id`    | `INT`          | `PK`, `AUTO_INCREMENT` | 강의 고유 번호 |
| `name`         | `VARCHAR(100)` | `NOT NULL`             | 강의명         |
| `professor_id` | `INT`          | `FK`, `NOT NULL`       | 담당 교수      |

#### 4. 수강신청 테이블 (`Enrollment`)

아직 성적이 입력되지 않은 상태일 수 있기에 `NULL` 허용

| 컬럼명       | 데이터 타입 | 제약 조건              | 설명           |
| :----------- | :---------- | :--------------------- | :------------- |
| `enroll_id`  | `INT`       | `PK`, `AUTO_INCREMENT` | 수강 고유 번호 |
| `student_id` | `INT`       | `FK`                   | 수강 학생      |
| `course_id`  | `INT`       | `FK`                   | 수강 과목      |
| `grade`      | `CHAR(1)`   | NULL 허용 (A ~ F)      | 성적           |

### 테이블 생성 SQL

```sql
CREATE DATABASE IF NOT EXISTS college_enrollment_system;
USE college_enrollment_system;

DROP TABLE IF EXISTS enrollment;
DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS professor;

-- 학생 테이블 생성
CREATE TABLE student (
  student_id INT AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  major VARCHAR(50),
  PRIMARY KEY (student_id)
);

-- 교수 테이블 생성
CREATE TABLE professor (
  professor_id INT AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  PRIMARY KEY (professor_id)
);

-- 강의 테이블 생성
CREATE TABLE course (
    course_id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    professor_id INT NOT NULL,
    PRIMARY KEY (course_id),

    CONSTRAINT fk_course_professor FOREIGN KEY (professor_id)
      REFERENCES professor(professor_id)
);

-- 수강신청 테이블 생성
CREATE TABLE enrollment (
    enroll_id INT AUTO_INCREMENT,
    student_id INT,
    course_id INT,
    grade CHAR(1),
    PRIMARY KEY (enroll_id),

    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id)
      REFERENCES student(student_id),

    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id)
      REFERENCES course(course_id)
);
```

![수강시스템_ERD그림](/assets/img/college_enrollment_system_erd.png)

### 샘플 데이터 입력

```sql
-- 학생 데이터
INSERT INTO student (name, major) VALUES
('김철수', '컴퓨터공학과'),
('이영희', '경영학과'),
('박민수', '수학과'),
('최지현', '영문학과'),
('한유진', '컴퓨터공학과'),
('정수빈', '경영학과'),
('오세훈', '수학과');

-- 교수 데이터
INSERT INTO professor (name, department) VALUES
('빌 게이츠', '컴퓨터공학과'),
('스티브 잡스', '경영학과'),
('마크 저커버그', '수학과'),
('팀 쿡', '영문학과');

-- 강의 데이터
INSERT INTO course (name, professor_id) VALUES
('데이터베이스', 1),
('운영체제', 1),
('경영학원론', 2),
('마케팅전략', 2),
('선형대수학', 3),
('영문학개론', 4);

-- 수강신청 데이터
INSERT INTO enrollment (student_id, course_id, grade) VALUES
(1, 1, 'A'),
(1, 2, 'B'),
(2, 3, 'B'),
(2, 4, 'A'),
(3, 5, 'A'),
(4, 6, NULL),
(5, 1, NULL),
(5, 2, 'A'),
(6, 3, 'C'),
(7, 5, 'B'),
(7, 6, 'A');
```

---

## 조인이 필요한 이유

데이터베이스를 설계할 때는 **정규화**라는 과정을 거친다.  
정규화란 데이터를 논리적인 단위로 분리하여, 중복을 줄이고 데이터의 일관성을 보장하는 방법이다.

예를 들어, 학생과 강의, 교수 정보를 하나의 테이블에 전부 넣는다면 어떤 문제가 발생할까?

- 같은 교수 이름이 여러 번 반복 입력된다.
- 특정 교수 이름을 수정할 때, 모든 행을 일일이 수정해야 한다.
- 데이터가 불필요하게 커지고 관리하기 힘들어진다.

이런 문제들을 막기 위해 테이블을 학생(Student), 교수(Professor), 강의(Course), 수강신청(Enrollment) 으로 분리한 것이다.

그런데, 데이터를 이렇게 흩어놓으면 또 다른 문제가 생긴다.  
"학생 이름과 수강 과목을 함께 보고 싶다" 같은 요구사항을 처리하기 어려워지는 것이다.

이와 같은 경우에 **조인(JOIN)** 을 활용하면 됩니다.  
조인은 외래 키(Foreign Key)를 매개로 테이블을 연결하여, 마치 하나의 테이블처럼 통합된 정보를 보여준다.

---

## 내부 조인 (INNER JOIN)

내부 조인은 양쪽 테이블에 모두 존재하는 데이터만 결과에 포함시킨다.  
즉, 두 테이블을 연결했을 때 조건이 일치하는 행만 결과로 반환한다.

### 문법

```
SELECT 컬럼1, 컬럼2, ...
FROM 테이블1
INNER JOIN 테이블2
ON 테이블1.컬럼 = 테이블2.컬럼;
```

- FROM : 기준이 되는 첫 번째 테이블 지정
- INNER JOIN : 두 번째로 연결할 테이블 지정
- ON : 어떤 조건으로 두 테이블을 연결할지 지정

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> `INNER`는 생략할 수 있으며, 실무에서 그냥 `JOIN`이라고 많이 쓴다.  
{: .prompt-tip }

<!-- markdownlint-restore -->

<br>

## 대학 수강 시스템 에제로 이해하기

### 1단계: 두 테이블을 연결

먼저 학생(`Student`)과 수강신청(`Enrollment`) 테이블을 연결해보자.  
조인은 "공통된 컬럼"을 기준으로 두 테이블을 옆으로 붙이는 것이다.

```sql
SELECT *
FROM student
INNER JOIN enrollment
ON student.student_id = enrollment.student_id;
```

학생 테이블과 수강신청 테이블을 `student_id`컬럼을 기준으로 합친다.  
그러면 수강신청을 한 학생들만 결과로 출력된다.

#### **[실행 결과]**

| student_id | name   | major        | enroll_id | student_id | course_id | grade |
| :--------- | :----- | :----------- | :-------- | :--------- | :-------- | :---- |
| 1          | 김철수 | 컴퓨터공학과 | 1         | 1          | 1         | A     |
| 1          | 김철수 | 컴퓨터공학과 | 2         | 1          | 2         | B     |
| 2          | 이영희 | 경영학과     | 3         | 2          | 3         | B     |
| 2          | 이영희 | 경영학과     | 4         | 2          | 4         | A     |
| ...        | ...    | ...          | ...       | ...        | ...       | ...   |

### 2단계: 필요한 컬럼만 골라서 보기

실무에서 `SELECT *`는 거의 사용하지 않는다.  
불필요한 데이터까지 다 가져오기 때문에, 꼭 필요한 컬럼만 선택하는 것이 좋다.

학생 이름과 그 학생이 수강한 과목 id, 그리고 성적만 보고 싶은 경우 다음과 같이 작성하면 된다.

```sql
SELECT
  student.student_id,
  student.name AS student_name,
  enrollment.course_id,
  enrollment.grade
FROM student
INNER JOIN enrollment
ON student.student_id = enrollment.student_id;
```

학생별로 어떤 과목을 수강했고, 성적은 무엇인지 확인가능하다.

#### **[실행 결과]**

| student_id | student_name | course_id | grade |
| :--------- | :----------- | :-------- | :---- |
| 1          | 김철수       | 1         | A     |
| 1          | 김철수       | 2         | B     |
| 2          | 이영희       | 3         | B     |
| 2          | 이영희       | 4         | A     |
| 3          | 박민수       | 5         | A     |
| 4          | 최지현       | 6         | NULL  |
| ...        | ...          | ...       | ...   |

### 3단계: 여러 테이블을 연결하기

INNER JOIN은 두 테이블만 합치는 것이 아니라, 3개 이상의 테이블을 차례차례 이어붙일 수 있다.

학생 이름, 수강한 과목명, 담당 교수 이름까지 한 번에 조회 가능하다.

```sql
SELECT
  s.name AS student_name,
  c.name AS course_name,
  p.name AS professor_name,
  e.grade
FROM enrollment e
INNER JOIN student s ON e.student_id = s.student_id
INNER JOIN course c ON e.course_id = c.course_id
INNER JOIN professor p ON c.professor_id = p.professor_id;
```

#### **[실행 결과]**

| student_name | course_name  | professor_name | grade |
| :----------- | :----------- | :------------- | :---- |
| 김철수       | 데이터베이스 | 빌 게이츠      | A     |
| 한유진       | 데이터베이스 | 빌 게이츠      | NULL  |
| 김철수       | 운영체제     | 빌 게이츠      | B     |
| 한유진       | 운영체제     | 빌 게이츠      | A     |
| 이영희       | 경영학원론   | 스티브 잡스    | B     |
| ...          | ...          | ...            | ...   |

---

## INNER JOIN의 작동 순서

**1. FROM / JOIN**  
`FROM enrollment`으로 시작해서, `INNER JOIN`으로 student, course, professor를 연결한다.  
이때 `ON` 조건을 만족하는 행들만 합쳐져 하나의 가상 테이브이 만들어진다.

**2. WHERE**  
`WHERE e.grade = 'A'` 같은 조건이 추가된다면, 만들어진 가상 테이블에서 조건에 맞는 행만 필터링한다.

**3. SELECT**  
마지막으로 `SELECT`절에서 지정한 컬럼들만 뽑아 최종 결과를 반환한다.

<br>

예제를 통해, `INNER JOIN`을 활용해보자.

### 특정 학과 학생들의 수강 현황 확인하기

예를 들어, '컴퓨터공학과 학생들이 어떤 과목을 듣고 있는지' 확인하고 싶다고 해보자.  
학생 테이블과 수강신청 테이블, 과목 테이블을 연결하면 된다.

```sql
SELECT
  s.name AS student_name,
  s.major,
  c.name AS course_name,
  p.name AS professor_name
FROM student s
INNER JOIN enrollment e ON s.student_id = e.student_id
INNER JOIN course c ON e.course_id = c.course_id
INNER JOIN professor p ON c.professor_id = p.professor_id
WHERE s.major = '컴퓨터공학과';
```

#### [실행 순서]

**1. FROM / JOIN**  
`student`와 `enrollment`를 먼저 student_id 기준으로 결합한다.  
이어서 `course`, `professor`까지 연결해 하나의 큰 가상 테이블을 만든다.

**2. WHERE**  
그 중에 `컴퓨터공학과` 학생들만 남긴다.

**3. SELECT**  
최종적으로 학생 이름, 학과, 수강 과목, 담당 교수를 선택한다.

#### [실행 결과]

컴퓨터공학과 학생이 어떤 과목을 누구에게 배우는지 한눈에 확인할 수 있다.

| student_name | major        | course_name  | professor_name |
| :----------- | :----------- | :----------- | :------------- |
| 김철수       | 컴퓨터공학과 | 데이터베이스 | 빌 게이츠      |
| 김철수       | 컴퓨터공학과 | 운영체제     | 빌 게이츠      |
| 한유진       | 컴퓨터공학과 | 데이터베이스 | 빌 게이츠      |
| 한유진       | 컴퓨터공학과 | 운영체제     | 빌 게이츠      |

<br>

### 성적이 입력되지 않은 학생 찾기

이번에는 아직 성적이 입력되지 않은 학생들을 확인해보자.  
수강신청 테이블의 `grade` 컬럼이 `NULL`인 경우를 찾으면 된다.

```sql
SELECT
  s.name AS student_name,
  c.name AS course_name,
  p.name AS professor_name
FROM student s
INNER JOIN enrollment e ON s.student_id = e.student_id
INNER JOIN course c ON e.course_id = c.course_id
INNER JOIN professor p ON c.professor_id = p.professor_id
WHERE e.grade IS NULL;
```

#### [실행 순서]

**1. FROM / JOIN**  
학생, 수강신청, 과목, 교수 테이블을 모두 연결한다.

**2. WHERE**  
`grade IS NULL` 조건을 만족하는 행만 남긴다.

**3. SELECT**  
최종적으로 학생 이름, 수강 과목, 담당 교수 이름을 선택한다.

#### [실행 결과]

아직 성적이 입력되지 않은 학생이 어떤 과목을 수강 중인지 확인가능하다.

| student_name | course_name  | professor_name |
| :----------- | :----------- | :------------- |
| 최지현       | 영문학개론   | 팀 쿡          |
| 한유진       | 데이터베이스 | 빌 게이츠      |

---

## INNER JOIN, 방향에 따라 달라질까?

INNER JOIN은 테이블을 "교집합" 기준으로 묶어주는 역할을 한다.  
그럼 "`student` 테이블을 기준으로 조인할까? 아니면 `course`를 기준으로 조인할까? 결과가 달라지지않을까?"하고 의문이 생길 수 있다.

### 내부 조인은 **교집합**을 찾는다.

예를 들어, "컴퓨터공학과 학생들이 어떤 과목을 듣는지"를 조회하는 쿼리를 봐보자.

```sql
SELECT
  s.name AS student_name,
  c.name AS course_name
FROM student s
INNER JOIN enrollment e ON s.student_id = e.student_id
INNER JOIN course c ON e.course_id = c.course_id
WHERE s.major = '컴퓨터공학과';
```

여기서 조인의 기준을 `student ➔ enrollment ➔ course` 순으로 작성했다.  
반대로 `course ➔ enrollment ➔ student` 순으로 작성한다면 결과는 어떨까?

```sql
SELECT
  s.name AS student_name,
  c.name AS course_name
FROM course c
INNER JOIN enrollment e ON c.course_id = e.course_id
INNER JOIN student s ON e.student_id = s.student_id
WHERE s.major = '컴퓨터공학과';
```

| student_name | course_name  |
| :----------- | :----------- |
| 김철수       | 데이터베이스 |
| 김철수       | 운영체제     |
| 한유진       | 데이터베이스 |
| 한유진       | 운영체제     |

➔ 결과는 동일하다.

<br>

### 조인 순서를 왜 고민할까?

결과는 같지만, 가독성은 달라진다.

예를 들어:

- 학생을 중심으로 보고 싶을 때 ➔ `FROM student JOIN ...`
- 과목을 중심으로 보고 싶을 때 ➔ `FROM course JOIN ...`

실제 쿼리 결과는 같지만, 논리의 흐름을 읽는 사람이 어떤 데이터를 중심으로 이해하느냐에 따라 쿼리의 "시작점"을 다르게 잡아주는 게 더 자연스럽다.

<br>

### 별칭(Alias)으로 더 읽기 쉽게

조인이 많아지면 테이블 이름을 계속 쓰기 번거롭다.  
그래서 보통 **별칭(alias)**을 붙인다.

```sql
SELECT
  s.name AS student_name,
  c.name AS course_name,
  p.name AS professor_name
FROM student s
INNER JOIN enrollment e ON s.student_id = e.student_id
INNER JOIN course c ON e.course_id = c.course_id
INNER JOIN professor p ON c.professor_id = p.professor_id;
```

- 테이블에는 보통 `AS`를 생략하고 한 글자 별칭을 붙인다. (예: `student s`)
- 컬럼에는 `AS`를 명시적으로 적어주는 게 가독성에 좋다. (예: `s.name AS student_name`)

---

마지막으로 정리를 하자면,

- 내부 조인은 **두 테이블 간 교집합**만 남기는 연산이다.
- 어떤 테이블을 기준으로 시작하든 결과는 동일하다.
- 하지만 읽는 사람이 이해하기 쉽게 문제의 흐름에 맞춰 기준 테이블을 선택하는 것이 좋다.
- 테이블에는 짧은 별칭을 붙이고, 컬럼에는 `AS`를 활용해 명확하게 표현하는 습관이 도움이 된다.

INNER JOIN은 "데이터 간의 관계를 연결하여 필요한 정보를 뽑아내는" 가장 기본적이면서도 중요한 도구입니다.  
다음 글에는 외부 조인에 대해 다뤄보겠습니다.

---

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 이 글은 [**실전 데이터베이스 - 기본편**] 강의 내용을 바탕으로 작성되었습니다.  
> [출처] : (인프런 강의) [김영한의 실전 데이터베이스 - 기본편](https://www.inflearn.com/course/%EA%B9%80%EC%98%81%ED%95%9C-%EC%8B%A4%EC%A0%84-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EA%B8%B0%EB%B3%B8%ED%8E%B8)  
{: .prompt-info }

<!-- markdownlint-restore -->
