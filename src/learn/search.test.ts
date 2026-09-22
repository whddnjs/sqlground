import { describe, expect, it } from 'vitest'
import { CHAPTERS } from './content'
import { searchLessons } from './search'

const lessons = CHAPTERS.flatMap((c) => c.lessons)

describe('단원 검색', () => {
  it('빈 검색어는 전부 돌려주고 미리보기가 없다', () => {
    const hits = searchLessons(lessons, '  ')
    expect(hits.length).toBe(lessons.length)
    expect(hits.every((h) => h.snippet === null)).toBe(true)
  })

  it('제목이나 키워드가 맞으면 미리보기 없이, 본문만 맞으면 맞은 곳 주변을 돌려준다', () => {
    const byKeyword = searchLessons(lessons, 'coalesce')
    expect(byKeyword.find((h) => h.lesson.id === 'null')?.snippet).toBeNull()

    // "ambiguous" 는 JOIN 단원 본문에만 있다
    const byBody = searchLessons(lessons, 'ambiguous')
    const join = byBody.find((h) => h.lesson.id === 'join')
    expect(join?.snippet).toMatch(/ambiguous/)
    expect(join?.snippet).not.toMatch(/[`#*]/)
  })

  it('없는 말은 결과가 없다', () => {
    expect(searchLessons(lessons, 'zzzz없는말')).toEqual([])
  })
})
