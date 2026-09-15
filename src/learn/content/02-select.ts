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

## 중복 없애기 (DISTINCT)

\`\`\`sql
SELECT DISTINCT category FROM products;
\`\`\`

\`DISTINCT\` 는 SELECT 바로 뒤에 한 번만 씁니다. 여러 열을 적으면 그 조합이 같은 행을 하나로 합칩니다.

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

## 목록 안에 있는지: IN

\`OR\` 를 여러 번 쓰는 대신 \`IN\` 을 씁니다.

\`\`\`sql
SELECT name, city FROM customers
WHERE city IN ('서울', '부산', '대구');
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

SQLite 의 \`LIKE\` 는 영문 대소문자를 구분하지 않습니다. MySQL 도 기본은 같지만 PostgreSQL 은 구분합니다(대소문자 무시는 \`ILIKE\`).
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

## LIMIT

앞에서 N 개만 가져옵니다. "가장 비싼 상품 3개" 같은 질문은 정렬 + LIMIT 조합입니다.

\`\`\`sql
SELECT name, price FROM products
ORDER BY price DESC
LIMIT 3;
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

## 집계와 함께: 조건별 개수 세기

\`CASE\` 를 \`SUM\` 안에 넣으면 한 번의 조회로 여러 조건의 개수를 셀 수 있습니다. 실무에서 아주 자주 쓰는 패턴입니다.

\`\`\`sql
SELECT
  count(*) AS total,
  sum(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
  sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders;
\`\`\`

## WHERE 와 ORDER BY 에서도

\`\`\`sql
-- 취소 주문을 맨 아래로
SELECT id, status FROM orders
ORDER BY CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END, id
LIMIT 10;
\`\`\`
`,
    },
  ],
}
