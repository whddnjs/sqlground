import type { Chapter } from '../types'

export const AGGREGATE: Chapter = {
  id: 'aggregate',
  title: '집계와 그룹',
  lessons: [
    {
      id: 'aggregate-functions',
      title: '집계 함수',
      keywords: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', '집계'],
      body: `
집계 함수는 **여러 행을 하나의 값**으로 요약합니다.

\`\`\`sql
SELECT
  count(*)   AS product_count,
  sum(stock) AS total_stock,
  avg(price) AS avg_price,
  min(price) AS cheapest,
  max(price) AS priciest
FROM products;
\`\`\`

| 함수 | 뜻 |
|---|---|
| \`count(*)\` | 행 수 |
| \`count(열)\` | 그 열이 NULL 이 아닌 행 수 |
| \`count(DISTINCT 열)\` | 서로 다른 값의 수 |
| \`sum\` \`avg\` \`min\` \`max\` | 합, 평균, 최소, 최대 |

열 하나가 아니라 **식**도 집계할 수 있습니다.

\`\`\`sql
-- 재고를 전부 팔면 얼마인가
SELECT sum(price * stock) AS stock_value,
       round(avg(price))  AS avg_price
FROM products;
\`\`\`

\`min\`, \`max\` 는 날짜와 문자열에도 씁니다.

\`\`\`sql
SELECT min(ordered_at) AS first_order,
       max(ordered_at) AS last_order,
       count(DISTINCT customer_id) AS buyers
FROM orders;
\`\`\`

## count(*) 와 count(열) 의 차이

학교 샘플에서 성적이 NULL 인 수강이 있습니다.

\`\`\`sql
SELECT
  count(*)      AS all_rows,
  count(score)  AS scored_rows,
  count(DISTINCT student_id) AS students
FROM enrollments;
\`\`\`

\`avg(score)\` 도 NULL 을 빼고 평균을 냅니다. "NULL 을 0 으로 치고 평균" 을 원하면 \`avg(coalesce(score, 0))\` 로 명시하세요.

## WHERE 와 함께

집계는 **WHERE 로 거른 뒤**의 행을 대상으로 합니다.

\`\`\`sql
SELECT count(*) AS delivered_orders
FROM orders
WHERE status = 'delivered';
\`\`\`

## 집계와 일반 열을 섞으면?

\`\`\`sql
-- SQLite 에서는 실행되지만 name 은 "아무 행" 의 값이라 의미가 없습니다
SELECT name, max(price) FROM products;
\`\`\`

SQLite 는 이 경우 max 를 만족하는 행의 name 을 돌려주는 특수 규칙이 있지만, 표준 SQL 이 아니고 다른 DB 에서는 에러입니다. "가장 비싼 상품 이름" 은 \`ORDER BY price DESC LIMIT 1\` 이나 서브쿼리로 구하세요.

## 대상 행이 없을 때

조건에 맞는 행이 하나도 없으면 \`count\` 는 0 이지만 \`sum\`, \`avg\`, \`min\`, \`max\` 는 **NULL** 입니다.

\`\`\`sql
SELECT count(*) AS cnt, sum(price) AS total, avg(price) AS average
FROM products
WHERE category = '없는 카테고리';
\`\`\`

합계를 화면에 보여 줄 때는 \`COALESCE(sum(price), 0)\` 으로 0 을 만들어 주는 경우가 많습니다.
`,
    },
    {
      id: 'group-by',
      title: 'GROUP BY 와 HAVING',
      keywords: ['GROUP BY', 'HAVING', '그룹', '집계'],
      body: `
\`GROUP BY\` 는 같은 값끼리 묶어서 **그룹마다** 집계합니다. "카테고리별 상품 수", "고객별 주문 수" 같은 질문이 전부 이겁니다.

\`\`\`sql
SELECT category, count(*) AS product_count, avg(price) AS avg_price
FROM products
GROUP BY category
ORDER BY product_count DESC;
\`\`\`

규칙 하나만 기억하세요. **SELECT 에 적는 열은 GROUP BY 에 있는 열이거나 집계 함수여야 합니다.** 그룹 안에는 행이 여러 개라 일반 열 값을 하나로 정할 수 없기 때문입니다.

## 여러 열로 묶기

\`\`\`sql
SELECT major, year, count(*) AS students
FROM students
GROUP BY major, year
ORDER BY major, year;
\`\`\`

## 그룹마다 여러 집계

집계 함수는 몇 개든 나란히 쓸 수 있습니다. 과목별 수강 인원, 성적이 나온 인원, 평균, 최고점입니다.

\`\`\`sql
SELECT course_id,
       count(*)             AS enrolled,
       count(score)         AS scored,
       round(avg(score), 1) AS avg_score,
       max(score)           AS top_score
FROM enrollments
GROUP BY course_id
ORDER BY avg_score DESC;
\`\`\`

## 식으로 묶기

열 그대로가 아니라 계산한 값으로도 묶을 수 있습니다.

\`\`\`sql
-- 입사 연도별 직원 수와 평균 연봉
SELECT substr(hire_date, 1, 4) AS hire_year,
       count(*)           AS employees,
       round(avg(salary)) AS avg_salary
FROM employees
GROUP BY hire_year
ORDER BY hire_year;
\`\`\`

## 그룹에 조건 걸기: HAVING

\`WHERE\` 는 **묶기 전** 행을 거르고, \`HAVING\` 은 **묶은 후** 그룹을 거릅니다. 집계 결과로 조건을 걸려면 HAVING 입니다.

\`\`\`sql
-- 3번 이상 주문한 고객
SELECT customer_id, count(*) AS order_count
FROM orders
GROUP BY customer_id
HAVING count(*) >= 3
ORDER BY order_count DESC;
\`\`\`

둘을 같이 쓰면 이렇게 됩니다.

\`\`\`sql
-- 취소를 뺀 주문만 세고, 그중 2건 이상인 고객
SELECT customer_id, count(*) AS order_count
FROM orders
WHERE status <> 'cancelled'
GROUP BY customer_id
HAVING count(*) >= 2
ORDER BY order_count DESC;
\`\`\`

## CASE 와 함께: 그룹별 조건 집계

\`sum(CASE ...)\` 를 GROUP BY 와 합치면 그룹마다 조건별 개수를 나란히 볼 수 있습니다.

\`\`\`sql
-- 취소한 적이 있는 고객의 전체 주문 수와 취소 수
SELECT customer_id,
       count(*) AS orders,
       sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY customer_id
HAVING sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) > 0;
\`\`\`

## 실행되는 순서

적는 순서와 달리 DB 는 이 순서로 처리합니다.

\`\`\`text
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
\`\`\`

- \`WHERE\` 는 집계보다 먼저라서 집계 함수를 쓸 수 없습니다.
- \`SELECT\` 는 \`WHERE\` 보다 나중이라서, SELECT 에서 붙인 별칭을 WHERE 에서 쓸 수 없습니다.
- \`ORDER BY\` 는 SELECT 다음이라 별칭으로 정렬할 수 있습니다.

## 자주 하는 실수

\`\`\`sql
-- 에러: HAVING 은 GROUP BY 없이 쓸 수 없습니다 (SQLite 는 허용하지만 다른 DB 는 에러)
-- WHERE 자리에 집계 함수를 쓰는 것도 에러입니다:
SELECT customer_id FROM orders WHERE count(*) > 2;
\`\`\`

위 예제를 실행하면 "misuse of aggregate" 에러가 납니다. 집계 조건은 항상 HAVING 으로.

## 월별 매출 구하기

날짜 함수와 조합하면 시계열 집계가 됩니다.

\`\`\`sql
SELECT strftime('%Y-%m', o.ordered_at) AS month,
       sum(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY month
ORDER BY month;
\`\`\`

여기서 쓴 JOIN 은 다음 장에서 배웁니다.
`,
    },
  ],
}
