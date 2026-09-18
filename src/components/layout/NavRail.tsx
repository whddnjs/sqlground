import { BookOpen, Database, ListChecks, Settings, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { routes } from '../../routes'
import { Logo } from './Logo'

interface Item {
  to: string
  label: string
  icon: LucideIcon
}

const MAIN: Item[] = [
  { to: routes.playground, label: '연습장', icon: Database },
  { to: routes.learn, label: '학습', icon: BookOpen },
  { to: routes.problems, label: '문제풀이', icon: ListChecks },
]

const BOTTOM: Item[] = [{ to: routes.settings, label: '설정', icon: Settings }]

export function NavRail() {
  return (
    <nav className="flex w-[68px] shrink-0 flex-col items-center pb-2">
      <div className="flex h-12 items-center justify-center">
        <Logo />
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {MAIN.map((item) => (
          <NavButton key={item.to} item={item} />
        ))}
      </ul>
      <ul className="mt-auto flex flex-col gap-1">
        {BOTTOM.map((item) => (
          <NavButton key={item.to} item={item} />
        ))}
      </ul>
    </nav>
  )
}

function NavButton({ item }: { item: Item }) {
  const Icon = item.icon
  return (
    <li>
      <NavLink
        to={item.to}
        // 연습장은 '/' 라 end 를 줘야 다른 경로에서 활성이 되지 않는다
        end={item.to === routes.playground}
        className={({ isActive }) =>
          [
            'relative flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10.5px] font-medium transition-colors',
            isActive ? 'bg-surface text-accent-fg shadow-panel' : 'text-fg-muted hover:bg-hover hover:text-fg',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute top-2.5 bottom-2.5 -left-1.5 w-[3px] rounded-full bg-accent" />}
            <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}
