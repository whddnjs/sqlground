import { Eye, Plus, Trash2 } from 'lucide-react'
import type { TableInfo } from '../../db/engine'

interface Props {
  tables: TableInfo[]
  onCreateTable(): void
  onSelectTable(table: TableInfo): void
  onInsertRow(table: TableInfo): void
  onDropTable(table: TableInfo): void
}

export function SchemaBrowser({ tables, onCreateTable, onSelectTable, onInsertRow, onDropTable }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-neutral-500">테이블</span>
        <button
          onClick={onCreateTable}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          <Plus size={12} /> 만들기
        </button>
      </div>

      {tables.length === 0 ? (
        <p className="px-3 text-sm text-neutral-500">
          테이블이 없습니다. 위의 만들기 버튼이나 CREATE TABLE 로 만들어 보세요.
        </p>
      ) : (
        <ul className="px-2 text-sm">
          {tables.map((t) => (
            <li key={t.name}>
              <details open className="group">
                <summary className="flex cursor-pointer items-center rounded px-1 py-0.5 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <span className="flex items-center gap-0.5 opacity-50 group-hover:opacity-100">
                    <IconButton title="조회 (SELECT)" onClick={() => onSelectTable(t)}>
                      <Eye size={13} />
                    </IconButton>
                    <IconButton title="행 추가 (INSERT)" onClick={() => onInsertRow(t)}>
                      <Plus size={13} />
                    </IconButton>
                    <IconButton title="테이블 삭제 (DROP)" onClick={() => onDropTable(t)} danger>
                      <Trash2 size={13} />
                    </IconButton>
                  </span>
                </summary>
                <ul className="ml-4 border-l border-neutral-200 pl-2 dark:border-neutral-700">
                  {t.columns.map((c) => (
                    <li key={c.name} className="flex justify-between gap-2 py-0.5 font-mono text-xs">
                      <span>
                        {c.primaryKey && <span className="mr-1 text-amber-600">PK</span>}
                        {c.name}
                      </span>
                      <span className="text-neutral-400">
                        {c.type}
                        {c.notNull && ' !'}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function IconButton({ title, onClick, danger, children }: { title: string; onClick(): void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={[
        'rounded p-0.5 text-neutral-400',
        danger ? 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950' : 'hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
