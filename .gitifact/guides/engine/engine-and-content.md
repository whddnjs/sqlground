<!-- gitifact-guide: G-lz24kkdkml -->

# 엔진 구조와 콘텐츠 규칙

## 구조

- `SqliteEngine` (`src/db/sqlite/`): sql.js 를 직접 부르는 동기 엔진. Web Worker 안에서 돌고, 단위 테스트가 직접 사용한다
- `WorkerEngine` (`src/db/worker/`): 화면에서 쓰는 비동기 래퍼(`AsyncDbEngine`). 메시지 프로토콜은 `protocol.ts`
- 화면은 `AsyncDbEngine` 만 본다. 나중에 PostgreSQL(PGlite) 등 다른 엔진을 붙일 때 이 경계를 유지한다
- 연습장 DB(`store/db-store.ts`)와 학습·문제풀이 DB(`learn/lesson-engine.ts`)는 서로 다른 엔진 인스턴스다. 예제와 문제를 아무리 실행해도 연습장 작업이 바뀌지 않아야 한다

## 되돌리기와 저장

- 실행 전후 change token(`total_changes` + `schema_version`)을 비교해 DB 가 실제로 바뀐 실행에만 스냅샷을 쌓고 IndexedDB 에 저장한다. 조회는 되돌리기 단계를 소모하지 않는다
- 판단 로직은 `src/db/run-with-snapshot.ts` 에 두고 테스트한다

## sql.js 의 함정

- `export()` 는 연결을 닫았다 다시 연다. 그래서 PRAGMA(FOREIGN KEY 강제)가 초기화되고, 열려 있던 트랜잭션이 사라진다
- 엔진은 export 뒤 PRAGMA 를 다시 걸고, 트랜잭션이 열려 있는 동안에는 스냅샷과 자동 저장을 미룬다. export 를 부르는 새 경로를 만들면 이 두 가지를 반드시 고려한다
- 실행 중인 쿼리를 밖에서 멈출 수 없다. 중단은 워커를 종료하고 새로 띄운 뒤 복구 지점(연습장은 실행 직전 스냅샷, 학습·문제풀이는 샘플 로드 직후 `checkpoint()`)을 import 하는 방식이다

## 학습·문제 콘텐츠 규칙

- 학습 본문의 ```sql 블록은 학습용 DB 에서 실제로 실행돼야 한다. 의도적으로 에러를 보여 주는 예제는 블록 안 주석이나 바로 앞 문단에 "에러" 를 적는다. 테스트가 이 규칙으로 판별한다
- 문제의 정답 쿼리는 샘플 DB 에서 실행되고 결과가 있어야 하며, 데이터 변경 문제(`checkSql`)는 아무것도 안 하면 오답이어야 한다
- react-markdown 의 `components` 는 모듈 상수로 고정한다. 렌더마다 새 객체를 넘기면 예제 블록이 다시 마운트돼 실행 결과가 사라진다. 바뀌는 값은 `LessonDbContext` 로 전달한다

## 검증

- 단위 테스트 `pnpm test`, 화면 회귀 `pnpm e2e`(빌드 결과물 대상, 항상 새로 빌드). 새 기능을 넣으면 e2e 에 흐름을 추가한다
- 로컬 preview 서버(4173)를 켜둔 채 e2e 를 돌리면 포트 충돌로 실패한다
