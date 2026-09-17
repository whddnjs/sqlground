import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { isRecord, readJson, writeJson } from '../lib/storage'

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

const THEMES: Theme[] = ['system', 'light', 'dark']

function load(): Settings {
  const s = readJson(KEY)
  if (!isRecord(s)) return DEFAULT_SETTINGS
  return {
    theme: THEMES.includes(s.theme as Theme) ? (s.theme as Theme) : DEFAULT_SETTINGS.theme,
    fontSize: typeof s.fontSize === 'number' && s.fontSize >= 11 && s.fontSize <= 22 ? s.fontSize : DEFAULT_SETTINGS.fontSize,
    foreignKeys: typeof s.foreignKeys === 'boolean' ? s.foreignKeys : DEFAULT_SETTINGS.foreignKeys,
  }
}

interface SettingsState extends Settings {
  update(patch: Partial<Settings>): void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...load(),
  update(patch) {
    const next: Settings = { theme: get().theme, fontSize: get().fontSize, foreignKeys: get().foreignKeys, ...patch }
    writeJson(KEY, next)
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

const darkMedia = () => window.matchMedia('(prefers-color-scheme: dark)')
const subscribeMedia = (cb: () => void) => {
  const m = darkMedia()
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

/** 설정과 OS 설정을 합쳐 실제로 적용 중인 테마 */
export function useEffectiveTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.theme)
  const osDark = useSyncExternalStore(subscribeMedia, () => darkMedia().matches, () => false)
  return theme === 'dark' || (theme === 'system' && osDark) ? 'dark' : 'light'
}
