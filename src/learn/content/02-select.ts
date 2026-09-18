import type { Chapter } from '../types'

export const SELECT_BASICS: Chapter = {
  id: 'select',
  title: '데이터 조회',
  lessons: [
    {
      id: 'select',
      title: 'SELECT 기본',
      keywords: ['SELECT', 'FROM', 'AS', '별칭', 'DISTINCT'],
      body: `
가장 많이 쓰는 문장입니다. 모양은 항상 이렇습니다.

\`\`\`text
SELECT 열1, 열2, ...
FROM 테이블;
\`\`\`

## 원하는 열만 고르기

\`\`\`sql
SELECT name, price FROM products;
\`\`\`

열 순서는 내가 적은 순서대로 나옵니다. \`*\` 대신 필요한 열만 적는 습관을 들이세요. 실무에서는 열이 수십 개인 테이블이 흔합니다.

## 계산과 별칭 (AS)

열끼리 계산할 수 있고, 결과 열에 \`AS\` 로 이름을 붙일 수 있습니다.

\`\`\`sql
SELECT name, price, price * 0.9 AS sale_price
FROM products;
\`\`\`

\`AS\` 는 생략해도 되지만(\`price * 0.9 sale_price\`) 초보 때는 적는 편이 읽기 쉽습니다.

문자열은 \`||\` 로 이어 붙입니다. 별칭에 공백이나 한글을 쓰려면 큰따옴표로 감쌉니다.

\`\`\`sql
SELECT name || ' <' || email || '>' AS contact,
       city AS "사는 곳"
FROM customers;
\`\`\`

회사 샘플의 \`salary\` 는 연봉(만원)입니다. 12 로 나누면 월 급여가 됩니다. \`round\` 는 반올림 함수입니다.

\`\`\`sql
SELECT name, title, salary, round(salary / 12) AS monthly
FROM employees;
\`\`\`

## 중복 없애기 (DISTINCT)

\`\`\`sql
SELECT DISTINCT category FROM products;
\`\`\`

\`DISTINCT\` 는 SELECT 바로 뒤에 한 번만 씁니다. 여러 열을 적으면 그 조합이 같은 행을 하나로 합칩니다.

\`\`\`sql
-- 전공과 학년의 조합. 같은 전공·같은 학년인 학생이 여러 명이어도 한 줄입니다
SELECT DISTINCT major, year FROM students;
\`\`\`

## 테이블 없이 계산만

\`FROM\` 없이도 실행됩니다. 함수를 시험해 볼 때 편합니다.

\`\`\`sql
SELECT 10 / 3 AS int_div, 10 / 3.0 AS real_div, 'SQL' || ' 연습' AS joined;
\`\`\`

정수끼리 나누면 정수가 나옵니다(\`3\`). 소수를 원하면 한쪽을 소수로 만드세요. \`||\` 는 문자열을 이어 붙입니다.
`,
    },
    {
      id: 'where',
      title: 'WHERE 로 조건 걸기',
      keywords: ['WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', '비교'],
      body: `
\`WHERE\` 는 행을 거르는 조건입니다. 조건이 참인 행만 결과에 남습니다.

\`\`\`sql
SELECT name, price FROM products
WHERE price >= 100000;
\`\`\`

## 비교 연산자

| 연산자 | 뜻 |
|---|---|
| \`=\` | 같다 (\`==\` 아님) |
| \`<>\` 또는 \`!=\` | 다르다 |
| \`<\` \`<=\` \`>\` \`>=\` | 크기 비교 |

문자열 비교는 따옴표를 잊지 마세요. \`city = 서울\` 이라고 쓰면 "서울이라는 열이 없다" 는 에러가 납니다.

\`<>\` 는 "그 값이 아닌 것" 을 고릅니다.

\`\`\`sql
-- 배송완료가 아닌 주문
SELECT id, status, ordered_at FROM orders
WHERE status <> 'delivered';
\`\`\`

## 여러 조건: AND, OR, NOT

\`\`\`sql
SELECT name, category, price FROM products
WHERE category = '전자기기' AND price < 50000;
\`\`\`

\`AND\` 가 \`OR\` 보다 먼저 계산됩니다. 섞어 쓸 때는 괄호로 의도를 분명히 하세요.

\`\`\`sql
SELECT name, category, price FROM products
WHERE (category = '도서' OR category = '생활용품') AND price < 20000;
\`\`\`

\`NOT\` 은 조건을 뒤집습니다. 아래에서 배울 \`IN\`, \`BETWEEN\`, \`LIKE\` 앞에도 붙일 수 있습니다(\`NOT IN\`, \`NOT BETWEEN\`, \`NOT LIKE\`).

\`\`\`sql
-- 서울도 부산도 아닌 곳에 사는 고객
SELECT name, city FROM customers
WHERE NOT (city = '서울' OR city = '부산');
\`\`\`

## 목록 안에 있는지: IN

\`OR\` 를 여러 번 쓰는 대신 \`IN\` 을 씁니다.

\`\`\`sql
SELECT name, city FROM customers
WHERE city IN ('서울', '부산', '대구');
\`\`\`

\`\`\`sql
-- 반대로: 전자기기와 가구를 뺀 나머지 상품
SELECT name, category FROM products
WHERE category NOT IN ('전자기기', '가구');
\`\`\`

## 범위: BETWEEN

양 끝을 **포함**합니다.

\`\`\`sql
SELECT name, price FROM products
WHERE price BETWEEN 20000 AND 40000;
\`\`\`

## 패턴 검색: LIKE

- \`%\` 는 아무 글자 0개 이상
- \`_\` 는 아무 글자 딱 1개

\`\`\`sql
SELECT name FROM products WHERE name LIKE '%키보드%';
\`\`\`

\`\`\`sql
-- 이메일이 example.com 으로 끝나는 고객
SELECT name, email FROM customers WHERE email LIKE '%@example.com';
\`\`\`

\`\`\`sql
-- _ 는 딱 한 글자: 성이 김씨이고 이름이 세 글자인 학생
SELECT name, major FROM students WHERE name LIKE '김__';
\`\`\`

SQLite 의 \`LIKE\` 는 영문 대소문자를 구분하지 않습니다. MySQL 도 기본은 같지만 PostgreSQL 은 구분합니다(대소문자 무시는 \`ILIKE\`).

## 조건을 조합해 보기

실제 질문은 조건이 여러 개입니다. 하나씩 \`AND\` 로 붙여 나가면 됩니다.

\`\`\`sql
-- 개발 부서(1번)가 아니고, 연봉이 5000 이상이고, 2019년 이후에 입사한 직원
SELECT name, title, salary, hire_date FROM employees
WHERE department_id <> 1
  AND salary >= 5000
  AND hire_date >= '2019-01-01';
\`\`\`

날짜가 \`'2019-01-01'\` 같은 형식의 문자열이면 크기 비교가 곧 날짜 순서입니다.
`,
    },
    {
      id: 'order-limit',
      title: '정렬과 개수 제한',
      keywords: ['ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', '정렬', '페이징'],
      body: `
## ORDER BY

결과 순서는 지정하지 않으면 **보장되지 않습니다**. 순서가 중요하면 반드시 \`ORDER BY\` 를 붙이세요.

\`\`\`sql
SELECT name, price FROM products
ORDER BY price DESC;
\`\`\`

- \`ASC\`: 오름차순 (기본값, 생략 가능)
- \`DESC\`: 내림차순

여러 기준으로 정렬하려면 쉼표로 나열합니다. 앞 기준이 같을 때 다음 기준을 봅니다.

\`\`\`sql
SELECT name, category, price FROM products
ORDER BY category, price DESC;
\`\`\`

별칭이나 계산식으로도 정렬할 수 있습니다.

\`\`\`sql
-- 재고 금액(가격 × 재고)이 큰 순서
SELECT name, price, stock, price * stock AS stock_value
FROM products
ORDER BY stock_value DESC;
\`\`\`

## LIMIT

앞에서 N 개만 가져옵니다. "가장 비싼 상품 3개" 같은 질문은 정렬 + LIMIT 조합입니다.

\`\`\`sql
SELECT name, price FROM products
ORDER BY price DESC
LIMIT 3;
\`\`\`

"가장 최근 주문 5건" 도 같은 모양입니다. 같은 날 들어온 주문이 있으면 그 사이의 순서는 정해져 있지 않으므로, 두 번째 기준으로 \`id\` 를 넣어 결과가 매번 같게 만듭니다.

\`\`\`sql
SELECT id, customer_id, ordered_at, status FROM orders
ORDER BY ordered_at DESC, id DESC
LIMIT 5;
\`\`\`

## OFFSET 으로 건너뛰기

페이지 넘기기에 씁니다. 2페이지(6~10번째)를 보려면:

\`\`\`sql
SELECT id, name FROM products
ORDER BY id
LIMIT 5 OFFSET 5;
\`\`\`

## 절의 순서

SELECT 문의 절은 정해진 순서로 써야 합니다. 이 순서가 틀리면 문법 에러입니다.

\`\`\`text
SELECT ...
FROM ...
WHERE ...
GROUP BY ...
HAVING ...
ORDER BY ...
LIMIT ...
\`\`\`

GROUP BY 와 HAVING 은 다음 장에서 다룹니다.

지금까지 배운 절을 모두 쓰면 이렇게 됩니다. 재고가 있는 전자기기 중에서 싼 순서로 3개.

\`\`\`sql
SELECT name, price, stock
FROM products
WHERE category = '전자기기' AND stock > 0
ORDER BY price
LIMIT 3;
\`\`\`
`,
    },
    {
      id: 'null',
      title: 'NULL 다루기',
      keywords: ['NULL', 'IS NULL', 'IS NOT NULL', 'COALESCE', 'IFNULL'],
      body: `
\`NULL\` 은 "값이 없음" 입니다. 0 도 아니고 빈 문자열도 아닙니다. 초보자가 가장 많이 헷갈리는 부분이라 따로 다룹니다.

학교 샘플의 \`enrollments.score\` 는 아직 성적이 안 나온 수강에 NULL 이 들어 있습니다.

\`\`\`sql
SELECT student_id, course_id, semester, score
FROM enrollments
WHERE semester = '2024-2'
LIMIT 10;
\`\`\`

## NULL 은 = 로 비교할 수 없다

\`score = NULL\` 은 참도 거짓도 아닌 "알 수 없음" 이라 아무 행도 안 나옵니다.

\`\`\`sql
-- 아무것도 안 나옵니다
SELECT count(*) FROM enrollments WHERE score = NULL;
\`\`\`

\`IS NULL\` / \`IS NOT NULL\` 을 써야 합니다.

\`\`\`sql
SELECT count(*) AS no_score FROM enrollments WHERE score IS NULL;
\`\`\`

## NULL 과 계산

NULL 이 섞인 계산 결과는 NULL 입니다. \`NULL + 10\` 은 NULL.

\`\`\`sql
SELECT NULL + 10 AS a, NULL || 'x' AS b;
\`\`\`

## 기본값으로 바꾸기: COALESCE

\`COALESCE(a, b, c)\` 는 앞에서부터 NULL 이 아닌 첫 값을 돌려줍니다. 화면에 NULL 대신 0 이나 '미정' 을 보여 줄 때 씁니다.

\`\`\`sql
SELECT student_id, course_id, COALESCE(score, 0) AS score_or_zero
FROM enrollments
WHERE semester = '2024-2'
LIMIT 10;
\`\`\`

SQLite 와 MySQL 에는 같은 일을 하는 \`IFNULL(a, b)\` 도 있습니다. \`COALESCE\` 는 모든 DB 에서 통합니다.

## 조건을 뒤집을 때의 함정

\`<>\` 나 \`NOT\` 조건도 NULL 행은 돌려주지 않습니다. 회사 샘플에는 아직 부서가 없는(\`department_id\` 가 NULL) 직원이 두 명(대표와 인턴) 있습니다.

\`\`\`sql
-- "개발 부서(1번)가 아닌 직원" 을 찾았는데, 부서가 NULL 인 직원은 빠져 있습니다
SELECT name, department_id FROM employees
WHERE department_id <> 1;
\`\`\`

NULL 인 행도 원하면 직접 적어야 합니다.

\`\`\`sql
SELECT name, department_id FROM employees
WHERE department_id <> 1 OR department_id IS NULL;
\`\`\`

## 정렬과 NULL

SQLite 는 오름차순에서 NULL 을 **맨 앞**에 둡니다. DB 마다 다르니(PostgreSQL 은 맨 뒤) 순서가 중요하면 명시하세요.

\`\`\`sql
SELECT name, department_id FROM employees
ORDER BY department_id
LIMIT 5;
\`\`\`

\`department_id IS NULL\` 은 참이면 1, 거짓이면 0 이라서 첫 번째 정렬 기준으로 쓰면 NULL 이 뒤로 갑니다.

\`\`\`sql
SELECT name, department_id FROM employees
ORDER BY department_id IS NULL, department_id DESC
LIMIT 5;
\`\`\`

## 집계와 NULL

\`AVG\`, \`SUM\`, \`COUNT(열)\` 은 NULL 을 **무시**합니다. \`COUNT(*)\` 만 NULL 행도 셉니다. 다음 장에서 확인합니다.
`,
    },
    {
      id: 'functions',
      title: '문자열, 숫자, 날짜 함수',
      keywords: ['함수', 'LENGTH', 'UPPER', 'LOWER', 'SUBSTR', 'REPLACE', 'ROUND', 'ABS', 'DATE', 'strftime', '날짜'],
      body: `
함수는 값을 받아 다른 값을 돌려줍니다. \`SELECT\` 절이나 \`WHERE\` 절 어디서든 쓸 수 있습니다.

## 문자열

\`\`\`sql
SELECT
  name,
  length(name)          AS len,
  upper(email)          AS upper_email,
  substr(joined_at, 1, 4) AS joined_year,
  replace(email, '@example.com', '') AS local_part
FROM customers
LIMIT 5;
\`\`\`

| 함수 | 뜻 |
|---|---|
| \`length(s)\` | 글자 수 |
| \`upper(s)\` \`lower(s)\` | 대문자 / 소문자 (영문만) |
| \`substr(s, 시작, 길이)\` | 부분 문자열. 시작은 1부터 |
| \`replace(s, 찾을, 바꿀)\` | 치환 |
| \`trim(s)\` | 양쪽 공백 제거 |
| \`a \\|\\| b\` | 이어 붙이기 |

함수는 \`WHERE\` 와 \`ORDER BY\` 에서도 씁니다.

\`\`\`sql
-- 이름이 7글자 이상인 상품을 긴 순서로
SELECT name, length(name) AS len FROM products
WHERE length(name) >= 7
ORDER BY len DESC;
\`\`\`

\`substr\` 의 길이를 생략하면 끝까지 자릅니다.

\`\`\`sql
SELECT name,
       substr(name, 1, 1) AS family_name,
       substr(name, 2)    AS given_name
FROM students
LIMIT 5;
\`\`\`

## 숫자

\`\`\`sql
SELECT
  round(123.456, 1) AS r1,
  round(2.5)        AS r2,
  abs(-7)           AS a,
  17 % 5            AS remainder,
  max(3, 9, 4)      AS biggest;
\`\`\`

\`max(a, b, ...)\` 처럼 인자가 여러 개면 그중 큰 값(스칼라 함수), \`max(열)\` 처럼 하나면 열 전체의 최댓값(집계 함수)입니다. 같은 이름이지만 다르게 동작합니다.

정수끼리 나누면 소수점 아래가 버려집니다. 한쪽을 실수로 만들면 됩니다. 가격을 만 원 단위로 바꿔 봅니다.

\`\`\`sql
SELECT name, price,
       price / 10000            AS man_int,
       round(price / 10000.0, 1) AS man
FROM products
LIMIT 5;
\`\`\`

\`CAST(값 AS 타입)\` 은 타입을 바꿉니다. 문자열로 들어온 숫자를 계산하거나 소수를 정수로 자를 때 씁니다.

\`\`\`sql
SELECT CAST('42' AS INTEGER) + 1 AS n,
       CAST(7400.5 AS INTEGER)   AS truncated,
       CAST(2024 AS TEXT) || '년' AS label;
\`\`\`

## 날짜

SQLite 에는 날짜 타입이 따로 없어 \`'2024-03-15'\` 같은 **ISO 형식 문자열**로 저장합니다. 이 형식이면 문자열 비교로 날짜 비교가 됩니다.

\`\`\`sql
SELECT id, ordered_at FROM orders
WHERE ordered_at >= '2024-06-01' AND ordered_at < '2024-07-01'
ORDER BY ordered_at;
\`\`\`

날짜 함수는 \`date\`, \`strftime\` 을 씁니다.

\`\`\`sql
SELECT
  date('now')                       AS today,
  strftime('%Y-%m', ordered_at)     AS month,
  julianday('2024-12-31') - julianday(ordered_at) AS days_to_year_end
FROM orders
LIMIT 5;
\`\`\`

\`strftime\` 의 형식: \`%Y\` 연도, \`%m\` 월, \`%d\` 일, \`%H\` 시, \`%w\` 요일(0=일요일).

날짜를 더하고 빼려면 \`date(날짜, 수정자, ...)\` 를 씁니다.

\`\`\`sql
SELECT id, ordered_at,
       date(ordered_at, '+7 days')        AS due_date,
       date(ordered_at, 'start of month') AS month_start,
       date(ordered_at, 'start of month', '+1 month', '-1 day') AS month_end
FROM orders
LIMIT 5;
\`\`\`

두 날짜의 차이는 \`julianday\` 끼리 빼서 구합니다. 아래는 학생의 만 나이입니다.

\`\`\`sql
SELECT name, birth_date,
       CAST((julianday('now') - julianday(birth_date)) / 365.25 AS INTEGER) AS age
FROM students
LIMIT 5;
\`\`\`

> MySQL 은 \`DATE_FORMAT\`, PostgreSQL 은 \`TO_CHAR\` 를 씁니다. 날짜 함수는 DB 마다 이름이 가장 많이 다른 영역입니다.
`,
    },
    {
      id: 'case',
      title: 'CASE 로 값 분기하기',
      keywords: ['CASE', 'WHEN', 'THEN', 'ELSE', 'END', '조건'],
      body: `
\`CASE\` 는 SQL 의 if-else 입니다. 값에 따라 다른 결과를 만듭니다.

\`\`\`sql
SELECT name, price,
  CASE
    WHEN price >= 100000 THEN '고가'
    WHEN price >= 30000  THEN '중가'
    ELSE '저가'
  END AS price_band
FROM products
ORDER BY price DESC;
\`\`\`

- 위에서부터 처음 참인 \`WHEN\` 의 값을 씁니다.
- \`ELSE\` 를 생략하면 아무것도 안 맞을 때 NULL 입니다.
- \`END\` 로 닫아야 합니다. 빠뜨리면 문법 에러.

## 값이 정확히 일치할 때는 짧게

\`\`\`sql
SELECT id, status,
  CASE status
    WHEN 'paid'      THEN '결제완료'
    WHEN 'shipped'   THEN '배송중'
    WHEN 'delivered' THEN '배송완료'
    WHEN 'cancelled' THEN '취소'
  END AS status_kr
FROM orders
LIMIT 10;
\`\`\`

## NULL 과 WHEN 의 순서

점수를 등급으로 바꿔 봅니다. 아직 성적이 없는 수강은 \`score\` 가 NULL 입니다.

\`\`\`sql
SELECT student_id, course_id, score,
  CASE
    WHEN score IS NULL THEN '미입력'
    WHEN score >= 90   THEN 'A'
    WHEN score >= 80   THEN 'B'
    WHEN score >= 70   THEN 'C'
    ELSE 'F'
  END AS grade
FROM enrollments
WHERE semester = '2024-2'
ORDER BY score
LIMIT 12;
\`\`\`

- \`WHEN score IS NULL\` 을 빼면 NULL 은 어떤 비교에도 참이 아니라 \`ELSE\` 로 떨어져 'F' 가 됩니다. NULL 이 있을 수 있는 열은 먼저 걸러 주세요.
- 위에서부터 검사하므로 \`score >= 80\` 에는 "90 미만" 을 다시 적지 않아도 됩니다. 순서를 바꾸면 결과가 달라집니다.

## 집계와 함께: 조건별 개수 세기

\`CASE\` 를 \`SUM\` 안에 넣으면 한 번의 조회로 여러 조건의 개수를 셀 수 있습니다. 실무에서 아주 자주 쓰는 패턴입니다.

\`\`\`sql
SELECT
  count(*) AS total,
  sum(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
  sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders;
\`\`\`

## 계산에 쓰기

\`CASE\` 의 결과는 값이라서 식 안에 넣을 수 있습니다. 카테고리마다 할인율을 다르게 적용합니다.

\`\`\`sql
SELECT name, category, price,
  price * CASE category
            WHEN '도서'     THEN 0.9
            WHEN '전자기기' THEN 0.95
            ELSE 1
          END AS sale_price
FROM products;
\`\`\`

## WHERE 와 ORDER BY 에서도

\`\`\`sql
-- 취소 주문을 맨 아래로
SELECT id, status FROM orders
ORDER BY CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END, id
LIMIT 10;
\`\`\`

글자순이 아닌 **내가 정한 순서**로 정렬할 때도 같은 방법을 씁니다.

\`\`\`sql
-- 진행 순서대로: 결제완료 → 배송중 → 배송완료 → 취소
SELECT id, status, ordered_at FROM orders
ORDER BY CASE status
           WHEN 'paid'      THEN 1
           WHEN 'shipped'   THEN 2
           WHEN 'delivered' THEN 3
           ELSE 4
         END, ordered_at
LIMIT 12;
\`\`\`
`,
    },
  ],
}
