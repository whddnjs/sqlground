<!-- gitifact-guide: G-w3sv4ezcpy -->

# 디자인 시스템 지침

## 방향

"정돈된 개발 도구" (Linear, Supabase 대시보드 느낌). 강조색은 인디고·바이올렛. 라이트와 다크 모두 완성도 있게 유지한다.

## 색은 토큰으로만

- 토큰은 `src/index.css` 의 `@theme` 에 의미 기반으로 정의하고, `.dark` 블록에서 값만 바꾼다
- 컴포넌트는 `bg-surface`, `text-fg-muted`, `border-line`, `bg-accent` 같은 토큰 클래스만 쓴다. `neutral-*`, `blue-*` 같은 원시 색 클래스와 `dark:` 쌍을 새로 만들지 않는다. `dark:` 는 상태색(emerald, red, amber)에만 허용한다
- 토큰의 뜻: canvas(앱 바탕) / surface(카드·패널) / subtle(표 머리, 코드 조각, 입력 뒤) / hover, hover-strong / line, line-strong / fg, fg-muted, fg-subtle(글자 3단계) / accent, accent-hover, accent-soft(옅은 강조 면), accent-fg(그 위 글자)
- 이유: 라이트·다크가 한 구조로 움직여야 화면이 누더기가 되지 않고, 색을 바꿀 때 한 곳만 고치면 된다
- 글자 토큰(fg-subtle 포함)과 강조색 위 흰 글자는 라이트·다크 모두 4.5:1 이상을 지킨다. 토큰 값을 바꾸면 `pnpm e2e` 의 접근성 테스트(`e2e/a11y.spec.ts`, axe)가 주요 화면을 다시 잰다. 처음엔 fg-subtle 이 3.2:1 이라 작은 안내 글이 잘 안 보였다

## 글꼴

- 본문 Pretendard Variable, 코드·그리드 숫자 JetBrains Mono Variable. npm 패키지로 자체 호스팅한다
- 숫자 열은 `tabular-nums` 로 자릿수를 맞춘다

## 공통 부품

`src/index.css` 의 `@layer components` 에 있다. 새 화면은 이것부터 쓴다.

- 버튼 `.btn` + `.btn-primary` / `.btn-ghost` / `.btn-outline` / `.btn-danger`, 작은 크기 `.btn-sm`, 아이콘만 `.btn-icon`
- 입력 `.input`, 카드 `.card`, 배지 `.badge`, 섹션 제목 `.section-label`, 키 표시 `.kbd`
- 버튼 안에 장식 텍스트(단축키 표시 등)를 넣을 때는 `aria-hidden` 을 붙이고 버튼에 `aria-label` 을 준다. 접근성 이름이 바뀌면 테스트 셀렉터와 스크린리더가 함께 깨진다

## 폰 폭 (md 미만)

- 학습은 읽고 예제를 실행할 수 있어야 하고, 연습장·문제풀이는 깨지지만 않으면 된다(쿼리를 폰으로 치는 사람은 거의 없다). 전면 모바일 UI 는 만들지 않는다
- 메뉴는 아래 탭(`NavRail` 의 `order-last md:order-none`), 헤더 버튼은 아이콘만, 학습·문제 목록은 `SideList` 로 버튼을 눌러 여는 덮개가 된다
- 세로 배치에는 `flex-col-reverse` 를 쓰지 않는다. 넘친 내용이 위로 자라 스크롤로 닿지 않는다. `order` 로 순서만 바꾼다
- 스크롤 컨테이너의 부모 체인에 `min-h-0` 이 빠지면 폰에서 페이지 전체가 늘어난다

## 레이아웃

- 앱 바탕(canvas) 위에 패널이 카드(surface)로 뜬다. 패널 사이 여백이 크기 조절 핸들(`.resize-handle`)이다
- 다이얼로그는 `components/ui/Modal.tsx` 를 쓴다
- 버튼 안에 버튼을 두지 않는다. 접기 버튼과 액션 버튼은 형제 요소로 둔다

## 에디터

- `src/components/editor/editor-theme.ts` 가 CSS 변수(`--syn-*`)로 구문 색을 정의한다. 연습장, 학습 예제, 문제풀이 세 에디터가 `sqlExtensions()` 로 같은 테마와 자동완성을 쓴다
- @uiw/react-codemirror 의 기본 테마는 `theme="none"` 으로 끈다. 켜면 앱 배경과 어긋난다
- 현재 줄 배경(`--syn-active-line`)은 반투명(rgb … / 0.0x)이어야 한다. CodeMirror 는 선택 영역을 본문 아래 층에 그리므로 불투명한 줄 배경이 선택 영역을 덮어 "드래그해도 블록이 안 보이는" 버그가 된다. 연습장만 현재 줄 강조를 켜 두고 있어 연습장에서만 나타났다

## 브랜드

로고는 `components/layout/Logo.tsx`. 파비콘(`public/favicon.svg`)과 공유 이미지(`public/og.png`)는 같은 모양·색이어야 한다.
