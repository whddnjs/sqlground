import { create } from 'zustand'
import { readJson, stringRecord, writeJson } from '../lib/storage'

const KEY = 'sqlground:descriptions'

/** "테이블.컬럼" → 한글 설명. SQLite 에는 컬럼 주석이 없어 브라우저에 따로 저장한다 */
type Descriptions = Record<string, string>

const load = (): Descriptions => stringRecord(readJson(KEY))
const persist = (d: Descriptions) => writeJson(KEY, d)

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
