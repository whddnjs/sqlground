import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  /** 폰 폭에서 목록을 열었는지. 넓은 화면에서는 항상 보인다 */
  open: boolean
  onClose(): void
  title: string
  children: ReactNode
}

/** 학습·문제풀이의 왼쪽 목록. 넓은 화면에서는 옆에 고정, 폰 폭에서는 버튼으로 여는 덮개가 된다 */
export function SideList({ open, onClose, title, children }: Props) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label={title}
        className={[
          'card shrink-0 flex-col overflow-hidden md:static md:flex md:w-64 md:max-w-none',
          open ? 'fixed inset-y-2 left-2 z-50 flex w-[85vw] max-w-sm' : 'hidden',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-line py-1.5 pr-1.5 pl-3 md:hidden">
          <span className="text-sm font-semibold">{title}</span>
          <button onClick={onClose} aria-label={`${title} 닫기`} className="btn-icon">
            <X size={15} />
          </button>
        </div>
        {children}
      </aside>
    </>
  )
}
