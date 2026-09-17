import { create } from 'zustand'
import { isRecord, readJson, stringArray, writeJson } from '../lib/storage'

const KEY = 'sqlground:learn'

interface Saved {
  completed: string[]
  lastLesson: string | null
}

function load(): Saved {
  const s = readJson(KEY)
  if (!isRecord(s)) return { completed: [], lastLesson: null }
  return { completed: stringArray(s.completed), lastLesson: typeof s.lastLesson === 'string' ? s.lastLesson : null }
}

const persist = (s: Saved) => writeJson(KEY, s)

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
