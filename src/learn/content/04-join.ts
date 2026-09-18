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

\`\`\`sql
-- 에러: id 와 name 중 id 가 두 테이블에 모두 있어 어느 쪽인지 알 수 없습니다
SELECT id, name
FROM orders
JOIN customers ON customers.id = orders.customer_id;
\`\`\`

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

## 다른 샘플로: 학생과 과목 잇기

학교 샘플은 학생과 과목이 \`enrollments\` 로 이어져 있습니다. 가운데 테이블에서 출발해 양쪽을 붙이면 됩니다.

\`\`\`sql
-- 김하늘 학생이 들은 과목과 성적
SELECT s.name AS student, c.name AS course, c.credits, e.semester, e.score
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c  ON c.id = e.course_id
WHERE s.name = '김하늘'
ORDER BY e.semester, c.name;
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

## JOIN 과 집계: 많이 팔린 상품

JOIN 으로 필요한 열을 모은 다음 GROUP BY 로 요약하는 것이 실무 조회의 기본 모양입니다.

\`\`\`sql
-- 취소 주문을 빼고, 판매 수량이 많은 상품 5개
SELECT p.name,
       sum(oi.quantity)                 AS sold,
       sum(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o   ON o.id = oi.order_id
WHERE o.status <> 'cancelled'
GROUP BY p.id
ORDER BY sold DESC
LIMIT 5;
\`\`\`
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

같은 방법으로 "한 번도 팔리지 않은 상품" 도 찾습니다. 기준이 되는 테이블을 왼쪽에 두는 것만 기억하면 됩니다.

\`\`\`sql
SELECT p.name, p.category
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE oi.id IS NULL;
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

비교해 보세요. 같은 조건을 \`WHERE\` 에 쓰면 배송완료 주문이 없는 고객이 결과에서 통째로 사라집니다.

\`\`\`sql
SELECT c.name, count(o.id) AS delivered
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'delivered'
GROUP BY c.id
ORDER BY delivered, c.name
LIMIT 10;
\`\`\`

## LEFT JOIN 을 이어 붙일 때

LEFT JOIN 뒤에 테이블을 더 붙일 때는 **뒤쪽도 LEFT JOIN** 이어야 합니다. 중간에 INNER JOIN 이 끼면 짝 없는 행이 거기서 탈락합니다.

\`\`\`sql
-- 고객별 총 구매액. 주문이 없으면 0
SELECT c.name,
       COALESCE(sum(oi.quantity * oi.unit_price), 0) AS total
FROM customers c
LEFT JOIN orders o       ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id
ORDER BY total DESC;
\`\`\`

짝이 없으면 \`sum\` 이 NULL 이 되므로 \`COALESCE\` 로 0 을 만들어 줍니다.

## RIGHT JOIN, FULL JOIN

SQLite 3.39 이상은 \`RIGHT JOIN\`, \`FULL OUTER JOIN\` 도 지원합니다. 하지만 RIGHT JOIN 은 테이블 순서만 바꾸면 LEFT JOIN 으로 쓸 수 있어 실무에서도 거의 LEFT JOIN 만 씁니다.

\`\`\`sql
-- 맨 처음 예제와 같은 결과. 남기고 싶은 customers 가 오른쪽에 있어 RIGHT JOIN
SELECT c.name, o.id AS order_id
FROM orders o
RIGHT JOIN customers c ON c.id = o.customer_id
ORDER BY c.id
LIMIT 15;
\`\`\`
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

직접 확인해 봅니다. "부하 직원이 없는 직원" 을 \`NOT IN\` 으로 찾으면 아무도 안 나옵니다. 대표의 \`manager_id\` 가 NULL 이라 목록에 NULL 이 섞였기 때문입니다.

\`\`\`sql
-- 0행
SELECT name, title FROM employees
WHERE id NOT IN (SELECT manager_id FROM employees);
\`\`\`

목록에서 NULL 을 빼면 제대로 나옵니다.

\`\`\`sql
SELECT name, title FROM employees
WHERE id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL);
\`\`\`

## 존재 여부 (EXISTS)

\`\`\`sql
-- 주문한 적 없는 고객 (LEFT JOIN ... IS NULL 과 같은 결과)
SELECT id, name FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
\`\`\`

바깥 쿼리의 \`c.id\` 를 안에서 참조하는 것을 **상관 서브쿼리**라고 합니다.

상관 서브쿼리는 바깥 행마다 한 번씩 실행된다고 생각하면 됩니다. SELECT 절에 넣으면 "각 행 옆에 관련 집계 붙이기" 가 됩니다.

\`\`\`sql
-- 고객마다 주문 수. 주문이 없으면 0
SELECT c.name,
       (SELECT count(*) FROM orders o WHERE o.customer_id = c.id) AS orders
FROM customers c
ORDER BY orders DESC
LIMIT 8;
\`\`\`

"그룹마다 최댓값을 가진 행" 도 상관 서브쿼리로 구할 수 있습니다.

\`\`\`sql
-- 카테고리마다 가장 비싼 상품
SELECT category, name, price
FROM products p
WHERE price = (SELECT max(price) FROM products WHERE category = p.category)
ORDER BY price DESC;
\`\`\`

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

\`WITH\` 는 쉼표로 여러 개를 이어 쓸 수 있고, 뒤의 것이 앞의 것을 참조할 수 있습니다. 긴 조회를 단계별로 나눠 적는 방법입니다.

\`\`\`sql
-- 평균보다 많이 산 고객
WITH totals AS (
  SELECT o.customer_id, sum(oi.quantity * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.customer_id
),
average AS (
  SELECT avg(total) AS avg_total FROM totals
)
SELECT c.name, t.total, round(a.avg_total) AS avg_total
FROM totals t
JOIN customers c ON c.id = t.customer_id
JOIN average a
WHERE t.total > a.avg_total
ORDER BY t.total DESC;
\`\`\`

\`JOIN average a\` 처럼 ON 없이 붙이면 모든 행에 그 한 행이 붙습니다(행이 하나뿐인 결과를 옆에 붙일 때 쓰는 방법).
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

차이를 직접 봅니다. 학생의 전공 이름과 과목의 개설 학과 이름을 합치면, \`UNION\` 은 겹치는 이름을 한 번만 남깁니다.

\`\`\`sql
SELECT major AS name FROM students
UNION
SELECT department FROM courses;
\`\`\`

결과 열 이름은 **첫 번째 SELECT** 의 것을 따릅니다. 열 개수가 다르면 실행되지 않습니다.

\`\`\`sql
-- 에러: 위는 열이 2개, 아래는 1개
SELECT name, city FROM customers
UNION ALL
SELECT name FROM students;
\`\`\`

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

## 합계 행 붙이기

그룹별 결과 아래에 전체 합계를 한 줄 붙일 때 \`UNION ALL\` 을 자주 씁니다.

\`\`\`sql
SELECT category, count(*) AS products, sum(stock) AS stock
FROM products
GROUP BY category
UNION ALL
SELECT '전체', count(*), sum(stock)
FROM products;
\`\`\`
`,
    },
  ],
}
