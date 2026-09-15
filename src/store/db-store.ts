import { create } from 'zustand'
import { createEngine } from '../db/create-engine'
import type { ExecOutcome, TableInfo } from '../db/engine'
import { clearDb, loadDb, saveDb } from '../db/persist'
import type { Preset } from '../db/presets'
import { SnapshotStack } from '../db/snapshot'
import { useSettingsStore } from './settings-store'

type Status = 'loading' | 'ready' | 'error'
export type HistorySource = 'editor' | 'ui' | 'preset'

export interface HistoryEntry {
  id: number
  sql: string
  source: HistorySource
  ok: boolean
  at: number
}

/** UI 조작으로 실행한 SQL 을 결과 위에 보여 주기 위한 알림 */
export interface UiNotice {
  sql: string
  rowsAffected: number
}

interface DbState {
  status: Status
  loadError: string | null
  tables: TableInfo[]
  outcome: ExecOutcome | null
  notice: UiNotice | null
  history: HistoryEntry[]
  /** 되돌릴 수 있는 스냅샷 개수 */
  undoCount: number
  init(): Promise<void>
  run(sql: string): void
  /**
   * UI 조작으로 만든 SQL 실행. refreshSql 이 있으면 성공 후 그 조회를 다시 실행해 결과를 갱신하고,
   * 실행한 SQL 은 notice 로 보여 준다 (셀 편집 후 그리드 유지용)
   */
  runFromUi(sql: string, refreshSql?: string): void
  loadPreset(preset: Preset): void
  undo(): Promise<void>
  reset(): Promise<void>
  exportDb(): Uint8Array
  /** 파일에서 가져오기. 직전 상태는 스냅샷으로 남긴다 */
  importDb(data: Uint8Array): Promise<void>
  setForeignKeys(enabled: boolean): void
}

const engine = createEngine()
const snapshots = new SnapshotStack(10)
const HISTORY_LIMIT = 100

const SAVE_DELAY_MS = 500
let saveTimer: ReturnType<typeof setTimeout> | undefined
let historyId = 0

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void saveDb(engine.export())
  }, SAVE_DELAY_MS)
}

export const useDbStore = create<DbState>((set, get) => {
  const refresh = (patch: Partial<DbState> = {}) =>
    set({ tables: engine.getTables(), undoCount: snapshots.size, ...patch })

  const record = (sql: string, source: HistorySource, ok: boolean) => {
    const entry: HistoryEntry = { id: ++historyId, sql, source, ok, at: Date.now() }
    return [entry, ...get().history].slice(0, HISTORY_LIMIT)
  }

  return {
    status: 'loading',
    loadError: null,
    tables: [],
    outcome: null,
    notice: null,
    history: [],
    undoCount: 0,

    async init() {
      try {
        await engine.init()
        engine.setForeignKeys(useSettingsStore.getState().foreignKeys)
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
      refresh({ outcome, notice: null, history: record(sql, 'editor', !outcome.error) })
      scheduleSave()
    },

    runFromUi(sql, refreshSql) {
      snapshots.push(engine.export())
      const outcome = engine.exec(sql)
      const history = record(sql, 'ui', !outcome.error)
      if (outcome.error || !refreshSql) {
        refresh({ outcome, notice: null, history })
      } else {
        const rowsAffected = outcome.results.reduce((n, r) => n + r.rowsAffected, 0)
        refresh({ outcome: engine.exec(refreshSql), notice: { sql, rowsAffected }, history })
      }
      scheduleSave()
    },

    loadPreset(preset) {
      snapshots.push(engine.export())
      const outcome = engine.exec(preset.sql)
      refresh({
        outcome: outcome.error ? outcome : null,
        notice: outcome.error ? null : { sql: `-- 샘플 "${preset.name}" 로드: ${preset.tables.join(', ')}`, rowsAffected: 0 },
        history: record(`-- 샘플 로드: ${preset.name}`, 'preset', !outcome.error),
      })
      scheduleSave()
    },

    async undo() {
      const data = snapshots.pop()
      if (!data) return
      await engine.import(data)
      refresh({ outcome: null, notice: null })
      scheduleSave()
    },

    async reset() {
      snapshots.push(engine.export())
      await engine.reset()
      clearTimeout(saveTimer)
      await clearDb()
      refresh({ outcome: null, notice: null })
    },

    exportDb() {
      return engine.export()
    },

    async importDb(data) {
      snapshots.push(engine.export())
      await engine.import(data)
      // 깨진 파일이면 여기서 에러가 난다. getTables 로 실제 읽히는지 확인
      refresh({ outcome: null, notice: { sql: '-- DB 파일 가져오기', rowsAffected: 0 } })
      scheduleSave()
    },

    setForeignKeys(enabled) {
      engine.setForeignKeys(enabled)
    },
  }
})
