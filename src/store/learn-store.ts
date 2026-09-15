import { create } from 'zustand'

const KEY = 'sqlground:learn'

interface Saved {
  completed: string[]
  lastLesson: string | null
}

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>
    return { completed: s.completed ?? [], lastLesson: s.lastLesson ?? null }
  } catch {
    return { completed: [], lastLesson: null }
  }
}

function persist(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // 저장 불가 환경이면 무시
  }
}

interface LearnState extends Saved {
  select(lessonId: string): void
  toggleCompleted(lessonId: string): void
}

export const useLearnStore = create<LearnState>((set, get) => ({
  ...load(),
  select(lessonId) {
    const next = { completed: get().completed, lastLesson: lessonId }
    persist(next)
    set(next)
  },
  toggleCompleted(lessonId) {
    const has = get().completed.includes(lessonId)
    const completed = has ? get().completed.filter((id) => id !== lessonId) : [...get().completed, lessonId]
    const next = { completed, lastLesson: get().lastLesson }
    persist(next)
    set(next)
  },
}))
