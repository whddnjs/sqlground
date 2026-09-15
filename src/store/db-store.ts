import { create } from 'zustand'
import { createEngine } from '../db/create-engine'
import type { ExecOutcome, TableInfo } from '../db/engine'

type Status = 'loading' | 'ready' | 'error'

interface DbState {
  status: Status
  loadError: string | null
  tables: TableInfo[]
  outcome: ExecOutcome | null
  init(): Promise<void>
  run(sql: string): void
  reset(): Promise<void>
}

const engine = createEngine()

export const useDbStore = create<DbState>((set) => ({
  status: 'loading',
  loadError: null,
  tables: [],
  outcome: null,

  async init() {
    try {
      await engine.init()
      set({ status: 'ready', tables: engine.getTables() })
    } catch (e) {
      set({ status: 'error', loadError: e instanceof Error ? e.message : String(e) })
    }
  },

  run(sql) {
    const outcome = engine.exec(sql)
    set({ outcome, tables: engine.getTables() })
  },

  async reset() {
    await engine.reset()
    set({ outcome: null, tables: [] })
  },
}))
