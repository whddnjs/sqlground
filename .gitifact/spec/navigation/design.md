<!-- gitifact-design: S-4wg7gb5fn7 -->

# 화면 이동과 주소 설계

## 개요

react-router 로 화면 전환을 URL 에 맡긴다. 이전에는 zustand 상태(`view`)와 브라우저 저장소의 "마지막 선택" 으로 화면을 정했고, 그래서 뒤로 가기와 링크 공유가 되지 않았다.

## 구조와 데이터

- `src/routes.ts`: 주소 상수와 생성 함수. 컴포넌트는 문자열을 직접 쓰지 않고 이것을 쓴다.
- `App.tsx`: `<Routes>` 로 화면을 고르고, 화면별 지연 로딩과 에러 바운더리는 그대로 둔다. 바운더리 key 는 pathname.
- `NavRail`: `<NavLink>`. 활성 표시는 라우터의 isActive 로. 연습장은 `/` 라 `end` 를 준다.
- `LearnView` / `ProblemsView`: `useParams` 의 id 가 곧 현재 항목. 목록 클릭·이전·다음·관련 단원·이 단원 문제 풀기는 모두 `navigate()` 다.
- 마지막 선택(`learn-store.lastLesson`, `problem-store.lastProblem`)은 그대로 유지하되 역할이 바뀐다. 이제는 id 없는 `/learn`, `/problems` 에서 어디로 보낼지 정하는 용도이며, 현재 항목이 정해질 때마다 갱신한다.
- `vercel.json` rewrites: 정적 호스팅에서 `/learn/join` 같은 깊은 주소를 직접 열면 index.html 을 돌려주도록 한다. `assets/`, 파비콘, 공유 이미지는 제외.

## 처리 흐름

<!-- gitifact-ref: R-deywsidxcj -->

- 메뉴 클릭 → NavLink 이동 → Routes 가 화면을 고른다.
- `/learn` → 마지막 단원(없으면 첫 단원)으로 `<Navigate replace>`. 존재하지 않는 id 도 같은 규칙으로 첫 단원으로 보낸다. 문제풀이도 동일.
- 문제 화면은 문제 id 가 바뀌면 에디터 내용·결과·힌트 상태를 **렌더 중에** 새 문제의 것으로 바꾼다. effect 로 초기화하면 그 사이에 들어온 입력이 지워지는 틈이 생겨 e2e 에서 경합이 드러났다.

## 오류 처리와 검증

- 알 수 없는 주소는 `*` 라우트가 연습장으로 보낸다.
- e2e: 단원·문제 주소 직접 열기와 새로고침, 문제 → 관련 단원 → 뒤로 가기, 없는 id 와 id 없는 메뉴의 이동 규칙. 메뉴는 role=link 로 찾는다.

## 주요 설계 결정

- 라우터 도입 시점: 처음엔 연습장 하나라 "라우팅 없음" 으로 시작했고, 학습·문제풀이가 붙은 뒤에도 재검토하지 않았다. 사용자가 지적해 도입했다.
- BrowserRouter 를 택하고 HashRouter 를 기각한 이유: 공유 주소가 깔끔해야 하고, Vercel rewrite 한 줄이면 깊은 주소가 해결된다.
- 주소에 DB 상태를 넣지 않는 이유: URL 공유(DB 내용 포함)는 별도 기능으로 크기와 압축 문제를 따로 다뤄야 한다.
