import { Eye, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ColumnInfo, TableInfo } from '../../db/engine'
import { typeLabel } from '../../lib/type-labels'
import { useDescriptionStore } from '../../store/description-store'

interface Props {
  tables: TableInfo[]
  onCreateTable(): void
  onSelectTable(table: TableInfo): void
  onInsertRow(table: TableInfo): void
  onAlterTable(table: TableInfo): void
  onDropTable(table: TableInfo): void
}

export function SchemaBrowser({ tables, onCreateTable, onSelectTable, onInsertRow, onAlterTable, onDropTable }: Props) {
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
                    <IconButton title="구조 변경 (ALTER TABLE)" onClick={() => onAlterTable(t)}>
                      <Settings2 size={13} />
                    </IconButton>
                    <IconButton title="테이블 삭제 (DROP)" onClick={() => onDropTable(t)} danger>
                      <Trash2 size={13} />
                    </IconButton>
                  </span>
                </summary>
                <ul className="ml-4 border-l border-neutral-200 pl-2 dark:border-neutral-700">
                  {t.columns.map((c) => (
                    <ColumnRow key={c.name} table={t} column={c} />
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

function ColumnRow({ table, column: c }: { table: TableInfo; column: ColumnInfo }) {
  const desc = useDescriptionStore((s) => s.descriptions[`${table.name}.${c.name}`] ?? '')
  const setDesc = useDescriptionStore((s) => s.set)
  const [editing, setEditing] = useState<string | null>(null)
  const isFk = table.foreignKeys.some((fk) => fk.column === c.name)
  const fk = table.foreignKeys.find((fk) => fk.column === c.name)

  const save = () => {
    if (editing !== null) setDesc(table.name, c.name, editing)
    setEditing(null)
  }

  return (
    <li className="group/col py-0.5 text-xs">
      <div className="flex items-center justify-between gap-2 font-mono">
        <span className="min-w-0 truncate" title={fk ? `${fk.refTable}.${fk.refColumn || 'PK'} 참조` : undefined}>
          {c.primaryKey && <span className="mr-1 text-amber-600">PK</span>}
          {isFk && !c.primaryKey && <span className="mr-1 text-blue-600">FK</span>}
          {c.name}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span className="text-neutral-400" title={`${typeLabel(c.type)}${c.notNull ? ' · 필수(NOT NULL)' : ''}`}>
            {c.type}
            {c.notNull && ' !'}
          </span>
          <button
            title="이 컬럼이 무엇인지 한글로 메모"
            onClick={() => setEditing(desc)}
            className="rounded p-0.5 text-neutral-300 opacity-0 group-hover/col:opacity-100 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <Pencil size={11} />
          </button>
        </span>
      </div>
      {editing !== null ? (
        <input
          autoFocus
          value={editing}
          onChange={(e) => setEditing(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(null)
          }}
          placeholder="예: 고객 이름"
          className="mt-0.5 w-full rounded border border-blue-400 bg-white px-1 py-0.5 text-[11px] focus:outline-none dark:bg-neutral-800"
        />
      ) : (
        desc && <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400" title={desc}>{desc}</p>
      )}
    </li>
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
