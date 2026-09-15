import { BookOpen, Database, ListChecks, Settings, type LucideIcon } from 'lucide-react'
import { useUiStore, type View } from '../../store/ui-store'

interface Item {
  view: View
  label: string
  icon: LucideIcon
  comingSoon?: boolean
}

const MAIN: Item[] = [
  { view: 'playground', label: '연습장', icon: Database },
  { view: 'learn', label: '학습', icon: BookOpen },
  { view: 'problems', label: '문제풀이', icon: ListChecks },
]

const BOTTOM: Item[] = [{ view: 'settings', label: '설정', icon: Settings }]

export function NavRail() {
  return (
    <nav className="flex w-16 shrink-0 flex-col items-center border-r border-neutral-200 bg-neutral-50 py-2 dark:border-neutral-700 dark:bg-neutral-950">
      <ul className="flex flex-col gap-1">
        {MAIN.map((item) => (
          <NavButton key={item.view} item={item} />
        ))}
      </ul>
      <ul className="mt-auto flex flex-col gap-1">
        {BOTTOM.map((item) => (
          <NavButton key={item.view} item={item} />
        ))}
      </ul>
    </nav>
  )
}

function NavButton({ item }: { item: Item }) {
  const { view, setView } = useUiStore()
  const active = view === item.view
  const Icon = item.icon
  return (
    <li>
      <button
        onClick={() => setView(item.view)}
        aria-current={active ? 'page' : undefined}
        className={[
          'relative flex w-14 flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[11px]',
          active
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200',
        ].join(' ')}
      >
        <Icon size={20} strokeWidth={1.75} />
        <span>{item.label}</span>
        {item.comingSoon && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400" title="준비 중" />
        )}
      </button>
    </li>
  )
}
