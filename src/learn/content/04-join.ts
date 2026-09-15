import type { Chapter } from '../types'

export const JOIN: Chapter = {
  id: 'join',
  title: '여러 테이블 다루기',
  lessons: [
    {
      id: 'join',
      title: 'JOIN 기본',
      keywords: ['JOIN', 'INNER JOIN', 'ON', '조인', '별칭'],
      body: `
주문 목록에 고객 **이름**을 같이 보고 싶습니다. 그런데 \`orders\` 에는 \`customer_id\` 숫자만 있고 이름은 \`customers\` 에 있습니다.
두 테이블을 이어 붙이는 게 \`JOIN\` 입니다.

\`\`\`sql
SELECT orders.id, customers.name, orders.ordered_at
FROM orders
JOIN customers ON customers.id = orders.customer_id
ORDER BY orders.id
LIMIT 10;
\`\`\`

- \`JOIN 테이블\`: 이어 붙일 테이블
- \`ON 조건\`: 어느 행끼리 짝지을지. 거의 항상 "FK = PK" 입니다.

## 테이블 별칭

테이블 이름을 매번 다 쓰면 길어지니 별칭을 붙입니다. 실무 SQL 은 대부분 이 형태입니다.

\`\`\`sql
SELECT o.id, c.name, c.city, o.ordered_at, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.city = '서울'
ORDER BY o.ordered_at DESC
LIMIT 10;
\`\`\`

두 테이블에 같은 이름의 열이 있으면(\`id\`) 반드시 \`o.id\` 처럼 어느 쪽인지 적어야 합니다. 안 적으면 "ambiguous column name" 에러입니다.

## 세 개 이상 잇기

주문 상품에 상품 이름까지 붙이려면 JOIN 을 연달아 씁니다.

\`\`\`sql
SELECT o.id AS order_id, c.name AS customer, p.name AS product, oi.quantity
FROM order_items oi
JOIN orders o    ON o.id = oi.order_id
JOIN customers c ON c.id = o.customer_id
JOIN products p  ON p.id = oi.product_id
ORDER BY o.id
LIMIT 10;
\`\`\`

## JOIN 결과의 행 수

JOIN 은 짝이 맞는 조합마다 행을 만듭니다. 고객 한 명이 주문을 3번 했으면 고객 정보가 3행에 반복됩니다.
"고객별로 하나씩" 을 원하면 GROUP BY 와 함께 씁니다.

\`\`\`sql
SELECT c.name, count(o.id) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
ORDER BY orders DESC;
\`\`\`

이 결과에는 **주문이 한 번도 없는 고객이 빠져 있습니다**. 그런 고객까지 보려면 다음 단원의 LEFT JOIN 이 필요합니다.
`,
    },
    {
      id: 'left-join',
      title: 'LEFT JOIN 과 짝이 없는 행',
      keywords: ['LEFT JOIN', 'OUTER JOIN', 'IS NULL', '조인'],
      body: `
기본 \`JOIN\`(= INNER JOIN)은 **양쪽에 짝이 있는 행만** 남깁니다.
\`LEFT JOIN\` 은 왼쪽 테이블의 행을 **모두** 남기고, 오른쪽에 짝이 없으면 그 자리를 NULL 로 채웁니다.

\`\`\`sql
SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
ORDER BY c.id
LIMIT 15;
\`\`\`

주문이 없는 고객은 \`order_id\` 가 NULL 로 나옵니다.

## 짝이 없는 행만 찾기

"주문한 적 없는 고객" 은 LEFT JOIN 뒤에 \`IS NULL\` 조건을 거는 게 정석입니다.

\`\`\`sql
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
\`\`\`

## 0 을 포함한 집계

INNER JOIN 으로 세면 주문 없는 고객이 사라집니다. LEFT JOIN 과 \`count(o.id)\` 를 쓰면 0 으로 나옵니다.

\`\`\`sql
SELECT c.name, count(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
ORDER BY orders, c.name;
\`\`\`

여기서 \`count(*)\` 를 쓰면 NULL 행도 1로 세어 버려 0 이 아니라 1 이 나옵니다. \`count(o.id)\` 처럼 오른쪽 열을 세야 합니다.

## ON 과 WHERE 의 차이

LEFT JOIN 에서 오른쪽 테이블 조건을 \`WHERE\` 에 쓰면 짝 없는 행이 다시 사라집니다. 오른쪽 조건은 \`ON\` 에 넣으세요.

\`\`\`sql
-- 배송완료 주문 수. 없으면 0
SELECT c.name, count(o.id) AS delivered
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'delivered'
GROUP BY c.id
ORDER BY delivered DESC, c.name
LIMIT 10;
\`\`\`

## RIGHT JOIN, FULL JOIN

SQLite 3.39 이상은 \`RIGHT JOIN\`, \`FULL OUTER JOIN\` 도 지원합니다. 하지만 RIGHT JOIN 은 테이블 순서만 바꾸면 LEFT JOIN 으로 쓸 수 있어 실무에서도 거의 LEFT JOIN 만 씁니다.
`,
    },
    {
      id: 'subquery',
      title: '서브쿼리',
      keywords: ['서브쿼리', 'subquery', 'IN', 'EXISTS', '스칼라', '인라인 뷰'],
      body: `
서브쿼리는 **쿼리 안의 쿼리**입니다. 괄호로 감싸서 값, 목록, 또는 테이블처럼 씁니다.

## 값 하나 (스칼라 서브쿼리)

"평균보다 비싼 상품" 은 먼저 평균을 구해야 합니다. 그 계산을 괄호 안에 넣습니다.

\`\`\`sql
SELECT name, price
FROM products
WHERE price > (SELECT avg(price) FROM products)
ORDER BY price;
\`\`\`

SELECT 절에도 넣을 수 있습니다.

\`\`\`sql
SELECT name, price,
       price - (SELECT avg(price) FROM products) AS diff_from_avg
FROM products
ORDER BY diff_from_avg DESC
LIMIT 5;
\`\`\`

## 목록 (IN 서브쿼리)

"도서를 주문한 적 있는 고객" 처럼 조건이 다른 테이블에 있을 때 씁니다.

\`\`\`sql
SELECT id, name FROM customers
WHERE id IN (
  SELECT o.customer_id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE p.category = '도서'
);
\`\`\`

\`NOT IN\` 으로 반대도 됩니다. 단, 서브쿼리 결과에 NULL 이 섞이면 \`NOT IN\` 은 아무 행도 돌려주지 않습니다. 그럴 땐 아래 \`NOT EXISTS\` 를 쓰세요.

## 존재 여부 (EXISTS)

\`\`\`sql
-- 주문한 적 없는 고객 (LEFT JOIN ... IS NULL 과 같은 결과)
SELECT id, name FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
\`\`\`

바깥 쿼리의 \`c.id\` 를 안에서 참조하는 것을 **상관 서브쿼리**라고 합니다.

## 테이블처럼 (FROM 절 서브쿼리)

집계 결과를 다시 집계하거나 조인할 때 씁니다.

\`\`\`sql
-- 고객별 주문 수를 구한 다음, 그 평균
SELECT avg(order_count) AS avg_orders_per_customer
FROM (
  SELECT customer_id, count(*) AS order_count
  FROM orders
  GROUP BY customer_id
);
\`\`\`

## WITH 로 이름 붙이기

FROM 절 서브쿼리가 길어지면 \`WITH\` 로 위에 이름을 붙여 두면 읽기 쉽습니다.

\`\`\`sql
WITH customer_orders AS (
  SELECT customer_id, count(*) AS order_count
  FROM orders
  GROUP BY customer_id
)
SELECT c.name, co.order_count
FROM customer_orders co
JOIN customers c ON c.id = co.customer_id
ORDER BY co.order_count DESC
LIMIT 5;
\`\`\`
`,
    },
    {
      id: 'union',
      title: '결과 합치기: UNION',
      keywords: ['UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT', '집합'],
      body: `
JOIN 이 옆으로 붙이는 거라면, \`UNION\` 은 **위아래로** 붙입니다. 두 SELECT 의 열 개수와 순서가 같아야 합니다.

\`\`\`sql
SELECT name, '고객' AS kind FROM customers WHERE city = '부산'
UNION ALL
SELECT name, '학생' AS kind FROM students WHERE major = '수학';
\`\`\`

- \`UNION ALL\`: 그대로 이어 붙임
- \`UNION\`: 이어 붙인 뒤 **중복 행 제거** (느림)

중복이 없다는 걸 알면 \`UNION ALL\` 을 쓰세요.

## 공통 / 차집합

\`\`\`sql
-- 2024-1 학기와 2024-2 학기에 모두 수강한 학생
SELECT student_id FROM enrollments WHERE semester = '2024-1'
INTERSECT
SELECT student_id FROM enrollments WHERE semester = '2024-2';
\`\`\`

\`\`\`sql
-- 2024-1 학기엔 들었지만 2024-2 학기엔 안 들은 학생
SELECT student_id FROM enrollments WHERE semester = '2024-1'
EXCEPT
SELECT student_id FROM enrollments WHERE semester = '2024-2';
\`\`\`

> MySQL 8.0 이전에는 INTERSECT, EXCEPT 가 없습니다. 그 경우 EXISTS 서브쿼리로 바꿔 씁니다.

## 정렬은 맨 마지막에 한 번

\`\`\`sql
SELECT name, price FROM products WHERE category = '도서'
UNION ALL
SELECT name, price FROM products WHERE category = '생활용품'
ORDER BY price DESC;
\`\`\`

\`ORDER BY\` 는 합쳐진 전체 결과에 한 번만 적용됩니다.
`,
    },
  ],
}
