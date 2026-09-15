import { create } from 'zustand'

const KEY = 'sqlground:descriptions'

/** "테이블.컬럼" → 한글 설명. SQLite 에는 컬럼 주석이 없어 브라우저에 따로 저장한다 */
type Descriptions = Record<string, string>

function load(): Descriptions {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Descriptions
  } catch {
    return {}
  }
}

function persist(d: Descriptions) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    // 저장 불가 환경이면 무시
  }
}

interface DescriptionState {
  descriptions: Descriptions
  get(table: string, column: string): string
  set(table: string, column: string, text: string): void
  /** 프리셋 로드 시 여러 개를 한 번에 */
  setMany(entries: Descriptions): void
}

export const useDescriptionStore = create<DescriptionState>((set, get) => ({
  descriptions: load(),
  get: (table, column) => get().descriptions[`${table}.${column}`] ?? '',
  set(table, column, text) {
    const next = { ...get().descriptions }
    const key = `${table}.${column}`
    if (text.trim() === '') delete next[key]
    else next[key] = text.trim()
    persist(next)
    set({ descriptions: next })
  },
  setMany(entries) {
    const next = { ...get().descriptions, ...entries }
    persist(next)
    set({ descriptions: next })
  },
}))
