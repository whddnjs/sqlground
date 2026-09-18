import { KeyRound, Link2 } from 'lucide-react'
import type { SqlValue } from '../../db/engine'

export interface PreviewColumn {
  name: string
  type?: string
  description?: string
  key?: 'pk' | 'fk'
}

interface Props {
  columns: PreviewColumn[]
  rows: SqlValue[][]
  /** 전체 행 수. rows 보다 많으면 "외 N행" 을 붙인다 */
  total: number
}

/** 테이블 미리보기와 기대 결과에 쓰는 작은 표. 페이지 없이 앞의 몇 행만 보여 준다 */
export function DataPreview({ columns, rows, total }: Props) {
  const numeric = columns.map((_, ci) => rows.some((r) => typeof r[ci] === 'number') && rows.every((r) => r[ci] === null || typeof r[ci] === 'number'))

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-separate border-spacing-0 text-[12.5px]">
        <thead>
          <tr className="bg-subtle text-left align-top">
            {columns.map((c, i) => (
              <th key={i} className={['border-b border-line px-2.5 py-1.5 font-normal whitespace-nowrap', numeric[i] ? 'text-right' : ''].join(' ')}>
                <span className={['flex items-center gap-1 font-mono text-xs font-medium text-fg', numeric[i] ? 'justify-end' : ''].join(' ')}>
                  {c.key === 'pk' && <KeyRound size={10} className="text-amber-500" />}
                  {c.key === 'fk' && <Link2 size={10} className="text-accent-fg" />}
                  {c.name}
                  {c.type && <span className="badge ml-0.5 h-4 px-1 text-[9px]">{c.type}</span>}
                </span>
                {c.description && <span className="mt-0.5 block max-w-44 truncate text-[10.5px] text-fg-subtle" title={c.description}>{c.description}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((v, ci) => (
                <td key={ci} className={['border-b border-line px-2.5 py-1 whitespace-nowrap', numeric[ci] ? 'text-right font-mono text-xs tabular-nums' : ''].join(' ')}>
                  {v === null ? <span className="rounded bg-subtle px-1 font-mono text-[10px] text-fg-subtle">NULL</span> : v instanceof Uint8Array ? 'BLOB' : String(v)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, columns.length)} className="px-2.5 py-3 text-center text-xs text-fg-subtle">
                행이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {total > rows.length && <p className="bg-subtle/50 px-2.5 py-1 text-[11px] text-fg-subtle">… 외 {(total - rows.length).toLocaleString()}행 (전체 {total.toLocaleString()}행)</p>}
    </div>
  )
}
