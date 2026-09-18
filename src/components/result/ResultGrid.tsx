import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { QueryResult, SqlValue } from '../../db/engine'
import type { EditableTarget } from '../../lib/editable-select'

const PAGE_SIZE = 50
const MAX_ROWS = 1000

interface Props {
  result: QueryResult
  /** 있으면 셀 더블클릭 편집과 행 삭제가 켜진다 */
  editable?: EditableTarget | null
  onUpdateCell?(pkValue: SqlValue, column: string, type: string, value: string | null): void
  onDeleteRow?(pkValue: SqlValue): void
  /** 체크박스로 고른 여러 행 삭제 */
  onDeleteRows?(pkValues: SqlValue[]): void
}

interface Editing {
  row: number
  col: number
  value: string
}

export function ResultGrid({ result, editable, onUpdateCell, onDeleteRow, onDeleteRows }: Props) {
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Editing | null>(null)
  // 선택한 행의 PK 값. 결과가 갱신돼도 PK 기준이라 유지된다
  const [selected, setSelected] = useState<SqlValue[]>([])
  const selectable = !!editable && !!onDeleteRows

  const rows = result.rows.slice(0, MAX_ROWS)
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const offset = current * PAGE_SIZE
  const visible = rows.slice(offset, offset + PAGE_SIZE)

  // 값이 전부 숫자(또는 NULL)인 열은 오른쪽 정렬해 자릿수를 맞춘다
  const numeric = useMemo(
    () => result.columns.map((_, ci) => rows.some((r) => typeof r[ci] === 'number') && rows.every((r) => r[ci] === null || typeof r[ci] === 'number')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result],
  )

  const commit = (value: string | null) => {
    if (!editing || !editable || !onUpdateCell) return
    const row = rows[editing.row]
    const col = editable.columnMap.get(editing.col)
    if (col) onUpdateCell(row[editable.pkIndex], col.name, col.type, value)
    setEditing(null)
  }

  const pkOf = (row: SqlValue[]) => (editable ? row[editable.pkIndex] : null)
  const visiblePks = visible.map(pkOf)
  const allVisibleSelected = visiblePks.length > 0 && visiblePks.every((pk) => selected.includes(pk))
  const toggleRow = (pk: SqlValue) => setSelected((cur) => (cur.includes(pk) ? cur.filter((x) => x !== pk) : [...cur, pk]))
  const toggleAllVisible = () =>
    setSelected((cur) => (allVisibleSelected ? cur.filter((x) => !visiblePks.includes(x)) : [...new Set([...cur, ...visiblePks])]))
  // 이미 지워진 행은 선택에서 뺀다
  const liveSelected = selected.filter((pk) => rows.some((r) => pkOf(r) === pk))

  return (
    <div className="flex flex-col gap-2">
      {result.rows.length > MAX_ROWS && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          결과가 많아 {MAX_ROWS.toLocaleString()}행까지만 표시합니다. (전체 {result.rows.length.toLocaleString()}행)
        </p>
      )}
      {editable && (
        <div className="flex min-h-6 items-center gap-2 text-[11px] text-fg-subtle">
          <span>셀을 더블클릭하면 값을 고칠 수 있습니다. Enter 로 저장, Esc 로 취소, NULL 버튼으로 비우기.</span>
          {selectable && liveSelected.length > 0 && (
            <button
              onClick={() => {
                onDeleteRows?.(liveSelected)
                setSelected([])
              }}
              className="btn btn-sm ml-auto border border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
            >
              <Trash2 size={12} /> 선택한 {liveSelected.length}행 삭제
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr className="bg-subtle text-left text-xs text-fg-muted">
              {selectable && (
                <th className="w-px border-b border-line py-1.5 pr-1 pl-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="이 페이지 모두 선택" className="accent-(--color-accent)" />
                </th>
              )}
              <th className="w-px border-b border-line px-3 py-1.5 text-right font-normal text-fg-subtle">#</th>
              {result.columns.map((c, i) => (
                <th key={i} className={['border-b border-line px-3 py-1.5 font-mono font-medium whitespace-nowrap', numeric[i] ? 'text-right' : ''].join(' ')}>
                  {c}
                </th>
              ))}
              {editable && <th className="w-px border-b border-line" />}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, vi) => {
              const ri = offset + vi
              const isSelected = selectable && selected.includes(pkOf(row))
              return (
                <tr key={ri} className={['group/row', isSelected ? 'bg-accent-soft' : 'hover:bg-hover/60'].join(' ')}>
                  {selectable && (
                    <td className="border-b border-line py-1 pr-1 pl-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(pkOf(row))} aria-label={`${ri + 1}행 선택`} className="accent-(--color-accent)" />
                    </td>
                  )}
                  <td className="border-b border-line px-3 py-1 text-right font-mono text-[11px] text-fg-subtle tabular-nums">{ri + 1}</td>
                  {row.map((v, ci) => {
                    const isEditing = editing?.row === ri && editing.col === ci
                    const canEdit = !!editable && ci !== editable.pkIndex && editable.columnMap.has(ci)
                    return (
                      <td
                        key={ci}
                        onDoubleClick={() => canEdit && setEditing({ row: ri, col: ci, value: v === null ? '' : String(v) })}
                        className={[
                          'border-b border-line px-3 py-1 whitespace-nowrap',
                          numeric[ci] ? 'text-right font-mono text-[12.5px] tabular-nums' : '',
                          canEdit ? 'cursor-text' : '',
                        ].join(' ')}
                      >
                        {isEditing ? (
                          <span className="flex items-center gap-1">
                            <input
                              autoFocus
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              onBlur={() => setEditing(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commit(editing.value)
                                if (e.key === 'Escape') setEditing(null)
                              }}
                              className="input -my-0.5 h-6 min-w-24 px-1.5"
                            />
                            <button
                              title="이 셀을 NULL 로"
                              // blur 로 편집이 닫히기 전에 처리되도록 mousedown 에서 실행
                              onMouseDown={(e) => {
                                e.preventDefault()
                                commit(null)
                              }}
                              className="badge shrink-0 border border-line-strong bg-surface hover:bg-hover"
                            >
                              NULL
                            </button>
                          </span>
                        ) : (
                          <Cell value={v} />
                        )}
                      </td>
                    )
                  })}
                  {editable && (
                    <td className="border-b border-line pr-2">
                      <button
                        title="행 삭제 (DELETE)"
                        aria-label="행 삭제 (DELETE)"
                        onClick={() => onDeleteRow?.(row[editable.pkIndex])}
                        className="rounded p-1 text-fg-subtle opacity-0 group-hover/row:opacity-100 hover:bg-red-500/10 hover:text-red-600 focus-visible:opacity-100 dark:hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={result.columns.length + 3} className="px-3 py-6 text-center text-xs text-fg-subtle">
                  결과 행이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center gap-1 text-xs text-fg-muted">
          <button className="btn-icon" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="이전 페이지">
            <ChevronLeft size={15} />
          </button>
          <span className="tabular-nums">
            {current + 1} / {pageCount}
          </span>
          <button className="btn-icon" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} aria-label="다음 페이지">
            <ChevronRight size={15} />
          </button>
          <span className="ml-1 text-fg-subtle">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, rows.length)} / {rows.length.toLocaleString()}행
          </span>
        </div>
      )}
    </div>
  )
}

function Cell({ value }: { value: SqlValue }) {
  if (value === null) return <span className="rounded bg-subtle px-1 font-mono text-[10.5px] text-fg-subtle">NULL</span>
  if (value instanceof Uint8Array) return <span className="font-mono text-[11px] text-fg-subtle">BLOB · {value.length} bytes</span>
  return <>{String(value)}</>
}
