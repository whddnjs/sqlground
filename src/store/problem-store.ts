import { create } from 'zustand'

const KEY = 'sqlground:problems'

interface Saved {
  solved: string[]
  drafts: Record<string, string>
  lastProblem: string | null
}

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>
    return { solved: s.solved ?? [], drafts: s.drafts ?? {}, lastProblem: s.lastProblem ?? null }
  } catch {
    return { solved: [], drafts: {}, lastProblem: null }
  }
}

function persist(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // 저장 불가 환경이면 무시
  }
}

interface ProblemState extends Saved {
  select(id: string): void
  saveDraft(id: string, sql: string): void
  markSolved(id: string): void
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
  }
})
