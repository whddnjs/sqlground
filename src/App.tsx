import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { NavRail } from './components/layout/NavRail'
import { ShortcutsDialog } from './components/layout/ShortcutsDialog'
import type { Preset } from './db/presets'
import { useDbStore } from './store/db-store'
import { useDescriptionStore } from './store/description-store'
import { useEditorStore } from './store/editor-store'
import { applyTheme, useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'
import { ComingSoon } from './views/ComingSoon'
import { LearnView } from './views/LearnView'
import { PlaygroundView } from './views/PlaygroundView'
import { SettingsView } from './views/SettingsView'

export default function App() {
  const { status, loadError, tables, init, run, reset, loadPreset } = useDbStore()
  const code = useEditorStore((s) => s.code)
  const view = useUiStore((s) => s.view)
  const setDescriptions = useDescriptionStore((s) => s.setMany)
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => applyTheme(theme), [theme])

  const [showShortcuts, setShowShortcuts] = useState(false)
  useEffect(() => {
    // 입력 중이 아닐 때 ? 를 누르면 단축키 안내
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      setShowShortcuts(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleReset = useCallback(() => {
    if (window.confirm('모든 테이블과 데이터를 지우고 빈 DB 로 초기화할까요?')) void reset()
  }, [reset])
  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      const existing = tables.map((t) => t.name).filter((n) => preset.tables.includes(n))
      if (existing.length > 0 && !window.confirm(`이미 있는 테이블(${existing.join(', ')})을 샘플 데이터로 덮어씁니다. 계속할까요?`)) return
      loadPreset(preset)
      setDescriptions(preset.descriptions)
    },
    [tables, loadPreset, setDescriptions],
  )

  if (status === 'loading') return <Centered>DB 엔진을 불러오는 중…</Centered>
  if (status === 'error') return <Centered>DB 엔진을 불러오지 못했습니다: {loadError}</Centered>

  return (
    <div className="flex h-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onRun={() => run(code)} onReset={handleReset} onLoadPreset={handleLoadPreset} onShowShortcuts={() => setShowShortcuts(true)} />
        <main className="relative min-h-0 flex-1">
          {view === 'playground' && <PlaygroundView />}
          {view === 'learn' && <LearnView />}
          {view === 'problems' && (
            <ComingSoon
              title="문제풀이"
              description="단계별 SQL 문제를 풀고 정답 쿼리 결과와 비교합니다."
              planned={['난이도별 문제 목록 (기초 조회 → JOIN → 집계 → 서브쿼리)', '내 쿼리 결과와 정답 결과 자동 비교', '풀이 진행도 저장']}
            />
          )}
          {view === 'settings' && <SettingsView />}
        </main>
      </div>
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-neutral-500">{children}</div>
}
