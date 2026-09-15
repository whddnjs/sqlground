import { describe, expect, it } from 'vitest'
import { SqliteEngine } from '../sqlite/sqlite-engine'
import { PRESETS } from './index'

describe.each(PRESETS)('프리셋 $name', (preset) => {
  it('에러 없이 로드되고 선언한 테이블이 모두 생긴다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    const { error } = engine.exec(preset.sql)
    expect(error).toBeUndefined()
    expect(engine.getTables().map((t) => t.name).sort()).toEqual([...preset.tables].sort())
  })

  it('컬럼 설명은 실제 있는 테이블.컬럼만 가리킨다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    engine.exec(preset.sql)
    const known = new Set(engine.getTables().flatMap((t) => t.columns.map((c) => `${t.name}.${c.name}`)))
    for (const key of Object.keys(preset.descriptions)) expect(known.has(key), key).toBe(true)
  })

  it('두 번 로드해도 에러가 없다 (DROP IF EXISTS)', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    engine.exec(preset.sql)
    expect(engine.exec(preset.sql).error).toBeUndefined()
  })
})

describe('쇼핑몰 프리셋', () => {
  it('JOIN 과 집계가 가능한 관계 데이터가 들어 있다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    engine.exec(PRESETS[0].sql)
    const { results, error } = engine.exec(`
      SELECT c.name, SUM(oi.quantity * oi.unit_price) AS total
      FROM customers c
      JOIN orders o ON o.customer_id = c.id
      JOIN order_items oi ON oi.order_id = o.id
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 3
    `)
    expect(error).toBeUndefined()
    expect(results[0].rows).toHaveLength(3)
    expect(Number(results[0].rows[0][1])).toBeGreaterThan(0)
  })
})
