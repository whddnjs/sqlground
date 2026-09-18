import type { Chapter } from '../types'

export const ADVANCED: Chapter = {
  id: 'advanced',
  title: '한 걸음 더',
  lessons: [
    {
      id: 'window-functions',
      title: '윈도우 함수',
      keywords: ['윈도우 함수', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', '누적합', '순위'],
      body: `
집계 함수는 여러 행을 **하나로 합칩니다**. 윈도우 함수는 행을 합치지 않고, **각 행 옆에** 집계 결과를 붙입니다.
"부서별 평균 급여를 각 직원 옆에 보여 줘" 같은 요구가 딱 이겁니다.

회사 샘플의 \`employees\` 를 씁니다.

\`\`\`sql
SELECT name, department_id, salary,
       avg(salary) OVER (PARTITION BY department_id) AS dept_avg,
       salary - avg(salary) OVER (PARTITION BY department_id) AS diff
FROM employees
ORDER BY department_id, salary DESC;
\`\`\`

- \`OVER (...)\` 가 붙으면 윈도우 함수입니다.
- \`PARTITION BY 열\`: 그룹을 나눕니다. GROUP BY 와 비슷하지만 행이 합쳐지지 않습니다.
- 생략하면 전체가 하나의 그룹입니다.

## 순위: ROW_NUMBER, RANK, DENSE_RANK

\`\`\`sql
SELECT name, department_id, salary,
       row_number() OVER (PARTITION BY department_id ORDER BY salary DESC) AS row_num,
       rank()       OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk,
       dense_rank() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dense
FROM employees
WHERE department_id IS NOT NULL
ORDER BY department_id, salary DESC;
\`\`\`

| 함수 | 동점일 때 |
|---|---|
| \`row_number()\` | 무조건 1, 2, 3… (동점도 다른 번호) |
| \`rank()\` | 같은 순위, 다음 순위는 건너뜀 (1, 1, 3) |
| \`dense_rank()\` | 같은 순위, 건너뛰지 않음 (1, 1, 2) |

## "부서별 최고 연봉자" 구하기

윈도우 함수는 WHERE 에서 바로 쓸 수 없습니다. 서브쿼리나 WITH 로 한 번 감싸고 거릅니다.

\`\`\`sql
WITH ranked AS (
  SELECT e.name, d.name AS department, e.salary,
         row_number() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rn
  FROM employees e
  JOIN departments d ON d.id = e.department_id
)
SELECT department, name, salary
FROM ranked
WHERE rn = 1
ORDER BY salary DESC;
\`\`\`

이 패턴("그룹별 상위 N개")은 실무에서 정말 자주 씁니다. GROUP BY 로는 깔끔하게 안 되는 문제입니다.

\`rn = 1\` 을 \`rn <= 2\` 로 바꾸면 "그룹별 상위 2개" 가 됩니다. 쇼핑몰 샘플로 해 봅니다.

\`\`\`sql
-- 카테고리마다 비싼 상품 2개
WITH ranked AS (
  SELECT category, name, price,
         row_number() OVER (PARTITION BY category ORDER BY price DESC) AS rn
  FROM products
)
SELECT category, rn, name, price
FROM ranked
WHERE rn <= 2
ORDER BY category, rn;
\`\`\`

## 누적합과 이동 평균

\`ORDER BY\` 를 넣으면 "여기까지의" 집계가 됩니다.

\`\`\`sql
SELECT strftime('%Y-%m', o.ordered_at) AS month,
       sum(oi.quantity * oi.unit_price) AS revenue,
       sum(sum(oi.quantity * oi.unit_price)) OVER (ORDER BY strftime('%Y-%m', o.ordered_at)) AS cumulative
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY month
ORDER BY month;
\`\`\`

\`sum(sum(...)) OVER\` 가 낯설 텐데, 안쪽 sum 은 GROUP BY 집계이고 바깥 sum 은 그 결과를 누적하는 윈도우 함수입니다.

범위를 직접 정할 수도 있습니다. \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\` 는 "앞의 두 행부터 지금 행까지" 라서 3개월 이동 평균이 됩니다.

\`\`\`sql
WITH monthly AS (
  SELECT strftime('%Y-%m', o.ordered_at) AS month,
         sum(oi.quantity * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY month
)
SELECT month, revenue,
       round(avg(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)) AS moving_avg_3m
FROM monthly
ORDER BY month;
\`\`\`

## 전체에서 차지하는 비율

\`OVER ()\` 처럼 괄호를 비우면 전체가 한 그룹입니다. 각 행의 값을 전체 합으로 나누면 비율이 됩니다.

\`\`\`sql
SELECT category,
       sum(price * stock) AS stock_value,
       round(100.0 * sum(price * stock) / sum(sum(price * stock)) OVER (), 1) AS percent
FROM products
GROUP BY category
ORDER BY percent DESC;
\`\`\`

## 앞뒤 행 참조: LAG, LEAD

전월 대비 증감처럼 "바로 앞 행의 값" 이 필요할 때 씁니다.

\`\`\`sql
WITH monthly AS (
  SELECT strftime('%Y-%m', o.ordered_at) AS month,
         sum(oi.quantity * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY month
)
SELECT month, revenue,
       lag(revenue) OVER (ORDER BY month) AS prev_month,
       revenue - lag(revenue) OVER (ORDER BY month) AS change
FROM monthly
ORDER BY month;
\`\`\`

첫 행의 \`prev_month\` 는 앞 행이 없어 NULL 입니다. \`lag(revenue, 1, 0)\` 처럼 세 번째 인자로 기본값을 줄 수 있습니다.

\`lead\` 는 반대로 **다음 행**을 봅니다. 고객별로 다음 주문까지 며칠이 걸렸는지 구합니다.

\`\`\`sql
SELECT customer_id, ordered_at,
       lead(ordered_at) OVER (PARTITION BY customer_id ORDER BY ordered_at) AS next_order,
       CAST(julianday(lead(ordered_at) OVER (PARTITION BY customer_id ORDER BY ordered_at))
            - julianday(ordered_at) AS INTEGER) AS days_gap
FROM orders
WHERE customer_id IN (9, 13)
ORDER BY customer_id, ordered_at;
\`\`\`

고객의 마지막 주문은 다음 행이 없어 NULL 입니다.

> 윈도우 함수는 SQLite 3.25 이상, MySQL 8.0 이상, PostgreSQL 전 버전에서 지원합니다. 문법은 거의 같습니다.
`,
    },
    {
      id: 'self-join-recursive',
      title: '자기 참조와 재귀 CTE',
      keywords: ['self join', '자기 참조', '계층', 'WITH RECURSIVE', '재귀', '조직도', 'manager'],
      body: `
\`employees.manager_id\` 는 **같은 테이블**의 \`id\` 를 가리킵니다. 직원의 상사도 직원이니까요.
이런 구조를 **자기 참조**라고 하고, 조직도·댓글의 답글·카테고리 트리가 모두 이 모양입니다.

\`\`\`sql
SELECT id, name, title, manager_id FROM employees ORDER BY id;
\`\`\`

## 자기 자신과 JOIN (self join)

"각 직원과 그 상사의 이름" 은 같은 테이블을 두 번 JOIN 합니다. 별칭이 필수입니다.

\`\`\`sql
SELECT e.name AS employee, e.title, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;
\`\`\`

\`e\` 는 직원 역할, \`m\` 은 상사 역할입니다. 대표는 상사가 없으니(\`manager_id\` NULL) LEFT JOIN 이어야 빠지지 않습니다.

## 상사별 부하 직원 수

\`\`\`sql
SELECT m.name AS manager, count(e.id) AS reports
FROM employees m
JOIN employees e ON e.manager_id = m.id
GROUP BY m.id
ORDER BY reports DESC;
\`\`\`

## 두 단계 위까지

한 단계는 JOIN 한 번, 두 단계는 두 번… 깊이가 정해져 있으면 JOIN 을 반복하면 됩니다.

\`\`\`sql
SELECT e.name, m1.name AS manager, m2.name AS managers_manager
FROM employees e
LEFT JOIN employees m1 ON m1.id = e.manager_id
LEFT JOIN employees m2 ON m2.id = m1.manager_id
WHERE e.title LIKE '%주니어%' OR e.title = '인턴';
\`\`\`

## 깊이를 모를 때: 재귀 CTE

조직이 몇 단계인지 모르거나 "대표 아래 전체 조직도" 를 뽑으려면 **재귀 CTE** 를 씁니다.

\`\`\`sql
WITH RECURSIVE org(id, name, title, depth, path) AS (
  -- 시작점: 상사가 없는 사람 (대표)
  SELECT id, name, title, 0, name
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- 반복: 직전 결과에 있는 사람을 상사로 둔 직원을 한 단계씩 추가
  SELECT e.id, e.name, e.title, o.depth + 1, o.path || ' > ' || e.name
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT depth, substr('        ', 1, depth * 2) || name AS org_chart, title, path
FROM org
ORDER BY path;
\`\`\`

구조는 항상 같습니다.

1. **기준 행**: 재귀를 시작할 행 (여기서는 대표)
2. \`UNION ALL\`
3. **재귀 행**: CTE 자기 자신(\`org\`)과 JOIN 해 다음 단계를 만드는 SELECT

새 행이 안 나올 때까지 3번을 반복합니다. \`depth\` 나 \`path\` 같은 열을 같이 끌고 가면 결과를 정렬하고 들여쓰기하기 좋습니다.

## 특정 사람 아래 전체 인원

\`\`\`sql
WITH RECURSIVE team(id) AS (
  SELECT id FROM employees WHERE name = '김개발'
  UNION ALL
  SELECT e.id FROM employees e JOIN team t ON e.manager_id = t.id
)
SELECT count(*) - 1 AS total_reports   -- 본인 제외
FROM team;
\`\`\`

## 아래에서 위로: 상사 체인

방향을 뒤집으면 한 사람에서 출발해 대표까지 올라갑니다. JOIN 조건의 좌우만 바뀝니다.

\`\`\`sql
WITH RECURSIVE chain(id, name, title, manager_id, step) AS (
  SELECT id, name, title, manager_id, 0
  FROM employees
  WHERE name = '한주니'

  UNION ALL

  SELECT m.id, m.name, m.title, m.manager_id, c.step + 1
  FROM employees m
  JOIN chain c ON m.id = c.manager_id
)
SELECT step, name, title FROM chain ORDER BY step;
\`\`\`

## 재귀로 날짜 목록 만들기

재귀 CTE 는 계층 데이터가 없어도 씁니다. 연속된 숫자나 날짜를 만들어 두고 LEFT JOIN 하면 **데이터가 없는 날도 0 으로** 보여 줄 수 있습니다.

\`\`\`sql
WITH RECURSIVE days(day) AS (
  SELECT '2024-11-10'
  UNION ALL
  SELECT date(day, '+1 day') FROM days WHERE day < '2024-11-20'
)
SELECT d.day, count(o.id) AS orders
FROM days d
LEFT JOIN orders o ON o.ordered_at = d.day
GROUP BY d.day
ORDER BY d.day;
\`\`\`

\`WHERE day < '2024-11-20'\` 이 재귀를 끝내는 조건입니다.

## 무한 루프 주의

데이터에 순환(A 의 상사가 B, B 의 상사가 A)이 있으면 재귀가 끝나지 않습니다.
SQLite 는 결과가 너무 커지면 멈추지만, 실무에서는 \`depth < 20\` 같은 조건을 재귀 행의 WHERE 에 넣어 안전장치를 두는 게 좋습니다.

\`\`\`sql
-- depth 조건으로 두 단계(대표, 팀장)까지만 내려갑니다
WITH RECURSIVE org(id, name, title, depth) AS (
  SELECT id, name, title, 0 FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.title, o.depth + 1
  FROM employees e
  JOIN org o ON e.manager_id = o.id
  WHERE o.depth < 1
)
SELECT depth, name, title FROM org ORDER BY depth, id;
\`\`\`

> \`WITH RECURSIVE\` 는 SQLite, PostgreSQL, MySQL 8.0 이상에서 같은 문법입니다.
`,
    },
  ],
}
