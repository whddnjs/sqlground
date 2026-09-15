import type { Chapter } from '../types'

export const MODIFY: Chapter = {
  id: 'modify',
  title: '데이터 변경과 구조',
  lessons: [
    {
      id: 'create-table',
      title: 'CREATE TABLE, 타입, 제약',
      keywords: ['CREATE TABLE', 'PRIMARY KEY', 'NOT NULL', 'UNIQUE', 'DEFAULT', 'CHECK', '타입', 'INTEGER', 'TEXT', 'REAL'],
      body: `
테이블을 만드는 문장입니다. 열마다 **이름, 타입, 제약**을 적습니다.

\`\`\`sql
DROP TABLE IF EXISTS memos;

CREATE TABLE memos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  body       TEXT,
  priority   INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
\`\`\`

첫 줄의 \`DROP TABLE IF EXISTS\` 는 예제를 여러 번 실행할 수 있게 하려는 것입니다. 이미 있는 이름으로 CREATE 하면 "already exists" 에러가 납니다.

## SQLite 의 타입

| 타입 | 저장하는 것 |
|---|---|
| \`INTEGER\` | 정수 |
| \`REAL\` | 실수 |
| \`TEXT\` | 문자열. 날짜도 문자열로 |
| \`BLOB\` | 이진 데이터 |
| \`NUMERIC\` | 숫자로 변환 가능하면 숫자로 |

SQLite 는 타입을 느슨하게 다룹니다. \`INTEGER\` 열에 \`'abc'\` 를 넣어도 에러 없이 들어갑니다(**타입 친화성**).
MySQL, PostgreSQL 은 엄격하게 거부하니 실무에서는 타입에 맞는 값을 넣는 습관을 들이세요. 또 그쪽에는 \`VARCHAR(100)\`, \`DATE\`, \`BOOLEAN\`, \`DECIMAL\` 같은 타입이 더 있습니다.

## 제약 (constraint)

| 제약 | 뜻 |
|---|---|
| \`PRIMARY KEY\` | 행의 고유 식별자. 중복·NULL 불가 |
| \`AUTOINCREMENT\` | 비우면 1, 2, 3… 자동 부여 (INTEGER PRIMARY KEY 에만) |
| \`NOT NULL\` | 비워 둘 수 없음 |
| \`UNIQUE\` | 중복 불가 (NULL 은 허용) |
| \`DEFAULT 값\` | 안 넣으면 이 값 |
| \`CHECK (조건)\` | 조건에 맞는 값만 |
| \`REFERENCES 테이블(열)\` | 외래키. 외래키 단원에서 |

제약을 어기면 INSERT/UPDATE 가 거부됩니다. 직접 확인해 보세요.

\`\`\`sql
-- priority 가 범위 밖이라 CHECK 제약 에러
INSERT INTO memos (title, priority) VALUES ('테스트', 9);
\`\`\`

## 만든 테이블 확인

\`\`\`sql
SELECT sql FROM sqlite_master WHERE name = 'memos';
\`\`\`

연습장에서는 스키마 브라우저의 **만들기** 버튼으로 폼을 채우면 이 문장이 자동으로 만들어집니다. 폼과 생성된 SQL 을 나란히 보면 문법이 빨리 익숙해집니다.
`,
    },
    {
      id: 'insert',
      title: 'INSERT',
      keywords: ['INSERT', 'INSERT INTO', 'VALUES', 'INSERT SELECT', '추가'],
      body: `
행을 추가합니다. 이 단원의 예제는 앞 단원에서 만든 \`memos\` 테이블을 씁니다. 없으면 먼저 만듭니다.

\`\`\`sql
CREATE TABLE IF NOT EXISTS memos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  body       TEXT,
  priority   INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
\`\`\`

## 기본형

\`\`\`sql
INSERT INTO memos (title, body, priority)
VALUES ('SQL 공부', 'INSERT 까지 왔다', 2);

SELECT * FROM memos;
\`\`\`

- 열 목록과 값 목록의 **개수와 순서**가 맞아야 합니다.
- 적지 않은 열은 \`DEFAULT\` 값이 들어가거나(\`priority\`, \`created_at\`), 없으면 NULL 입니다(\`body\`).
- \`id\` 는 AUTOINCREMENT 라 비워 두면 자동으로 채워집니다.

## 여러 행 한 번에

\`\`\`sql
INSERT INTO memos (title, priority) VALUES
  ('장보기', 4),
  ('운동', 3),
  ('독서', 1);

SELECT id, title, priority FROM memos;
\`\`\`

한 행씩 여러 번 실행하는 것보다 훨씬 빠릅니다.

## 제약 위반 확인

\`\`\`sql
-- title 이 NOT NULL 이라 에러
INSERT INTO memos (body) VALUES ('제목 없음');
\`\`\`

에러 메시지 아래의 한글 설명을 읽어 보세요. 실무에서도 이 메시지들을 자주 만납니다.

## 조회 결과를 넣기 (INSERT ... SELECT)

다른 테이블의 데이터를 복사할 때 씁니다.

\`\`\`sql
INSERT INTO memos (title, priority)
SELECT '재고 확인: ' || name, 5
FROM products
WHERE stock = 0;

SELECT * FROM memos WHERE priority = 5;
\`\`\`

## 열 목록 생략

\`INSERT INTO memos VALUES (...)\` 처럼 열 목록을 빼면 **모든 열을 테이블 정의 순서대로** 넣어야 합니다. 나중에 열이 추가되면 깨지므로 항상 열 목록을 적는 편이 안전합니다.
`,
    },
    {
      id: 'update-delete',
      title: 'UPDATE 와 DELETE',
      keywords: ['UPDATE', 'SET', 'DELETE', 'WHERE', '수정', '삭제'],
      body: `
## UPDATE

\`\`\`sql
UPDATE products
SET price = price * 1.1
WHERE category = '도서';

SELECT name, price FROM products WHERE category = '도서';
\`\`\`

- \`SET 열 = 값\` 을 쉼표로 여러 개 적을 수 있습니다.
- 값에 기존 열을 쓸 수 있어 "10% 인상" 같은 계산이 됩니다.

여러 열을 한 번에:

\`\`\`sql
UPDATE products
SET stock = 50, price = 16000
WHERE name = '휴대용 선풍기';

SELECT name, price, stock FROM products WHERE name = '휴대용 선풍기';
\`\`\`

## DELETE

취소된 주문을 지워 보겠습니다. 그런데 이 예제는 FOREIGN KEY 제약 에러가 납니다. 취소 주문에 \`order_items\` 가 매달려 있기 때문입니다.

\`\`\`sql
DELETE FROM orders WHERE status = 'cancelled';
\`\`\`

자식 행을 먼저 지우면 됩니다. (외래키 단원의 \`ON DELETE CASCADE\` 를 쓰면 자동으로 됩니다)

\`\`\`sql
DELETE FROM order_items
WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled');

DELETE FROM orders WHERE status = 'cancelled';

SELECT count(*) AS remaining FROM orders;
\`\`\`

## WHERE 를 빼먹으면

**모든 행**이 바뀌거나 지워집니다. 실무에서 가장 무서운 실수입니다.

\`\`\`sql
-- 정말로 모든 상품 재고가 0 이 됩니다
UPDATE products SET stock = 0;

SELECT sum(stock) FROM products;
\`\`\`

습관을 들이세요.
1. UPDATE/DELETE 를 쓰기 전에 **같은 WHERE 로 SELECT** 해서 대상 행을 확인한다.
2. 실무 DB 에서는 트랜잭션 안에서 실행하고, 결과를 본 뒤 COMMIT 한다. (트랜잭션 단원)

이 페이지의 학습용 DB 는 "예제 DB 초기화" 로 되돌릴 수 있으니 마음껏 실수해도 됩니다.

## 서브쿼리로 값 채우기

\`\`\`sql
-- 각 주문 상품의 단가를 현재 상품 가격으로 갱신
UPDATE order_items
SET unit_price = (SELECT price FROM products WHERE products.id = order_items.product_id);

SELECT oi.id, p.name, oi.unit_price, p.price
FROM order_items oi JOIN products p ON p.id = oi.product_id
LIMIT 5;
\`\`\`
`,
    },
    {
      id: 'alter-drop',
      title: 'ALTER TABLE 과 DROP',
      keywords: ['ALTER TABLE', 'ADD COLUMN', 'RENAME', 'DROP COLUMN', 'DROP TABLE'],
      body: `
이미 있는 테이블의 구조를 바꿉니다.

\`\`\`sql
DROP TABLE IF EXISTS memos;
CREATE TABLE memos (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
INSERT INTO memos (title) VALUES ('첫 메모');
\`\`\`

## 열 추가

\`\`\`sql
ALTER TABLE memos ADD COLUMN done INTEGER NOT NULL DEFAULT 0;

SELECT * FROM memos;
\`\`\`

이미 행이 있는 테이블에 \`NOT NULL\` 열을 추가하려면 \`DEFAULT\` 가 필요합니다. 기존 행을 채울 값이 있어야 하니까요.

## 이름 바꾸기

\`\`\`sql
ALTER TABLE memos RENAME COLUMN done TO is_done;
ALTER TABLE memos RENAME TO notes;

SELECT * FROM notes;
\`\`\`

## 열 삭제

\`\`\`sql
ALTER TABLE notes DROP COLUMN is_done;

SELECT * FROM notes;
\`\`\`

## SQLite 가 못 하는 것

SQLite 의 ALTER TABLE 은 위 네 가지뿐입니다. **열 타입 변경, 제약 추가/삭제**는 안 됩니다.
그럴 땐 새 테이블을 만들고 데이터를 옮긴 뒤 이름을 바꾸는 방식을 씁니다.

\`\`\`sql
CREATE TABLE notes_new (id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE);
INSERT INTO notes_new (id, title) SELECT id, title FROM notes;
DROP TABLE notes;
ALTER TABLE notes_new RENAME TO notes;

SELECT sql FROM sqlite_master WHERE name = 'notes';
\`\`\`

MySQL, PostgreSQL 은 \`ALTER TABLE ... MODIFY/ALTER COLUMN\` 으로 타입과 제약을 직접 바꿀 수 있습니다.

## DROP TABLE

테이블과 데이터를 통째로 지웁니다. 되돌릴 수 없습니다.

\`\`\`sql
DROP TABLE IF EXISTS notes;
\`\`\`

\`IF EXISTS\` 를 붙이면 없을 때 에러가 나지 않습니다. 스크립트를 반복 실행할 때 유용합니다.
`,
    },
    {
      id: 'foreign-key',
      title: '외래키와 관계',
      keywords: ['FOREIGN KEY', 'REFERENCES', 'ON DELETE', 'CASCADE', '관계', '외래키'],
      body: `
외래키는 "이 열의 값은 저 테이블의 키 중 하나여야 한다" 는 약속입니다.
\`orders.customer_id\` 에 존재하지 않는 고객 번호가 들어가는 걸 막아 줍니다.

\`\`\`sql
-- 999번 고객은 없으므로 FOREIGN KEY 제약 에러
INSERT INTO orders (customer_id, ordered_at, status)
VALUES (999, '2024-09-01', 'paid');
\`\`\`

## 선언하기

\`\`\`sql
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
  id    INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE comments (
  id      INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  body    TEXT NOT NULL
);

INSERT INTO posts (title) VALUES ('첫 글'), ('둘째 글');
INSERT INTO comments (post_id, body) VALUES (1, '좋아요'), (1, '저도요'), (2, '궁금해요');
\`\`\`

\`REFERENCES posts(id)\` 한 줄이 외래키입니다. 여러 열이거나 옵션이 필요하면 테이블 제약으로 씁니다.

\`\`\`text
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
\`\`\`

## 부모를 지우면?

기본 동작은 **거부**입니다. 댓글이 달린 글은 지울 수 없습니다.

\`\`\`sql
-- comments 가 참조 중이라 FOREIGN KEY 제약 에러
DELETE FROM posts WHERE id = 1;
\`\`\`

\`ON DELETE\` 옵션으로 바꿀 수 있습니다.

| 옵션 | 부모 삭제 시 자식은 |
|---|---|
| (기본) \`NO ACTION\` | 삭제 거부 |
| \`CASCADE\` | 같이 삭제 |
| \`SET NULL\` | 참조 열을 NULL 로 |

\`\`\`sql
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id      INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  body    TEXT NOT NULL
);
INSERT INTO comments (post_id, body) VALUES (1, '좋아요'), (1, '저도요'), (2, '궁금해요');

DELETE FROM posts WHERE id = 1;

SELECT * FROM comments;
\`\`\`

1번 글의 댓글이 함께 사라졌습니다.

## SQLite 에서 주의할 점

SQLite 는 **기본적으로 외래키 제약을 검사하지 않습니다.** 연결마다 \`PRAGMA foreign_keys = ON\` 을 실행해야 합니다.
이 사이트는 켜 둔 상태이고, 설정 화면에서 끌 수 있습니다. MySQL(InnoDB), PostgreSQL 은 항상 검사합니다.

## 관계 종류

- **1:N** 고객 한 명 → 주문 여러 건. FK 는 N 쪽(orders)에 둡니다.
- **N:M** 학생 여러 명 ↔ 과목 여러 개. 중간 테이블(enrollments)이 양쪽 FK 를 가집니다.
- **1:1** 드뭅니다. 한쪽 PK 가 다른 쪽 FK 겸 PK.

관계도 메뉴에서 샘플 테이블의 FK 선을 보면서 위 내용을 대조해 보세요.
`,
    },
    {
      id: 'transaction',
      title: '트랜잭션',
      keywords: ['트랜잭션', 'BEGIN', 'COMMIT', 'ROLLBACK', 'transaction'],
      body: `
여러 문장을 **하나의 묶음**으로 실행하는 것입니다. 묶음 안의 문장은 전부 성공하거나(COMMIT) 전부 취소됩니다(ROLLBACK).

계좌 이체를 생각해 보세요. A 에서 빼고 B 에 더하는 두 UPDATE 중 하나만 실행되면 돈이 사라집니다.

\`\`\`sql
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INTEGER NOT NULL CHECK (balance >= 0));
INSERT INTO accounts VALUES ('A', 10000), ('B', 5000);
\`\`\`

## BEGIN … COMMIT

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance - 3000 WHERE name = 'A';
UPDATE accounts SET balance = balance + 3000 WHERE name = 'B';
COMMIT;

SELECT * FROM accounts;
\`\`\`

## ROLLBACK 으로 되돌리기

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = 0 WHERE name = 'A';
SELECT * FROM accounts;   -- 트랜잭션 안에서는 0 으로 보임
ROLLBACK;

SELECT * FROM accounts;   -- 되돌아옴
\`\`\`

## 실패하면 전부 취소하기

아래는 A 잔액이 부족해 두 번째 UPDATE 가 CHECK 제약에 걸립니다. 이 사이트는 에러가 나면 그 문장에서 멈추므로, 첫 UPDATE 만 반영된 채 트랜잭션이 열려 있게 됩니다. 이럴 때 ROLLBACK 으로 정리합니다.

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance + 20000 WHERE name = 'B';
UPDATE accounts SET balance = balance - 20000 WHERE name = 'A';
COMMIT;
\`\`\`

\`\`\`sql
ROLLBACK;
SELECT * FROM accounts;
\`\`\`

실제 애플리케이션 코드에서는 try/catch 로 에러를 잡아 ROLLBACK 을 호출합니다.

## 왜 중요한가

- **원자성**: 절반만 반영되는 일이 없다.
- **안전한 실험**: 실무 DB 에서 UPDATE/DELETE 를 할 때 \`BEGIN\` 으로 시작해 결과를 SELECT 로 확인하고, 맞으면 COMMIT, 틀리면 ROLLBACK.
- **성능**: 수천 건 INSERT 를 하나의 트랜잭션으로 묶으면 훨씬 빠릅니다.

> 이 사이트의 "되돌리기" 버튼은 트랜잭션이 아니라 실행 전 스냅샷을 복원하는 기능입니다. 실무 DB 에는 그런 버튼이 없으니 트랜잭션을 습관으로 만드세요.
`,
    },
    {
      id: 'view-index',
      title: '뷰와 인덱스',
      keywords: ['VIEW', 'CREATE VIEW', 'INDEX', 'CREATE INDEX', 'EXPLAIN', '성능'],
      body: `
## 뷰 (VIEW)

자주 쓰는 SELECT 에 이름을 붙여 테이블처럼 쓰는 것입니다. 데이터를 복사하지 않고 매번 원래 쿼리를 실행합니다.

\`\`\`sql
DROP VIEW IF EXISTS order_summary;

CREATE VIEW order_summary AS
SELECT o.id, c.name AS customer, o.ordered_at, o.status,
       sum(oi.quantity * oi.unit_price) AS total
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;
\`\`\`

\`\`\`sql
SELECT * FROM order_summary
WHERE total >= 300000
ORDER BY total DESC;
\`\`\`

복잡한 JOIN 을 한 번만 적어 두고 여러 곳에서 재사용할 때, 또는 일부 열만 노출하고 싶을 때 씁니다.
뷰는 읽기 전용이라고 생각하면 됩니다(SQLite 는 뷰에 INSERT 불가).

## 인덱스 (INDEX)

책의 찾아보기처럼, 특정 열로 빠르게 찾을 수 있게 하는 자료구조입니다.
인덱스가 없으면 DB 는 조건에 맞는 행을 찾기 위해 **테이블 전체를 훑습니다**.

\`\`\`sql
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
\`\`\`

- PRIMARY KEY 와 UNIQUE 열에는 자동으로 인덱스가 생깁니다.
- WHERE, JOIN ON, ORDER BY 에 자주 쓰는 열이 후보입니다. 특히 **외래키 열**은 거의 항상 인덱스를 겁니다.
- 인덱스는 공짜가 아닙니다. INSERT/UPDATE 때마다 같이 갱신되므로 무조건 많이 만드는 게 좋은 게 아닙니다.

## 인덱스를 쓰는지 확인: EXPLAIN QUERY PLAN

\`\`\`sql
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE customer_id = 5;
\`\`\`

결과의 \`detail\` 에 \`USING INDEX idx_orders_customer\` 가 보이면 인덱스를 탄 것이고, \`SCAN orders\` 면 전체를 훑는 것입니다.
샘플 데이터는 작아서 체감이 안 되지만, 실무에서 행이 수백만 개가 되면 이 차이가 수 초 대 수 밀리초입니다.

> MySQL, PostgreSQL 은 \`EXPLAIN\` 만 씁니다. 출력 형식은 다르지만 "인덱스를 탔는가" 를 보는 목적은 같습니다.

## 여기까지 왔다면

SELECT 부터 트랜잭션까지 실무 SQL 의 뼈대를 다 봤습니다. 이제 연습장에서 샘플 데이터로 스스로 질문을 만들고 답을 구해 보세요.
"이번 달 매출 상위 3개 카테고리는?", "한 번도 성적을 못 받은 학생은?" 같은 질문이 좋은 연습입니다.
`,
    },
  ],
}
