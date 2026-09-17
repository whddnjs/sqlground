/** UI 조작을 SQL 문자열로 바꾸는 순수 함수들. 생성된 SQL 은 화면에 그대로 노출된다 */

export const SQLITE_TYPES = ['INTEGER', 'TEXT', 'REAL', 'NUMERIC', 'BLOB'] as const
export type SqliteType = (typeof SQLITE_TYPES)[number]

export interface ColumnDef {
  name: string
  type: SqliteType
  primaryKey: boolean
  autoIncrement: boolean
  notNull: boolean
  unique: boolean
  /** 비어 있으면 DEFAULT 없음. 사용자가 적은 그대로 (예: 0, 'abc', CURRENT_TIMESTAMP) */
  defaultValue: string
  /** 외래키. 없으면 null */
  references: { table: string; column: string } | null
}

export function emptyColumn(): ColumnDef {
  return { name: '', type: 'TEXT', primaryKey: false, autoIncrement: false, notNull: false, unique: false, defaultValue: '', references: null }
}

export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

/** 예약어나 특수문자가 없는 단순 식별자는 따옴표 없이, 아니면 따옴표로 감싼다 */
export function identifier(name: string): string {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && !RESERVED.has(name.toUpperCase()) ? name : quoteIdentifier(name)
}

const RESERVED = new Set([
  'SELECT', 'FROM', 'WHERE', 'TABLE', 'INSERT', 'UPDATE', 'DELETE', 'ORDER', 'GROUP', 'BY', 'LIMIT', 'JOIN', 'ON',
  'AS', 'AND', 'OR', 'NOT', 'NULL', 'IN', 'IS', 'KEY', 'PRIMARY', 'DEFAULT', 'UNIQUE', 'CHECK', 'INDEX', 'VALUES',
  'INTO', 'SET', 'CREATE', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC',
])

export function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** 입력 문자열을 컬럼 타입에 맞는 리터럴로. 숫자 타입에 숫자 모양이면 그대로, 아니면 문자열 */
export function literal(value: string | null, type: string): string {
  if (value === null) return 'NULL'
  const affinity = type.toUpperCase()
  const numeric = affinity.includes('INT') || affinity.includes('REAL') || affinity.includes('NUM') || affinity.includes('FLOA') || affinity.includes('DOUB')
  if (numeric && /^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim()
  return quoteString(value)
}

export function buildCreateTable(name: string, columns: ColumnDef[]): string {
  const lines = columns.map((c) => {
    const parts = [`  ${identifier(c.name)} ${c.type}`]
    if (c.primaryKey) parts.push('PRIMARY KEY')
    if (c.primaryKey && c.autoIncrement && c.type === 'INTEGER') parts.push('AUTOINCREMENT')
    if (c.notNull && !c.primaryKey) parts.push('NOT NULL')
    if (c.unique && !c.primaryKey) parts.push('UNIQUE')
    if (c.defaultValue.trim() !== '') parts.push(`DEFAULT ${c.defaultValue.trim()}`)
    if (c.references) parts.push(`REFERENCES ${identifier(c.references.table)}(${identifier(c.references.column)})`)
    return parts.join(' ')
  })
  return `CREATE TABLE ${identifier(name)} (\n${lines.join(',\n')}\n);`
}

export interface InsertValue {
  column: string
  type: string
  /** null 이면 NULL 리터럴 */
  value: string | null
}

export function buildInsert(table: string, values: InsertValue[]): string {
  const cols = values.map((v) => identifier(v.column)).join(', ')
  const vals = values.map((v) => literal(v.value, v.type)).join(', ')
  return `INSERT INTO ${identifier(table)} (${cols}) VALUES (${vals});`
}

export interface RowRef {
  table: string
  pkColumn: string
  pkValue: string | number
}

export function buildUpdate(ref: RowRef, column: string, type: string, value: string | null): string {
  return `UPDATE ${identifier(ref.table)} SET ${identifier(column)} = ${literal(value, type)} WHERE ${identifier(ref.pkColumn)} = ${pkLiteral(ref.pkValue)};`
}

export function buildDelete(ref: RowRef): string {
  return `DELETE FROM ${identifier(ref.table)} WHERE ${identifier(ref.pkColumn)} = ${pkLiteral(ref.pkValue)};`
}

/** 여러 행을 한 문장으로 삭제. pkValues 가 하나면 buildDelete 와 같은 모양 */
export function buildDeleteMany(table: string, pkColumn: string, pkValues: Array<string | number>): string {
  if (pkValues.length === 1) return buildDelete({ table, pkColumn, pkValue: pkValues[0] })
  return `DELETE FROM ${identifier(table)} WHERE ${identifier(pkColumn)} IN (${pkValues.map(pkLiteral).join(', ')});`
}

export function buildDropTable(table: string): string {
  return `DROP TABLE ${identifier(table)};`
}

export function buildSelectAll(table: string, limit = 100): string {
  return `SELECT * FROM ${identifier(table)} LIMIT ${limit};`
}

function pkLiteral(v: string | number): string {
  return typeof v === 'number' ? String(v) : quoteString(v)
}

export function buildRenameTable(table: string, newName: string): string {
  return `ALTER TABLE ${identifier(table)} RENAME TO ${identifier(newName)};`
}

export function buildAddColumn(table: string, column: ColumnDef): string {
  const parts = [`${identifier(column.name)} ${column.type}`]
  if (column.notNull) parts.push('NOT NULL')
  if (column.unique) parts.push('UNIQUE')
  if (column.defaultValue.trim() !== '') parts.push(`DEFAULT ${column.defaultValue.trim()}`)
  if (column.references) parts.push(`REFERENCES ${identifier(column.references.table)}(${identifier(column.references.column)})`)
  return `ALTER TABLE ${identifier(table)} ADD COLUMN ${parts.join(' ')};`
}

export function buildRenameColumn(table: string, column: string, newName: string): string {
  return `ALTER TABLE ${identifier(table)} RENAME COLUMN ${identifier(column)} TO ${identifier(newName)};`
}

export function buildDropColumn(table: string, column: string): string {
  return `ALTER TABLE ${identifier(table)} DROP COLUMN ${identifier(column)};`
}
