import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { NavRail } from './components/layout/NavRail'
import { useDbStore } from './store/db-store'
import { useUiStore } from './store/ui-store'
import { ComingSoon } from './views/ComingSoon'
import { PlaygroundView } from './views/PlaygroundView'

const INITIAL_SQL = `-- Cmd/Ctrl + Enter 로 실행합니다. 선택 영역이 있으면 그 부분만 실행합니다.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER
);

INSERT INTO users (name, age) VALUES ('민수', 25), ('지영', 31), ('현우', NULL);

SELECT * FROM users;
`

export default function App() {
  const { status, loadError, init, run, reset } = useDbStore()
  const view = useUiStore((s) => s.view)
  const [code, setCode] = useState(INITIAL_SQL)

  useEffect(() => {
    void init()
  }, [init])

  const handleRun = useCallback((sql: string) => run(sql), [run])
  const handleReset = useCallback(() => {
    if (window.confirm('모든 테이블과 데이터를 지우고 빈 DB 로 초기화할까요?')) void reset()
  }, [reset])

  if (status === 'loading') return <Centered>DB 엔진을 불러오는 중…</Centered>
  if (status === 'error') return <Centered>DB 엔진을 불러오지 못했습니다: {loadError}</Centered>

  return (
    <div className="flex h-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onRun={() => run(code)} onReset={handleReset} />
        <main className="min-h-0 flex-1">
          {view === 'playground' && <PlaygroundView code={code} onCodeChange={setCode} onRun={handleRun} />}
          {view === 'problems' && (
            <ComingSoon
              title="문제풀이"
              description="단계별 SQL 문제를 풀고 정답 쿼리 결과와 비교합니다."
              planned={['난이도별 문제 목록 (기초 조회 → JOIN → 집계 → 서브쿼리)', '내 쿼리 결과와 정답 결과 자동 비교', '풀이 진행도 저장']}
            />
          )}
          {view === 'settings' && (
            <ComingSoon
              title="설정"
              description="에디터와 화면 동작을 취향에 맞게 조정합니다."
              planned={['테마 (시스템 / 라이트 / 다크)', '에디터 글꼴 크기, 키워드 대문자 자동 변환', 'DB 파일 내보내기 / 가져오기', '로그인과 클라우드 저장']}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-neutral-500">{children}</div>
}
