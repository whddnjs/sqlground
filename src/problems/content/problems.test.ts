import { describe, expect, it } from 'vitest'
import { SqliteEngine } from '../../db/sqlite/sqlite-engine'
import { CHAPTERS } from '../../learn/content'
import { loadSamples } from '../../learn/lesson-engine'
import { PROBLEMS } from './index'

const lessonIds = new Set(CHAPTERS.flatMap((c) => c.lessons.map((l) => l.id)))

describe('문제 콘텐츠', () => {
  it('id 가 겹치지 않고 연결된 단원이 모두 존재한다', () => {
    const ids = PROBLEMS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PROBLEMS) expect(lessonIds.has(p.lessonId), `${p.id} → ${p.lessonId}`).toBe(true)
  })

  it('정답 쿼리가 샘플 DB 에서 실행되고 결과가 있다', async () => {
    const engine = new SqliteEngine()
    await engine.init()
    loadSamples(engine)
    for (const p of PROBLEMS) {
      const { results, error } = engine.exec(p.answerSql)
      expect(error?.message, p.title).toBeUndefined()
      expect(results[0].rows.length, p.title).toBeGreaterThan(0)
    }
  })
})
