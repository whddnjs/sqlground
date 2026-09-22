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
    <nav aria-label="주 메뉴" className="order-last flex shrink-0 items-center border-t border-line bg-surface md:order-none md:w-[68px] md:flex-col md:border-0 md:bg-transparent md:pb-2">
      <div className="hidden h-12 items-center justify-center md:flex">
        <Logo />
      </div>
      <ul className="flex flex-1 justify-around gap-1 md:mt-1 md:flex-none md:flex-col">
        {MAIN.map((item) => (
          <NavButton key={item.to} item={item} />
        ))}
      </ul>
      <ul className="flex gap-1 md:mt-auto md:flex-col">
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
            'relative flex w-14 flex-col items-center gap-1 rounded-lg py-1.5 text-[10.5px] font-medium transition-colors md:py-2',
            isActive ? 'bg-surface text-accent-fg shadow-panel' : 'text-fg-muted hover:bg-hover hover:text-fg',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute top-2.5 bottom-2.5 -left-1.5 hidden w-[3px] rounded-full bg-accent md:block" />}
            <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}
