import { describe, expect, it } from 'vitest'
import { SqliteEngine } from '../db/sqlite/sqlite-engine'
import { buildCreateTable, buildDelete, buildDropTable, buildInsert, buildSelectAll, buildUpdate, emptyColumn, literal } from './sql-builder'

describe('sql-builder', () => {
  it('CREATE TABLE: 제약 조건을 순서대로 붙이고 PK 에는 NOT NULL/UNIQUE 를 중복해서 붙이지 않는다', () => {
    const sql = buildCreateTable('users', [
      { ...emptyColumn(), name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, notNull: true },
      { ...emptyColumn(), name: 'email', type: 'TEXT', notNull: true, unique: true },
      { ...emptyColumn(), name: 'age', type: 'INTEGER', defaultValue: '0' },
      { ...emptyColumn(), name: 'order', type: 'TEXT' },
    ])
    expect(sql).toBe(
      'CREATE TABLE users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  email TEXT NOT NULL UNIQUE,\n  age INTEGER DEFAULT 0,\n  "order" TEXT\n);',
    )
  })

  it('literal: 숫자 타입에 숫자 모양이면 그대로, 아니면 작은따옴표로 감싸고 이스케이프한다', () => {
    expect(literal('42', 'INTEGER')).toBe('42')
    expect(literal('3.5', 'REAL')).toBe('3.5')
    expect(literal('abc', 'INTEGER')).toBe("'abc'")
    expect(literal('42', 'TEXT')).toBe("'42'")
    expect(literal("it's", 'TEXT')).toBe("'it''s'")
    expect(literal(null, 'TEXT')).toBe('NULL')
  })

  it('INSERT / UPDATE / DELETE / DROP / SELECT', () => {
    expect(
      buildInsert('users', [
        { column: 'name', type: 'TEXT', value: '민수' },
        { column: 'age', type: 'INTEGER', value: '25' },
        { column: 'memo', type: 'TEXT', value: null },
      ]),
    ).toBe("INSERT INTO users (name, age, memo) VALUES ('민수', 25, NULL);")
    const ref = { table: 'users', pkColumn: 'id', pkValue: 3 }
    expect(buildUpdate(ref, 'name', 'TEXT', '지영')).toBe("UPDATE users SET name = '지영' WHERE id = 3;")
    expect(buildDelete({ ...ref, pkValue: 'abc' })).toBe("DELETE FROM users WHERE id = 'abc';")
    expect(buildDropTable('order items')).toBe('DROP TABLE "order items";')
    expect(buildSelectAll('users')).toBe('SELECT * FROM users LIMIT 100;')
  })

  it('생성한 SQL 이 실제 엔진에서 실행된다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    const create = buildCreateTable('t', [
      { ...emptyColumn(), name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { ...emptyColumn(), name: 'name', type: 'TEXT', notNull: true },
    ])
    const insert = buildInsert('t', [{ column: 'name', type: 'TEXT', value: "O'Brien" }])
    const update = buildUpdate({ table: 't', pkColumn: 'id', pkValue: 1 }, 'name', 'TEXT', 'Kim')
    const { results, error } = engine.exec([create, insert, update, buildSelectAll('t')].join('\n'))
    expect(error).toBeUndefined()
    expect(results[3].rows).toEqual([[1, 'Kim']])
    expect(engine.exec(buildDelete({ table: 't', pkColumn: 'id', pkValue: 1 })).results[0].rowsAffected).toBe(1)
  })
})
