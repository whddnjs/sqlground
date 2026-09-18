<!-- gitifact-guide: G-w3sv4ezcpy -->

# 디자인 시스템 지침

## 방향

"정돈된 개발 도구" (Linear, Supabase 대시보드 느낌). 강조색은 인디고·바이올렛. 라이트와 다크 모두 완성도 있게 유지한다.

## 색은 토큰으로만

- 토큰은 `src/index.css` 의 `@theme` 에 의미 기반으로 정의하고, `.dark` 블록에서 값만 바꾼다
- 컴포넌트는 `bg-surface`, `text-fg-muted`, `border-line`, `bg-accent` 같은 토큰 클래스만 쓴다. `neutral-*`, `blue-*` 같은 원시 색 클래스와 `dark:` 쌍을 새로 만들지 않는다. `dark:` 는 상태색(emerald, red, amber)에만 허용한다
- 토큰의 뜻: canvas(앱 바탕) / surface(카드·패널) / subtle(표 머리, 코드 조각, 입력 뒤) / hover, hover-strong / line, line-strong / fg, fg-muted, fg-subtle(글자 3단계) / accent, accent-hover, accent-soft(옅은 강조 면), accent-fg(그 위 글자)
- 이유: 라이트·다크가 한 구조로 움직여야 화면이 누더기가 되지 않고, 색을 바꿀 때 한 곳만 고치면 된다

## 글꼴

- 본문 Pretendard Variable, 코드·그리드 숫자 JetBrains Mono Variable. npm 패키지로 자체 호스팅한다
- 숫자 열은 `tabular-nums` 로 자릿수를 맞춘다

## 공통 부품

`src/index.css` 의 `@layer components` 에 있다. 새 화면은 이것부터 쓴다.

- 버튼 `.btn` + `.btn-primary` / `.btn-ghost` / `.btn-outline` / `.btn-danger`, 작은 크기 `.btn-sm`, 아이콘만 `.btn-icon`
- 입력 `.input`, 카드 `.card`, 배지 `.badge`, 섹션 제목 `.section-label`, 키 표시 `.kbd`
- 버튼 안에 장식 텍스트(단축키 표시 등)를 넣을 때는 `aria-hidden` 을 붙이고 버튼에 `aria-label` 을 준다. 접근성 이름이 바뀌면 테스트 셀렉터와 스크린리더가 함께 깨진다

## 레이아웃

- 앱 바탕(canvas) 위에 패널이 카드(surface)로 뜬다. 패널 사이 여백이 크기 조절 핸들(`.resize-handle`)이다
- 다이얼로그는 `components/ui/Modal.tsx` 를 쓴다
- 버튼 안에 버튼을 두지 않는다. 접기 버튼과 액션 버튼은 형제 요소로 둔다

## 에디터

- `src/components/editor/editor-theme.ts` 가 CSS 변수(`--syn-*`)로 구문 색을 정의한다. 연습장, 학습 예제, 문제풀이 세 에디터가 `sqlExtensions()` 로 같은 테마와 자동완성을 쓴다
- @uiw/react-codemirror 의 기본 테마는 `theme="none"` 으로 끈다. 켜면 앱 배경과 어긋난다

## 브랜드

로고는 `components/layout/Logo.tsx`. 파비콘(`public/favicon.svg`)과 공유 이미지(`public/og.png`)는 같은 모양·색이어야 한다.
