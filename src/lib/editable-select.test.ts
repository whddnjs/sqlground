import { describe, expect, it } from 'vitest'
import type { QueryResult, TableInfo } from '../db/engine'
import { detectEditableTarget } from './editable-select'

const users: TableInfo = {
  name: 'users',
  columns: [
    { name: 'id', type: 'INTEGER', notNull: false, primaryKey: true, defaultValue: null },
    { name: 'name', type: 'TEXT', notNull: true, primaryKey: false, defaultValue: null },
  ],
  foreignKeys: [],
}
const nopk: TableInfo = { name: 'logs', columns: [{ name: 'msg', type: 'TEXT', notNull: false, primaryKey: false, defaultValue: null }], foreignKeys: [] }
const tables = [users, nopk]

function result(sql: string, columns: string[]): QueryResult {
  return { sql, columns, rows: [], rowsAffected: 0, durationMs: 0 }
}

describe('detectEditableTarget', () => {
  it('단일 테이블에 PK 가 포함된 조회는 편집 대상', () => {
    for (const sql of ['SELECT * FROM users', 'select id, name from users where id > 1 order by id limit 10;', 'SELECT id, name\nFROM users']) {
      const t = detectEditableTarget(result(sql, ['id', 'name']), tables)
      expect(t?.table.name, sql).toBe('users')
      expect(t?.pkIndex).toBe(0)
    }
  })

  it('PK 컬럼이 결과에 없으면 편집 불가', () => {
    expect(detectEditableTarget(result('SELECT name FROM users', ['name']), tables)).toBeNull()
  })

  it('JOIN, GROUP BY, 집계, 별칭, PK 없는 테이블, 모르는 테이블은 편집 불가', () => {
    const cases: Array<[string, string[]]> = [
      ['SELECT u.id, u.name FROM users u JOIN logs l', ['id', 'name']],
      ['SELECT id, count(*) FROM users GROUP BY id', ['id', 'count(*)']],
      ['SELECT id AS uid, name FROM users', ['uid', 'name']],
      ['SELECT * FROM logs', ['msg']],
      ['SELECT * FROM nope', ['id']],
      ['SELECT * FROM users WHERE id IN (SELECT id FROM users)', ['id', 'name']],
    ]
    for (const [sql, cols] of cases) expect(detectEditableTarget(result(sql, cols), tables), sql).toBeNull()
  })
})
