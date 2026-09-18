import { ChevronDown, CircleHelp, Play, RotateCcw, Square, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PRESETS, type Preset } from '../../db/presets'
import { useDbStore } from '../../store/db-store'
import { useUiStore } from '../../store/ui-store'

interface Props {
  onRun(): void
  onReset(): void
  onLoadPreset(preset: Preset): void
  onShowShortcuts(): void
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function Header({ onRun, onReset, onLoadPreset, onShowShortcuts }: Props) {
  const view = useUiStore((s) => s.view)
  const undoCount = useDbStore((s) => s.undoCount)
  const undo = useDbStore((s) => s.undo)
  const running = useDbStore((s) => s.running)
  const cancel = useDbStore((s) => s.cancel)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 pr-3 pl-1">
      <h1 className="text-[15px] font-semibold tracking-tight">SQLGround</h1>

      <button
        disabled
        title="PostgreSQL 등 다른 DB는 준비 중입니다"
        className="flex h-6 items-center gap-1 rounded-full border border-line-strong bg-surface pr-1.5 pl-2 text-[11px] font-medium text-fg-muted disabled:cursor-not-allowed"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        SQLite
        <ChevronDown size={11} className="text-fg-subtle" />
      </button>

      <div className="ml-auto flex items-center gap-0.5">
        {view === 'playground' && (
          <>
            <PresetMenu onSelect={onLoadPreset} />
            <button
              className="btn btn-ghost"
              disabled={undoCount === 0}
              onClick={() => void undo()}
              title={undoCount === 0 ? '되돌릴 실행이 없습니다' : `직전 실행 전으로 되돌립니다 (${undoCount}단계 남음)`}
            >
              <RotateCcw size={14} />
              되돌리기
            </button>
            <button className="btn btn-ghost" onClick={onReset} title="모든 테이블과 데이터를 지웁니다">
              <Trash2 size={14} />
              초기화
            </button>
            <span className="mx-1.5 h-5 w-px bg-line-strong" />
          </>
        )}
        <button onClick={onShowShortcuts} title="단축키 안내 (?)" aria-label="단축키 안내" className="btn-icon">
          <CircleHelp size={16} />
        </button>
        {view === 'playground' &&
          (running ? (
            <button onClick={cancel} title="실행을 멈추고 DB 를 실행 직전 상태로 되돌립니다" className="btn btn-danger ml-1.5">
              <Square size={12} fill="currentColor" />
              중단
            </button>
          ) : (
            <button onClick={onRun} title="Cmd/Ctrl + Enter" aria-label="실행" className="btn btn-primary ml-1.5 pr-1.5">
              <Play size={13} fill="currentColor" />
              실행
              <span aria-hidden="true" className="ml-1 rounded bg-white/15 px-1 font-mono text-[10px] font-normal text-white/80">{IS_MAC ? '⌘↵' : 'Ctrl ↵'}</span>
            </button>
          ))}
      </div>
    </header>
  )
}

function PresetMenu({ onSelect }: { onSelect(preset: Preset): void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)} title="연습용 샘플 데이터를 불러옵니다" aria-expanded={open}>
        <Upload size={14} />
        샘플 로드
      </button>
      {open && (
        <ul className="absolute right-0 z-30 mt-1.5 w-80 rounded-lg border border-line-strong bg-surface p-1 shadow-pop">
          {PRESETS.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  setOpen(false)
                  onSelect(p)
                }}
                className="w-full rounded-md px-2.5 py-2 text-left hover:bg-hover"
              >
                <p className="flex items-center gap-2 text-[13px] font-medium">
                  {p.name}
                  <span className="badge">{p.tables.length} tables</span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{p.description}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
