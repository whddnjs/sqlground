import type { ColumnInfo, QueryResult, TableInfo } from '../db/engine'

export interface EditableTarget {
  table: TableInfo
  pk: ColumnInfo
  /** 결과 컬럼 인덱스 → 테이블 컬럼. 편집 가능한 컬럼만 */
  columnMap: Map<number, ColumnInfo>
  pkIndex: number
}

const SIMPLE_SELECT = /^\s*SELECT\s+(.+?)\s+FROM\s+("[^"]+"|[A-Za-z_][A-Za-z0-9_]*)\s*(WHERE\b.*|ORDER\s+BY\b.*|LIMIT\b.*|;)?\s*$/is

/**
 * "단일 테이블 + PK 포함" 조회 결과인지 판단한다.
 * JOIN, GROUP BY, 서브쿼리, 별칭이 섞인 결과는 원본 행을 특정할 수 없으므로 편집 대상에서 뺀다.
 */
export function detectEditableTarget(result: QueryResult, tables: TableInfo[]): EditableTarget | null {
  const m = result.sql.match(SIMPLE_SELECT)
  if (!m) return null
  const [, selectList, rawTable, tail = ''] = m
  if (/\b(JOIN|GROUP\s+BY|UNION|DISTINCT)\b/i.test(result.sql) || /\(/.test(selectList) || /\bAS\b/i.test(selectList) || /\(/.test(tail)) return null

  const tableName = rawTable.replace(/^"|"$/g, '')
  const table = tables.find((t) => t.name === tableName)
  if (!table) return null

  const pkColumns = table.columns.filter((c) => c.primaryKey)
  if (pkColumns.length !== 1) return null
  const pk = pkColumns[0]

  const columnMap = new Map<number, ColumnInfo>()
  result.columns.forEach((name, i) => {
    const col = table.columns.find((c) => c.name === name)
    if (col) columnMap.set(i, col)
  })
  const pkIndex = result.columns.indexOf(pk.name)
  if (pkIndex < 0 || columnMap.size !== result.columns.length) return null

  return { table, pk, columnMap, pkIndex }
}
