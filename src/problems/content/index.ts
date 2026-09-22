import type { Problem } from '../types'

/**
 * 단원마다 쉬움 → 보통 → 어려움 순으로 3문제. 개념 소개 단원과 결과 비교가 어려운 단원은 1~2문제.
 * 설명에는 결과 열을 순서대로 적는다. 답이 여러 개 나올 만한 문제에만 alternatives 를 단다.
 * 같은 단원 안에서는 이 파일의 순서가 곧 화면 순서다.
 * 파일 끝의 종합 문제(mixes)는 장마다 3문제, 보통 → 어려움 순이며 그 장의 단원 2개 이상을 섞는다.
 */
export const PROBLEMS: Problem[] = [
  // ── 시작하기 > 테이블, 행, 열
  {
    id: 'p-tables-1',
    lessonId: 'tables',
    title: '고객 테이블 통째로 보기',
    difficulty: 1,
    description: '`customers` 테이블의 **모든 열, 모든 행** 을 조회하세요.',
    answerSql: 'SELECT * FROM customers',
    hint: '`*` 는 "모든 열" 이라는 뜻입니다.',
  },
  {
    id: 'p-tables-2',
    lessonId: 'tables',
    title: '어떤 테이블이 있을까',
    difficulty: 2,
    description:
      '이 DB 에 들어 있는 **테이블 이름** 을 한 열로 조회하세요. SQLite 는 테이블 목록을 `sqlite_master` 라는 특별한 테이블에 두며, 그 안의 `type` 열이 `table` 인 행이 테이블입니다.\n\n결과 열: ① 테이블 이름(name)',
    answerSql: "SELECT name FROM sqlite_master WHERE type = 'table'",
    hint: "sqlite_master 에서 name 열만 고르고 WHERE type = 'table'.",
  },

  // ── 데이터 조회 > SELECT 기본
  {
    id: 'p-select-1',
    lessonId: 'select',
    title: '상품 이름과 가격',
    difficulty: 1,
    description: '`products` 테이블에서 **상품 이름과 가격** 두 열만 조회하세요.\n\n결과 열: ① 이름(name) ② 가격(price)',
    answerSql: 'SELECT name, price FROM products',
    hint: '필요한 열만 SELECT 뒤에 쉼표로 나열합니다.',
  },
  {
    id: 'p-select-2',
    lessonId: 'select',
    title: '카테고리 목록',
    difficulty: 2,
    description: '`products` 에 어떤 **카테고리** 가 있는지, 같은 값이 반복되지 않게 한 열로 조회하세요.\n\n결과 열: ① 카테고리(category)',
    answerSql: 'SELECT DISTINCT category FROM products',
    answerNote: 'DISTINCT 는 결과에서 똑같은 행을 하나로 합칩니다.',
    alternatives: [{ sql: 'SELECT category FROM products GROUP BY category', note: 'GROUP BY 로 묶어도 같은 결과입니다. 중복 제거만 필요하면 DISTINCT 가 의도를 더 잘 드러내고, 카테고리별 개수까지 세려면 GROUP BY 로 가야 합니다.' }],
    hint: 'DISTINCT 는 SELECT 바로 뒤에 씁니다.',
  },
  {
    id: 'p-select-3',
    lessonId: 'select',
    title: '재고 금액과 표시용 이름',
    difficulty: 3,
    description:
      '`products` 에서 상품마다 **"이름 (카테고리)"** 모양의 문자열과 **재고 금액** 을 조회하세요. 재고 금액은 가격 × 재고 수량입니다.\n\n결과 열: ① `무선 마우스 (전자기기)` 같은 문자열 ② 가격 × 재고',
    answerSql: "SELECT name || ' (' || category || ')' AS label, price * stock AS stock_value FROM products",
    hint: "문자열은 || 로 이어 붙이고, 열끼리는 * 로 곱합니다. 괄호와 공백은 작은따옴표 문자열 ' (' 로 넣습니다.",
  },

  // ── 데이터 조회 > WHERE
  {
    id: 'p-where-2',
    lessonId: 'where',
    title: '서울 또는 부산 고객',
    difficulty: 1,
    description: '`customers` 에서 도시가 **서울이거나 부산** 인 고객을 조회하세요.\n\n결과 열: ① 이름(name) ② 도시(city)',
    answerSql: "SELECT name, city FROM customers WHERE city IN ('서울', '부산')",
    answerNote: '같은 열을 여러 값과 비교할 때는 IN 이 짧고, 값이 늘어나도 목록에 추가만 하면 됩니다.',
    alternatives: [{ sql: "SELECT name, city FROM customers WHERE city = '서울' OR city = '부산'", note: 'OR 로 이어도 결과는 같습니다. 값이 두 개일 때는 비슷하지만 서너 개로 늘어나면 IN 쪽이 훨씬 읽기 쉽습니다.' }],
    hint: 'IN (...) 또는 OR 를 씁니다. 문자열은 작은따옴표로.',
  },
  {
    id: 'p-where-5',
    lessonId: 'where',
    title: 'SQL 을 좋아하는 직원',
    difficulty: 2,
    description: '`employees` 에서 자기소개(bio)에 **"SQL"** 이라는 글자가 들어 있는 직원을 조회하세요.\n\n결과 열: ① 이름(name) ② 직함(title)',
    answerSql: "SELECT name, title FROM employees WHERE bio LIKE '%SQL%'",
    hint: "LIKE 와 % 를 씁니다. 앞뒤 어디든 올 수 있으면 양쪽에 %. 예: '%SQL%'",
  },
  {
    id: 'p-where-6',
    lessonId: 'where',
    title: '조건 세 개 한꺼번에',
    difficulty: 3,
    description:
      '`products` 에서 아래 조건을 **모두** 만족하는 상품을 조회하세요.\n\n- 가격이 20,000 이상 50,000 이하\n- 카테고리가 전자기기 또는 사무용품\n- 재고가 1개 이상\n\n결과 열: ① 이름(name) ② 카테고리(category) ③ 가격(price)',
    answerSql: "SELECT name, category, price FROM products WHERE price BETWEEN 20000 AND 50000 AND category IN ('전자기기', '사무용품') AND stock > 0",
    alternatives: [
      {
        sql: "SELECT name, category, price FROM products WHERE price >= 20000 AND price <= 50000 AND (category = '전자기기' OR category = '사무용품') AND stock > 0",
        note: 'BETWEEN 과 IN 을 풀어 쓴 형태입니다. OR 를 AND 와 섞을 때는 괄호가 꼭 필요합니다. 괄호를 빼면 AND 가 먼저 계산돼 전혀 다른 결과가 나옵니다.',
      },
    ],
    hint: 'BETWEEN a AND b 는 양 끝을 포함합니다. "또는" 조건은 IN 으로 묶으면 괄호 걱정이 없습니다.',
  },

  // ── 데이터 조회 > 정렬과 개수 제한
  {
    id: 'p-order-1',
    lessonId: 'order-limit',
    title: '가장 비싼 상품 3개',
    difficulty: 1,
    orderMatters: true,
    description: '`products` 에서 **가장 비싼 상품 3개** 를 비싼 순서대로 조회하세요.\n\n결과 열: ① 이름(name) ② 가격(price)',
    answerSql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3',
    hint: 'ORDER BY ... DESC 로 내림차순 정렬한 뒤 LIMIT 3.',
  },
  {
    id: 'p-order-4',
    lessonId: 'order-limit',
    title: '카테고리별로 모아서, 비싼 것부터',
    difficulty: 2,
    orderMatters: true,
    description: '`products` 를 **카테고리 이름 순(가나다)** 으로 정렬하되, 같은 카테고리 안에서는 **비싼 상품이 먼저** 오게 조회하세요.\n\n결과 열: ① 카테고리(category) ② 이름(name) ③ 가격(price)',
    answerSql: 'SELECT category, name, price FROM products ORDER BY category, price DESC',
    hint: '정렬 기준을 쉼표로 나열합니다. 앞 기준이 같을 때 다음 기준을 봅니다. DESC 는 그 열에만 적용됩니다.',
  },
  {
    id: 'p-order-5',
    lessonId: 'order-limit',
    title: '가격 4위부터 6위까지',
    difficulty: 3,
    orderMatters: true,
    description: '`products` 에서 **가격이 네 번째로 비싼 상품부터 여섯 번째까지** 3개를 비싼 순서대로 조회하세요. 페이지 넘기기와 같은 원리입니다.\n\n결과 열: ① 이름(name) ② 가격(price)',
    answerSql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3',
    hint: 'OFFSET n 은 앞에서 n 개를 건너뜁니다. 1~3위를 건너뛰려면 OFFSET 3.',
  },

  // ── 데이터 조회 > NULL
  {
    id: 'p-null-1',
    lessonId: 'null',
    title: '성적이 없는 수강',
    difficulty: 1,
    description: '`enrollments` 는 "어느 학생이 어느 과목을 들었는지" 를 한 행씩 기록한 테이블입니다. 이 중 **아직 성적(score)이 비어 있는 기록이 몇 건인지** 숫자 하나로 조회하세요.\n\n결과 열: ① 건수',
    answerSql: 'SELECT count(*) FROM enrollments WHERE score IS NULL',
    hint: '= NULL 로는 찾을 수 없습니다. IS NULL 을 씁니다.',
  },
  {
    id: 'p-null-2',
    lessonId: 'null',
    title: 'NULL 을 0 으로',
    difficulty: 2,
    description: '`enrollments` 에서 **2024-2 학기** 수강 기록을 조회하되, 성적이 비어 있으면 **0** 으로 바꿔서 보여 주세요.\n\n결과 열: ① 수강 번호(id) ② 성적(비어 있으면 0)',
    answerSql: "SELECT id, coalesce(score, 0) FROM enrollments WHERE semester = '2024-2'",
    answerNote: 'COALESCE 는 앞에서부터 NULL 이 아닌 첫 값을 돌려주며 모든 DB 에서 통합니다.',
    alternatives: [{ sql: "SELECT id, ifnull(score, 0) FROM enrollments WHERE semester = '2024-2'", note: 'IFNULL 은 인자가 딱 두 개일 때 쓰는 짧은 형태입니다. SQLite 와 MySQL 에는 있지만 PostgreSQL 에는 없어서, 옮겨 다닐 코드라면 COALESCE 가 안전합니다.' }],
    hint: 'COALESCE(score, 0) 또는 IFNULL(score, 0).',
  },
  {
    id: 'p-null-3',
    lessonId: 'null',
    title: '평균이 두 가지로 나오는 이유',
    difficulty: 3,
    description:
      '`enrollments` 의 **2024-2 학기** 성적 평균을 두 가지로 구하세요. 하나는 성적이 빈 기록을 **빼고** 낸 평균, 다른 하나는 빈 성적을 **0 점으로 치고** 낸 평균입니다. 둘 다 소수 첫째 자리까지 반올림합니다.\n\n결과 열: ① 빈 성적을 뺀 평균 ② 빈 성적을 0 으로 친 평균',
    answerSql: "SELECT round(avg(score), 1), round(avg(coalesce(score, 0)), 1) FROM enrollments WHERE semester = '2024-2'",
    answerNote: 'AVG 는 NULL 을 알아서 건너뜁니다. 그래서 "0 점으로 친 평균" 을 원하면 COALESCE 로 직접 0 을 넣어 줘야 합니다.',
    hint: 'avg(score) 는 NULL 을 무시합니다. 0 으로 치려면 avg(coalesce(score, 0)). 반올림은 round(값, 1).',
  },

  // ── 데이터 조회 > 함수
  {
    id: 'p-func-2',
    lessonId: 'functions',
    title: '상품 이름의 글자 수',
    difficulty: 1,
    description: '`products` 에서 상품 이름과 **이름의 글자 수** 를 조회하세요.\n\n결과 열: ① 이름(name) ② 글자 수',
    answerSql: 'SELECT name, length(name) FROM products',
    hint: 'length(문자열) 은 글자 수를 돌려줍니다.',
  },
  {
    id: 'p-func-1',
    lessonId: 'functions',
    title: '가입 연도',
    difficulty: 2,
    description: '`customers` 의 가입일(joined_at)은 `2023-01-15` 같은 문자열입니다. 고객 이름과 **가입 연도 네 자리** 를 조회하세요.\n\n결과 열: ① 이름(name) ② 가입 연도(예: 2023)',
    answerSql: 'SELECT name, substr(joined_at, 1, 4) FROM customers',
    alternatives: [{ sql: "SELECT name, strftime('%Y', joined_at) FROM customers", note: '날짜 함수로 연도를 뽑는 방법입니다. 문자열 형식에 기대지 않아 더 안전하고, 월(%m)이나 요일(%w)도 같은 방식으로 뽑을 수 있습니다.' }],
    hint: "substr(joined_at, 1, 4) 는 첫 글자부터 네 글자. 날짜 함수로는 strftime('%Y', joined_at).",
  },
  {
    id: 'p-func-3',
    lessonId: 'functions',
    title: '이메일 아이디만',
    difficulty: 3,
    description: '`customers` 의 이메일은 모두 `@example.com` 으로 끝납니다. 고객 이름과, 이메일에서 **@ 앞부분(아이디)만** 조회하세요.\n\n결과 열: ① 이름(name) ② 아이디(예: minsu.kim)',
    answerSql: "SELECT name, replace(email, '@example.com', '') FROM customers",
    answerNote: '도메인이 모두 같다는 걸 알 때는 그 부분을 빈 문자열로 바꾸는 게 가장 짧습니다.',
    alternatives: [{ sql: "SELECT name, substr(email, 1, instr(email, '@') - 1) FROM customers", note: '도메인이 제각각이어도 되는 일반적인 방법입니다. instr 로 @ 의 위치를 찾고 그 앞까지만 잘라 냅니다.' }],
    hint: "replace(문자열, 찾을, 바꿀) 로 '@example.com' 을 '' 로 바꿉니다.",
  },

  // ── 데이터 조회 > CASE
  {
    id: 'p-case-3',
    lessonId: 'case',
    title: '재고 있음 / 품절',
    difficulty: 1,
    description: '`products` 에서 상품 이름과 함께, 재고가 0 이면 `품절`, 아니면 `재고 있음` 이라는 글자를 조회하세요.\n\n결과 열: ① 이름(name) ② `품절` 또는 `재고 있음`',
    answerSql: "SELECT name, CASE WHEN stock = 0 THEN '품절' ELSE '재고 있음' END FROM products",
    hint: "CASE WHEN 조건 THEN '값' ELSE '값' END.",
  },
  {
    id: 'p-case-1',
    lessonId: 'case',
    title: '가격대 분류',
    difficulty: 2,
    description: '`products` 의 상품마다 **가격대** 를 붙여 조회하세요. 100,000 이상이면 `고가`, 30,000 이상이면 `중가`, 나머지는 `저가` 입니다.\n\n결과 열: ① 이름(name) ② 가격대',
    answerSql: "SELECT name, CASE WHEN price >= 100000 THEN '고가' WHEN price >= 30000 THEN '중가' ELSE '저가' END FROM products",
    hint: 'WHEN 은 위에서부터 처음 맞는 것을 씁니다. 큰 값부터 검사하세요.',
  },
  {
    id: 'p-case-2',
    lessonId: 'case',
    title: '등급별로 몇 건인지',
    difficulty: 3,
    description:
      '`enrollments` 의 성적(score)을 **등급** 으로 바꾼 뒤, **등급마다 수강 기록이 몇 건인지** 세어 조회하세요. 등급이라는 열은 테이블에 없으니 CASE 로 직접 만들어야 합니다.\n\n- 90 이상 `A`, 80 이상 `B`, 70 이상 `C`, 그 미만 `F`\n- 성적이 비어 있는 기록은 세지 않습니다\n\n결과 열: ① 등급(A/B/C/F) ② 그 등급을 받은 기록의 건수',
    answerSql:
      "SELECT CASE WHEN score >= 90 THEN 'A' WHEN score >= 80 THEN 'B' WHEN score >= 70 THEN 'C' ELSE 'F' END AS grade, count(*) FROM enrollments WHERE score IS NOT NULL GROUP BY grade",
    hint: 'CASE 로 만든 등급에 AS grade 로 이름을 붙이고, 그 이름으로 GROUP BY 합니다. 빈 성적은 WHERE score IS NOT NULL 로 먼저 뺍니다.',
  },

  // ── 집계와 그룹 > 집계 함수
  {
    id: 'p-agg-2',
    lessonId: 'aggregate-functions',
    title: '배송완료 주문 수',
    difficulty: 1,
    description: '`orders` 에서 상태(status)가 **delivered** 인 주문이 몇 건인지 숫자 하나로 조회하세요.\n\n결과 열: ① 건수',
    answerSql: "SELECT count(*) FROM orders WHERE status = 'delivered'",
    hint: 'WHERE 로 거른 뒤 count(*).',
  },
  {
    id: 'p-agg-1',
    lessonId: 'aggregate-functions',
    title: '상품 가격 통계',
    difficulty: 2,
    description: '`products` 전체의 **평균 가격, 가장 비싼 가격, 가장 싼 가격** 을 한 행으로 조회하세요.\n\n결과 열: ① 평균 ② 최고 ③ 최저',
    answerSql: 'SELECT avg(price), max(price), min(price) FROM products',
    hint: 'avg, max, min 을 한 SELECT 에 나란히 씁니다.',
  },
  {
    id: 'p-agg-3',
    lessonId: 'aggregate-functions',
    title: '세는 방법 세 가지',
    difficulty: 3,
    description:
      '`enrollments` 의 **2024-2 학기** 기록에 대해 세 가지 숫자를 한 행으로 조회하세요.\n\n결과 열: ① 수강 기록 전체 건수 ② 성적이 입력된 기록의 건수 ③ 수강한 학생 수(같은 학생은 한 번만)',
    answerSql: "SELECT count(*), count(score), count(DISTINCT student_id) FROM enrollments WHERE semester = '2024-2'",
    answerNote: 'count(*) 는 행 수, count(열) 은 그 열이 NULL 이 아닌 행 수, count(DISTINCT 열) 은 서로 다른 값의 개수입니다.',
    hint: 'count(*), count(score), count(DISTINCT student_id).',
  },

  // ── 집계와 그룹 > GROUP BY
  {
    id: 'p-group-1',
    lessonId: 'group-by',
    title: '카테고리별 상품 수',
    difficulty: 1,
    description: '`products` 를 **카테고리별** 로 묶어 상품이 몇 개씩 있는지 조회하세요.\n\n결과 열: ① 카테고리(category) ② 상품 수',
    answerSql: 'SELECT category, count(*) FROM products GROUP BY category',
    hint: 'GROUP BY category 와 count(*).',
  },
  {
    id: 'p-group-2',
    lessonId: 'group-by',
    title: '3건 이상 주문한 고객',
    difficulty: 2,
    description: '`orders` 에서 **주문이 3건 이상인 고객** 만 골라 조회하세요.\n\n결과 열: ① 고객 번호(customer_id) ② 주문 수',
    answerSql: 'SELECT customer_id, count(*) FROM orders GROUP BY customer_id HAVING count(*) >= 3',
    answerNote: '묶은 뒤의 집계 결과로 거를 때는 WHERE 가 아니라 HAVING 입니다.',
    hint: '집계 결과 조건은 WHERE 에 쓸 수 없습니다. GROUP BY 뒤에 HAVING count(*) >= 3.',
  },
  {
    id: 'p-group-3',
    lessonId: 'group-by',
    title: '전공별 평균 성적',
    difficulty: 3,
    description: '`students` 와 `enrollments` 를 이어서 **전공(major)별 평균 성적** 을 조회하세요. 평균은 소수 첫째 자리까지 반올림하고, 성적이 빈 기록은 평균에서 빠집니다.\n\n결과 열: ① 전공(major) ② 평균 성적',
    answerSql: 'SELECT s.major, round(avg(e.score), 1) FROM students s JOIN enrollments e ON e.student_id = s.id GROUP BY s.major',
    hint: 'students 와 enrollments 를 student_id 로 JOIN 한 뒤 GROUP BY s.major. avg 는 NULL 을 알아서 무시합니다.',
  },

  // ── 여러 테이블 > JOIN
  {
    id: 'p-join-4',
    lessonId: 'join',
    title: '주문마다 고객 이름 붙이기',
    difficulty: 1,
    description: '`orders` 에는 고객 번호(customer_id)만 있고 이름은 `customers` 에 있습니다. 두 테이블을 이어서 **모든 주문** 을 조회하세요.\n\n결과 열: ① 주문 번호(orders.id) ② 고객 이름(customers.name)',
    answerSql: 'SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id',
    hint: 'FROM orders o JOIN customers c ON c.id = o.customer_id.',
  },
  {
    id: 'p-join-1',
    lessonId: 'join',
    title: '주문과 고객 이름',
    difficulty: 2,
    description: '**배송완료(delivered)** 된 주문만 골라 고객 이름과 함께 조회하세요.\n\n결과 열: ① 주문 번호(orders.id) ② 고객 이름(customers.name) ③ 주문일(ordered_at)',
    answerSql: "SELECT o.id, c.name, o.ordered_at FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'delivered'",
    hint: 'JOIN 한 뒤 WHERE o.status = ... 로 거릅니다.',
  },
  {
    id: 'p-join-2',
    lessonId: 'join',
    title: '고객별 총 구매액 상위 5명',
    difficulty: 3,
    orderMatters: true,
    description:
      '취소(cancelled)되지 않은 주문만 대상으로 **고객별 총 구매액** 을 구해, **구매액이 큰 순서로 5명** 을 조회하세요. 구매액은 주문 상품(`order_items`)의 수량 × 단가를 모두 더한 값입니다.\n\n결과 열: ① 고객 이름 ② 총 구매액',
    answerSql:
      "SELECT c.name, sum(oi.quantity * oi.unit_price) AS total FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY c.id ORDER BY total DESC LIMIT 5",
    hint: '세 테이블을 JOIN → WHERE status <> cancelled → GROUP BY 고객 → ORDER BY 합계 DESC → LIMIT 5.',
  },

  // ── 여러 테이블 > LEFT JOIN
  {
    id: 'p-leftjoin-3',
    lessonId: 'left-join',
    title: '직원과 부서 이름 (미배정 포함)',
    difficulty: 1,
    description: '**모든 직원** 을 부서 이름과 함께 조회하세요. 아직 부서가 없는 직원도 빠지면 안 되고, 그 직원의 부서 이름은 **NULL** 로 나와야 합니다.\n\n결과 열: ① 직원 이름 ② 부서 이름',
    answerSql: 'SELECT e.name, d.name FROM employees e LEFT JOIN departments d ON d.id = e.department_id',
    hint: '빠지면 안 되는 쪽(employees)을 왼쪽에 두고 LEFT JOIN.',
  },
  {
    id: 'p-leftjoin-1',
    lessonId: 'left-join',
    title: '주문 없는 고객',
    difficulty: 2,
    description: '**한 번도 주문하지 않은 고객** 을 조회하세요.\n\n결과 열: ① 고객 이름(name)',
    answerSql: 'SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL',
    answerNote: 'LEFT JOIN 으로 짝이 없는 고객은 주문 쪽 열이 NULL 이 됩니다. 그 행만 남기는 방식입니다.',
    alternatives: [
      { sql: 'SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)', note: '"이 고객의 주문이 하나도 없다" 를 그대로 옮긴 형태라 읽기 쉽습니다. 실무에서 가장 많이 쓰는 방식 중 하나입니다.' },
      { sql: 'SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)', note: '짧지만 함정이 있습니다. 서브쿼리 결과에 NULL 이 하나라도 섞이면 NOT IN 은 아무 행도 돌려주지 않습니다. 여기서는 customer_id 가 NOT NULL 이라 안전합니다.' },
    ],
    hint: 'LEFT JOIN 뒤 오른쪽 테이블의 열이 IS NULL 인 행만 남깁니다.',
  },
  {
    id: 'p-leftjoin-2',
    lessonId: 'left-join',
    title: '고객별 주문 수 (0 포함)',
    difficulty: 3,
    description: '**모든 고객** 에 대해 주문을 몇 번 했는지 조회하세요. 주문이 없는 고객도 빠지지 않고 **0** 으로 나와야 합니다.\n\n결과 열: ① 고객 이름 ② 주문 수',
    answerSql: 'SELECT c.name, count(o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id',
    answerNote: 'count(*) 는 짝이 없어 NULL 로 채워진 행도 1 로 셉니다. 오른쪽 테이블의 열(o.id)을 세야 0 이 나옵니다.',
    hint: 'LEFT JOIN 과 count(o.id). count(*) 를 쓰면 0 이 아니라 1 이 나옵니다.',
  },

  // ── 여러 테이블 > 서브쿼리
  {
    id: 'p-sub-4',
    lessonId: 'subquery',
    title: '가장 비싼 상품',
    difficulty: 1,
    description: '`products` 에서 **가격이 가장 높은 상품** 을 조회하세요.\n\n결과 열: ① 이름(name) ② 가격(price)',
    answerSql: 'SELECT name, price FROM products WHERE price = (SELECT max(price) FROM products)',
    answerNote: '최고가가 같은 상품이 여러 개여도 모두 나옵니다.',
    alternatives: [{ sql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 1', note: '더 짧지만 최고가 상품이 둘 이상이면 하나만 나옵니다. "가장 비싼 것들 전부" 가 필요하면 서브쿼리 쪽이 맞습니다.' }],
    hint: '괄호 안에서 max(price) 를 먼저 구하고, 그 값과 같은 행을 찾습니다.',
  },
  {
    id: 'p-sub-1',
    lessonId: 'subquery',
    title: '평균보다 비싼 상품',
    difficulty: 2,
    description: '`products` 에서 **전체 평균 가격보다 비싼 상품** 을 조회하세요.\n\n결과 열: ① 이름(name) ② 가격(price)',
    answerSql: 'SELECT name, price FROM products WHERE price > (SELECT avg(price) FROM products)',
    hint: 'WHERE price > (SELECT avg(price) FROM products).',
  },
  {
    id: 'p-sub-2',
    lessonId: 'subquery',
    title: '도서를 산 고객',
    difficulty: 3,
    description: '**도서 카테고리 상품을 한 번이라도 주문한 고객** 을, 같은 이름이 반복되지 않게 조회하세요.\n\n결과 열: ① 고객 이름(name)',
    answerSql:
      "SELECT name FROM customers WHERE id IN (SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.category = '도서')",
    answerNote: 'IN 은 목록에 있기만 하면 되므로 같은 고객이 도서를 여러 번 샀어도 한 번만 나옵니다.',
    alternatives: [
      {
        sql: "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.category = '도서'",
        note: '전부 JOIN 으로 이어도 됩니다. 다만 JOIN 은 짝마다 행을 만들기 때문에 같은 고객이 여러 번 나와 DISTINCT 가 필요합니다.',
      },
      {
        sql: "SELECT name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.customer_id = c.id AND p.category = '도서')",
        note: 'EXISTS 는 조건에 맞는 행을 하나만 찾으면 멈춥니다. 데이터가 많을 때 IN 보다 빠른 경우가 많습니다.',
      },
    ],
    hint: 'IN 서브쿼리 안에서 orders → order_items → products 를 JOIN 해 customer_id 목록을 만듭니다.',
  },

  // ── 여러 테이블 > UNION
  {
    id: 'p-union-2',
    lessonId: 'union',
    title: '두 목록을 위아래로',
    difficulty: 1,
    description: '**서울에 사는 고객의 이름** 과 **컴퓨터공학 전공 학생의 이름** 을 한 목록으로 이어 붙여 조회하세요.\n\n결과 열: ① 이름',
    answerSql: "SELECT name FROM customers WHERE city = '서울' UNION ALL SELECT name FROM students WHERE major = '컴퓨터공학'",
    hint: '두 SELECT 사이에 UNION ALL. 양쪽의 열 개수가 같아야 합니다.',
  },
  {
    id: 'p-union-1',
    lessonId: 'union',
    title: '두 학기 모두 수강한 학생',
    difficulty: 2,
    description: '`enrollments` 에서 **2024-1 학기와 2024-2 학기에 모두 수강한 학생** 을 조회하세요.\n\n결과 열: ① 학생 번호(student_id)',
    answerSql: "SELECT student_id FROM enrollments WHERE semester = '2024-1' INTERSECT SELECT student_id FROM enrollments WHERE semester = '2024-2'",
    answerNote: 'INTERSECT 는 두 결과에 모두 있는 행만 남깁니다.',
    alternatives: [{ sql: 'SELECT student_id FROM enrollments GROUP BY student_id HAVING count(DISTINCT semester) = 2', note: '학생별로 묶어 "수강한 학기가 두 가지" 인지 세는 방법입니다. INTERSECT 가 없는 옛 MySQL 에서도 쓸 수 있고, 학기가 세 개 이상으로 늘어나도 숫자만 바꾸면 됩니다.' }],
    hint: 'INTERSECT. 또는 GROUP BY student_id HAVING count(DISTINCT semester) = 2.',
  },
  {
    id: 'p-union-3',
    lessonId: 'union',
    title: '배송완료가 한 번도 없는 고객',
    difficulty: 3,
    description:
      '**배송완료(delivered)된 주문이 한 번도 없는 고객** 의 이름을 조회하세요. 주문을 아예 안 한 고객도, 주문은 했지만 아직 배송완료가 없는 고객도 포함됩니다. "전체 고객 번호" 에서 "배송완료 주문이 있는 고객 번호" 를 빼는 방식으로 풀어 보세요.\n\n결과 열: ① 고객 이름(name)',
    answerSql: "SELECT name FROM customers WHERE id IN (SELECT id FROM customers EXCEPT SELECT customer_id FROM orders WHERE status = 'delivered')",
    answerNote: 'EXCEPT 는 앞 결과에서 뒤 결과에 있는 행을 뺍니다. 두 SELECT 의 열 개수가 같아야 합니다.',
    alternatives: [
      {
        sql: "SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'delivered')",
        note: '집합 연산 없이 "이 고객의 배송완료 주문이 없다" 를 그대로 쓴 형태입니다. 실무에서는 이쪽을 더 자주 봅니다.',
      },
    ],
    hint: 'SELECT id FROM customers EXCEPT SELECT customer_id FROM orders WHERE status = ... 로 번호를 구한 뒤 이름을 찾습니다.',
  },

  // ── 데이터 변경과 구조 > CREATE TABLE
  {
    id: 'p-create-2',
    lessonId: 'create-table',
    title: '태그 테이블 만들기',
    difficulty: 1,
    description: '`tags` 라는 테이블을 만드세요.\n\n- `id` INTEGER, 기본키\n- `name` TEXT',
    answerSql: 'CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT)',
    checkSql: `SELECT name, upper(type), pk FROM pragma_table_info('tags')`,
    orderMatters: true,
    hint: 'CREATE TABLE tags (열이름 타입 제약, ...).',
  },
  {
    id: 'p-create-1',
    lessonId: 'create-table',
    title: '할 일 테이블 만들기',
    difficulty: 2,
    description: '`todos` 테이블을 만드세요.\n\n- `id` INTEGER, 기본키\n- `title` TEXT, 비워 둘 수 없음(NOT NULL)\n- `done` INTEGER, 비워 둘 수 없음, 넣지 않으면 0',
    answerSql: 'CREATE TABLE todos (id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)',
    checkSql: `SELECT name, upper(type), "notnull", dflt_value, pk FROM pragma_table_info('todos')`,
    orderMatters: true,
    hint: '제약은 타입 뒤에 이어서 씁니다. 기본값은 DEFAULT 0.',
  },
  {
    id: 'p-create-3',
    lessonId: 'create-table',
    title: '상품 리뷰 테이블 (외래키 포함)',
    difficulty: 3,
    description:
      '`reviews` 테이블을 만드세요.\n\n- `id` INTEGER, 기본키\n- `product_id` INTEGER, 비워 둘 수 없음, `products` 의 `id` 를 참조하는 외래키\n- `rating` INTEGER, 비워 둘 수 없음\n- `body` TEXT',
    answerSql: 'CREATE TABLE reviews (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id), rating INTEGER NOT NULL, body TEXT)',
    checkSql: `SELECT name, upper(type), "notnull", pk FROM pragma_table_info('reviews') UNION ALL SELECT 'FK: ' || "from", "table" || '.' || "to", 0, 0 FROM pragma_foreign_key_list('reviews')`,
    hint: '외래키는 열 정의 끝에 REFERENCES products(id).',
  },

  // ── 데이터 변경과 구조 > INSERT
  {
    id: 'p-insert-1',
    lessonId: 'insert',
    title: '새 상품 추가',
    difficulty: 1,
    description: "`products` 에 상품을 하나 추가하세요. 이름 **'무선 충전기'**, 카테고리 **'전자기기'**, 가격 **29000**, 재고 **40**. 상품 번호(id)는 비워 두면 자동으로 매겨집니다.",
    answerSql: "INSERT INTO products (name, category, price, stock) VALUES ('무선 충전기', '전자기기', 29000, 40)",
    checkSql: "SELECT name, category, price, stock FROM products WHERE name = '무선 충전기'",
    hint: 'INSERT INTO products (열 목록) VALUES (값 목록). 열과 값의 순서를 맞춥니다.',
  },
  {
    id: 'p-insert-2',
    lessonId: 'insert',
    title: '부서 두 개 한 번에 추가',
    difficulty: 2,
    description: "`departments` 에 **'재무'** 와 **'법무'** 부서를 **문장 하나로** 추가하세요. 근무지(location)는 둘 다 **'서울 본사 2층'** 입니다.",
    answerSql: "INSERT INTO departments (name, location) VALUES ('재무', '서울 본사 2층'), ('법무', '서울 본사 2층')",
    checkSql: 'SELECT name, location FROM departments',
    hint: 'VALUES 뒤에 괄호 묶음을 쉼표로 여러 개 적습니다.',
  },
  {
    id: 'p-insert-3',
    lessonId: 'insert',
    title: '조회 결과를 그대로 추가',
    difficulty: 3,
    description:
      "가격이 100,000 이상인 **전자기기** 를 리퍼 상품으로 다시 등록하려 합니다. 해당 상품마다 이름 뒤에 **' (리퍼)'** 를 붙이고, 가격은 **원래의 70%**, 재고는 **5**, 카테고리는 그대로 해서 `products` 에 추가하세요. 값을 하나씩 적지 말고 조회 결과를 그대로 넣는 방식으로 작성합니다.",
    answerSql: "INSERT INTO products (name, category, price, stock) SELECT name || ' (리퍼)', category, price * 0.7, 5 FROM products WHERE category = '전자기기' AND price >= 100000",
    checkSql: "SELECT name, category, price, stock FROM products WHERE name LIKE '%(리퍼)'",
    hint: 'INSERT INTO ... (열 목록) 뒤에 VALUES 대신 SELECT 문을 씁니다.',
  },

  // ── 데이터 변경과 구조 > UPDATE / DELETE
  {
    id: 'p-update-1',
    lessonId: 'update-delete',
    title: '품절 상품 재입고',
    difficulty: 1,
    description: '`products` 에서 **재고(stock)가 0 인 상품** 만 골라 재고를 **100** 으로 바꾸세요. 다른 상품은 그대로여야 합니다.',
    answerSql: 'UPDATE products SET stock = 100 WHERE stock = 0',
    checkSql: 'SELECT id, stock FROM products',
    hint: 'UPDATE ... SET ... WHERE. WHERE 를 빼먹으면 모든 상품이 100 이 됩니다.',
  },
  {
    id: 'p-update-2',
    lessonId: 'update-delete',
    title: '도서 10% 할인',
    difficulty: 2,
    description: '`products` 에서 카테고리가 **도서** 인 상품의 가격을 **지금 가격의 90%** 로 내리세요.',
    answerSql: "UPDATE products SET price = price * 0.9 WHERE category = '도서'",
    checkSql: 'SELECT id, price FROM products',
    hint: 'SET price = price * 0.9 처럼 기존 값을 이용해 새 값을 만들 수 있습니다.',
  },
  {
    id: 'p-delete-2',
    lessonId: 'update-delete',
    title: '취소 주문 정리',
    difficulty: 3,
    description:
      '**취소된(cancelled) 주문** 을 `orders` 에서 삭제하세요. 그런데 그 주문에 딸린 `order_items` 가 남아 있으면 외래키 제약 때문에 삭제가 거부됩니다. **주문 상품을 먼저 지우고 주문을 지우는** 두 문장을 순서대로 작성하세요.',
    answerSql: "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled'); DELETE FROM orders WHERE status = 'cancelled'",
    checkSql: 'SELECT (SELECT count(*) FROM orders), (SELECT count(*) FROM order_items)',
    hint: '자식(order_items)부터 지웁니다. 대상은 order_id IN (SELECT id FROM orders WHERE status = ...) 로 고릅니다.',
  },

  // ── 데이터 변경과 구조 > ALTER / DROP
  {
    id: 'p-alter-1',
    lessonId: 'alter-drop',
    title: '전화번호 컬럼 추가',
    difficulty: 1,
    description: '`customers` 테이블에 **`phone`** 이라는 **TEXT** 열을 추가하세요.',
    answerSql: 'ALTER TABLE customers ADD COLUMN phone TEXT',
    checkSql: "SELECT name, upper(type) FROM pragma_table_info('customers')",
    orderMatters: true,
    hint: 'ALTER TABLE 테이블 ADD COLUMN 이름 타입.',
  },
  {
    id: 'p-alter-2',
    lessonId: 'alter-drop',
    title: '컬럼 이름 바꾸기',
    difficulty: 2,
    description: '`customers` 테이블의 **`city`** 열 이름을 **`region`** 으로 바꾸세요. 데이터는 그대로 남아야 합니다.',
    answerSql: 'ALTER TABLE customers RENAME COLUMN city TO region',
    checkSql: "SELECT name FROM pragma_table_info('customers')",
    orderMatters: true,
    hint: 'ALTER TABLE 테이블 RENAME COLUMN 옛이름 TO 새이름.',
  },
  {
    id: 'p-alter-3',
    lessonId: 'alter-drop',
    title: '할인율 열을 추가하고 채우기',
    difficulty: 3,
    description:
      '`products` 에 **`discount_rate`** 라는 REAL 열을 추가하세요. 비워 둘 수 없고 기본값은 **0** 입니다. 그다음 **도서** 카테고리 상품만 할인율을 **0.1** 로 바꾸세요. 두 문장입니다.',
    answerSql: "ALTER TABLE products ADD COLUMN discount_rate REAL NOT NULL DEFAULT 0; UPDATE products SET discount_rate = 0.1 WHERE category = '도서'",
    checkSql: 'SELECT id, discount_rate FROM products',
    hint: '이미 행이 있는 테이블에 NOT NULL 열을 추가하려면 DEFAULT 가 꼭 필요합니다.',
  },

  // ── 데이터 변경과 구조 > 외래키
  {
    id: 'p-fk-1',
    lessonId: 'foreign-key',
    title: '실제로 있는 고객의 주문 추가',
    difficulty: 1,
    description: "`orders` 에 주문을 하나 추가하세요. 고객 번호 **1**, 주문일 **'2024-12-01'**, 상태 **'paid'**. 없는 고객 번호를 넣으면 외래키 제약으로 거부됩니다.",
    answerSql: "INSERT INTO orders (customer_id, ordered_at, status) VALUES (1, '2024-12-01', 'paid')",
    checkSql: "SELECT customer_id, ordered_at, status FROM orders WHERE ordered_at = '2024-12-01'",
    hint: 'customer_id 에는 customers 에 실제로 있는 번호를 넣어야 합니다.',
  },
  {
    id: 'p-fk-2',
    lessonId: 'foreign-key',
    title: '글을 지우면 댓글도 함께',
    difficulty: 2,
    description:
      '`posts` 와 `comments` 두 테이블을 만드세요. 글이 삭제되면 그 글의 댓글도 **자동으로 함께 삭제** 되도록 외래키에 옵션을 걸어야 합니다.\n\n- `posts`: `id` INTEGER 기본키, `title` TEXT\n- `comments`: `id` INTEGER 기본키, `post_id` INTEGER (posts.id 참조, 글 삭제 시 함께 삭제), `body` TEXT',
    answerSql: 'CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT); CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE, body TEXT)',
    checkSql: `SELECT "table", "from", "to", on_delete FROM pragma_foreign_key_list('comments')`,
    hint: 'REFERENCES posts(id) 뒤에 ON DELETE CASCADE.',
  },
  {
    id: 'p-fk-3',
    lessonId: 'foreign-key',
    title: '고객과 그 흔적을 모두 지우기',
    difficulty: 3,
    description:
      '고객 번호 **9** 번을 `customers` 에서 삭제하세요. 이 고객의 주문과 주문 상품이 남아 있으면 삭제가 거부되므로, **참조하는 쪽부터 차례로** 지워야 합니다. 세 문장입니다.',
    answerSql:
      'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = 9); DELETE FROM orders WHERE customer_id = 9; DELETE FROM customers WHERE id = 9',
    checkSql: 'SELECT (SELECT count(*) FROM customers), (SELECT count(*) FROM orders), (SELECT count(*) FROM order_items)',
    hint: '순서: order_items → orders → customers. 맨 아래 자식부터 지웁니다.',
  },

  // ── 데이터 변경과 구조 > 트랜잭션
  {
    id: 'p-tx-1',
    lessonId: 'transaction',
    title: '재고를 한 묶음으로 옮기기',
    difficulty: 2,
    description:
      "**'무선 마우스'** 의 재고를 10 줄이고 **'기계식 키보드'** 의 재고를 10 늘리세요. 둘 중 하나만 반영되는 일이 없도록 **하나의 트랜잭션** 으로 묶어 확정(COMMIT)까지 합니다.",
    answerSql: "BEGIN; UPDATE products SET stock = stock - 10 WHERE name = '무선 마우스'; UPDATE products SET stock = stock + 10 WHERE name = '기계식 키보드'; COMMIT",
    checkSql: "SELECT name, stock FROM products WHERE name IN ('무선 마우스', '기계식 키보드')",
    hint: 'BEGIN; 으로 시작해 두 UPDATE 를 쓰고 COMMIT; 으로 끝냅니다.',
  },

  // ── 데이터 변경과 구조 > 뷰와 인덱스
  {
    id: 'p-view-1',
    lessonId: 'view-index',
    title: '고가 상품 뷰',
    difficulty: 1,
    description: '가격이 100,000 이상인 상품의 이름과 가격만 보여 주는 **`expensive_products`** 라는 뷰를 만드세요.\n\n뷰의 열: ① 이름(name) ② 가격(price)',
    answerSql: 'CREATE VIEW expensive_products AS SELECT name, price FROM products WHERE price >= 100000',
    checkSql: 'SELECT * FROM expensive_products',
    hint: 'CREATE VIEW 이름 AS SELECT ....',
  },
  {
    id: 'p-index-1',
    lessonId: 'view-index',
    title: '주문 상태로 빨리 찾기',
    difficulty: 2,
    description: '`orders` 를 상태(status)로 자주 검색한다고 합니다. `status` 열에 **`idx_orders_status`** 라는 이름의 인덱스를 만드세요.',
    answerSql: 'CREATE INDEX idx_orders_status ON orders(status)',
    checkSql: "SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name = 'idx_orders_status'",
    hint: 'CREATE INDEX 인덱스이름 ON 테이블(열).',
  },

  // ── 한 걸음 더 > 윈도우 함수
  {
    id: 'p-window-2',
    lessonId: 'window-functions',
    title: '전체 연봉 순위',
    difficulty: 1,
    description: '`employees` 의 모든 직원에게 **연봉이 높은 순으로 순위** 를 매겨 조회하세요. 연봉이 같으면 같은 순위입니다.\n\n결과 열: ① 이름(name) ② 연봉(salary) ③ 순위',
    answerSql: 'SELECT name, salary, rank() OVER (ORDER BY salary DESC) FROM employees',
    hint: 'rank() OVER (ORDER BY salary DESC).',
  },
  {
    id: 'p-window-3',
    lessonId: 'window-functions',
    title: '부서 평균을 각자 옆에',
    difficulty: 2,
    description: '부서가 있는 직원마다 **자기 부서의 평균 연봉** 을 옆에 붙여 조회하세요. 평균은 정수로 반올림합니다. 직원 행이 하나로 합쳐지면 안 됩니다.\n\n결과 열: ① 이름(name) ② 연봉(salary) ③ 소속 부서의 평균 연봉',
    answerSql: 'SELECT name, salary, round(avg(salary) OVER (PARTITION BY department_id)) FROM employees WHERE department_id IS NOT NULL',
    answerNote: 'GROUP BY 는 행을 합치지만, OVER (PARTITION BY ...) 는 행을 그대로 둔 채 그룹의 집계값만 옆에 붙입니다.',
    hint: 'avg(salary) OVER (PARTITION BY department_id).',
  },
  {
    id: 'p-window-1',
    lessonId: 'window-functions',
    title: '부서별 최고 연봉자',
    difficulty: 3,
    description: '**부서마다 연봉이 가장 높은 직원 한 명씩** 을 조회하세요. 부서가 없는 직원은 제외합니다.\n\n결과 열: ① 부서 이름 ② 직원 이름 ③ 연봉',
    answerSql:
      'WITH r AS (SELECT d.name AS dept, e.name, e.salary, row_number() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rn FROM employees e JOIN departments d ON d.id = e.department_id) SELECT dept, name, salary FROM r WHERE rn = 1',
    answerNote: '윈도우 함수는 WHERE 에서 바로 쓸 수 없어서, WITH 로 한 번 감싼 뒤 순번이 1 인 행만 고릅니다.',
    alternatives: [
      {
        sql: 'SELECT d.name, e.name, e.salary FROM employees e JOIN departments d ON d.id = e.department_id WHERE e.salary = (SELECT max(x.salary) FROM employees x WHERE x.department_id = e.department_id)',
        note: '윈도우 함수 없이 "자기 부서의 최고 연봉과 같은 직원" 을 찾는 방법입니다. 최고 연봉이 같은 사람이 있으면 모두 나온다는 점이 row_number 와 다릅니다.',
      },
    ],
    hint: 'row_number() OVER (PARTITION BY 부서 ORDER BY 연봉 DESC) 를 WITH 로 감싸고 rn = 1.',
  },

  // ── 한 걸음 더 > 자기 참조와 재귀 CTE
  {
    id: 'p-self-1',
    lessonId: 'self-join-recursive',
    title: '직원과 상사',
    difficulty: 1,
    description: '`employees` 의 `manager_id` 는 같은 테이블의 다른 직원(상사)을 가리킵니다. **모든 직원과 그 직속 상사의 이름** 을 조회하세요. 상사가 없는 대표는 상사 이름이 **NULL** 로 나와야 합니다.\n\n결과 열: ① 직원 이름 ② 상사 이름',
    answerSql: 'SELECT e.name, m.name FROM employees e LEFT JOIN employees m ON m.id = e.manager_id',
    hint: '같은 테이블에 별칭을 두 개(e, m) 붙여 LEFT JOIN 합니다.',
  },
  {
    id: 'p-self-3',
    lessonId: 'self-join-recursive',
    title: '상사별 부하 직원 수',
    difficulty: 2,
    description: '**부하 직원이 한 명이라도 있는 사람** 마다 직속 부하가 몇 명인지 조회하세요.\n\n결과 열: ① 상사 이름 ② 직속 부하 수',
    answerSql: 'SELECT m.name, count(e.id) FROM employees m JOIN employees e ON e.manager_id = m.id GROUP BY m.id',
    hint: '상사 역할(m)과 부하 역할(e)로 같은 테이블을 JOIN 한 뒤 상사별로 묶습니다.',
  },
  {
    id: 'p-self-2',
    lessonId: 'self-join-recursive',
    title: '개발팀장 아래 전체 인원',
    difficulty: 3,
    description: "**'김개발'** 아래에 있는 사람이 **직속과 그 아래 단계까지 모두 합쳐** 몇 명인지 숫자 하나로 조회하세요. 본인은 세지 않습니다.\n\n결과 열: ① 인원 수",
    answerSql: "WITH RECURSIVE t(id) AS (SELECT id FROM employees WHERE name = '김개발' UNION ALL SELECT e.id FROM employees e JOIN t ON e.manager_id = t.id) SELECT count(*) - 1 FROM t",
    hint: 'WITH RECURSIVE 로 김개발에서 시작해 manager_id 를 따라 한 단계씩 내려갑니다. 마지막에 본인 1 명을 뺍니다.',
  },

  // ── 종합 문제 > 데이터 조회 (WHERE · CASE · 정렬 · NULL · 함수)
  {
    id: 'p-mix-select-1',
    lessonId: 'where',
    mixes: ['where', 'case', 'order-limit'],
    title: '하반기 주문 현황판',
    difficulty: 2,
    description:
      '`orders` 에서 **2024년 7월 1일 이후** 주문을 조회하세요. 상태는 한글로 바꿉니다: paid → 결제완료, shipped → 배송중, delivered → 배송완료, cancelled → 취소. **최근 주문이 위로**, 같은 날이면 주문 번호가 큰 것이 위로 오게 정렬하세요.\n\n결과 열: ① 주문 번호(id) ② 주문일(ordered_at) ③ 상태(한글)\n\n이 문제는 WHERE, CASE, 정렬 단원을 씁니다.',
    answerSql:
      "SELECT id, ordered_at, CASE status WHEN 'paid' THEN '결제완료' WHEN 'shipped' THEN '배송중' WHEN 'delivered' THEN '배송완료' ELSE '취소' END AS status_kr FROM orders WHERE ordered_at >= '2024-07-01' ORDER BY ordered_at DESC, id DESC",
    answerNote: '값이 정확히 일치하는 분기라 `CASE status WHEN ...` 짧은 형태를 썼습니다. 날짜는 ISO 문자열이라 크기 비교가 곧 날짜 비교입니다.',
    hint: "WHERE ordered_at >= '2024-07-01', CASE status WHEN ... END, ORDER BY ordered_at DESC, id DESC 를 한 문장에 씁니다.",
    orderMatters: true,
  },
  {
    id: 'p-mix-select-2',
    lessonId: 'functions',
    mixes: ['functions', 'null', 'case', 'where', 'order-limit'],
    title: '2019년 이후 입사자와 배정 여부',
    difficulty: 3,
    description:
      '`employees` 에서 **2019년 1월 1일 이후 입사한 직원** 을 조회하세요. 입사 연도는 `hire_date` 에서 앞 4글자를 잘라 만들고, 부서가 없으면(`department_id` 가 NULL) **미배정**, 있으면 **배정** 이라고 표시합니다. **입사일 순** 으로 정렬하세요.\n\n결과 열: ① 이름(name) ② 입사 연도(4자리 문자열) ③ 배정 여부(배정/미배정)\n\n이 문제는 함수, NULL, CASE, WHERE, 정렬 단원을 씁니다.',
    answerSql:
      "SELECT name, substr(hire_date, 1, 4) AS hire_year, CASE WHEN department_id IS NULL THEN '미배정' ELSE '배정' END AS assigned FROM employees WHERE hire_date >= '2019-01-01' ORDER BY hire_date",
    answerNote: 'NULL 은 `=` 로 비교할 수 없으니 CASE 안에서 `IS NULL` 을 씁니다. `substr(hire_date, 1, 4)` 대신 `strftime(\'%Y\', hire_date)` 도 됩니다.',
    alternatives: [
      {
        sql: "SELECT name, strftime('%Y', hire_date), CASE WHEN department_id IS NULL THEN '미배정' ELSE '배정' END FROM employees WHERE hire_date >= '2019-01-01' ORDER BY hire_date",
        note: '날짜 함수 `strftime` 으로 연도를 뽑는 방법입니다. 결과는 같지만 "날짜에서 연도를 꺼낸다" 는 뜻이 더 분명합니다.',
      },
    ],
    hint: "substr(hire_date, 1, 4), CASE WHEN department_id IS NULL THEN '미배정' ELSE '배정' END, WHERE hire_date >= '2019-01-01', ORDER BY hire_date.",
    orderMatters: true,
  },
  {
    id: 'p-mix-select-3',
    lessonId: 'order-limit',
    mixes: ['order-limit', 'functions', 'case'],
    title: '재고 금액 상위 5개 상품',
    difficulty: 3,
    description:
      '`products` 에서 **재고 금액(가격 × 재고)이 큰 상품 5개** 를 조회하세요. 재고 금액은 **만 원 단위로 소수 첫째 자리까지** 반올림하고(예: 4,935,000 → 493.5), 재고 상태는 재고가 50 이상이면 **많음**, 20 이상이면 **보통**, 그 미만이면 **적음** 으로 표시합니다. 재고 금액이 큰 순서여야 합니다.\n\n결과 열: ① 이름(name) ② 재고 금액(만 원) ③ 재고 상태\n\n이 문제는 정렬·개수 제한, 함수, CASE 단원을 씁니다.',
    answerSql:
      "SELECT name, round(price * stock / 10000.0, 1) AS stock_value_man, CASE WHEN stock >= 50 THEN '많음' WHEN stock >= 20 THEN '보통' ELSE '적음' END AS stock_state FROM products ORDER BY price * stock DESC LIMIT 5",
    answerNote: '`10000.0` 처럼 한쪽을 실수로 만들어야 소수가 남습니다. 정렬 기준은 별칭 대신 원래 식(`price * stock`)을 써도 됩니다.',
    hint: 'round(price * stock / 10000.0, 1), CASE WHEN stock >= 50 ... WHEN stock >= 20 ... ELSE ... END, ORDER BY price * stock DESC LIMIT 5.',
    orderMatters: true,
  },

  // ── 종합 문제 > 집계와 그룹 (GROUP BY · 집계 함수 · CASE · 날짜 함수)
  {
    id: 'p-mix-agg-1',
    lessonId: 'group-by',
    mixes: ['group-by', 'aggregate-functions', 'functions', 'case'],
    title: '월별 주문 수와 취소 수',
    difficulty: 2,
    description:
      '`orders` 를 **월별** 로 묶어 그 달의 **전체 주문 수** 와 **취소된 주문 수** 를 조회하세요. 월은 `strftime(\'%Y-%m\', ordered_at)` 로 만든 `2024-01` 형태이고, 월 순서대로 정렬합니다.\n\n결과 열: ① 월(YYYY-MM) ② 주문 수 ③ 취소 수\n\n이 문제는 GROUP BY, 집계 함수, 날짜 함수, CASE 단원을 씁니다.',
    answerSql:
      "SELECT strftime('%Y-%m', ordered_at) AS month, count(*) AS orders, sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled FROM orders GROUP BY month ORDER BY month",
    answerNote: '조건에 맞는 행만 세려면 `sum(CASE WHEN ... THEN 1 ELSE 0 END)` 패턴을 씁니다. SQLite 에서는 `sum(status = \'cancelled\')` 처럼 비교식(참=1)을 바로 더해도 됩니다.',
    alternatives: [
      {
        sql: "SELECT strftime('%Y-%m', ordered_at), count(*), sum(status = 'cancelled') FROM orders GROUP BY 1 ORDER BY 1",
        note: 'SQLite 는 비교식이 1/0 이라 `sum(status = \'cancelled\')` 로 줄일 수 있습니다. 다른 DB 에서는 통하지 않을 수 있어 CASE 가 더 안전합니다.',
      },
    ],
    hint: "strftime('%Y-%m', ordered_at) 로 묶고, 취소 수는 sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END).",
  },
  {
    id: 'p-mix-agg-2',
    lessonId: 'group-by',
    mixes: ['group-by', 'aggregate-functions', 'where', 'null'],
    title: '2024-1 학기 과목별 성적 통계',
    difficulty: 3,
    description:
      '`enrollments` 에서 **2024-1 학기** 의 수강을 **과목별** 로 묶어, 성적이 입력된 수강 수와 평균 성적(소수 첫째 자리 반올림), 최고 점수를 조회하세요. **평균이 75 이상인 과목만** 남기고 평균이 높은 순으로 정렬합니다.\n\n결과 열: ① 과목 번호(course_id) ② 성적 있는 수강 수 ③ 평균 성적 ④ 최고 점수\n\n이 문제는 GROUP BY·HAVING, 집계 함수, WHERE, NULL 단원을 씁니다.',
    answerSql:
      "SELECT course_id, count(score) AS scored, round(avg(score), 1) AS avg_score, max(score) AS top FROM enrollments WHERE semester = '2024-1' GROUP BY course_id HAVING avg(score) >= 75 ORDER BY avg_score DESC",
    answerNote: '학기 조건은 묶기 전이라 WHERE, 평균 조건은 묶은 뒤라 HAVING 입니다. `count(score)` 는 NULL 을 빼고 셉니다.',
    hint: "WHERE semester = '2024-1' → GROUP BY course_id → HAVING avg(score) >= 75. 성적 있는 수강 수는 count(score).",
  },
  {
    id: 'p-mix-agg-3',
    lessonId: 'group-by',
    mixes: ['group-by', 'aggregate-functions', 'case'],
    title: '단골 고객의 배송·취소 현황',
    difficulty: 3,
    description:
      '`orders` 를 **고객별** 로 묶어 **주문이 3건 이상인 고객** 만 조회하세요. 전체 주문 수, 배송완료 수, 그리고 **취소 비율(%)** 을 소수 첫째 자리까지 구합니다. 취소 비율은 취소 수 ÷ 전체 주문 수 × 100 입니다. 주문 수가 많은 순, 같으면 고객 번호 순으로 정렬합니다.\n\n결과 열: ① 고객 번호(customer_id) ② 주문 수 ③ 배송완료 수 ④ 취소 비율\n\n이 문제는 GROUP BY·HAVING, 집계 함수, CASE 단원을 씁니다.',
    answerSql:
      "SELECT customer_id, count(*) AS orders, sum(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered, round(100.0 * sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / count(*), 1) AS cancel_pct FROM orders GROUP BY customer_id HAVING count(*) >= 3 ORDER BY orders DESC, customer_id",
    answerNote: '비율은 `100.0 *` 처럼 실수로 시작해야 정수 나눗셈으로 0 이 되지 않습니다.',
    hint: 'sum(CASE WHEN status = ... THEN 1 ELSE 0 END) 를 두 번 쓰고, 비율은 round(100.0 * 취소수 / count(*), 1). HAVING count(*) >= 3.',
    orderMatters: true,
  },

  // ── 종합 문제 > 여러 테이블 다루기 (JOIN · LEFT JOIN · 서브쿼리 · UNION)
  {
    id: 'p-mix-join-1',
    lessonId: 'left-join',
    mixes: ['left-join', 'join', 'null'],
    title: '고객별 배송완료 구매액 (0 포함)',
    difficulty: 2,
    description:
      '**모든 고객** 에 대해 **배송완료(delivered) 주문의 구매액 합계** 를 조회하세요. 구매액은 `order_items` 의 수량 × 단가입니다. 배송완료 주문이 없는 고객은 **0** 으로 나와야 합니다. 구매액이 큰 순, 같으면 이름 순으로 정렬합니다.\n\n결과 열: ① 고객 이름(name) ② 배송완료 구매액\n\n이 문제는 LEFT JOIN, JOIN, NULL 단원을 씁니다.',
    answerSql:
      "SELECT c.name, COALESCE(sum(oi.quantity * oi.unit_price), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'delivered' LEFT JOIN order_items oi ON oi.order_id = o.id GROUP BY c.id ORDER BY total DESC, c.name",
    answerNote: '상태 조건을 WHERE 에 쓰면 배송완료가 없는 고객이 사라지므로 ON 에 넣습니다. 짝이 없으면 sum 이 NULL 이라 COALESCE 로 0 을 만듭니다.',
    hint: "LEFT JOIN orders ... ON o.customer_id = c.id AND o.status = 'delivered' → LEFT JOIN order_items → COALESCE(sum(...), 0).",
    orderMatters: true,
  },
  {
    id: 'p-mix-join-2',
    lessonId: 'subquery',
    mixes: ['subquery', 'join', 'group-by'],
    title: '평균보다 많이 산 고객',
    difficulty: 3,
    description:
      '취소되지 않은 주문을 기준으로 **고객별 총 구매액** 을 구한 뒤, 그 **평균보다 많이 산 고객** 만 조회하세요. 구매액은 `order_items` 의 수량 × 단가이고, 구매액이 큰 순으로 정렬합니다.\n\n결과 열: ① 고객 이름(name) ② 총 구매액\n\n이 문제는 서브쿼리(WITH), JOIN, GROUP BY 단원을 씁니다.',
    answerSql:
      "WITH totals AS (SELECT o.customer_id, sum(oi.quantity * oi.unit_price) AS total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY o.customer_id) SELECT c.name, t.total FROM totals t JOIN customers c ON c.id = t.customer_id WHERE t.total > (SELECT avg(total) FROM totals) ORDER BY t.total DESC",
    answerNote: '고객별 합계를 WITH 로 한 번 만들어 두면 "평균" 과 "평균보다 큰 고객" 을 같은 결과에서 꺼낼 수 있습니다.',
    alternatives: [
      {
        sql: "SELECT c.name, sum(oi.quantity * oi.unit_price) AS total FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'cancelled' GROUP BY c.id HAVING total > (SELECT avg(t) FROM (SELECT sum(oi2.quantity * oi2.unit_price) AS t FROM orders o2 JOIN order_items oi2 ON oi2.order_id = o2.id WHERE o2.status <> 'cancelled' GROUP BY o2.customer_id)) ORDER BY total DESC",
        note: 'WITH 없이 HAVING 안에 FROM 절 서브쿼리를 넣은 방법입니다. 같은 집계를 두 번 적어야 해서 WITH 쪽이 읽기 쉽습니다.',
      },
    ],
    hint: 'WITH totals AS (고객별 합계) 를 만들고, WHERE total > (SELECT avg(total) FROM totals).',
    orderMatters: true,
  },
  {
    id: 'p-mix-join-3',
    lessonId: 'union',
    mixes: ['union', 'left-join', 'subquery'],
    title: '한 번도 없던 것들',
    difficulty: 3,
    description:
      '두 목록을 **위아래로 합쳐** 조회하세요. 첫 번째는 **한 번도 주문되지 않은 상품** (종류 열에 `상품`), 두 번째는 **도서 카테고리 상품을 한 번도 산 적 없는 고객** (종류 열에 `고객`)입니다. 상품 목록이 먼저 옵니다.\n\n결과 열: ① 종류(상품/고객) ② 이름\n\n이 문제는 UNION, LEFT JOIN, 서브쿼리 단원을 씁니다.',
    answerSql:
      "SELECT '상품' AS kind, p.name FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL UNION ALL SELECT '고객', c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.customer_id = c.id AND p.category = '도서')",
    answerNote: '"한 번도 없는" 은 LEFT JOIN … IS NULL 또는 NOT EXISTS 로 찾습니다. 두 목록은 겹칠 일이 없어 UNION ALL 을 썼습니다.',
    alternatives: [
      {
        sql: "SELECT '상품', name FROM products WHERE id NOT IN (SELECT product_id FROM order_items) UNION ALL SELECT '고객', name FROM customers WHERE id NOT IN (SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.category = '도서')",
        note: '둘 다 NOT IN 으로 쓴 방법입니다. 서브쿼리 결과에 NULL 이 섞이면 NOT IN 은 아무 행도 돌려주지 않으니, NULL 이 있을 수 있는 열에는 NOT EXISTS 가 안전합니다.',
      },
    ],
    hint: "상품: LEFT JOIN order_items … WHERE oi.id IS NULL. 고객: NOT EXISTS (도서를 산 주문). 둘을 UNION ALL 로 잇고 종류 열은 '상품', '고객' 문자열.",
  },

  // ── 종합 문제 > 데이터 변경과 구조 (CREATE · INSERT · UPDATE · ALTER · 트랜잭션 · 뷰)
  {
    id: 'p-mix-modify-1',
    lessonId: 'create-table',
    mixes: ['create-table', 'insert'],
    title: '품절 상품 보관 테이블',
    difficulty: 2,
    description:
      '`sold_out` 테이블을 만들고 **재고가 0 인 상품** 을 옮겨 담으세요. 열은 `id`(정수, 기본키), `name`(문자열, NOT NULL), `category`(문자열, NOT NULL) 이고, 값은 `products` 에서 그대로 복사합니다.\n\n확인 쿼리는 `sold_out` 의 이름과 카테고리를 id 순으로 봅니다.\n\n이 문제는 CREATE TABLE, INSERT 단원을 씁니다.',
    answerSql:
      'CREATE TABLE sold_out (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL); INSERT INTO sold_out (id, name, category) SELECT id, name, category FROM products WHERE stock = 0',
    answerNote: '조회 결과를 그대로 넣을 때는 `INSERT ... SELECT` 입니다. VALUES 로 값을 손으로 적으면 데이터가 바뀔 때 어긋납니다.',
    hint: 'CREATE TABLE sold_out (...) 다음에 INSERT INTO sold_out (id, name, category) SELECT id, name, category FROM products WHERE stock = 0.',
    checkSql: 'SELECT name, category FROM sold_out ORDER BY id',
  },
  {
    id: 'p-mix-modify-2',
    lessonId: 'transaction',
    mixes: ['transaction', 'update-delete', 'insert', 'create-table'],
    title: '도서 가격 인상과 변경 기록',
    difficulty: 3,
    description:
      '도서 카테고리 상품의 가격을 **2,000원씩 올리면서** 변경 전후 가격을 기록으로 남기세요.\n\n1. `price_log` 테이블을 만듭니다: `product_id`(정수, NOT NULL, `products(id)` 참조), `old_price`(정수, NOT NULL), `new_price`(정수, NOT NULL).\n2. **하나의 트랜잭션 안에서** 도서 상품마다 (id, 현재 가격, 현재 가격 + 2000) 을 `price_log` 에 넣고, `products` 의 가격을 2,000원 올린 뒤 COMMIT 합니다.\n\n확인 쿼리는 기록과 현재 가격을 나란히 봅니다.\n\n이 문제는 트랜잭션, UPDATE, INSERT, CREATE TABLE 단원을 씁니다.',
    answerSql:
      "CREATE TABLE price_log (product_id INTEGER NOT NULL REFERENCES products(id), old_price INTEGER NOT NULL, new_price INTEGER NOT NULL); BEGIN; INSERT INTO price_log (product_id, old_price, new_price) SELECT id, price, price + 2000 FROM products WHERE category = '도서'; UPDATE products SET price = price + 2000 WHERE category = '도서'; COMMIT",
    answerNote: '기록을 먼저 넣고 가격을 올려야 `old_price` 에 인상 전 가격이 남습니다. 순서를 바꾸면 둘 다 인상 후 가격이 됩니다.',
    hint: "CREATE TABLE price_log (...); BEGIN; INSERT INTO price_log SELECT id, price, price + 2000 FROM products WHERE category = '도서'; UPDATE products SET price = price + 2000 WHERE category = '도서'; COMMIT;",
    checkSql: 'SELECT l.product_id, l.old_price, l.new_price, p.price FROM price_log l JOIN products p ON p.id = l.product_id ORDER BY l.product_id',
  },
  {
    id: 'p-mix-modify-3',
    lessonId: 'alter-drop',
    mixes: ['alter-drop', 'update-delete', 'view-index', 'subquery'],
    title: 'VIP 등급 열과 뷰',
    difficulty: 3,
    description:
      '고객 등급을 도입하세요.\n\n1. `customers` 에 `grade` 열을 추가합니다: 문자열, NOT NULL, 기본값 `일반`.\n2. **주문이 3건 이상인 고객** 의 등급을 `VIP` 로 바꿉니다.\n3. 이름과 등급만 보여 주는 `vip_customers` 뷰를 만듭니다. 등급이 VIP 인 고객만 들어갑니다.\n\n확인 쿼리는 `vip_customers` 를 이름 순으로 봅니다.\n\n이 문제는 ALTER TABLE, UPDATE, 뷰, 서브쿼리 단원을 씁니다.',
    answerSql:
      "ALTER TABLE customers ADD COLUMN grade TEXT NOT NULL DEFAULT '일반'; UPDATE customers SET grade = 'VIP' WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING count(*) >= 3); CREATE VIEW vip_customers AS SELECT name, grade FROM customers WHERE grade = 'VIP'",
    answerNote: '행이 있는 테이블에 NOT NULL 열을 추가하려면 DEFAULT 가 필요합니다. 3건 이상인 고객은 GROUP BY … HAVING 서브쿼리로 고릅니다.',
    hint: "ALTER TABLE customers ADD COLUMN grade TEXT NOT NULL DEFAULT '일반'; UPDATE ... WHERE id IN (SELECT customer_id FROM orders GROUP BY customer_id HAVING count(*) >= 3); CREATE VIEW vip_customers AS SELECT name, grade FROM customers WHERE grade = 'VIP';",
    checkSql: 'SELECT * FROM vip_customers ORDER BY name',
  },

  // ── 종합 문제 > 한 걸음 더 (윈도우 함수 · 재귀 CTE · JOIN · GROUP BY)
  {
    id: 'p-mix-adv-1',
    lessonId: 'window-functions',
    mixes: ['window-functions', 'self-join-recursive', 'join'],
    title: '부서 안 연봉 순위와 상사',
    difficulty: 2,
    description:
      '부서가 있는 직원마다 **부서 이름, 이름, 직속 상사 이름, 연봉, 부서 안 연봉 순위** 를 조회하세요. 순위는 연봉이 높은 순으로 `rank()` 를 씁니다. 상사는 `manager_id` 가 가리키는 같은 테이블의 직원입니다. 부서 이름 순, 그 안에서 순위 순으로 정렬합니다.\n\n결과 열: ① 부서 이름 ② 직원 이름 ③ 상사 이름 ④ 연봉 ⑤ 부서 안 순위\n\n이 문제는 윈도우 함수, 자기 참조 JOIN, JOIN 단원을 씁니다.',
    answerSql:
      'SELECT d.name AS dept, e.name, m.name AS manager, e.salary, rank() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk FROM employees e JOIN departments d ON d.id = e.department_id JOIN employees m ON m.id = e.manager_id ORDER BY dept, rnk',
    answerNote: '같은 테이블을 상사 역할(m)로 한 번 더 JOIN 하고, 순위는 윈도우 함수로 각 행 옆에 붙입니다. 부서가 있는 직원은 모두 상사가 있어 INNER JOIN 으로 충분합니다.',
    hint: 'employees e JOIN departments d, JOIN employees m ON m.id = e.manager_id, 그리고 rank() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC).',
    orderMatters: true,
  },
  {
    id: 'p-mix-adv-2',
    lessonId: 'self-join-recursive',
    mixes: ['self-join-recursive', 'group-by', 'join'],
    title: '조직 단계별 인원과 평균 연봉',
    difficulty: 3,
    description:
      '대표를 0단계로 두고 `manager_id` 를 따라 내려가며 각 직원의 **조직 단계(depth)** 를 구한 뒤, **단계별 인원 수와 평균 연봉(정수 반올림)** 을 조회하세요. 단계 순으로 정렬합니다.\n\n결과 열: ① 단계(depth) ② 인원 수 ③ 평균 연봉\n\n이 문제는 재귀 CTE, GROUP BY, JOIN 단원을 씁니다.',
    answerSql:
      'WITH RECURSIVE org(id, depth) AS (SELECT id, 0 FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, o.depth + 1 FROM employees e JOIN org o ON e.manager_id = o.id) SELECT o.depth, count(*) AS headcount, round(avg(e.salary)) AS avg_salary FROM org o JOIN employees e ON e.id = o.id GROUP BY o.depth ORDER BY o.depth',
    answerNote: '재귀 CTE 로 (id, depth) 만 만들고, 연봉은 employees 와 다시 JOIN 해 가져옵니다. CTE 안에서 salary 까지 끌고 가도 됩니다.',
    hint: 'WITH RECURSIVE org(id, depth) AS (대표 0 UNION ALL 직원 depth+1) 을 만든 뒤 employees 와 JOIN 해 GROUP BY depth.',
  },
  {
    id: 'p-mix-adv-3',
    lessonId: 'self-join-recursive',
    mixes: ['self-join-recursive', 'group-by', 'join'],
    title: '팀장별 전체 인원',
    difficulty: 3,
    description:
      '대표(`manager_id` 가 NULL)의 **직속 부하** 를 팀장이라고 부릅니다. 팀장마다 **그 아래 전체 인원** (직속과 그 아래 단계까지 모두, 본인 제외)을 조회하세요. 인원이 많은 순, 같으면 이름 순으로 정렬합니다. 부하가 없는 팀장은 0 으로 나와야 합니다.\n\n결과 열: ① 팀장 이름 ② 아래 전체 인원\n\n이 문제는 재귀 CTE, GROUP BY, JOIN 단원을 씁니다.',
    answerSql:
      'WITH RECURSIVE t(root, id) AS (SELECT id, id FROM employees WHERE manager_id = (SELECT id FROM employees WHERE manager_id IS NULL) UNION ALL SELECT t.root, e.id FROM employees e JOIN t ON e.manager_id = t.id) SELECT m.name, count(*) - 1 AS total_reports FROM t JOIN employees m ON m.id = t.root GROUP BY t.root ORDER BY total_reports DESC, m.name',
    answerNote: '재귀 CTE 에 "어느 팀장에서 출발했는지"(root)를 같이 끌고 가면 팀장 여러 명을 한 번에 셀 수 있습니다. 시작 행에 본인이 들어가므로 마지막에 1 을 뺍니다.',
    hint: 'WITH RECURSIVE t(root, id) AS (팀장들: SELECT id, id … UNION ALL SELECT t.root, e.id …) 다음 GROUP BY t.root, count(*) - 1.',
    orderMatters: true,
  },
]
