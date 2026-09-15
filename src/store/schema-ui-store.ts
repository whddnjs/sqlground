import { create } from 'zustand'

const KEY = 'sqlground:collapsed-tables'

function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function persist(names: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(names))
  } catch {
    // 저장 불가 환경이면 무시
  }
}

interface SchemaUiState {
  /** 접힌 테이블 이름. 기본은 모두 펼침 */
  collapsed: string[]
  toggle(table: string): void
  setAll(tables: string[], collapsed: boolean): void
}

export const useSchemaUiStore = create<SchemaUiState>((set, get) => ({
  collapsed: load(),
  toggle(table) {
    const cur = get().collapsed
    const next = cur.includes(table) ? cur.filter((t) => t !== table) : [...cur, table]
    persist(next)
    set({ collapsed: next })
  },
  setAll(tables, collapsed) {
    const next = collapsed ? tables : []
    persist(next)
    set({ collapsed: next })
  },
}))
