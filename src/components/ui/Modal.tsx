import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose(): void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, footer, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className={[
        'm-auto w-[calc(100%-2rem)] rounded-xl border border-line-strong bg-surface p-0 text-fg shadow-pop backdrop:bg-black/45 backdrop:backdrop-blur-[2px]',
        '',
        wide ? 'max-w-4xl' : 'max-w-xl',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onClose} className="btn-icon" aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-3">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
    </dialog>
  )
}

export function SqlPreview({ sql }: { sql: string }) {
  return (
    <div className="mt-4">
      <p className="section-label mb-1.5">이 조작은 아래 SQL 을 실행합니다</p>
      <pre className="overflow-x-auto rounded-lg border border-line bg-subtle p-3 font-mono text-xs leading-relaxed whitespace-pre">{sql}</pre>
    </div>
  )
}

export function DialogActions({ sql, disabled, onInsert, onRun }: { sql: string; disabled: boolean; onInsert(sql: string): void; onRun(sql: string): void }) {
  return (
    <>
      <button
        disabled={disabled}
        onClick={() => onInsert(sql)}
        className="btn btn-outline"
      >
        에디터에 넣기
      </button>
      <button
        disabled={disabled}
        onClick={() => onRun(sql)}
        className="btn btn-primary"
      >
        실행
      </button>
    </>
  )
}

export const inputClass = 'input'
