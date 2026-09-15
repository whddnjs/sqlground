import { create } from 'zustand'
import { createEngine } from '../db/create-engine'
import type { ExecOutcome, TableInfo } from '../db/engine'
import { clearDb, loadDb, saveDb } from '../db/persist'
import type { Preset } from '../db/presets'
import { SnapshotStack } from '../db/snapshot'

type Status = 'loading' | 'ready' | 'error'

interface DbState {
  status: Status
  loadError: string | null
  tables: TableInfo[]
  outcome: ExecOutcome | null
  /** 되돌릴 수 있는 스냅샷 개수 */
  undoCount: number
  init(): Promise<void>
  run(sql: string): void
  loadPreset(preset: Preset): void
  undo(): Promise<void>
  reset(): Promise<void>
}

const engine = createEngine()
const snapshots = new SnapshotStack(10)

const SAVE_DELAY_MS = 500
let saveTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void saveDb(engine.export())
  }, SAVE_DELAY_MS)
}

export const useDbStore = create<DbState>((set) => {
  const refresh = (patch: Partial<DbState> = {}) =>
    set({ tables: engine.getTables(), undoCount: snapshots.size, ...patch })

  return {
    status: 'loading',
    loadError: null,
    tables: [],
    outcome: null,
    undoCount: 0,

    async init() {
      try {
        await engine.init()
        const saved = await loadDb()
        if (saved) await engine.import(saved)
        refresh({ status: 'ready' })
      } catch (e) {
        set({ status: 'error', loadError: e instanceof Error ? e.message : String(e) })
      }
    },

    run(sql) {
      snapshots.push(engine.export())
      const outcome = engine.exec(sql)
      refresh({ outcome })
      scheduleSave()
    },

    loadPreset(preset) {
      snapshots.push(engine.export())
      const outcome = engine.exec(preset.sql)
      refresh({ outcome })
      scheduleSave()
    },

    async undo() {
      const data = snapshots.pop()
      if (!data) return
      await engine.import(data)
      refresh({ outcome: null })
      scheduleSave()
    },

    async reset() {
      snapshots.push(engine.export())
      await engine.reset()
      clearTimeout(saveTimer)
      await clearDb()
      refresh({ outcome: null })
    },
  }
})
