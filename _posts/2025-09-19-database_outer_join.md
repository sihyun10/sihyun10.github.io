---
title: "외부 조인(OUTER JOIN) 이해하기"
date: 2025-09-19 21:32:00 +09:00
categories: [Study, Database]
tags: [database]
pin: false
---

[지난 글](https://sihyun10.github.io/posts/database_inner_join/)에서 **내부 조인(INNER JOIN)**을 활용해 학생과 수강신청 테이블을 연결하고, 실제로 수강 신청한 학생들의 데이터만 조회해보았다. 그런데 내부 조인의 한계가 있다.

예를 들어, 성적이 아직 입력되지 않은 학생은 어떻게 조회할까?  
내부 조인만 사용하면 이런 학생은 결과에서 누락된다.  
이럴 때 필요한 것이 **외부 조인(OUTER JOIN)**이다.

---

지난 글에서 세팅해두었던 **대학 수강 시스템 예제 데이터**를 그대로 활용하여 진행한다.

## 외부 조인이란?

한쪽 테이블을 기준으로 삼아, 조건이 맞지 않더라도 기준 테이블의 데이터는 모두 결과에 포함시키는 조인 방식이다.

- LEFT OUTER JOIN (LEFT JOIN) : 왼쪽 테이블을 기준
- RIGHT OUTER JOIN (RIGHT JOIN) : 오른쪽 테이블을 기준

즉, 교집합 + 기준 테이블의 모든 데이터가 결과에 포함된다.  
(OUTER는 생략 가능하며, 보통은 LEFT JOIN, RIGHT JOIN 형태로 작성한다)

---

## LEFT JOIN - 성적이 없는 학생도 포함하여 조회

모든 학생과 그들의 수강 내역을 조회한다.  
만약 성적이 입력되지 않았더라도 결과에 포함되도록 한다.

```sql
SELECT s.name AS student_name, c.name AS course_name, e.grade
FROM student s
LEFT JOIN enrollment e ON s.student_id = e.student_id
LEFT JOIN course c ON e.course_id = c.course_id;
```

**[실행 결과]**

| student_name | course_name  | grade |
| :----------- | :----------- | :---- |
| 김철수       | 데이터베이스 | A     |
| 김철수       | 운영체제     | B     |
| 이영희       | 경영학원론   | B     |
| 이영희       | 마케팅전략   | A     |
| 박민수       | 선형대수학   | A     |
| 최지현       | 영문학개론   | NULL  |
| 한유진       | 데이터베이스 | NULL  |
| 한유진       | 운영체제     | A     |
| 정수빈       | 경영학원론   | C     |
| ...          | ...          | ...   |

- 성적이 입력된 학생은 A, B, C 등을 확인할 수 있다.
- 성적이 아직 입력되지 않은 학생은 `NULL`로 표시된다.

여기서 기준 테이블은 `student`이다.  
`student` 테이블의 모든 학생은 결과에 포함되고, `enrollment`, `course` 테이블을 이어 붙이면서 일치하는 데이터가 있으면 값을 채우고, 없으면 빈 값(NULL)으로 표시된다.

### LEFT JOIN - 성적이 없는 학생만 조회

이번에는 성적이 입력되지 않은 학생만 따로 조회해보자.

```sql
SELECT s.name AS student_name, c.name AS course_name, e.grade
FROM student s
LEFT JOIN enrollment e ON s.student_id = e.student_id
LEFT JOIN course c ON e.course_id = c.course_id
WHERE e.grade IS NULL;
```

**[실행 결과]**

| student_name | course_name  | grade |
| :----------- | :----------- | :---- |
| 최지현       | 영문학개론   | NULL  |
| 한유진       | 데이터베이스 | NULL  |

모든 학생이 결과에 포함되지만, `WHERE e.grade IS NULL` 조건을 걸었기에 성적이 없는 행만 필터링되었다.

## RIGHT JOIN - 같은 결과, 다른 기준

이번에는 동일한 내용을 **RIGHT JOIN**으로 표현해보자.

```sql
SELECT s.name AS student_name, c.name AS course_name, e.grade
FROM enrollment e
RIGHT JOIN student s ON e.student_id = s.student_id
LEFT JOIN course c ON e.course_id = c.course_id;
```

- FROM enrollment로 시작했지만, `RIGHT JOIN student`로 작성하였기 때문에 결과의 기준은 `student` 테이블이다.
- student에 있는 모든 학생이 결과에 포함된다.
- 결과적으로 LEFT JOIN으로 작성했을 때와 동일한 결과가 나온다.
  - `FROM student s LEFT JOIN enrollment e ON s.student_id = e.student_id`

<br>

### 실무에서는 LEFT JOIN을 더 많이 쓴다

LEFT JOIN과 RIGHT JOIN은 기능적으로 동일하다.  
테이블의 위치를 바꾸면 언제든 서로 바꿀 수 있다.  
그렇지만, 실무에서는 LEFT JOIN이 훨씬 많이 사용된다. 이유는 다음과 같다.

**1. 가독성**

- 쿼리를 읽을 때, FROM 절에 오는 테이블이 자연스럽게 "기준 테이블"로 인식
- RIGHT JOIN을 쓰면 기준 테이블이 뒤에 나오기 때문에 직관성이 떨어짐

**2. 일관성**

- LEFT JOIN으로 통일하면 쿼리를 읽고 해석하는 방식이 단순해짐
- RIGHT JOIN과 혼용하면 "이번엔 어느 테이블이 기준일까?"를 계속 확인해야 함

---

## 조인의 특징 - 행이 늘어날 때와 그렇지 않을 때

조인을 하면 결과 행(Row) 수가 그대로일 때도 있고, 증가할 때도 있다.  
이 차이를 제대로 이해하지 못하면 집계함수(COUNT, SUM, AVG 등)를 잘못 써서 엉뚱한 분석 결과를 얻게 된다.

### 언제 행이 늘어날까?

조인은 두 테이블의 데이터를 조건에 맞춰 붙이는 것이다.  
이때 기준 테이블의 한 행이 다른 테이블의 여러 행과 연결되면, 그만큼 결과 행 수도 늘어난다.  
반대로 한 행이 오직 하나의 행과만 연결된다면 행 수는 늘어나지 않는다.

### 1. 자식 ➔ 부모 조인 (FK ➔ PK 참조)

수강 신청(enrollment)을 기준으로 학생(student)을 조인한다고 해보자.

```sql
SELECT s.name AS student_name, e.course_id, e.grade
FROM enrollment e
JOIN student s ON e.student_id = s.student_id;
```

- `enrollment`의 각 행은 **반드시 한 명의 학생**에게 속한다
- 수강 신청 하나가 여러 학생일 수는 없다
- 기준 테이블이 `enrollment`라면 결과의 행 수는 **수강 신청**한 개수와 동일하다

자식 ➔ 부모 방향의 조인은 항상 1:1 매칭이라 행이 늘어나지 않는다.

### 2. 부모 ➔ 자식 조인 (PK ➔ FK 참조)

반대로 학생(student)을 기준으로 수강 신청(enrollment)을 조인해보자.

```sql
SELECT s.name AS student_name, e.course_id, e.grade
FROM student s
JOIN enrollment e ON s.student_id = e.student_id;
```

- 한 학생은 여러 강의를 수강할 수 있다
- 따라서 학생 한 명의 행이 수강 신청한 개수만큼 복제된다
- 예를 들어, 김철수 학생이 2개 과목을 수강신청했다면, 김철수 학생은 2번 반복되어 출력된다

부모 ➔ 자식 방향의 조인은 행이 늘어날 수 있다.

### 부모 ➔ 자식 방향의 조인한 상태로 올바른 학생 수를 세려면?

```sql
SELECT COUNT(DISTINCT s.student_id)
FROM student s
JOIN enrollment e ON s.student_id = e.student_id;
```

중복 제거(DISTINCT)를 해주어야 올바른 학생 수를 구할 수 있다.  
그렇지 않으면 같은 학생이 수강 과목 수만큼 중복 계산된다.

---

## 셀프 조인 (SELF JOIN)

**하나의 테이블 안**에서 자신의 데이터를 참조해야 하는 경우도 있는데, 이를 셀프 조인(SELF JOIN)이라 한다.

즉, 어떤 과목을 수강하려면 먼저 이수해야 하는 과목이 있을 수 있다. 이 경우 `course` 테이블 안에 `prerequisite_course_id`라는 컬럼을 활용하여 자기 자신을 참조하게 만들 수 있다.

현재, 만들어둔 course 테이블에는 선수 과목을 표현할 수 있는 컬럼이 없다.  
따라서 `course` 테이블에 다음과 같이 선수 과목(`prerequisite`)컬럼을 추가했다고 가정하자.

```sql
-- course 테이블 생성 (선수 과목 추가)
CREATE TABLE course (
  course_id INT AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  professor_id INT NOT NULL,
  prerequisite_course_id INT NULL,
  PRIMARY KEY (course_id),

  CONSTRAINT fk_course_professor FOREIGN KEY (professor_id)
    REFERENCES professor(professor_id),
  CONSTRAINT fk_course_prerequisite FOREIGN KEY (prerequisite_course_id)
    REFERENCES course(course_id)
);
```

- `prerequisite_course_id` : 해당 과목을 수강하기 위해 먼저 들어야 하는 과목의 `course_id`를 참조
- NULL 허용 ➔ 선수 과목이 없는 경우도 있기 때문

```sql
-- 강의 데이터
INSERT INTO course (name, professor_id, prerequisite_course_id) VALUES
('SQL 기초', 1, NULL),
('데이터베이스', 1, 1),
('운영체제', 1, NULL),
('경영학원론', 2, NULL),
('마케팅전략', 2, 4),
('선형대수학', 3, NULL),
('통계학개론', 3, 5),
('영문학개론', 4, NULL);
```

### SELF JOIN - 선수과목이 무엇인지 조회하기

```sql
SELECT
  c.name AS course_name,
  p.name AS prerequisite_name
FROM course c
LEFT JOIN course p ON c.prerequisite_course_id = p.course_id;
```

- c : 현재 과목
- p : 선수 과목
- 같은 테이블에 서로 다른 별칭(alias)을 부여하여, 데이터베이스가 다른 테이블처럼 인식하게 한다
- LEFT JOIN으로 하였기에 선수 과목이 없는 경우는 NULL로 표시된다.

**[실행 결과]**

| course_name  | prerequisite_name |
| :----------- | :---------------- |
| SQL 기초     | NULL              |
| 데이터베이스 | SQL 기초          |
| 운영체제     | NULL              |
| 경영학원론   | NULL              |
| 마케팅전략   | 경영학원론        |
| 선형대수학   | NULL              |
| 통계학개론   | 선형대수학        |
| 영문학개론   | NULL              |

- 데이터베이스는 SQL 기초가 선수 과목
- 마케팅전략은 경영학원론이 선수 과목
- 통계학개론은 선형대수학이 선수 과목
- 선수 과목이 없는 경우는 NULL

---

## 정리

- 외부조인(LEFT/RIGHT JOIN)
  - 한쪽 테이블의 모든 데이터를 기준으로, 조건에 맞지 않는 경우에도 결과에 포함시키는 조인 방식
    - LEFT JOIN : 왼쪽 테이블을 기준으로 모든 데이터를 포함
    - RIGHT JOIN : 오른쪽 테이블을 기준으로 모든 데이터를 포함
- 조인의 특징 - 행 수 변화
  - 자식 ➔ 부모(FK ➔ PK) 조인 : 결과 행 수 그대로
  - 부모 ➔ 자식(PK ➔ FK) 조인 : 결과 행 수 증가
    - 집계를 할 때 `DISTINCT` 또는 그룹화를 통해 중복 제거 필요
- 셀프 조인(SELF JOIN)
  - 자기 자신과 조인해야 할 때 사용
  - 테이블에 서로 다른 별칭을 부여해 다른 테이블처럼 인식

외부 조인은 한쪽 테이블의 데이터를 모두 보장하면서 다른 테이블과 연결된 정보를 확인할 수 있는 유용한 도구이다.  
기준 테이블을 명확히 하고, JOIN 방향과 결과 행 수 변화를 항상 염두에 두고 사용하는 습관이 중요하다.

---

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

> 이 글은 [**실전 데이터베이스 - 기본편**] 강의 내용을 바탕으로 작성되었습니다.  
> [출처] : (인프런 강의) [김영한의 실전 데이터베이스 - 기본편](https://www.inflearn.com/course/%EA%B9%80%EC%98%81%ED%95%9C-%EC%8B%A4%EC%A0%84-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EA%B8%B0%EB%B3%B8%ED%8E%B8)  
{: .prompt-info }

<!-- markdownlint-restore -->
