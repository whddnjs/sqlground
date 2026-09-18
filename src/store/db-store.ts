import { create } from 'zustand'
import { createEngine } from '../db/create-engine'
import type { ExecOutcome, TableInfo } from '../db/engine'
import { clearDb, loadDb, saveDb } from '../db/persist'
import type { Preset } from '../db/presets'
import { SnapshotStack } from '../db/snapshot'
import { isRecord, readJson, writeJson } from '../lib/storage'
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
  /** 쿼리가 실행 중인지. 실행 중에는 중단 버튼을 보여 준다 */
  running: boolean
  init(): Promise<void>
  run(sql: string): Promise<void>
  /** 실행 중인 쿼리를 중단한다. DB 는 실행 직전 상태로 돌아간다 */
  cancel(): void
  /**
   * UI 조작으로 만든 SQL 실행. refreshSql 이 있으면 성공 후 그 조회를 다시 실행해 결과를 갱신하고,
   * 실행한 SQL 은 notice 로 보여 준다 (셀 편집 후 그리드 유지용)
   */
  runFromUi(sql: string, refreshSql?: string): Promise<void>
  loadPreset(preset: Preset): Promise<void>
  undo(): Promise<void>
  reset(): Promise<void>
  exportDb(): Promise<Uint8Array>
  /** 파일에서 가져오기. 직전 상태는 스냅샷으로 남긴다 */
  importDb(data: Uint8Array): Promise<void>
  setForeignKeys(enabled: boolean): Promise<void>
}

const engine = createEngine()
const snapshots = new SnapshotStack(10)
const HISTORY_LIMIT = 100
const HISTORY_KEY = 'sqlground:history'
const SOURCES: HistorySource[] = ['editor', 'ui', 'preset']

/** 새로고침해도 실행 이력이 남도록 브라우저에 저장한다. 깨진 항목은 버린다 */
function loadHistory(): HistoryEntry[] {
  const raw = readJson(HISTORY_KEY)
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (e): e is HistoryEntry =>
        isRecord(e) && typeof e.id === 'number' && typeof e.sql === 'string' && SOURCES.includes(e.source as HistorySource) && typeof e.ok === 'boolean' && typeof e.at === 'number',
    )
    .slice(0, HISTORY_LIMIT)
}
const savedHistory = loadHistory()
/** 끝나지 않는 쿼리를 자동으로 끊는 한도. 그 전에는 사용자가 중단 버튼으로 끊을 수 있다 */
const RUN_TIMEOUT_MS = 30_000

const SAVE_DELAY_MS = 500
let saveTimer: ReturnType<typeof setTimeout> | undefined
let historyId = savedHistory.reduce((m, e) => Math.max(m, e.id), 0)
/** 저장할 변경이 남아 있는지. 트랜잭션 중에는 저장을 미루므로 따로 기억해 둔다 */
let dirty = false

/**
 * 변경이 있으면 잠시 뒤 IndexedDB 에 저장한다.
 * 저장은 export 를 부르고, export 는 연결을 다시 열어 진행 중인 트랜잭션을 없앤다.
 * 그래서 트랜잭션이 열려 있으면 저장하지 않고 dirty 로 남겨, 트랜잭션이 끝난 뒤의 실행에서 저장한다.
 */
function scheduleSave(changed = true) {
  if (changed) dirty = true
  if (!dirty) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void (async () => {
      if (await engine.inTransaction()) return
      dirty = false
      await saveDb(await engine.export())
    })()
  }, SAVE_DELAY_MS)
}

export const useDbStore = create<DbState>((set, get) => {
  const record = (sql: string, source: HistorySource, ok: boolean) => {
    const entry: HistoryEntry = { id: ++historyId, sql, source, ok, at: Date.now() }
    const next = [entry, ...get().history].slice(0, HISTORY_LIMIT)
    writeJson(HISTORY_KEY, next)
    return next
  }

  /** 실행하고, 바뀐 경우에만 되돌리기 스택에 쌓는다 */
  const execute = async (sql: string) => {
    set({ running: true })
    try {
      const r = await engine.run(sql, { timeoutMs: RUN_TIMEOUT_MS })
      if (r.changed && r.snapshot) snapshots.push(r.snapshot)
      return r
    } finally {
      set({ running: false })
    }
  }

  return {
    status: 'loading',
    loadError: null,
    tables: [],
    outcome: null,
    notice: null,
    history: savedHistory,
    undoCount: 0,
    running: false,

    async init() {
      try {
        await engine.init()
        await engine.setForeignKeys(useSettingsStore.getState().foreignKeys)
        const saved = await loadDb()
        if (saved) await engine.import(saved)
        set({ status: 'ready', tables: await engine.getTables() })
      } catch (e) {
        set({ status: 'error', loadError: e instanceof Error ? e.message : String(e) })
      }
    },

    async run(sql) {
      if (get().running) return
      const r = await execute(sql)
      set({ outcome: r.outcome, notice: null, tables: r.tables, undoCount: snapshots.size, history: record(sql, 'editor', !r.outcome.error) })
      scheduleSave(r.changed)
    },

    cancel() {
      engine.cancel()
    },

    async runFromUi(sql, refreshSql) {
      if (get().running) return
      const r = await execute(sql)
      const history = record(sql, 'ui', !r.outcome.error)
      if (r.outcome.error || !refreshSql) {
        set({ outcome: r.outcome, notice: null, tables: r.tables, undoCount: snapshots.size, history })
      } else {
        const rowsAffected = r.outcome.results.reduce((n, x) => n + x.rowsAffected, 0)
        const refreshed = await engine.exec(refreshSql, { timeoutMs: RUN_TIMEOUT_MS })
        set({ outcome: refreshed.outcome, notice: { sql, rowsAffected }, tables: refreshed.tables, undoCount: snapshots.size, history })
      }
      scheduleSave(r.changed)
    },

    async loadPreset(preset) {
      if (get().running) return
      const r = await execute(preset.sql)
      set({
        outcome: r.outcome.error ? r.outcome : null,
        notice: r.outcome.error ? null : { sql: `-- 샘플 "${preset.name}" 로드: ${preset.tables.join(', ')}`, rowsAffected: 0 },
        tables: r.tables,
        undoCount: snapshots.size,
        history: record(`-- 샘플 로드: ${preset.name}`, 'preset', !r.outcome.error),
      })
      scheduleSave(r.changed)
    },

    async undo() {
      const data = snapshots.pop()
      if (!data) return
      await engine.import(data)
      set({ outcome: null, notice: null, tables: await engine.getTables(), undoCount: snapshots.size })
      scheduleSave()
    },

    async reset() {
      snapshots.push(await engine.export())
      await engine.reset()
      clearTimeout(saveTimer)
      dirty = false
      await clearDb()
      set({ outcome: null, notice: null, tables: [], undoCount: snapshots.size })
    },

    exportDb() {
      return engine.export()
    },

    async importDb(data) {
      const before = await engine.export()
      // 깨진 파일이면 import 나 getTables 에서 에러가 난다. 그때는 원래 상태로 되돌린다
      try {
        await engine.import(data)
        const tables = await engine.getTables()
        snapshots.push(before)
        set({ outcome: null, notice: { sql: '-- DB 파일 가져오기', rowsAffected: 0 }, tables, undoCount: snapshots.size })
        scheduleSave()
      } catch (e) {
        await engine.import(before)
        throw e
      }
    },

    async setForeignKeys(enabled) {
      await engine.setForeignKeys(enabled)
    },
  }
})
