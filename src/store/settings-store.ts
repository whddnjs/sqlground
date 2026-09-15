import { create } from 'zustand'

const KEY = 'sqlground:settings'

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  theme: Theme
  /** 에디터 글꼴 크기 (px) */
  fontSize: number
  /** FOREIGN KEY 제약 강제 */
  foreignKeys: boolean
}

export const DEFAULT_SETTINGS: Settings = { theme: 'system', fontSize: 14, foreignKeys: true }

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsState extends Settings {
  update(patch: Partial<Settings>): void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...load(),
  update(patch) {
    const next: Settings = { theme: get().theme, fontSize: get().fontSize, foreignKeys: get().foreignKeys, ...patch }
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // 저장 불가 환경이면 무시
    }
    set(next)
  },
}))

/** 테마 설정을 <html class="dark"> 로 반영한다. system 이면 OS 설정을 따른다 */
export function applyTheme(theme: Theme): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    const dark = theme === 'dark' || (theme === 'system' && media.matches)
    document.documentElement.classList.toggle('dark', dark)
  }
  apply()
  media.addEventListener('change', apply)
  return () => media.removeEventListener('change', apply)
}
