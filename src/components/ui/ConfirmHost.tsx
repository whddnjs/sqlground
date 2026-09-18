import { AlertTriangle, Info, RotateCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useConfirmStore, type AlertOptions, type ConfirmOptions } from '../../store/confirm-store'

/**
 * confirm()/alert() 가 띄우는 다이얼로그. App 에 한 번만 둔다.
 * 브라우저 기본 confirm 과 달리 실행될 SQL 을 보여 주고 앱 디자인을 따른다.
 */
export function ConfirmHost() {
  const pending = useConfirmStore((s) => s.pending)
  const settle = useConfirmStore((s) => s.settle)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (pending) ref.current?.showModal()
  }, [pending])

  if (!pending) return null
  const isAlert = pending.kind === 'alert'
  const o = pending.options as ConfirmOptions & AlertOptions

  return (
    <dialog
      ref={ref}
      role={isAlert ? 'alertdialog' : 'dialog'}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault()
        settle(false)
      }}
      onClose={() => settle(false)}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line-strong bg-surface p-0 text-fg shadow-pop backdrop:bg-black/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex gap-3 px-5 pt-5">
        <span className={['mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', o.danger ? 'bg-red-500/12 text-red-600 dark:text-red-400' : 'bg-accent-soft text-accent-fg'].join(' ')}>
          {o.danger ? <AlertTriangle size={16} /> : <Info size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="confirm-title" className="text-[15px] font-semibold">
            {o.title}
          </h2>
          {o.message && <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{o.message}</p>}
          {o.sql && <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-line bg-subtle p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap">{o.sql}</pre>}
          {o.undoable && (
            <p className="mt-2 flex items-center gap-1 text-xs text-fg-subtle">
              <RotateCcw size={11} /> 헤더의 되돌리기로 복구할 수 있습니다
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-4">
        {!isAlert && (
          <button autoFocus onClick={() => settle(false)} className="btn btn-outline">
            취소
          </button>
        )}
        <button autoFocus={isAlert} onClick={() => settle(true)} className={['btn', o.danger ? 'btn-danger' : 'btn-primary'].join(' ')}>
          {isAlert ? '확인' : (o.confirmLabel ?? '확인')}
        </button>
      </div>
    </dialog>
  )
}
