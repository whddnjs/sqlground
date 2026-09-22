import { describe, expect, it } from 'vitest'
import type { QueryResult } from '../../db/engine'
import { SqliteEngine } from '../../db/sqlite/sqlite-engine'
import { CHAPTERS } from '../../learn/content'
import { loadSamples } from '../../learn/samples'
import { lastQueryResult } from '../context'
import { grade } from '../grade'
import type { Problem } from '../types'
import { PROBLEMS } from './index'

const lessons = CHAPTERS.flatMap((c) => c.lessons)
const lessonIds = new Set(lessons.map((l) => l.id))

async function freshEngine() {
  const engine = new SqliteEngine()
  await engine.init()
  loadSamples(engine)
  return engine
}

/** 앱의 채점과 같은 방식으로 "이 SQL 을 제출했을 때 비교 대상이 되는 결과" 를 구한다 */
async function gradedResult(problem: Problem, sql: string): Promise<QueryResult> {
  const engine = await freshEngine()
  const run = engine.exec(sql)
  expect(run.error?.message, `${problem.title}: ${sql}`).toBeUndefined()
  if (!problem.checkSql) return lastQueryResult(run.results)!
  const check = engine.exec(problem.checkSql)
  expect(check.error?.message, `${problem.title} (확인 쿼리)`).toBeUndefined()
  return lastQueryResult(check.results)!
}

describe('문제 콘텐츠', () => {
  it('id 가 겹치지 않고 연결된 단원이 모두 존재한다', () => {
    const ids = PROBLEMS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PROBLEMS) expect(lessonIds.has(p.lessonId), `${p.id} → ${p.lessonId}`).toBe(true)
  })

  it('단원마다 쉬운 문제부터 놓이고, 세 문제인 단원은 쉬움·보통·어려움이 하나씩이다', () => {
    for (const lesson of lessons) {
      const levels = PROBLEMS.filter((p) => p.lessonId === lesson.id && !p.mixes).map((p) => p.difficulty)
      expect(levels, lesson.title).toEqual([...levels].sort())
      expect(levels.length, `${lesson.title}: 단원당 최대 3문제`).toBeLessThanOrEqual(3)
      if (levels.length === 3) expect(levels, lesson.title).toEqual([1, 2, 3])
    }
  })

  it('종합 문제는 장마다 3문제, 보통 이상이며 그 장의 단원을 포함해 둘 이상 섞고 뒤 장의 단원은 쓰지 않는다', () => {
    const chapterOf = new Map(CHAPTERS.flatMap((c, i) => c.lessons.map((l) => [l.id, i] as const)))
    const mixed = PROBLEMS.filter((p) => p.mixes)
    expect(mixed.length).toBeGreaterThan(0)
    for (const p of mixed) {
      expect(p.mixes![0], `${p.title}: lessonId 는 mixes 의 첫 단원`).toBe(p.lessonId)
      expect(p.difficulty, `${p.title}: 종합 문제는 보통 이상`).toBeGreaterThanOrEqual(2)
      expect(p.description, p.title).toContain('단원을 씁니다')
      const chapter = chapterOf.get(p.lessonId)!
      expect(p.mixes!.length, `${p.title}: 단원 2개 이상`).toBeGreaterThanOrEqual(2)
      expect(new Set(p.mixes).size, `${p.title}: 단원이 겹침`).toBe(p.mixes!.length)
      for (const id of p.mixes!) expect(chapterOf.get(id)!, `${p.title}: ${id} 는 뒤 장의 단원`).toBeLessThanOrEqual(chapter)
    }
    for (const [i, c] of CHAPTERS.entries()) {
      const levels = mixed.filter((p) => chapterOf.get(p.lessonId) === i).map((p) => p.difficulty)
      if (levels.length === 0) continue
      expect(levels.length, `${c.title}: 종합 문제는 3개`).toBe(3)
      expect(levels, c.title).toEqual([...levels].sort())
    }
  })

  it('설명에 결과 열이 적혀 있다 (조회 문제)', () => {
    // 열이 하나뿐이거나 전체 조회인 문제는 예외
    const exempt = new Set(['p-tables-1'])
    for (const p of PROBLEMS.filter((x) => !x.checkSql && !exempt.has(x.id))) expect(p.description, p.title).toContain('결과 열:')
  })

  it('모범 답안이 샘플 DB 에서 실행되고 결과가 있다', async () => {
    for (const p of PROBLEMS) {
      const result = await gradedResult(p, p.answerSql)
      expect(result.rows.length, p.title).toBeGreaterThan(0)
    }
  })

  it('다른 풀이는 모범 답안과 같은 결과로 채점된다', async () => {
    const withAlternatives = PROBLEMS.filter((p) => p.alternatives?.length)
    expect(withAlternatives.length).toBeGreaterThan(0)
    for (const p of withAlternatives) {
      const expected = await gradedResult(p, p.answerSql)
      for (const alt of p.alternatives!) {
        const mine = await gradedResult(p, alt.sql)
        expect(grade(mine, expected, p.orderMatters), `${p.title}: ${alt.sql}`).toEqual({ ok: true, message: '정답입니다!' })
      }
    }
  })

  it('변경 문제는 아무것도 하지 않으면 오답이다', async () => {
    const changing = PROBLEMS.filter((x) => x.checkSql)
    expect(changing.length).toBeGreaterThan(0)
    for (const p of changing) {
      const expected = await gradedResult(p, p.answerSql)
      // 아직 없는 테이블·뷰를 확인하는 쿼리는 실행 전에는 에러가 난다. 그것도 "오답" 이다
      const before = (await freshEngine()).exec(p.checkSql!)
      if (before.error) continue
      expect(grade(lastQueryResult(before.results)!, expected, p.orderMatters).ok, `${p.title}: 아무것도 안 해도 정답이면 안 됨`).toBe(false)
    }
  })
})
