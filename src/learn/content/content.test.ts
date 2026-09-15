import { describe, expect, it } from 'vitest'
import { SqliteEngine } from '../../db/sqlite/sqlite-engine'
import { loadSamples } from '../lesson-engine'
import { extractSqlBlocks } from '../markdown'
import { CHAPTERS } from './index'

/**
 * 콘텐츠 검증: 모든 단원의 ```sql 예제를 단원 순서대로 실행한다.
 * 의도적으로 에러를 보여 주는 예제는 본문에 "에러" 라는 단어를 예제 바로 앞 문단이나 주석에 적어 둔다.
 */
const lessons = CHAPTERS.flatMap((c) => c.lessons.map((l) => ({ chapter: c.title, ...l })))

describe('학습 콘텐츠', () => {
  it('단원 id 가 겹치지 않는다', () => {
    const ids = lessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('모든 단원에 실행 가능한 예제가 하나 이상 있다', () => {
    for (const l of lessons) expect(extractSqlBlocks(l.body).length, l.title).toBeGreaterThan(0)
  })

  describe.each(lessons)('$chapter > $title', (lesson) => {
    it('예제가 순서대로 실행된다 (의도된 에러 제외)', async () => {
      const engine = new SqliteEngine()
      await engine.init()
      loadSamples(engine)
      const blocks = extractSqlBlocks(lesson.body)
      blocks.forEach((sql, i) => {
        const intendedError = /에러/.test(sql) || intendedErrorBefore(lesson.body, sql)
        const { error } = engine.exec(sql)
        if (intendedError) {
          expect(error, `예제 ${i + 1} 은 에러가 나야 합니다:\n${sql}`).toBeDefined()
        } else {
          expect(error?.message, `예제 ${i + 1}:\n${sql}`).toBeUndefined()
        }
      })
    })
  })
})

/** 예제 블록 바로 앞 문단에 "에러" 가 언급돼 있으면 의도된 에러 예제로 본다 */
function intendedErrorBefore(body: string, sql: string): boolean {
  const idx = body.indexOf(sql)
  if (idx < 0) return false
  const before = body.slice(0, idx).trimEnd().split('\n').filter((l) => l.trim() !== '')
  const lastParagraph = before[before.length - 2] ?? ''
  return /에러/.test(lastParagraph)
}
