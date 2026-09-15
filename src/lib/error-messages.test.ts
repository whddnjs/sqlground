import { describe, expect, it } from 'vitest'
import { SqliteEngine } from '../db/sqlite/sqlite-engine'
import { explainSqlError } from './error-messages'

describe('explainSqlError', () => {
  it('실제 SQLite 에러 메시지를 한글 설명으로 바꾼다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    engine.exec(`CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE); INSERT INTO t (name) VALUES ('a');`)

    const cases: Array<[string, string]> = [
      ['SELECT * FROM nope', "'nope' 테이블이 없습니다"],
      ['SELECT nope FROM t', "'nope' 컬럼이 없습니다"],
      ['CREATE TABLE t (x)', "'t' 테이블이 이미 있습니다"],
      ['SELEC 1', "'SELEC' 근처에 문법 오류"],
      ['SELECT 1 FROM t WHERE (', '문장이 끝나지 않았습니다'],
      ['INSERT INTO t (id) VALUES (2)', "'t.name' 컬럼은 NOT NULL"],
      ["INSERT INTO t (name) VALUES ('a')", "'t.name' 컬럼에 같은 값이 이미"],
      ["INSERT INTO t VALUES (1, 'x', 'y')", "컬럼이 2개인데 값은 3개"],
      ["INSERT INTO t (name) VALUES ('x', 'y')", '지정한 컬럼은 1개인데 값은 2개'],
      ['SELECT id FROM t a JOIN t b', "'id' 컬럼이 여러 테이블에"],
      ['SELECT nope()', "'nope' 함수는 SQLite 에 없습니다"],
    ]
    for (const [sql, expected] of cases) {
      const { error } = engine.exec(sql)
      expect(error, sql).toBeDefined()
      expect(explainSqlError(error!.message), `${sql} → ${error!.message}`).toContain(expected)
    }
  })

  it('모르는 에러는 null 을 돌려준다', () => {
    expect(explainSqlError('something weird')).toBeNull()
  })
})
