import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

export type Tone = 'amber' | 'accent' | 'violet' | 'emerald' | 'red' | 'neutral'

const TONES: Record<Tone, { stripe: string; header: string; icon: string }> = {
  amber: { stripe: 'border-l-amber-400', header: 'bg-amber-500/8', icon: 'text-amber-600 dark:text-amber-400' },
  accent: { stripe: 'border-l-accent', header: 'bg-accent-soft', icon: 'text-accent-fg' },
  violet: { stripe: 'border-l-violet-400', header: 'bg-violet-500/8', icon: 'text-violet-600 dark:text-violet-300' },
  emerald: { stripe: 'border-l-emerald-500', header: 'bg-emerald-500/10', icon: 'text-emerald-600 dark:text-emerald-400' },
  red: { stripe: 'border-l-red-500', header: 'bg-red-500/8', icon: 'text-red-600 dark:text-red-400' },
  neutral: { stripe: 'border-l-line-strong', header: 'bg-subtle/60', icon: 'text-fg-muted' },
}

interface Props {
  tone: Tone
  icon: ReactNode
  title: string
  /** 제목 옆 보조 정보 (행 수 등) */
  meta?: ReactNode
  onClose?(): void
  /** 값이 바뀌면 이 패널로 스크롤한다. 같은 패널의 내용만 갱신될 때 쓴다 */
  scrollKey?: unknown
  children: ReactNode
}

/**
 * 문제 에디터 아래에 쌓이는 영역(힌트, 기대 결과, 모범 답안, 내 실행 결과)의 공통 틀.
 * 색 띠·아이콘·제목으로 종류를 구분하고, 나타나거나 갱신되면 화면 안으로 들어온다.
 */
export function SectionPanel({ tone, icon, title, meta, onClose, scrollKey, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const t = TONES[tone]

  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [scrollKey])

  return (
    <section ref={ref} aria-label={title} className={['scroll-my-4 overflow-hidden rounded-lg border border-l-[3px] border-line', t.stripe].join(' ')}>
      <header className={['flex h-9 items-center gap-2 border-b border-line pr-1.5 pl-3', t.header].join(' ')}>
        <span className={['flex shrink-0', t.icon].join(' ')}>{icon}</span>
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {meta && <span className="min-w-0 truncate text-xs text-fg-muted">{meta}</span>}
        {onClose && (
          <button onClick={onClose} aria-label={`${title} 닫기`} className="btn-icon ml-auto h-6 w-6">
            <X size={13} />
          </button>
        )}
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}
