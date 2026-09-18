import { CornerDownLeft, Download, TerminalSquare } from 'lucide-react'
import { useState } from 'react'
import type { ExecOutcome, SqlValue, TableInfo } from '../../db/engine'
import { downloadCsv } from '../../lib/csv'
import { detectEditableTarget } from '../../lib/editable-select'
import { explainSqlError } from '../../lib/error-messages'
import { buildDelete, buildDeleteMany, buildUpdate } from '../../lib/sql-builder'
import { confirm } from '../../store/confirm-store'
import type { HistoryEntry, UiNotice } from '../../store/db-store'
import { ResultGrid } from './ResultGrid'
import { WelcomeCard } from './WelcomeCard'

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
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-line px-2">
        <TabButton active={tab === 'result'} onClick={() => setTab('result')}>결과</TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          히스토리{history.length > 0 && <span className="ml-1.5 font-mono text-[10px] opacity-70">{history.length}</span>}
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
        'flex h-7 items-center rounded-md px-2.5 text-xs font-medium transition-colors',
        active ? 'bg-accent-soft text-accent-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Results({ outcome, notice, tables, onRunFromUi }: Pick<Props, 'outcome' | 'notice' | 'tables' | 'onRunFromUi'>) {
  if (!outcome && !notice && tables.length === 0) return <WelcomeCard />
  if (!outcome && !notice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <TerminalSquare size={28} strokeWidth={1.4} className="text-fg-subtle" />
        <p className="text-[13px] text-fg-muted">쿼리를 실행하면 결과가 여기에 표시됩니다</p>
        <p className="flex items-center gap-1 text-xs text-fg-subtle">
          <span className="kbd">⌘</span>
          <span className="kbd">
            <CornerDownLeft size={10} />
          </span>
          <span className="ml-1">또는 Ctrl + Enter</span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {notice && (
        <section className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5 text-sm">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
            UI 조작으로 실행한 SQL{notice.rowsAffected > 0 && ` · ${notice.rowsAffected}행 영향`}
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-fg">{notice.sql}</pre>
        </section>
      )}
      {outcome?.results.map((r, i) => {
        const editable = r.columns.length > 0 ? detectEditableTarget(r, tables) : null
        return (
          <section key={i} className="flex flex-col gap-1">
            <header className="flex items-center gap-2 text-xs text-fg-muted">
              <code className="min-w-0 max-w-[60%] truncate rounded bg-subtle px-1.5 py-0.5 font-mono text-[11.5px] text-fg" title={r.sql}>{r.sql}</code>
              <span>{r.columns.length > 0 ? `${r.rows.length.toLocaleString()}행` : `${r.rowsAffected}행 영향`}</span>
              <span>{r.durationMs.toFixed(1)} ms</span>
              {r.columns.length > 0 && (
                <button
                  onClick={() => downloadCsv(r, `${editable?.table.name ?? 'result'}-${i + 1}.csv`)}
                  title="결과를 CSV 파일로 저장"
                  className="btn btn-sm btn-ghost ml-auto"
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
                  void confirm({ title: '이 행을 삭제할까요?', sql, confirmLabel: '삭제', danger: true, undoable: true }).then((ok) => {
                    if (ok) onRunFromUi(sql, r.sql)
                  })
                }}
                onDeleteRows={(pkValues: SqlValue[]) => {
                  if (!editable) return
                  const sql = buildDeleteMany(editable.table.name, editable.pk.name, pkValues as Array<string | number>)
                  void confirm({ title: `선택한 ${pkValues.length}행을 삭제할까요?`, sql, confirmLabel: '삭제', danger: true, undoable: true }).then((ok) => {
                    if (ok) onRunFromUi(sql, r.sql)
                  })
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
  if (entries.length === 0) return <p className="p-4 text-sm text-fg-muted">아직 실행한 쿼리가 없습니다.</p>
  const label: Record<HistoryEntry['source'], string> = { editor: '에디터', ui: 'UI', preset: '샘플' }
  return (
    <ul className="divide-y divide-line">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-2 px-3 py-2 text-xs">
          <span className="mt-0.5 w-10 shrink-0 text-fg-subtle">
            {new Date(e.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={['mt-0.5 shrink-0 rounded px-1 text-[10px]', e.ok ? 'bg-subtle text-fg-muted' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'].join(' ')}>
            {label[e.source]}
          </span>
          <code className="min-w-0 flex-1 truncate font-mono whitespace-pre text-fg" title={e.sql}>
            {e.sql}
          </code>
          <button onClick={() => onInsertToEditor(e.sql)} className="shrink-0 text-accent-fg hover:underline">
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
    <section className="rounded-lg border border-red-500/30 bg-red-500/8 p-3 text-sm">
      <p className="font-mono text-xs text-red-600 dark:text-red-400">{message}</p>
      {hint && <p className="mt-1.5 leading-relaxed text-fg">{hint}</p>}
      <pre className="mt-2 overflow-x-auto rounded-md bg-surface/70 p-2 font-mono text-xs text-fg-muted">{sql}</pre>
    </section>
  )
}
