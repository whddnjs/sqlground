import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Eye, KeyRound, Link2, Pencil, Plus, Settings2, Table2, Trash2, Waypoints } from 'lucide-react'
import { useState } from 'react'
import type { ColumnInfo, TableInfo } from '../../db/engine'
import { typeLabel } from '../../lib/type-labels'
import { useDescriptionStore } from '../../store/description-store'
import { useSchemaUiStore } from '../../store/schema-ui-store'

interface Props {
  tables: TableInfo[]
  onCreateTable(): void
  onSelectTable(table: TableInfo): void
  onInsertRow(table: TableInfo): void
  onAlterTable(table: TableInfo): void
  onDropTable(table: TableInfo): void
  onShowErd(): void
}

export function SchemaBrowser({ tables, onCreateTable, onSelectTable, onInsertRow, onAlterTable, onDropTable, onShowErd }: Props) {
  const { collapsed, toggle, setAll } = useSchemaUiStore()
  const allCollapsed = tables.length > 0 && tables.every((t) => collapsed.includes(t.name))

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-line pr-1.5 pl-3">
        <span className="section-label">테이블</span>
        {tables.length > 0 && <span className="badge ml-1">{tables.length}</span>}
        <span className="ml-auto" />
        {tables.length > 0 && (
          <button onClick={() => setAll(tables.map((t) => t.name), !allCollapsed)} title={allCollapsed ? '모두 펼치기' : '모두 접기'} className="btn-icon">
            {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
          </button>
        )}
        <button onClick={onCreateTable} className="btn btn-sm btn-ghost text-accent-fg hover:bg-accent-soft hover:text-accent-fg">
          <Plus size={13} /> 만들기
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <Table2 size={28} strokeWidth={1.4} className="text-fg-subtle" />
          <p className="text-[13px] leading-relaxed text-fg-muted">
            테이블이 없습니다.
            <br />
            위의 만들기 버튼이나 CREATE TABLE 로 만들어 보세요.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {tables.map((t) => {
            const open = !collapsed.includes(t.name)
            return (
              <li key={t.name} className="mb-0.5">
                {/* 접기 버튼과 액션 버튼을 형제로 둔다. 버튼 안에 버튼을 넣으면 키보드·스크린리더에서 문제가 된다 */}
                <div className="group flex items-center rounded-md hover:bg-hover">
                  <button onClick={() => toggle(t.name)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1 pl-1 text-left">
                    <ChevronRight size={13} className={['shrink-0 text-fg-subtle transition-transform', open ? 'rotate-90' : ''].join(' ')} />
                    <Table2 size={13} className="shrink-0 text-accent-fg" />
                    <span className="truncate text-[13px] font-medium">{t.name}</span>
                    {!open && <span className="ml-0.5 shrink-0 text-[10px] text-fg-subtle">{t.columns.length}열</span>}
                  </button>
                  <span className="flex shrink-0 items-center pr-0.5 opacity-40 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <RowAction title="조회 (SELECT)" onClick={() => onSelectTable(t)}>
                      <Eye size={13} />
                    </RowAction>
                    <RowAction title="행 추가 (INSERT)" onClick={() => onInsertRow(t)}>
                      <Plus size={13} />
                    </RowAction>
                    <RowAction title="구조 변경 (ALTER TABLE)" onClick={() => onAlterTable(t)}>
                      <Settings2 size={13} />
                    </RowAction>
                    <RowAction title="테이블 삭제 (DROP)" onClick={() => onDropTable(t)} danger>
                      <Trash2 size={13} />
                    </RowAction>
                  </span>
                </div>
                {open && (
                  <ul className="mt-0.5 mb-1.5 ml-[13px] border-l border-line pl-1.5">
                    {t.columns.map((c) => (
                      <ColumnRow key={c.name} table={t} column={c} />
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="shrink-0 border-t border-line p-2">
        <button onClick={onShowErd} disabled={tables.length === 0} className="btn btn-outline w-full">
          <Waypoints size={14} /> 관계도 보기
        </button>
      </div>
    </div>
  )
}

function ColumnRow({ table, column: c }: { table: TableInfo; column: ColumnInfo }) {
  const desc = useDescriptionStore((s) => s.descriptions[`${table.name}.${c.name}`] ?? '')
  const setDesc = useDescriptionStore((s) => s.set)
  const [editing, setEditing] = useState<string | null>(null)
  const fk = table.foreignKeys.find((f) => f.column === c.name)

  const save = () => {
    if (editing !== null) setDesc(table.name, c.name, editing)
    setEditing(null)
  }

  return (
    <li className="group/col rounded px-1.5 py-[3px] hover:bg-hover">
      <div className="flex items-center gap-1.5">
        <span className="flex w-3 shrink-0 justify-center" title={c.primaryKey ? '기본키 (PRIMARY KEY)' : fk ? `외래키 → ${fk.refTable}.${fk.refColumn || 'PK'}` : undefined}>
          {c.primaryKey ? <KeyRound size={11} className="text-amber-500" /> : fk ? <Link2 size={11} className="text-accent-fg" /> : null}
        </span>
        <span className="shrink-0 font-mono text-[12px]">{c.name}</span>
        {editing === null && (
          <span className="min-w-0 flex-1 truncate text-[11px] text-fg-subtle" title={desc || undefined}>
            {desc}
          </span>
        )}
        {editing !== null && <span className="flex-1" />}
        <button
          title="이 컬럼이 무엇인지 한글로 메모"
          aria-label={`${c.name} 설명 편집`}
          onClick={() => setEditing(desc)}
          className="shrink-0 rounded p-0.5 text-fg-subtle opacity-0 group-hover/col:opacity-100 hover:text-fg focus-visible:opacity-100"
        >
          <Pencil size={11} />
        </button>
        <span className="badge shrink-0" title={`${typeLabel(c.type)}${c.notNull ? ' · 필수(NOT NULL)' : ' · NULL 허용'}`}>
          {c.type || 'ANY'}
          {!c.notNull && !c.primaryKey && <span className="ml-0.5 text-fg-subtle">?</span>}
        </span>
      </div>
      {editing !== null && (
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
          className="input mt-1 h-6 px-1.5 text-[11px]"
        />
      )}
    </li>
  )
}

function RowAction({ title, onClick, danger, children }: { title: string; onClick(): void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={['rounded p-1 text-fg-muted', danger ? 'hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400' : 'hover:bg-hover-strong hover:text-fg'].join(' ')}
    >
      {children}
    </button>
  )
}
