import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { DbEngine } from './engine'
import { SqliteEngine } from './sqlite/sqlite-engine'

export function createEngine(): DbEngine {
  return new SqliteEngine({ wasmUrl })
}
