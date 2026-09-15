import { Download } from 'lucide-react'
import { useState } from 'react'
import type { ExecOutcome, SqlValue, TableInfo } from '../../db/engine'
import { downloadCsv } from '../../lib/csv'
import { detectEditableTarget } from '../../lib/editable-select'
import { explainSqlError } from '../../lib/error-messages'
import { buildDelete, buildUpdate } from '../../lib/sql-builder'
import type { HistoryEntry, UiNotice } from '../../store/db-store'
import { ResultGrid } from './ResultGrid'

interface Props {
  outcome: ExecOutcome | null
  notice: UiNotice | null
  history: HistoryEntry[]
  tables: TableInfo[]
  onRunFromUi(sql: string, refreshSql?: string): void
  onInsertToEditor(sql: string): void
}

type Tab = 'result' | 'history'

export function ResultPanel({ outcome, notice, history, tables, onRunFromUi, onInsertToEditor }: Props) {
  const [tab, setTab] = useState<Tab>('result')

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b border-neutral-200 px-2 dark:border-neutral-700">
        <TabButton active={tab === 'result'} onClick={() => setTab('result')}>결과</TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          히스토리{history.length > 0 && <span className="ml-1 text-neutral-400">{history.length}</span>}
        </TabButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'result' ? (
          <Results outcome={outcome} notice={notice} tables={tables} onRunFromUi={onRunFromUi} />
        ) : (
          <History entries={history} onInsertToEditor={onInsertToEditor} />
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick(): void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'border-b-2 px-3 py-1.5 text-xs font-medium',
        active ? 'border-blue-600 text-blue-700 dark:text-blue-300' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Results({ outcome, notice, tables, onRunFromUi }: Pick<Props, 'outcome' | 'notice' | 'tables' | 'onRunFromUi'>) {
  if (!outcome && !notice) {
    return <p className="p-4 text-sm text-neutral-500">쿼리를 실행하면 결과가 여기에 표시됩니다.</p>
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {notice && (
        <section className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950">
          <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            UI 조작으로 실행한 SQL{notice.rowsAffected > 0 && ` · ${notice.rowsAffected}행 영향`}
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-emerald-900 dark:text-emerald-100">{notice.sql}</pre>
        </section>
      )}
      {outcome?.results.map((r, i) => {
        const editable = r.columns.length > 0 ? detectEditableTarget(r, tables) : null
        return (
          <section key={i} className="flex flex-col gap-1">
            <header className="flex items-baseline gap-2 text-xs text-neutral-500">
              <code className="max-w-[60%] truncate font-mono text-neutral-700 dark:text-neutral-300">{r.sql}</code>
              <span>{r.columns.length > 0 ? `${r.rows.length.toLocaleString()}행` : `${r.rowsAffected}행 영향`}</span>
              <span>{r.durationMs.toFixed(1)} ms</span>
              {r.columns.length > 0 && (
                <button
                  onClick={() => downloadCsv(r, `${editable?.table.name ?? 'result'}-${i + 1}.csv`)}
                  title="결과를 CSV 파일로 저장"
                  className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                  <Download size={12} /> CSV
                </button>
              )}
            </header>
            {r.columns.length > 0 && (
              <ResultGrid
                result={r}
                editable={editable}
                onUpdateCell={(pkValue: SqlValue, column, type, value) => {
                  if (!editable) return
                  const ref = { table: editable.table.name, pkColumn: editable.pk.name, pkValue: pkValue as string | number }
                  onRunFromUi(buildUpdate(ref, column, type, value), r.sql)
                }}
                onDeleteRow={(pkValue: SqlValue) => {
                  if (!editable) return
                  const ref = { table: editable.table.name, pkColumn: editable.pk.name, pkValue: pkValue as string | number }
                  const sql = buildDelete(ref)
                  if (window.confirm(`이 행을 삭제할까요?\n\n${sql}`)) onRunFromUi(sql, r.sql)
                }}
              />
            )}
          </section>
        )
      })}
      {outcome?.error && <ErrorBox message={outcome.error.message} sql={outcome.error.sql} />}
    </div>
  )
}

function History({ entries, onInsertToEditor }: { entries: HistoryEntry[]; onInsertToEditor(sql: string): void }) {
  if (entries.length === 0) return <p className="p-4 text-sm text-neutral-500">아직 실행한 쿼리가 없습니다.</p>
  const label: Record<HistoryEntry['source'], string> = { editor: '에디터', ui: 'UI', preset: '샘플' }
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-2 px-3 py-2 text-xs">
          <span className="mt-0.5 w-10 shrink-0 text-neutral-400">
            {new Date(e.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={['mt-0.5 shrink-0 rounded px-1 text-[10px]', e.ok ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'].join(' ')}>
            {label[e.source]}
          </span>
          <code className="min-w-0 flex-1 truncate font-mono whitespace-pre text-neutral-700 dark:text-neutral-300" title={e.sql}>
            {e.sql}
          </code>
          <button onClick={() => onInsertToEditor(e.sql)} className="shrink-0 text-blue-600 hover:underline">
            에디터에 넣기
          </button>
        </li>
      ))}
    </ul>
  )
}

function ErrorBox({ message, sql }: { message: string; sql: string }) {
  const hint = explainSqlError(message)
  return (
    <section className="rounded border border-red-300 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950">
      <p className="font-mono text-xs text-red-600 dark:text-red-400">{message}</p>
      {hint && <p className="mt-1.5 text-red-800 dark:text-red-200">{hint}</p>}
      <pre className="mt-2 overflow-x-auto rounded bg-white/60 p-2 font-mono text-xs text-neutral-700 dark:bg-black/30 dark:text-neutral-300">{sql}</pre>
    </section>
  )
}
