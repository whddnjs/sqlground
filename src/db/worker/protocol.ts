import type { ExecOutcome, TableInfo } from '../engine'

export type Request =
  | { id: number; op: 'init'; wasmUrl: string; foreignKeys: boolean }
  | { id: number; op: 'exec'; sql: string }
  | { id: number; op: 'run'; sql: string }
  | { id: number; op: 'getTables' }
  | { id: number; op: 'export' }
  | { id: number; op: 'import'; data: Uint8Array }
  | { id: number; op: 'reset' }
  | { id: number; op: 'setForeignKeys'; enabled: boolean }
  | { id: number; op: 'inTransaction' }

export interface ExecValue {
  outcome: ExecOutcome
  tables: TableInfo[]
  /** 이 실행이 데이터나 구조를 바꿨는지 */
  changed: boolean
}

export interface RunValue extends ExecValue {
  inTransaction: boolean
}

export type Response =
  /** run 요청에서 실행 직전에 먼저 보내는 스냅샷. 실행이 안 끝날 때의 복구 지점 */
  | { id: number; kind: 'pre'; snapshot: Uint8Array }
  | { id: number; kind: 'done'; value: unknown }
  | { id: number; kind: 'error'; message: string }
