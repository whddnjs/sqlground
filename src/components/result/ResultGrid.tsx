import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { QueryResult, SqlValue } from '../../db/engine'
import type { EditableTarget } from '../../lib/editable-select'

const PAGE_SIZE = 50
const MAX_ROWS = 1000

interface Props {
  result: QueryResult
  /** 있으면 셀 더블클릭 편집과 행 삭제가 켜진다 */
  editable?: EditableTarget | null
  onUpdateCell?(pkValue: SqlValue, column: string, type: string, value: string): void
  onDeleteRow?(pkValue: SqlValue): void
}

interface Editing {
  row: number
  col: number
  value: string
}

export function ResultGrid({ result, editable, onUpdateCell, onDeleteRow }: Props) {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Editing | null>(null)
  const rows = result.rows.slice(0, MAX_ROWS)
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const offset = current * PAGE_SIZE
  const visible = rows.slice(offset, offset + PAGE_SIZE)

  const commit = () => {
    if (!editing || !editable || !onUpdateCell) return
    const row = rows[editing.row]
    const col = editable.columnMap.get(editing.col)
    if (col) onUpdateCell(row[editable.pkIndex], col.name, col.type, editing.value)
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {result.rows.length > MAX_ROWS && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          결과가 많아 {MAX_ROWS.toLocaleString()}행까지만 표시합니다. (전체 {result.rows.length.toLocaleString()}행)
        </p>
      )}
      {editable && (
        <p className="text-xs text-neutral-500">셀을 더블클릭하면 값을 고칠 수 있습니다. Enter 로 저장, Esc 로 취소.</p>
      )}
      <div className="overflow-x-auto rounded border border-neutral-200 dark:border-neutral-700">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="px-2 py-1 text-right text-xs text-neutral-400">#</th>
              {result.columns.map((c, i) => (
                <th key={i} className="px-3 py-1 text-left font-medium">
                  {c}
                </th>
              ))}
              {editable && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, vi) => {
              const ri = offset + vi
              return (
                <tr key={ri} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-2 py-1 text-right text-xs text-neutral-400">{ri + 1}</td>
                  {row.map((v, ci) => {
                    const isEditing = editing?.row === ri && editing.col === ci
                    const canEdit = !!editable && ci !== editable.pkIndex && editable.columnMap.has(ci)
                    return (
                      <td
                        key={ci}
                        onDoubleClick={() => canEdit && setEditing({ row: ri, col: ci, value: v === null ? '' : String(v) })}
                        className={['px-3 py-1 whitespace-nowrap', canEdit ? 'cursor-text hover:bg-blue-50 dark:hover:bg-blue-950/40' : ''].join(' ')}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onBlur={() => setEditing(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit()
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className="w-full min-w-24 rounded border border-blue-500 bg-white px-1 py-0 text-sm focus:outline-none dark:bg-neutral-800"
                          />
                        ) : (
                          <Cell value={v} />
                        )}
                      </td>
                    )
                  })}
                  {editable && (
                    <td className="px-1">
                      <button
                        title="행 삭제 (DELETE)"
                        onClick={() => onDeleteRow?.(row[editable.pkIndex])}
                        className="rounded p-0.5 text-neutral-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border px-2 py-0.5 disabled:opacity-40" disabled={current === 0} onClick={() => setPage(current - 1)}>
            이전
          </button>
          <span>
            {current + 1} / {pageCount}
          </span>
          <button className="rounded border px-2 py-0.5 disabled:opacity-40" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
            다음
          </button>
        </div>
      )}
    </div>
  )
}

function Cell({ value }: { value: SqlValue }) {
  if (value === null) return <span className="text-neutral-400 italic">NULL</span>
  if (value instanceof Uint8Array) return <span className="text-neutral-400">BLOB ({value.length} bytes)</span>
  return <>{String(value)}</>
}
