import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import { quoteIdentifier } from '../../lib/sql-builder'
import type {
  ColumnInfo,
  DbEngine,
  ExecOutcome,
  QueryResult,
  SqlValue,
  TableInfo,
} from '../engine'

export interface SqliteEngineOptions {
  /** 브라우저에서는 번들된 wasm URL 을 넘긴다. node(테스트)에서는 생략 */
  wasmUrl?: string
}

const DML_PATTERN = /^\s*(insert|update|delete|replace)\b/i

export class SqliteEngine implements DbEngine {
  private sqlJs: SqlJsStatic | null = null
  private db: Database | null = null
  private readonly options: SqliteEngineOptions

  constructor(options: SqliteEngineOptions = {}) {
    this.options = options
  }

  async init(): Promise<void> {
    if (this.db) return
    const { wasmUrl } = this.options
    this.sqlJs = await initSqlJs(wasmUrl ? { locateFile: () => wasmUrl } : undefined)
    this.db = new this.sqlJs.Database()
  }

  exec(sql: string): ExecOutcome {
    const db = this.requireDb()
    const results: QueryResult[] = []

    let iterator: ReturnType<Database['iterateStatements']>
    try {
      iterator = db.iterateStatements(sql)
    } catch (e) {
      return { results, error: { message: errorMessage(e), sql } }
    }

    // for..of 로 순회하면 sql.js 가 statement 를 자동으로 free 한다
    try {
      for (const stmt of iterator) {
        const statementSql = stripLeadingComments(stmt.getSQL())
        const started = performance.now()
        const columns = stmt.getColumnNames()
        const rows: SqlValue[][] = []
        while (stmt.step()) rows.push(stmt.get())
        const rowsAffected = DML_PATTERN.test(statementSql) ? db.getRowsModified() : 0
        results.push({
          sql: statementSql,
          columns,
          rows,
          rowsAffected,
          durationMs: performance.now() - started,
        })
      }
    } catch (e) {
      return { results, error: { message: errorMessage(e), sql: iterator.getRemainingSQL().trim() || sql } }
    }

    return { results }
  }

  getTables(): TableInfo[] {
    const db = this.requireDb()
    const names = db
      .exec(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
      .flatMap((r) => r.values.map((v) => String(v[0])))

    return names.map((name) => ({ name, columns: this.getColumns(db, name) }))
  }

  private getColumns(db: Database, table: string): ColumnInfo[] {
    const stmt = db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`)
    const columns: ColumnInfo[] = []
    try {
      while (stmt.step()) {
        const row = stmt.getAsObject()
        columns.push({
          name: String(row.name),
          type: String(row.type ?? ''),
          notNull: row.notnull === 1,
          primaryKey: Number(row.pk) > 0,
          defaultValue: row.dflt_value === null ? null : String(row.dflt_value),
        })
      }
    } finally {
      stmt.free()
    }
    return columns
  }

  export(): Uint8Array {
    return this.requireDb().export()
  }

  async import(data: Uint8Array): Promise<void> {
    await this.init()
    const { Database } = this.requireSqlJs()
    this.db?.close()
    this.db = new Database(data)
  }

  async reset(): Promise<void> {
    await this.init()
    const { Database } = this.requireSqlJs()
    this.db?.close()
    this.db = new Database()
  }

  private requireDb(): Database {
    if (!this.db) throw new Error('SqliteEngine 이 초기화되지 않았습니다. init() 을 먼저 호출하세요.')
    return this.db
  }

  private requireSqlJs(): SqlJsStatic {
    if (!this.sqlJs) throw new Error('SqliteEngine 이 초기화되지 않았습니다. init() 을 먼저 호출하세요.')
    return this.sqlJs
  }
}

/** 문장 앞에 붙은 주석과 공백을 제거한다. sql.js 의 getSQL 은 앞선 주석을 포함해 돌려준다 */
export function stripLeadingComments(sql: string): string {
  return sql.replace(/^(\s*(--[^\n]*\n?|\/\*[\s\S]*?\*\/))*\s*/, '').trim()
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
