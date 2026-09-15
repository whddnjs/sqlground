import { useCallback, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { NavRail } from './components/layout/NavRail'
import type { Preset } from './db/presets'
import { useDbStore } from './store/db-store'
import { useEditorStore } from './store/editor-store'
import { useUiStore } from './store/ui-store'
import { ComingSoon } from './views/ComingSoon'
import { PlaygroundView } from './views/PlaygroundView'

export default function App() {
  const { status, loadError, tables, init, run, reset, loadPreset } = useDbStore()
  const code = useEditorStore((s) => s.code)
  const view = useUiStore((s) => s.view)

  useEffect(() => {
    void init()
  }, [init])

  const handleReset = useCallback(() => {
    if (window.confirm('모든 테이블과 데이터를 지우고 빈 DB 로 초기화할까요?')) void reset()
  }, [reset])
  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      const existing = tables.map((t) => t.name).filter((n) => preset.tables.includes(n))
      if (existing.length > 0 && !window.confirm(`이미 있는 테이블(${existing.join(', ')})을 샘플 데이터로 덮어씁니다. 계속할까요?`)) return
      loadPreset(preset)
    },
    [tables, loadPreset],
  )

  if (status === 'loading') return <Centered>DB 엔진을 불러오는 중…</Centered>
  if (status === 'error') return <Centered>DB 엔진을 불러오지 못했습니다: {loadError}</Centered>

  return (
    <div className="flex h-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onRun={() => run(code)} onReset={handleReset} onLoadPreset={handleLoadPreset} />
        <main className="min-h-0 flex-1">
          {view === 'playground' && <PlaygroundView />}
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
