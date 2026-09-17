# SQLGround

설치 없이 브라우저에서 바로 SQL 을 연습하는 웹사이트. **https://sqlground.vercel.app**

- DB 도, 에디터도 설치할 필요 없음. 링크만 열면 끝
- 쿼리는 서버가 아니라 **브라우저 안**(sql.js, SQLite WASM)에서 실행
- SQL 을 몰라도 UI 로 테이블 생성·데이터 조작이 가능하고, 그때 실행되는 SQL 을 그대로 보여 줌

## 기능

| 메뉴 | 내용 |
|---|---|
| 연습장 | SQL 에디터, 결과 그리드(셀 편집), 스키마 브라우저, 테이블 생성·구조 변경 폼, 관계도(ERD), 샘플 데이터 3종, 되돌리기, CSV 내보내기 |
| 학습 | 6장 23단원 커리큘럼. 예제를 페이지 안에서 바로 실행. 문법 검색, 완료 체크 |
| 문제풀이 | 학습 단원에 연결된 27문제. 정답 결과와 자동 비교 |
| 설정 | 테마, 글꼴 크기, FOREIGN KEY 제약, DB 파일 내보내기/가져오기 |

작업 내용은 IndexedDB 에 저장되어 새로고침해도 유지됩니다. 서버와 로그인이 없습니다.

## 개발

```bash
pnpm install
pnpm dev        # 개발 서버
pnpm test       # 단위 테스트 (엔진, SQL 빌더, 학습 예제·문제 정답 실행 검증)
pnpm e2e        # 브라우저 회귀 테스트 (Playwright, 빌드 결과물 대상)
pnpm build      # 정적 빌드 → dist/
```

Vite + React + TypeScript, sql.js, CodeMirror 6, zustand, Tailwind. 설계와 결정 사항은 [DESIGN.md](./DESIGN.md) 참고.
