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
        'm-auto w-[calc(100%-2rem)] rounded-lg border border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-black/40',
        'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
        wide ? 'max-w-4xl' : 'max-w-xl',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-3">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">{footer}</div>}
    </dialog>
  )
}

export function SqlPreview({ sql }: { sql: string }) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-medium text-neutral-500">이 조작은 아래 SQL 을 실행합니다</p>
      <pre className="overflow-x-auto rounded bg-neutral-100 p-3 font-mono text-xs whitespace-pre dark:bg-neutral-800">{sql}</pre>
    </div>
  )
}

export function DialogActions({ sql, disabled, onInsert, onRun }: { sql: string; disabled: boolean; onInsert(sql: string): void; onRun(sql: string): void }) {
  return (
    <>
      <button
        disabled={disabled}
        onClick={() => onInsert(sql)}
        className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-600 dark:hover:bg-neutral-800"
      >
        에디터에 넣기
      </button>
      <button
        disabled={disabled}
        onClick={() => onRun(sql)}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
      >
        실행
      </button>
    </>
  )
}

export const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800'
