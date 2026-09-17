import { create } from 'zustand'
import { readJson, stringArray, writeJson } from '../lib/storage'

const KEY = 'sqlground:collapsed-tables'

const load = (): string[] => stringArray(readJson(KEY))
const persist = (names: string[]) => writeJson(KEY, names)

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
