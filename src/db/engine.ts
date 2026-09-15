export type SqlValue = number | string | Uint8Array | null

export interface QueryResult {
  /** 실행된 문장 원문 */
  sql: string
  columns: string[]
  rows: SqlValue[][]
  /** INSERT/UPDATE/DELETE 로 영향받은 행 수. 그 외 문장은 0 */
  rowsAffected: number
  durationMs: number
}

export interface SqlError {
  message: string
  /** 에러가 난 문장. 파싱 단계 에러면 입력 전체 */
  sql: string
}

export interface ExecOutcome {
  /** 에러 전까지 성공한 문장들의 결과 */
  results: QueryResult[]
  error?: SqlError
}

export interface ColumnInfo {
  name: string
  type: string
  notNull: boolean
  primaryKey: boolean
  defaultValue: string | null
}

export interface ForeignKeyInfo {
  column: string
  refTable: string
  refColumn: string
}

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
  foreignKeys: ForeignKeyInfo[]
}

export interface DbEngine {
  init(): Promise<void>
  /** 여러 문장을 순서대로 실행. 실패하면 그 지점에서 중단 */
  exec(sql: string): ExecOutcome
  getTables(): TableInfo[]
  export(): Uint8Array
  import(data: Uint8Array): Promise<void>
  /** 빈 DB 로 초기화 */
  reset(): Promise<void>
  /** FOREIGN KEY 제약 강제 여부 변경. 즉시 적용 */
  setForeignKeys(enabled: boolean): void
}
