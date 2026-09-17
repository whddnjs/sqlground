import { describe, expect, it } from 'vitest'
import { SqliteEngine } from '../../db/sqlite/sqlite-engine'
import { CHAPTERS } from '../../learn/content'
import { loadSamples } from '../../learn/lesson-engine'
import { grade } from '../grade'
import { PROBLEMS } from './index'

const lessonIds = new Set(CHAPTERS.flatMap((c) => c.lessons.map((l) => l.id)))

describe('문제 콘텐츠', () => {
  it('id 가 겹치지 않고 연결된 단원이 모두 존재한다', () => {
    const ids = PROBLEMS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PROBLEMS) expect(lessonIds.has(p.lessonId), `${p.id} → ${p.lessonId}`).toBe(true)
  })

  it('조회 문제: 정답 쿼리가 샘플 DB 에서 실행되고 결과가 있다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    loadSamples(engine)
    for (const p of PROBLEMS.filter((x) => !x.checkSql)) {
      const { results, error } = engine.exec(p.answerSql)
      expect(error?.message, p.title).toBeUndefined()
      expect(results[0].rows.length, p.title).toBeGreaterThan(0)
    }
  })

  it('변경 문제: 정답을 실행하면 확인 쿼리 결과가 달라지고, 아무것도 안 하면 오답이다', async () => {
    const changing = PROBLEMS.filter((x) => x.checkSql)
    expect(changing.length).toBeGreaterThan(0)
    for (const p of changing) {
      const engine = new SqliteEngine()
      await engine.init()
      loadSamples(engine)
      const before = engine.exec(p.checkSql!)
      expect(before.error?.message, `${p.title} (확인 쿼리)`).toBeUndefined()

      expect(engine.exec(p.answerSql).error?.message, `${p.title} (정답)`).toBeUndefined()
      const after = engine.exec(p.checkSql!)
      expect(after.results[0].rows.length, p.title).toBeGreaterThan(0)
      expect(grade(before.results[0], after.results[0], p.orderMatters).ok, `${p.title}: 아무것도 안 해도 정답이면 안 됨`).toBe(false)
    }
  })
})
