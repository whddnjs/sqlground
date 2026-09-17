import { create } from 'zustand'
import { isRecord, readJson, writeJson } from '../lib/storage'

const TABS_KEY = 'sqlground:tabs'
/** 탭 도입 전에 쓰던 키. 있으면 첫 탭으로 옮긴다 */
const LEGACY_CODE_KEY = 'sqlground:code'

const INITIAL_SQL = `-- Cmd/Ctrl + Enter 로 실행합니다. 선택 영역이 있으면 그 부분만 실행합니다.
-- 오른쪽 위 "샘플 로드" 로 연습용 데이터를 불러올 수 있습니다.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER
);

INSERT INTO users (name, age) VALUES ('민수', 25), ('지영', 31), ('현우', NULL);

SELECT * FROM users;
`

export interface EditorTab {
  id: string
  name: string
  code: string
}

interface Saved {
  tabs: EditorTab[]
  activeId: string
}

let seq = 0
const newId = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`

const isTab = (v: unknown): v is EditorTab =>
  isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.code === 'string'

function load(): Saved {
  const saved = readJson(TABS_KEY)
  if (isRecord(saved) && Array.isArray(saved.tabs)) {
    const tabs = saved.tabs.filter(isTab)
    if (tabs.length > 0) return { tabs, activeId: tabs.some((t) => t.id === saved.activeId) ? (saved.activeId as string) : tabs[0].id }
  }
  let legacy: string | null = null
  try {
    legacy = localStorage.getItem(LEGACY_CODE_KEY)
  } catch {
    // 접근 불가면 기본 예시로
  }
  const first: EditorTab = { id: newId(), name: '쿼리 1', code: legacy ?? INITIAL_SQL }
  return { tabs: [first], activeId: first.id }
}

const persist = (s: Saved) => writeJson(TABS_KEY, s)

/** "쿼리 N" 중 안 쓰는 가장 작은 번호 */
export function nextTabName(tabs: EditorTab[]): string {
  const used = new Set(tabs.map((t) => t.name))
  let n = 1
  while (used.has(`쿼리 ${n}`)) n++
  return `쿼리 ${n}`
}

interface EditorState extends Saved {
  /** 활성 탭의 내용. tabs 와 항상 같이 갱신된다 */
  code: string
  setCode(code: string): void
  /** 활성 탭 끝에 SQL 을 한 줄 띄워 붙인다 */
  appendCode(sql: string): void
  addTab(): void
  /** 마지막 남은 탭은 닫지 않고 내용만 비운다 */
  closeTab(id: string): void
  selectTab(id: string): void
  renameTab(id: string, name: string): void
}

const codeOf = (s: Saved) => s.tabs.find((t) => t.id === s.activeId)?.code ?? ''

export const useEditorStore = create<EditorState>((set, get) => {
  const commit = (next: Saved) => {
    persist(next)
    set({ ...next, code: codeOf(next) })
  }
  const initial = load()

  return {
    ...initial,
    code: codeOf(initial),

    setCode(code) {
      const { tabs, activeId } = get()
      commit({ tabs: tabs.map((t) => (t.id === activeId ? { ...t, code } : t)), activeId })
    },

    appendCode(sql) {
      const current = get().code
      get().setCode(current.trimEnd() === '' ? sql + '\n' : current.trimEnd() + '\n\n' + sql + '\n')
    },

    addTab() {
      const { tabs } = get()
      const tab: EditorTab = { id: newId(), name: nextTabName(tabs), code: '' }
      commit({ tabs: [...tabs, tab], activeId: tab.id })
    },

    closeTab(id) {
      const { tabs, activeId } = get()
      if (tabs.length === 1) {
        commit({ tabs: [{ ...tabs[0], code: '' }], activeId: tabs[0].id })
        return
      }
      const index = tabs.findIndex((t) => t.id === id)
      const rest = tabs.filter((t) => t.id !== id)
      // 활성 탭을 닫으면 그 자리의 이웃 탭으로 이동
      const nextActive = id === activeId ? rest[Math.min(index, rest.length - 1)].id : activeId
      commit({ tabs: rest, activeId: nextActive })
    },

    selectTab(id) {
      const { tabs } = get()
      if (tabs.some((t) => t.id === id)) commit({ tabs, activeId: id })
    },

    renameTab(id, name) {
      const trimmed = name.trim()
      if (trimmed === '') return
      const { tabs, activeId } = get()
      commit({ tabs: tabs.map((t) => (t.id === id ? { ...t, name: trimmed } : t)), activeId })
    },
  }
})
