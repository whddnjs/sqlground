import { useCallback, useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { SqlEditor } from './components/editor/SqlEditor'
import { ResultPanel } from './components/result/ResultPanel'
import { SchemaBrowser } from './components/schema/SchemaBrowser'
import { useDbStore } from './store/db-store'

const INITIAL_SQL = `-- Cmd/Ctrl + Enter 로 실행합니다. 선택 영역이 있으면 그 부분만 실행합니다.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER
);

INSERT INTO users (name, age) VALUES ('민수', 25), ('지영', 31), ('현우', NULL);

SELECT * FROM users;
`

export default function App() {
  const { status, loadError, tables, outcome, init, run } = useDbStore()
  const [code, setCode] = useState(INITIAL_SQL)

  useEffect(() => {
    void init()
  }, [init])

  const handleRun = useCallback((sql: string) => run(sql), [run])

  if (status === 'loading') return <Centered>DB 엔진을 불러오는 중…</Centered>
  if (status === 'error') return <Centered>DB 엔진을 불러오지 못했습니다: {loadError}</Centered>

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <h1 className="font-semibold">SQLGround</h1>
        <span className="text-xs text-neutral-500">SQLite · 브라우저에서 실행</span>
        <button
          className="ml-auto rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          onClick={() => run(code)}
        >
          실행
        </button>
      </header>

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize="20%" minSize="12%" className="overflow-y-auto border-r border-neutral-200 dark:border-neutral-700">
          <SchemaBrowser tables={tables} />
        </Panel>
        <Separator className="w-1 bg-neutral-100 hover:bg-blue-300 dark:bg-neutral-800" />
        <Panel>
          <Group orientation="vertical">
            <Panel defaultSize="45%" minSize="20%" className="overflow-hidden">
              <SqlEditor value={code} onChange={setCode} onRun={handleRun} tables={tables} />
            </Panel>
            <Separator className="h-1 bg-neutral-100 hover:bg-blue-300 dark:bg-neutral-800" />
            <Panel className="overflow-y-auto">
              <ResultPanel outcome={outcome} />
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-neutral-500">{children}</div>
}
