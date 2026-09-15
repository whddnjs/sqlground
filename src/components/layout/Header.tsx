import { ChevronDown, Play, RotateCcw, Trash2, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { useUiStore } from '../../store/ui-store'

interface Props {
  onRun(): void
  onReset(): void
}

export function Header({ onRun, onReset }: Props) {
  const view = useUiStore((s) => s.view)

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

      {view === 'playground' && (
        <div className="ml-auto flex items-center gap-1">
          <ToolButton icon={<Upload size={14} />} label="샘플 로드" disabled title="샘플 데이터셋은 준비 중입니다" />
          <ToolButton icon={<RotateCcw size={14} />} label="되돌리기" disabled title="실행 전으로 되돌리기는 준비 중입니다" />
          <ToolButton icon={<Trash2 size={14} />} label="초기화" onClick={onReset} title="모든 테이블과 데이터를 지웁니다" />
          <button
            onClick={onRun}
            title="Cmd/Ctrl + Enter"
            className="ml-2 flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            <Play size={14} />
            실행
          </button>
        </div>
      )}
    </header>
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
