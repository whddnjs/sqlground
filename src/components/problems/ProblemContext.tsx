import { ChevronRight, Table2 } from 'lucide-react'
import { SAMPLE_DESCRIPTIONS, type TablePreview } from '../../problems/context'
import { DataPreview } from './DataPreview'

interface Props {
  tables: TablePreview[]
  loading: boolean
}

/** 문제를 이해하는 데 필요한 맥락. 관련 테이블의 컬럼·설명·앞 몇 행을 항상 보여 준다 */
export function ProblemContext({ tables, loading }: Props) {
  if (loading) return <p className="mb-4 text-xs text-fg-subtle">관련 테이블을 불러오는 중…</p>
  if (tables.length === 0) return null

  return (
    <div className="mb-5 flex flex-col gap-3">
      {tables.length > 0 && (
        <details open className="group rounded-lg border border-line">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-semibold text-fg-muted select-none">
            <ChevronRight size={13} className="transition-transform group-open:rotate-90" />
            <Table2 size={13} /> 이 문제에서 쓰는 테이블
            <span className="font-normal text-fg-subtle">· {tables.map((t) => t.table.name).join(', ')}</span>
          </summary>
          <div className="flex flex-col gap-3 border-t border-line p-3">
            {tables.map(({ table, rows, total }) => (
              <div key={table.name}>
                <p className="mb-1 font-mono text-xs font-medium">{table.name}</p>
                <DataPreview
                  columns={table.columns.map((c) => ({
                    name: c.name,
                    type: c.type,
                    description: SAMPLE_DESCRIPTIONS[`${table.name}.${c.name}`],
                    key: c.primaryKey ? 'pk' : table.foreignKeys.some((f) => f.column === c.name) ? 'fk' : undefined,
                  }))}
                  rows={rows}
                  total={total}
                />
              </div>
            ))}
          </div>
        </details>
      )}

    </div>
  )
}
