import { create } from 'zustand'
import { isRecord, readJson, stringArray, stringRecord, writeJson } from '../lib/storage'

const KEY = 'sqlground:problems'

interface Saved {
  solved: string[]
  drafts: Record<string, string>
  lastProblem: string | null
}

function load(): Saved {
  const s = readJson(KEY)
  if (!isRecord(s)) return { solved: [], drafts: {}, lastProblem: null }
  return { solved: stringArray(s.solved), drafts: stringRecord(s.drafts), lastProblem: typeof s.lastProblem === 'string' ? s.lastProblem : null }
}

const persist = (s: Saved) => writeJson(KEY, s)

interface ProblemState extends Saved {
  select(id: string): void
  saveDraft(id: string, sql: string): void
  markSolved(id: string): void
  /** 해결 기록·작성 중인 답안·마지막 문제 위치를 모두 지운다 (설정의 진행 기록 초기화) */
  reset(): void
}

export const useProblemStore = create<ProblemState>((set, get) => {
  const commit = (patch: Partial<Saved>) => {
    const next: Saved = { solved: get().solved, drafts: get().drafts, lastProblem: get().lastProblem, ...patch }
    persist(next)
    set(next)
  }
  return {
    ...load(),
    select: (id) => commit({ lastProblem: id }),
    saveDraft: (id, sql) => commit({ drafts: { ...get().drafts, [id]: sql } }),
    markSolved: (id) => {
      if (!get().solved.includes(id)) commit({ solved: [...get().solved, id] })
    },
    reset: () => commit({ solved: [], drafts: {}, lastProblem: null }),
  }
})
