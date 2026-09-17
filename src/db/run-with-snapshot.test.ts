import { beforeEach, describe, expect, it } from 'vitest'
import { runWithSnapshot } from './run-with-snapshot'
import { SnapshotStack } from './snapshot'
import { SqliteEngine } from './sqlite/sqlite-engine'

describe('runWithSnapshot', () => {
  let engine: SqliteEngine
  let snapshots: SnapshotStack

  beforeEach(async () => {
    engine = new SqliteEngine()
    await engine.init()
    snapshots = new SnapshotStack()
    engine.exec(`CREATE TABLE t (id INTEGER); INSERT INTO t VALUES (1);`)
  })

  it('조회만 하면 되돌리기 단계가 쌓이지 않는다', () => {
    for (let i = 0; i < 3; i++) expect(runWithSnapshot(engine, snapshots, 'SELECT * FROM t').changed).toBe(false)
    expect(snapshots.size).toBe(0)
  })

  it('데이터나 구조를 바꾸면 실행 전 상태가 쌓이고, 그 스냅샷으로 복원된다', async () => {
    expect(runWithSnapshot(engine, snapshots, 'DELETE FROM t').changed).toBe(true)
    expect(runWithSnapshot(engine, snapshots, 'DROP TABLE t').changed).toBe(true)
    expect(snapshots.size).toBe(2)

    await engine.import(snapshots.pop()!)
    expect(engine.exec('SELECT count(*) FROM t').results[0].rows).toEqual([[0]])
    await engine.import(snapshots.pop()!)
    expect(engine.exec('SELECT count(*) FROM t').results[0].rows).toEqual([[1]])
  })

  it('실패한 실행은 아무것도 바꾸지 않았으면 쌓이지 않는다', () => {
    const { outcome, changed } = runWithSnapshot(engine, snapshots, 'SELECT * FROM nope')
    expect(outcome.error).toBeDefined()
    expect(changed).toBe(false)
    expect(snapshots.size).toBe(0)
  })

  it('여러 번에 나눠 실행한 트랜잭션이 유지된다', () => {
    runWithSnapshot(engine, snapshots, 'BEGIN')
    runWithSnapshot(engine, snapshots, 'INSERT INTO t VALUES (2)')
    expect(runWithSnapshot(engine, snapshots, 'ROLLBACK').outcome.error).toBeUndefined()
    expect(engine.exec('SELECT count(*) FROM t').results[0].rows).toEqual([[1]])

    runWithSnapshot(engine, snapshots, 'BEGIN; INSERT INTO t VALUES (3);')
    expect(runWithSnapshot(engine, snapshots, 'COMMIT').outcome.error).toBeUndefined()
    expect(engine.exec('SELECT count(*) FROM t').results[0].rows).toEqual([[2]])
  })
})
