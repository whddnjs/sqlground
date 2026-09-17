import { beforeEach, describe, expect, it } from 'vitest'
import { SqliteEngine, stripLeadingComments } from './sqlite-engine'

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

  it('결과의 sql 에는 문장 앞 주석이 포함되지 않는다', () => {
    const { results } = engine.exec(`
      -- 테이블 생성
      /* 블록 주석 */
      CREATE TABLE t (id INTEGER);
      -- 조회
      SELECT * FROM t;
    `)
    expect(results.map((r) => r.sql)).toEqual(['CREATE TABLE t (id INTEGER);', 'SELECT * FROM t;'])
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

  it('getTables 는 외래키 정보를 돌려준다', () => {
    engine.exec(`
      CREATE TABLE a (id INTEGER PRIMARY KEY);
      CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER REFERENCES a(id), a2 INTEGER REFERENCES a);
    `)
    const b = engine.getTables().find((t) => t.name === 'b')!
    expect(b.foreignKeys).toEqual([
      { column: 'a2', refTable: 'a', refColumn: '' },
      { column: 'a_id', refTable: 'a', refColumn: 'id' },
    ])
  })

  it('FOREIGN KEY 제약이 켜져 있고 import/reset 후에도 유지된다', async () => {
    const schema = `CREATE TABLE a (id INTEGER PRIMARY KEY); CREATE TABLE b (a_id INTEGER REFERENCES a(id));`
    engine.exec(schema)
    expect(engine.exec('INSERT INTO b VALUES (99)').error?.message).toContain('FOREIGN KEY constraint failed')

    await engine.import(engine.export())
    expect(engine.exec('INSERT INTO b VALUES (99)').error?.message).toContain('FOREIGN KEY constraint failed')

    // sql.js 의 export 는 연결을 닫았다 다시 열어 PRAGMA 가 초기화된다. 스냅샷마다 export 하므로 반드시 유지돼야 한다
    engine.export()
    expect(engine.exec('INSERT INTO b VALUES (99)').error?.message).toContain('FOREIGN KEY constraint failed')

    await engine.reset()
    engine.exec(schema)
    expect(engine.exec('INSERT INTO b VALUES (99)').error?.message).toContain('FOREIGN KEY constraint failed')

    const off = new SqliteEngine({ foreignKeys: false })
    await off.init()
    off.exec(schema)
    expect(off.exec('INSERT INTO b VALUES (99)').error).toBeUndefined()

    off.setForeignKeys(true)
    expect(off.exec('INSERT INTO b VALUES (98)').error?.message).toContain('FOREIGN KEY constraint failed')
    off.setForeignKeys(false)
    expect(off.exec('INSERT INTO b VALUES (98)').error).toBeUndefined()
  })

  it('changeToken 은 데이터나 구조가 바뀔 때만 달라진다', () => {
    engine.exec('CREATE TABLE t (id INTEGER)')
    const t0 = engine.changeToken()
    engine.exec('SELECT * FROM t; SELECT 1;')
    expect(engine.changeToken()).toBe(t0)
    engine.exec('INSERT INTO t VALUES (1)')
    const t1 = engine.changeToken()
    expect(t1).not.toBe(t0)
    engine.exec('ALTER TABLE t ADD COLUMN x TEXT')
    expect(engine.changeToken()).not.toBe(t1)
  })

  it('inTransaction 은 BEGIN 과 COMMIT/ROLLBACK 을 따라간다', () => {
    engine.exec('CREATE TABLE t (id INTEGER)')
    expect(engine.inTransaction()).toBe(false)
    engine.exec('BEGIN; INSERT INTO t VALUES (1);')
    expect(engine.inTransaction()).toBe(true)
    engine.exec('SAVEPOINT s; ROLLBACK TO s;')
    expect(engine.inTransaction()).toBe(true)
    engine.exec('ROLLBACK')
    expect(engine.inTransaction()).toBe(false)
    expect(engine.exec('SELECT count(*) FROM t').results[0].rows).toEqual([[0]])
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

describe('stripLeadingComments', () => {
  it('앞선 줄 주석과 블록 주석만 제거하고 본문 안의 주석은 남긴다', () => {
    expect(stripLeadingComments('  -- a\n/* b */\nSELECT 1 -- c')).toBe('SELECT 1 -- c')
    expect(stripLeadingComments('SELECT 1')).toBe('SELECT 1')
  })
})
