import { useState } from 'react'
import type { QueryResult, SqlValue } from '../../db/engine'

const PAGE_SIZE = 50
const MAX_ROWS = 1000

export function ResultGrid({ result }: { result: QueryResult }) {
  const [page, setPage] = useState(0)
  const rows = result.rows.slice(0, MAX_ROWS)
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-2">
      {result.rows.length > MAX_ROWS && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          결과가 많아 {MAX_ROWS.toLocaleString()}행까지만 표시합니다. (전체 {result.rows.length.toLocaleString()}행)
        </p>
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
            </tr>
          </thead>
          <tbody>
            {visible.map((row, ri) => (
              <tr key={ri} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="px-2 py-1 text-right text-xs text-neutral-400">
                  {current * PAGE_SIZE + ri + 1}
                </td>
                {row.map((v, ci) => (
                  <td key={ci} className="px-3 py-1 whitespace-nowrap">
                    <Cell value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <button
            className="rounded border px-2 py-0.5 disabled:opacity-40"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            이전
          </button>
          <span>
            {current + 1} / {pageCount}
          </span>
          <button
            className="rounded border px-2 py-0.5 disabled:opacity-40"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
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
