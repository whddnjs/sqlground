# SQLGround 설계 문서

> 설치 없이 브라우저에서 바로 SQL을 연습하는 웹사이트
> 작성일: 2026-09-15

## 1. 배경과 목적

DB 초보자가 SQL을 처음 연습하려면 개인 PC에 DB를 설치하고, 에디터도 설치하고, DB 종류가 바뀌면 또 설치해야 한다. 이 번거로움을 없애기 위해 **브라우저 안에서 모든 것이 동작하는 SQL 연습장**을 만든다.

- 설치 없음. 링크만 열면 바로 사용
- 쿼리는 서버가 아니라 **브라우저 안에서 실행**
- 초보자를 위해 SQL을 몰라도 UI로 테이블 생성과 데이터 조작이 가능
- DB 종류는 하나로 시작하고 나중에 추가

## 2. 핵심 기술 결정

### 2.1 브라우저 DB 엔진

브라우저에서 실제로 실행 가능한 엔진은 세 가지다. MySQL은 WASM 버전이 없어 브라우저 실행이 불가능하다.

| 엔진 | 라이브러리 | 특징 |
|---|---|---|
| SQLite | sql.js | 가볍고 안정적. 문법 단순. **1차 선택** |
| PostgreSQL | PGlite (WASM) | 실무 문법 그대로. 약 3MB. 2차 추가 후보 |
| DuckDB | duckdb-wasm | 분석 쿼리 특화. 연습 목적엔 과함 |

**결정: SQLite(sql.js)로 시작.** 가장 빠르게 프로토타입을 띄울 수 있다.

엔진 교체에 대비해 UI는 엔진에 직접 의존하지 않고 `DbEngine` 인터페이스만 바라본다.

```ts
interface DbEngine {
  init(): Promise<void>
  exec(sql: string): ExecOutcome          // 여러 문장 실행. 문장별 결과 + 실패 시 에러
  getTables(): TableInfo[]                // 스키마 브라우저용
  getColumns(table: string): ColumnInfo[]
  export(): Uint8Array                    // 영속화·다운로드용
  import(data: Uint8Array): Promise<void>
}
```

### 2.2 프레임워크

| 기준 | Next.js | Vite + React | Angular |
|---|---|---|---|
| SSR/서버 기능 | 있음. 이 프로젝트엔 불필요, 오히려 걸림돌 | 없음. 적합 | 없음. 적합 |
| sql.js WASM 로딩 | ssr:false 우회, wasm 경로 문제 | `?url` import로 해결. 가장 쉬움 | assets 등록. 쉬운 편 |
| 정적 배포 | `output: 'export'` 필요 | 그대로 됨 | 그대로 됨 |
| 에디터·그리드·패널 라이브러리 | 풍부 | 풍부 | 상대적으로 적음 |
| 설정 복잡도 | 높음 | 낮음 | 중간 |

**결정: Vite + React + TypeScript.**

- Next.js 제외 이유: 이 앱은 브라우저에서만 돈다. Next.js의 장점은 전부 서버 쪽에 있어 SSR 우회 비용만 생긴다.
- Angular 제외 이유: 가능은 하나 에디터, 그리드, 리사이즈 패널을 직접 래핑해야 하는 부분이 많다.
- 나중에 Next.js가 필요해져도(공유 페이지 SEO 등) 컴포넌트, 스토어, `DbEngine` 레이어는 그대로 옮길 수 있다.

### 2.3 로그인이 들어올 경우

로그인이 추가되어도 프레임워크 결정은 바뀌지 않는다. 필요한 것은 "사용자별 작은 데이터 저장"이고, **Supabase**(Auth + Postgres + RLS + Storage)로 브라우저에서 직접 처리한다. 서버 로직이 꼭 필요해지면(문제 채점 은닉 등) NestJS를 별도 API로 붙인다.

## 3. 기술 스택

| 역할 | 선택 |
|---|---|
| 빌드 | Vite + React + TypeScript |
| DB | sql.js (`DbEngine` 인터페이스 뒤에 숨김) |
| SQL 에디터 | CodeMirror 6 (`@uiw/react-codemirror` + `@codemirror/lang-sql`) |
| 결과 그리드 | 직접 구현한 테이블 (TanStack Table v9는 API가 크게 바뀌어 단순 그리드엔 과함) |
| 레이아웃 | `react-resizable-panels` |
| UI | Tailwind + shadcn/ui |
| 상태 관리 | zustand |
| 영속화 | IndexedDB (`idb-keyval`, DB 바이너리 저장) |
| 라우팅 | 없음. 단일 화면 |
| 배포 | 정적 호스팅 (Vercel 또는 GitHub Pages). 백엔드 없음, 비용 0 |

## 4. 기능 범위

### 4.1 1차 범위 (MVP)

**쿼리 실행**
- SQL 에디터에서 작성한 쿼리를 브라우저에서 실행
- 문법 강조, 테이블·컬럼 자동완성
- 쿼리 실행 히스토리

**결과 그리드**
- 행 수, 실행 시간 표시
- 결과가 많을 때 페이지네이션
- 셀 더블클릭으로 수정하면 UPDATE 실행 (UI 편집과 통합)

**UI 모드 (초보자용)**
- 테이블 생성 폼 (컬럼명, 타입, PK, NOT NULL 등)
- 데이터 추가, 수정, 삭제 폼
- **UI 조작 시 생성된 SQL을 화면에 노출** → UI 모드와 쿼리 모드를 잇는 교육적 핵심이자 이 사이트의 차별점

**스키마 브라우저**
- 사이드바에 테이블 목록, 컬럼, 타입 상시 표시

**샘플 데이터셋**
- 빈 DB에서는 SELECT 연습이 불가능하므로 버튼 하나로 프리셋 로드
- 예: 쇼핑몰(고객, 주문, 상품), 학교(학생, 수업, 성적)

**상태 저장과 복구**
- IndexedDB에 DB 바이너리 저장. 새로고침해도 유지
- 초기화 버튼
- 실행 전 상태로 되돌리기 (스냅샷). 초보자는 DROP TABLE을 반드시 실수한다
- DB 파일 내보내기 / 가져오기

**친절한 에러**
- 엔진 원문 에러 아래에 한글 설명 한 줄
- 자주 나오는 에러 10개 정도만 매핑

### 4.2 나중 범위

- 문제 풀이 모드 (정답 쿼리 결과와 비교하는 방식)
- PostgreSQL(PGlite) 엔진 추가
- ERD 시각화
- URL로 DB 상태 공유
- 로그인, 클라우드 저장 (Supabase)

## 5. 화면 구성 (초안)

```
┌──────────────┬──────────────────────────────────────┐
│ 스키마       │ SQL 에디터                            │
│ 브라우저     │ (CodeMirror)                          │
│              │                          [실행] [되돌리기] │
│ ▸ customers  ├──────────────────────────────────────┤
│ ▸ orders     │ 결과 그리드 / 생성된 SQL / 에러       │
│ ▸ products   │ (페이징 테이블)                       │
│              │                                       │
│ [+ 테이블]   │                                       │
│ [샘플 로드]  │                                       │
└──────────────┴──────────────────────────────────────┘
```

- 좌측: 스키마 브라우저 + 테이블 생성, 샘플 로드 버튼
- 우측 상단: SQL 에디터
- 우측 하단: 결과 탭 (그리드 / UI 조작으로 생성된 SQL / 에러 / 히스토리)
- 세 영역은 드래그로 크기 조절

## 6. 폴더 구조 (초안)

```
src/
  db/
    engine.ts          # DbEngine 인터페이스
    sqlite/            # sql.js 구현
    presets/           # 샘플 데이터셋 SQL
    snapshot.ts        # 되돌리기용 스냅샷
    persist.ts         # IndexedDB 저장/복원
  store/               # zustand 스토어 (스키마, 히스토리, 결과)
  components/
    editor/            # SQL 에디터
    result/            # 결과 그리드, 에러 표시
    schema/            # 스키마 브라우저
    forms/             # 테이블 생성, 데이터 추가/수정 폼
    layout/            # 리사이즈 패널
  lib/
    sql-builder.ts     # UI 조작 → SQL 문자열 생성
    error-messages.ts  # 에러 한글 매핑
```

## 7. 배포

**결정: Vercel + GitHub 연동.** 백엔드가 없으므로 `vite build` 결과물(`dist/`)만 정적 호스팅한다.

| 호스팅 | 장점 | 단점 |
|---|---|---|
| Vercel (선택) | 설정 최소, push마다 자동 배포, PR 미리보기 URL | 무료 플랜 대역폭 100GB/월 (충분) |
| Cloudflare Pages | 대역폭 무제한 | 설정이 조금 더 필요 |
| GitHub Pages | 저장소만 있으면 됨 | 하위 경로라 Vite `base` 설정 필요, 미리보기 없음 |

배포 흐름
1. GitHub에 `sqlground` 저장소 생성 후 push
2. Vercel에서 저장소 import. Vite 자동 감지
3. 이후 `main` push마다 자동 배포

주의 사항
- sql.js의 `sql-wasm.wasm`(약 1MB)은 `application/wasm` MIME으로 서빙되어야 하며, 위 호스팅 모두 기본 지원
- COOP/COEP 헤더는 sql.js, PGlite 모두 불필요
- Vite가 해시 파일명을 붙이므로 캐시 문제 없음
- 도메인은 `sqlground.vercel.app`으로 시작, 필요 시 커스텀 도메인 연결
- 나중에 Supabase 추가 시 환경변수만 Vercel 대시보드에 등록

## 8. 구현 세부 결정

코드 작성 시 바로 부딪히는 항목들. 기존 프로젝트(17_suzume-jong) 관례를 따른다.

### 개발 환경
- 패키지 매니저: pnpm
- Node 22
- oxlint + Vitest (`pnpm lint`, `pnpm test`). Vite 8 템플릿 기본이 oxlint라 그대로 사용
- 단위 테스트 대상: `DbEngine`, `sql-builder`, `error-messages`. UI는 수동 확인
- 커밋: `<type>: <subject>` 형식. 단일 프로젝트이므로 scope 생략
- GitHub 저장소명 `sqlground`, 공개 저장소

### 제품 규칙
- UI 언어: 한국어만. i18n 없음
- 다크 모드: 시스템 설정 따름 (shadcn 기본)
- 워크스페이스: DB 1개. 다중 DB는 나중

### 쿼리 실행
- 단축키 `Ctrl/Cmd + Enter`
- 선택 영역이 있으면 선택 부분만, 없으면 에디터 전체 실행
- 여러 문장이면 순서대로 실행하고 각 문장의 결과를 순서대로 표시
- 문장 하나라도 실패하면 그 지점에서 중단하고 에러 표시

### 스냅샷과 영속화
- 실행 직전마다 `export()`로 스냅샷 저장, 최근 10개 유지 (메모리)
- 실행 성공 후 500ms 디바운스로 IndexedDB 저장
- "되돌리기"는 직전 스냅샷을 `import()`

### 결과 그리드
- 그리드에 최대 1,000행 로드, 페이지당 50행
- 초과 시 "1,000행까지만 표시" 안내
- 셀 더블클릭 편집은 PK가 있는 단일 테이블 SELECT 결과에서만 활성화

### 테이블 생성 폼
- 타입: SQLite 5종 (INTEGER, TEXT, REAL, NUMERIC, BLOB)
- 제약: PRIMARY KEY, AUTOINCREMENT, NOT NULL, UNIQUE, DEFAULT
- FOREIGN KEY는 폼에서 제외. 쿼리로만 가능 (2단계에서 추가)

### 샘플 데이터셋
- 1차: 쇼핑몰 1개 (`customers`, `products`, `orders`, `order_items`), 테이블당 20~50행
- 학교 데이터셋은 쇼핑몰 완성 후 추가
- JOIN, GROUP BY, 서브쿼리 연습이 가능한 관계 구조로 설계

## 9. 진행 상황

2026-09-15 기준 1차 범위(MVP) 8단계 모두 구현 완료.

| 단계 | 상태 |
|---|---|
| 1. 프로젝트 생성 | 완료 |
| 2. sql.js + `DbEngine` | 완료 (테스트) |
| 3. 에디터 + 결과 그리드 | 완료 |
| 4. 스키마 브라우저 | 완료 |
| 5. 샘플 데이터셋 (쇼핑몰) | 완료 (테스트) |
| 6. IndexedDB 영속화 + 스냅샷 되돌리기 | 완료 |
| 7. UI 모드 (테이블 생성·행 추가·셀 편집·행 삭제·테이블 삭제 + SQL 노출) | 완료 (빌더 테스트) |
| 8. 에러 한글 매핑 | 완료 (테스트) |

추가로 구현된 것
- 앱 셸: 좌측 네비게이션 레일(연습장 / 문제풀이 / 설정), 헤더. 미구현 메뉴는 준비 중 화면
- 결과 패널 히스토리 탭 (에디터 / UI / 샘플 출처 표시, 에디터에 넣기)
- 에디터 내용 localStorage 유지

추가로 구현된 것 (2차)
- Ctrl+Enter 실행, 컬럼 한글 설명(브라우저 저장), 타입 한글 툴팁
- 관계도(ERD): FK 기준 배치, 박스·배경 드래그, 확대·축소
- 테이블 생성 폼 FK 옵션, 구조 변경(ALTER TABLE) 다이얼로그
- FOREIGN KEY 제약 강제 (sql.js export 가 연결을 다시 열어 PRAGMA 가 풀리는 문제 대응)
- 편집 그리드 NULL 입력, 결과 CSV 내보내기

추가로 구현된 것 (3차)
- 학교 샘플 데이터셋
- 설정 화면: 테마, 에디터 글꼴 크기, FK 제약 켜기/끄기, DB 파일 내보내기/가져오기
- 학습 메뉴: 5장 21단원 커리큘럼 + 문법 검색. 예제는 연습장과 분리된 학습용 DB 에서 즉시 실행. 완료 체크. 모든 예제를 실행 검증하는 테스트 (`src/learn/content/content.test.ts`)

학습 메뉴 설계 결정 (2026-09-15)
- 대상: SQL 만 처음인 개발자 (DB 개념 챕터는 짧게)
- 예제 실행: 학습 페이지 안, 격리 DB (쇼핑몰 + 학교 샘플 자동 로드)
- 구성: 순차 커리큘럼이면서 키워드 검색으로 문법 사전 역할
- 진행도: 완료 체크만. 연습 문제는 문제풀이 메뉴에서 단원별로 연결 예정
- 구현 규칙: react-markdown 의 `components` 는 모듈 상수로 고정한다. 렌더마다 새 객체를 넘기면 예제 블록이 다시 마운트돼 실행 결과가 사라진다. 바뀌는 값(테이블 목록, 실행 함수)은 `LessonDbContext` 로 전달
- 콘텐츠 규칙: ```sql 블록은 실행 가능해야 하며, 의도적으로 에러를 보여 주는 예제는 블록 안 주석이나 바로 앞 문단에 "에러" 를 적는다 (테스트가 이 규칙으로 판별)

추가로 구현된 것 (4차)
- 테이블 접기(상태 저장), 관계도를 스키마 패널 버튼 + 전체 화면 오버레이로 이동, 관계도에서 테이블 조작
- 단축키 안내 (헤더 ? 버튼, ? 키)
- 회사 샘플 (자기 참조, NULL 허용 FK, 실수 급여) + 윈도우 함수·재귀 CTE 단원
- 문제풀이 모드: 27문제, 학습 단원 연결, 값 기준 결과 비교 채점, 힌트·정답 보기, 진행도 저장. 정답 검증 테스트 (`src/problems/content/problems.test.ts`)

문제풀이 채점 규칙
- 열 이름은 무시하고 값만 비교. 열 개수와 행 수가 먼저 같아야 함
- `orderMatters` 가 아니면 행 순서 무시 (정렬 후 비교)
- 실수는 소수 4자리에서 비교, 숫자 모양 문자열은 숫자로 취급
- 정답 쿼리는 제출 시점의 학습용 DB 에서 같이 실행하므로 예제로 데이터가 바뀌어도 일관됨

추가로 구현된 것 (5차)
- 모든 SQL 에디터에 테이블·컬럼 자동완성 (점 없이도 쿼리에 등장한 테이블의 컬럼 제안)
- 문제 27 → 44개: 학교·회사 샘플 문제, 데이터 변경 문제(스냅샷 → 실행 → 확인 쿼리 → 복원)
- 학습 단원 끝 "이 단원 문제 풀기" 링크 (학습 ↔ 문제풀이 양방향)
- 결과 그리드 여러 행 선택 삭제
- 연습장 쿼리 탭

추가로 구현된 것 (6차, 2026-09-17 점검 결과 반영)
- 되돌리기: DB 가 실제로 바뀐 실행에만 스냅샷·저장 (change token 비교). 트랜잭션 중에는 스냅샷과 자동 저장을 미룸
- 쿼리를 Web Worker 에서 실행. 실행 중에도 화면이 반응하고 중단 버튼과 시간 제한(연습장 30초, 학습·문제 10초)이 있음
- 에러 바운더리, 브라우저 저장값 형식 검증, 파비콘·OG 메타·공유 이미지
- GitHub Actions CI 와 Playwright e2e 15개 (`pnpm e2e`)

엔진 구조
- `SqliteEngine` (동기, sql.js 직접 호출): 워커 안에서 돌고, 단위 테스트가 직접 사용
- `WorkerEngine` (`AsyncDbEngine`): 화면에서 쓰는 비동기 래퍼. 메시지 프로토콜은 `src/db/worker/protocol.ts`
- 중단은 워커 종료 → 새 워커 → 복구 지점 import. sql.js 가 실행 중인 쿼리를 밖에서 멈출 수 없어서다
- 복구 지점: 연습장은 `run()` 이 실행 직전에 먼저 보내는 스냅샷, 학습·문제풀이는 샘플 로드 직후 `checkpoint()`
- 주의: sql.js 의 `export()` 는 연결을 다시 열어 PRAGMA 와 열린 트랜잭션을 없앤다. export 를 부르는 모든 경로(스냅샷, 자동 저장)가 이 점을 고려해야 한다

## 9-1. 디자인 시스템 (2026-09-18)

방향: "정돈된 개발 도구" (Linear, Supabase 대시보드 느낌). 강조색 인디고·바이올렛.

- 토큰: `src/index.css` 의 `@theme` 에 의미 기반 색을 정의하고 `.dark` 에서 값만 바꾼다. 컴포넌트는 `bg-surface`, `text-fg-muted`, `border-line`, `bg-accent` 같은 토큰 클래스만 쓰고 `dark:` 는 상태색(emerald/red/amber)에만 남긴다
  - canvas(앱 바탕) / surface(카드·패널) / subtle(표 머리, 입력 뒤) / hover / line / fg 3단계 / accent, accent-soft, accent-fg
- 글꼴: Pretendard Variable(본문), JetBrains Mono Variable(코드·그리드 숫자). npm 패키지로 자체 호스팅
- 공통 부품: `.btn .btn-primary/.btn-ghost/.btn-outline/.btn-danger/.btn-sm`, `.btn-icon`, `.input`, `.card`, `.badge`, `.section-label`, `.kbd` (index.css @layer components)
- 레이아웃: 바탕(canvas) 위에 패널이 카드(surface)로 뜬다. 패널 사이 여백이 크기 조절 핸들(`.resize-handle`)
- 에디터: `src/components/editor/editor-theme.ts` 가 CSS 변수(`--syn-*`)로 구문 색을 정의. 세 에디터(연습장, 학습 예제, 문제풀이)가 `sqlExtensions()` 로 같은 테마를 쓴다. @uiw 기본 테마는 `theme="none"` 으로 끈다
- 새 화면을 만들 때: 원시 색 클래스(neutral-*, blue-*)를 쓰지 말고 토큰과 공통 부품을 쓴다. 로고는 `components/layout/Logo.tsx`, 파비콘·OG 이미지와 같은 모양

## 10. 다음 후보

- PostgreSQL(PGlite) 엔진, URL 공유, Supabase 로그인
- 모바일 레이아웃 (현재 데스크톱 전용, 400px 에서 가로 스크롤 발생)
- 브라우저 기본 확인창(window.confirm) 9곳을 자체 다이얼로그로 교체
- 접근성: 스키마 브라우저의 버튼 안 버튼 중첩 해소
- 히스토리 영속화, 학습 본문 검색, 첫 방문 안내

## 11. 배포 현황 (2026-09-15)

- GitHub: https://github.com/whddnjs/sqlground (공개, main)
- Vercel: https://sqlground.vercel.app (프로젝트 whddnjs-projects/sqlground, GitHub 연동으로 main push 시 자동 배포)
- 고유 배포 URL(`sqlground-xxxx-whddnjs-projects.vercel.app`)은 Vercel 인증 보호가 걸려 있어 외부에서 열리지 않음. 공유는 항상 `sqlground.vercel.app` 로
- 번들 분리 적용: 첫 화면 810KB, 학습 콘텐츠·문제풀이·설정·관계도는 지연 로딩
