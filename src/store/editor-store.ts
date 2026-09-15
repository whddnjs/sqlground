import { create } from 'zustand'

const CODE_KEY = 'sqlground:code'

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

function loadCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? INITIAL_SQL
  } catch {
    return INITIAL_SQL
  }
}

function persist(code: string) {
  try {
    localStorage.setItem(CODE_KEY, code)
  } catch {
    // 저장 불가 환경이면 무시
  }
}

interface EditorState {
  code: string
  setCode(code: string): void
  /** 에디터 끝에 SQL 을 한 줄 띄워 붙인다 */
  appendCode(sql: string): void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  code: loadCode(),
  setCode(code) {
    persist(code)
    set({ code })
  },
  appendCode(sql) {
    const current = get().code
    const next = current.trimEnd() === '' ? sql + '\n' : current.trimEnd() + '\n\n' + sql + '\n'
    persist(next)
    set({ code: next })
  },
}))
