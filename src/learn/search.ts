import type { Lesson } from './types'

export interface LessonHit {
  lesson: Lesson
  /** 제목·키워드가 아니라 본문에서만 맞았을 때, 맞은 곳 주변 한 줄 */
  snippet: string | null
}

/** 마크다운 표시를 걷어내 검색과 미리보기에 쓸 글로 만든다 */
function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`#*>|_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 단원을 검색한다. 제목·키워드가 맞으면 그대로, 본문만 맞으면 맞은 곳 주변을 잘라 함께 돌려준다.
 * 비교는 대소문자를 가리지 않는다.
 */
export function searchLessons(lessons: Lesson[], query: string): LessonHit[] {
  const q = query.trim().toLowerCase()
  if (q === '') return lessons.map((lesson) => ({ lesson, snippet: null }))
  const hits: LessonHit[] = []
  for (const lesson of lessons) {
    if (lesson.title.toLowerCase().includes(q) || lesson.keywords.some((k) => k.toLowerCase().includes(q))) {
      hits.push({ lesson, snippet: null })
      continue
    }
    const text = plain(lesson.body)
    const i = text.toLowerCase().indexOf(q)
    if (i < 0) continue
    const start = Math.max(0, i - 24)
    const end = Math.min(text.length, i + q.length + 40)
    hits.push({ lesson, snippet: `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}` })
  }
  return hits
}
