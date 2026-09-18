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
  /** 시간 초과나 사용자 중단으로 실행을 끊었을 때 true. 이 경우 DB 는 실행 직전 상태로 복원돼 있다 */
  interrupted?: boolean
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
  /**
   * 데이터나 구조가 바뀌면 값이 달라지는 토큰. 실행 전후를 비교해 "이 실행이 DB 를 바꿨는가" 를 판단한다.
   * export() 를 부르면 연결이 다시 열려 초기화되므로, 비교할 두 값 사이에는 export 가 없어야 한다.
   */
  changeToken(): string
  /** BEGIN 후 COMMIT/ROLLBACK 전인지. 이때 export 하면 연결이 닫히며 트랜잭션이 사라진다 */
  inTransaction(): boolean
}

/** run() 의 결과. 실행과 함께 되돌리기·저장 판단에 필요한 정보를 한 번에 돌려준다 */
export interface RunOutcome {
  outcome: ExecOutcome
  /** 이 실행이 DB 를 바꿨는지 */
  changed: boolean
  /** changed 일 때 실행 직전 DB. 되돌리기 스택에 쌓는다 */
  snapshot: Uint8Array | null
  tables: TableInfo[]
  inTransaction: boolean
}

export interface ExecOptions {
  /** 이 시간을 넘기면 실행을 중단하고 직전 상태로 복원한다 */
  timeoutMs?: number
}

/**
 * 화면에서 쓰는 엔진. 쿼리는 Web Worker 에서 돌아 화면을 멈추지 않고, 중단할 수 있다.
 * 동기 DbEngine(SqliteEngine)을 워커 안에서 감싼 것이다.
 */
export interface AsyncDbEngine {
  init(): Promise<void>
  /** 되돌리기 판단 없이 실행만 (학습·문제풀이용). changed 는 데이터나 구조가 바뀌었는지 */
  exec(sql: string, options?: ExecOptions): Promise<{ outcome: ExecOutcome; tables: TableInfo[]; changed: boolean }>
  /** 실행 + 변경 여부 + 실행 직전 스냅샷 (연습장용) */
  run(sql: string, options?: ExecOptions): Promise<RunOutcome>
  /** 실행 중인 쿼리를 중단한다. 실행 중이 아니면 아무 일도 없다 */
  cancel(): void
  getTables(): Promise<TableInfo[]>
  export(): Promise<Uint8Array>
  import(data: Uint8Array): Promise<void>
  reset(): Promise<void>
  setForeignKeys(enabled: boolean): Promise<void>
  inTransaction(): Promise<boolean>
  /** 현재 상태를 복구 지점으로 기억한다. 중단 시 여기로 돌아온다 */
  checkpoint(): Promise<void>
}
