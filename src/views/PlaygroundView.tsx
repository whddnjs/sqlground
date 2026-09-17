import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { EditorTabs } from '../components/editor/EditorTabs'
import { SqlEditor } from '../components/editor/SqlEditor'
import { AlterTableDialog } from '../components/forms/AlterTableDialog'
import { CreateTableDialog } from '../components/forms/CreateTableDialog'
import { InsertRowDialog } from '../components/forms/InsertRowDialog'
import { ResultPanel } from '../components/result/ResultPanel'
import { SchemaBrowser } from '../components/schema/SchemaBrowser'
import type { TableInfo } from '../db/engine'
import { buildDropTable, buildSelectAll } from '../lib/sql-builder'
import { useDbStore } from '../store/db-store'
import { useEditorStore } from '../store/editor-store'
import { useSettingsStore } from '../store/settings-store'

// 관계도는 버튼을 눌렀을 때만 내려받는다
const ErdView = lazy(() => import('./ErdView').then((m) => ({ default: m.ErdView })))

type Dialog = { type: 'create' } | { type: 'insert'; table: TableInfo } | { type: 'alter'; table: string } | null

export function PlaygroundView() {
  const { tables, outcome, notice, history, run, runFromUi } = useDbStore()
  const { code, setCode, appendCode, activeId } = useEditorStore()
  const fontSize = useSettingsStore((s) => s.fontSize)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [showErd, setShowErd] = useState(false)

  useEffect(() => {
    if (!showErd) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dialog) setShowErd(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showErd, dialog])

  const handleRun = useCallback((sql: string) => void run(sql), [run])
  const close = () => setDialog(null)
  const insertAndClose = (sql: string) => {
    appendCode(sql)
    close()
  }
  const runAndClose = (sql: string) => {
    void runFromUi(sql)
    close()
  }
  const selectTable = (t: TableInfo) => {
    const sql = buildSelectAll(t.name)
    appendCode(sql)
    void run(sql)
    setShowErd(false)
  }
  const dropTable = (t: TableInfo) => {
    const sql = buildDropTable(t.name)
    if (window.confirm(`'${t.name}' 테이블과 모든 데이터를 삭제할까요?\n\n${sql}\n\n(되돌리기로 복구할 수 있습니다)`)) void runFromUi(sql)
  }

  return (
    <>
      <Group orientation="horizontal" className="h-full">
        <Panel defaultSize="22%" minSize="12%" className="overflow-y-auto border-r border-neutral-200 dark:border-neutral-700">
          <SchemaBrowser
            tables={tables}
            onCreateTable={() => setDialog({ type: 'create' })}
            onSelectTable={selectTable}
            onInsertRow={(t) => setDialog({ type: 'insert', table: t })}
            onAlterTable={(t) => setDialog({ type: 'alter', table: t.name })}
            onDropTable={dropTable}
            onShowErd={() => setShowErd(true)}
          />
        </Panel>
        <Separator className="w-1 bg-neutral-100 hover:bg-blue-300 dark:bg-neutral-800" />
        <Panel>
          <Group orientation="vertical">
            <Panel defaultSize="45%" minSize="20%" className="flex flex-col overflow-hidden">
              <EditorTabs />
              {/* key 로 탭마다 에디터를 새로 만들어 실행 취소 기록이 섞이지 않게 한다 */}
              <div className="min-h-0 flex-1">
                <SqlEditor key={activeId} value={code} onChange={setCode} onRun={handleRun} tables={tables} fontSize={fontSize} />
              </div>
            </Panel>
            <Separator className="h-1 bg-neutral-100 hover:bg-blue-300 dark:bg-neutral-800" />
            <Panel className="overflow-hidden">
              <ResultPanel
                outcome={outcome}
                notice={notice}
                history={history}
                tables={tables}
                onRunFromUi={(sql, refreshSql) => void runFromUi(sql, refreshSql)}
                onInsertToEditor={appendCode}
              />
            </Panel>
          </Group>
        </Panel>
      </Group>

      {showErd && (
        <div className="absolute inset-0 z-20 bg-white dark:bg-neutral-900">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-neutral-500">불러오는 중…</div>}>
          <ErdView
            onClose={() => setShowErd(false)}
            onSelectTable={selectTable}
            onInsertRow={(t) => setDialog({ type: 'insert', table: t })}
            onAlterTable={(t) => setDialog({ type: 'alter', table: t.name })}
            onDropTable={dropTable}
          />
          </Suspense>
        </div>
      )}

      {dialog?.type === 'create' && <CreateTableDialog tables={tables} onClose={close} onInsert={insertAndClose} onRun={runAndClose} />}
      {dialog?.type === 'insert' && <InsertRowDialog table={dialog.table} onClose={close} onInsert={insertAndClose} onRun={runAndClose} />}
      {dialog?.type === 'alter' && (() => {
        // 구조 변경 후에도 다이얼로그를 유지하려고 이름으로 최신 테이블을 찾는다. 이름이 바뀌면 닫는다
        const table = tables.find((t) => t.name === dialog.table)
        if (!table) return null
        return <AlterTableDialog table={table} tables={tables} onClose={close} onInsert={insertAndClose} onRun={(sql) => void runFromUi(sql)} />
      })()}
    </>
  )
}
