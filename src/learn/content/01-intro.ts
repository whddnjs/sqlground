import type { Chapter } from '../types'

export const INTRO: Chapter = {
  id: 'intro',
  title: '시작하기',
  lessons: [
    {
      id: 'what-is-sql',
      title: 'SQL 이란, 그리고 이 사이트 사용법',
      keywords: ['SQL', 'SQLite', '소개'],
      body: `
**SQL(Structured Query Language)** 은 데이터베이스에 "이런 데이터 보여줘", "이 값 바꿔줘" 하고 말하는 언어입니다.
프로그래밍 언어처럼 절차를 적는 게 아니라, **원하는 결과가 무엇인지** 선언하면 DB 가 알아서 찾아 줍니다.

이 사이트는 브라우저 안에서 **SQLite** 라는 DB 를 돌립니다. 설치할 것도, 서버도 없습니다.
SQLite 는 문법이 표준 SQL 과 거의 같아서 여기서 배운 내용은 MySQL, PostgreSQL 에서도 대부분 그대로 통합니다. 다른 부분은 그때그때 짚어 드립니다.

## 예제는 바로 실행됩니다

아래 상자가 예제입니다. **실행** 버튼이나 \`Cmd/Ctrl + Enter\` 로 실행해 보세요. 내용을 고쳐서 다시 실행해도 됩니다.

\`\`\`sql
SELECT '안녕하세요' AS greeting, 1 + 1 AS sum;
\`\`\`

학습 페이지의 예제는 **연습장과 분리된 학습용 DB** 에서 돌아갑니다. 예제를 아무리 실행해도 연습장의 내 작업은 바뀌지 않고, 위쪽 "예제 DB 초기화" 로 언제든 처음 상태로 돌아갑니다.

"연습장에서 열기" 를 누르면 그 SQL 이 연습장 에디터에 붙어 더 자유롭게 실험할 수 있습니다.

## 학습용 DB 에 들어 있는 것

두 가지 샘플 데이터가 미리 실려 있습니다.

| 샘플 | 테이블 | 연습 포인트 |
|---|---|---|
| 쇼핑몰 | customers, products, orders, order_items | JOIN, 집계, 매출 계산 |
| 학교 | students, courses, enrollments | 다대다 관계, NULL 성적, 학기별 평균 |

다음 단원에서 이 테이블들을 살펴봅니다.
`,
    },
    {
      id: 'tables',
      title: '테이블, 행, 열',
      keywords: ['테이블', 'table', '행', 'row', '열', 'column', '스키마'],
      body: `
DB 안의 데이터는 **테이블**에 들어 있습니다. 엑셀 시트 하나를 떠올리면 됩니다.

- **열(column)**: 세로 방향. 이름과 타입이 정해져 있습니다. \`name TEXT\`, \`price INTEGER\` 처럼요.
- **행(row)**: 가로 방향. 데이터 한 건입니다. 고객 한 명, 주문 한 건.
- **기본키(PRIMARY KEY, PK)**: 행을 유일하게 구분하는 열. 보통 \`id\`.

쇼핑몰 샘플의 \`products\` 테이블을 그대로 꺼내 보겠습니다.

\`\`\`sql
SELECT * FROM products;
\`\`\`

\`*\` 는 "모든 열" 이라는 뜻입니다. 결과의 각 줄이 행, 각 칸이 열입니다.

## 어떤 테이블이 있는지 보기

SQLite 에는 테이블 목록이 \`sqlite_master\` 라는 특별한 테이블에 들어 있습니다.

\`\`\`sql
SELECT name, sql FROM sqlite_master WHERE type = 'table';
\`\`\`

\`sql\` 열에 각 테이블을 만든 문장이 그대로 보입니다. 열 이름과 타입을 확인할 때 유용합니다.
연습장에서는 왼쪽 스키마 브라우저가 같은 정보를 보여 줍니다.

## 테이블끼리의 관계

쇼핑몰 샘플은 이렇게 이어져 있습니다.

\`\`\`text
customers ──< orders ──< order_items >── products
   (고객)     (주문)      (주문 상품)      (상품)
\`\`\`

\`orders.customer_id\` 는 "이 주문을 한 고객의 id" 입니다. 이런 열을 **외래키(FOREIGN KEY, FK)** 라고 합니다.
관계는 나중에 JOIN 단원에서 본격적으로 다룹니다. 연습장 옆 **관계도** 메뉴에서 그림으로도 볼 수 있습니다.

## SQL 문장 작성 규칙

- 문장 끝은 \`;\` 로 닫습니다. 한 번에 여러 문장을 실행할 수 있습니다.
- 키워드(SELECT, FROM)는 대소문자를 구분하지 않습니다. 관례상 대문자로 씁니다.
- 문자열은 **작은따옴표** \`'서울'\` 로 감쌉니다. 큰따옴표는 열 이름용입니다.
- \`--\` 뒤는 줄 끝까지 주석입니다.

\`\`\`sql
-- 서울에 사는 고객만
select name, city from customers where city = '서울';
\`\`\`
`,
    },
  ],
}
