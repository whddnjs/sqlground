import { beforeEach, describe, expect, it } from 'vitest'
import { SqliteEngine } from './sqlite-engine'

describe('SqliteEngine', () => {
  let engine: SqliteEngine

  beforeEach(async () => {
    engine = new SqliteEngine()
    await engine.init()
  })

  it('여러 문장을 순서대로 실행하고 문장별 결과를 돌려준다', () => {
    const { results, error } = engine.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      INSERT INTO users (name) VALUES ('a'), ('b');
      SELECT * FROM users ORDER BY id;
    `)
    expect(error).toBeUndefined()
    expect(results).toHaveLength(3)
    expect(results[0].rowsAffected).toBe(0)
    expect(results[1].rowsAffected).toBe(2)
    expect(results[2].columns).toEqual(['id', 'name'])
    expect(results[2].rows).toEqual([
      [1, 'a'],
      [2, 'b'],
    ])
  })

  it('중간 문장이 실패하면 거기서 중단하고 앞선 결과와 에러를 함께 돌려준다', () => {
    const { results, error } = engine.exec(`
      CREATE TABLE t (id INTEGER);
      INSERT INTO nope VALUES (1);
      INSERT INTO t VALUES (1);
    `)
    expect(results).toHaveLength(1)
    expect(error?.message).toContain('no such table: nope')
    expect(error?.sql).toContain('INSERT INTO nope')
    expect(engine.exec('SELECT count(*) FROM t').results[0].rows).toEqual([[0]])
  })

  it('문법 오류는 결과 없이 에러만 돌려준다', () => {
    const { results, error } = engine.exec('SELEC 1')
    expect(results).toHaveLength(0)
    expect(error?.message).toContain('syntax error')
  })

  it('getTables 는 테이블과 컬럼 정보를 돌려준다', () => {
    engine.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL DEFAULT 0
      );
      CREATE TABLE "order items" (qty INTEGER);
    `)
    const tables = engine.getTables()
    expect(tables.map((t) => t.name)).toEqual(['order items', 'products'])
    expect(tables[1].columns).toEqual([
      { name: 'id', type: 'INTEGER', notNull: false, primaryKey: true, defaultValue: null },
      { name: 'name', type: 'TEXT', notNull: true, primaryKey: false, defaultValue: null },
      { name: 'price', type: 'REAL', notNull: false, primaryKey: false, defaultValue: '0' },
    ])
  })

  it('export 한 바이너리를 import 하면 데이터가 복원된다', async () => {
    engine.exec(`CREATE TABLE t (v TEXT); INSERT INTO t VALUES ('hello');`)
    const snapshot = engine.export()

    engine.exec(`DROP TABLE t`)
    expect(engine.getTables()).toHaveLength(0)

    await engine.import(snapshot)
    expect(engine.exec('SELECT v FROM t').results[0].rows).toEqual([['hello']])
  })

  it('reset 하면 빈 DB 가 된다', async () => {
    engine.exec(`CREATE TABLE t (v TEXT)`)
    await engine.reset()
    expect(engine.getTables()).toHaveLength(0)
  })
})
