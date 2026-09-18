import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { Header } from './components/layout/Header'
import { NavRail } from './components/layout/NavRail'
import { ShortcutsDialog } from './components/layout/ShortcutsDialog'
import type { Preset } from './db/presets'
import { useDbStore } from './store/db-store'
import { useDescriptionStore } from './store/description-store'
import { useEditorStore } from './store/editor-store'
import { applyTheme, useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'
import { PlaygroundView } from './views/PlaygroundView'

// 첫 화면에 필요 없는 뷰는 메뉴를 눌렀을 때 내려받는다 (번들 분리)
const LearnView = lazy(() => import('./views/LearnView').then((m) => ({ default: m.LearnView })))
const ProblemsView = lazy(() => import('./views/ProblemsView').then((m) => ({ default: m.ProblemsView })))
const SettingsView = lazy(() => import('./views/SettingsView').then((m) => ({ default: m.SettingsView })))

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
      void loadPreset(preset)
      setDescriptions(preset.descriptions)
    },
    [tables, loadPreset, setDescriptions],
  )

  if (status === 'loading') return <Centered>DB 엔진을 불러오는 중…</Centered>
  if (status === 'error') return <Centered>DB 엔진을 불러오지 못했습니다: {loadError}</Centered>

  return (
    <div className="flex h-full bg-canvas text-fg">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onRun={() => void run(code)} onReset={handleReset} onLoadPreset={handleLoadPreset} onShowShortcuts={() => setShowShortcuts(true)} />
        <main className="relative min-h-0 flex-1 pr-2 pb-2">
          {/* 한 화면이 깨져도 메뉴는 살아 있게 하고, 다른 메뉴로 옮기면 다시 시도한다 */}
          <ErrorBoundary key={view}>
          {view === 'playground' && <PlaygroundView />}
          <Suspense fallback={<Centered>불러오는 중…</Centered>}>
            {view === 'learn' && <LearnView />}
            {view === 'problems' && <ProblemsView />}
            {view === 'settings' && <SettingsView />}
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-fg-muted">{children}</div>
}
