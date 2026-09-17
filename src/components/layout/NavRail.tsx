import { BookOpen, Database, ListChecks, Settings, type LucideIcon } from 'lucide-react'
import { useUiStore, type View } from '../../store/ui-store'
import { Logo } from './Logo'

interface Item {
  view: View
  label: string
  icon: LucideIcon
}

const MAIN: Item[] = [
  { view: 'playground', label: '연습장', icon: Database },
  { view: 'learn', label: '학습', icon: BookOpen },
  { view: 'problems', label: '문제풀이', icon: ListChecks },
]

const BOTTOM: Item[] = [{ view: 'settings', label: '설정', icon: Settings }]

export function NavRail() {
  return (
    <nav className="flex w-[68px] shrink-0 flex-col items-center pb-2">
      <div className="flex h-12 items-center justify-center">
        <Logo />
      </div>
      <ul className="mt-1 flex flex-col gap-1">
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
          'relative flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10.5px] font-medium transition-colors',
          active ? 'bg-surface text-accent-fg shadow-panel' : 'text-fg-muted hover:bg-hover hover:text-fg',
        ].join(' ')}
      >
        {active && <span className="absolute top-2.5 bottom-2.5 -left-1.5 w-[3px] rounded-full bg-accent" />}
        <Icon size={19} strokeWidth={active ? 2 : 1.7} />
        <span>{item.label}</span>
      </button>
    </li>
  )
}
