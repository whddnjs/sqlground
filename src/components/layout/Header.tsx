import { ChevronDown, CircleHelp, Play, RotateCcw, Square, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PRESETS, type Preset } from '../../db/presets'
import { useDbStore } from '../../store/db-store'
import { useUiStore } from '../../store/ui-store'

interface Props {
  onRun(): void
  onReset(): void
  onLoadPreset(preset: Preset): void
  onShowShortcuts(): void
}

export function Header({ onRun, onReset, onLoadPreset, onShowShortcuts }: Props) {
  const view = useUiStore((s) => s.view)
  const undoCount = useDbStore((s) => s.undoCount)
  const undo = useDbStore((s) => s.undo)
  const running = useDbStore((s) => s.running)
  const cancel = useDbStore((s) => s.cancel)

  return (
    <header className="flex h-12 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-700">
      <h1 className="font-semibold tracking-tight">SQLGround</h1>

      <button
        disabled
        title="PostgreSQL 등 다른 DB는 준비 중입니다"
        className="flex items-center gap-1 rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-600 disabled:cursor-not-allowed dark:border-neutral-600 dark:text-neutral-300"
      >
        SQLite
        <ChevronDown size={12} />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onShowShortcuts}
          title="단축키 안내 (?)"
          aria-label="단축키 안내"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <CircleHelp size={16} />
        </button>
      {view === 'playground' && (
        <>
          <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <PresetMenu onSelect={onLoadPreset} />
          <ToolButton
            icon={<RotateCcw size={14} />}
            label="되돌리기"
            disabled={undoCount === 0}
            onClick={() => void undo()}
            title={undoCount === 0 ? '되돌릴 실행이 없습니다' : `직전 실행 전으로 되돌립니다 (${undoCount}단계 남음)`}
          />
          <ToolButton icon={<Trash2 size={14} />} label="초기화" onClick={onReset} title="모든 테이블과 데이터를 지웁니다" />
          {running ? (
            <button
              onClick={cancel}
              title="실행을 멈추고 DB 를 실행 직전 상태로 되돌립니다"
              className="ml-2 flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              <Square size={13} />
              중단
            </button>
          ) : (
            <button
              onClick={onRun}
              title="Cmd/Ctrl + Enter"
              className="ml-2 flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              <Play size={14} />
              실행
            </button>
          )}
        </>
      )}
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
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <ToolButton icon={<Upload size={14} />} label="샘플 로드" onClick={() => setOpen((o) => !o)} title="연습용 샘플 데이터를 불러옵니다" />
      {open && (
        <ul className="absolute right-0 z-10 mt-1 w-72 rounded-md border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {PRESETS.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  setOpen(false)
                  onSelect(p)
                }}
                className="w-full rounded px-2 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.description}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ToolButtonProps {
  icon: ReactNode
  label: string
  title?: string
  disabled?: boolean
  onClick?(): void
}

function ToolButton({ icon, label, title, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1 rounded px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {icon}
      {label}
    </button>
  )
}
