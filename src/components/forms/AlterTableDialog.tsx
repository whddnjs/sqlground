import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { TableInfo } from '../../db/engine'
import {
  SQLITE_TYPES,
  buildAddColumn,
  buildDropColumn,
  buildRenameColumn,
  buildRenameTable,
  emptyColumn,
  type ColumnDef,
} from '../../lib/sql-builder'
import { Modal, SqlPreview, inputClass } from '../ui/Modal'

interface Props {
  table: TableInfo
  tables: TableInfo[]
  onClose(): void
  onInsert(sql: string): void
  /** 실행 후 다이얼로그는 열린 채로 최신 구조를 다시 보여 준다 */
  onRun(sql: string): void
}

/**
 * ALTER TABLE 은 문장 하나가 조작 하나라서, 섹션마다 "적용" 을 눌러 바로 실행한다.
 * SQLite 는 컬럼 타입 변경이나 제약 변경을 지원하지 않으므로 이름 변경, 컬럼 추가/삭제만 제공한다.
 */
export function AlterTableDialog({ table, tables, onClose, onInsert, onRun }: Props) {
  const [newName, setNewName] = useState(table.name)
  const [newColumn, setNewColumn] = useState<ColumnDef>(emptyColumn)
  const [renames, setRenames] = useState<Record<string, string>>({})

  const renameTableSql = buildRenameTable(table.name, newName.trim() || table.name)
  const addColumnSql = buildAddColumn(table.name, { ...newColumn, name: newColumn.name.trim() || '컬럼명' })
  const canAdd = newColumn.name.trim() !== '' && !(newColumn.notNull && newColumn.defaultValue.trim() === '')

  return (
    <Modal title={`${table.name} 구조 변경`} onClose={onClose} wide>
      <p className="mb-4 text-xs text-neutral-500">
        각 항목은 적용을 누르는 즉시 ALTER TABLE 로 실행됩니다. 잘못 바꿨다면 헤더의 되돌리기로 복구할 수 있습니다.
        SQLite 는 컬럼 타입이나 제약 변경을 지원하지 않아 그 경우엔 테이블을 새로 만들어야 합니다.
      </p>

      <Section title="테이블 이름 변경">
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} />
          <ApplyButtons sql={renameTableSql} disabled={newName.trim() === '' || newName.trim() === table.name} onInsert={onInsert} onRun={onRun} />
        </div>
        <SqlPreview sql={renameTableSql} />
      </Section>

      <Section title="컬럼 추가">
        <div className="grid grid-cols-[1fr_auto_auto_auto_1fr_auto] items-center gap-2 text-sm">
          <input value={newColumn.name} onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })} placeholder="컬럼 이름" className={inputClass} />
          <select value={newColumn.type} onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value as ColumnDef['type'] })} className={inputClass}>
            {SQLITE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
            <input type="checkbox" checked={newColumn.notNull} onChange={(e) => setNewColumn({ ...newColumn, notNull: e.target.checked })} /> 필수
          </label>
          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
            <input type="checkbox" checked={newColumn.unique} onChange={(e) => setNewColumn({ ...newColumn, unique: e.target.checked })} /> 유일
          </label>
          <input
            value={newColumn.defaultValue}
            onChange={(e) => setNewColumn({ ...newColumn, defaultValue: e.target.value })}
            placeholder={newColumn.notNull ? '기본값 (필수 컬럼 추가 시 꼭 필요)' : '기본값'}
            className={inputClass}
          />
          <select
            value={newColumn.references ? `${newColumn.references.table}\t${newColumn.references.column}` : ''}
            onChange={(e) => {
              if (e.target.value === '') return setNewColumn({ ...newColumn, references: null })
              const [t, c] = e.target.value.split('\t')
              setNewColumn({ ...newColumn, references: { table: t, column: c } })
            }}
            className={inputClass}
            title="참조 (FK)"
          >
            <option value="">FK 없음</option>
            {tables.map((t) => (
              <optgroup key={t.name} label={t.name}>
                {t.columns.map((c) => (
                  <option key={c.name} value={`${t.name}\t${c.name}`}>
                    {t.name}.{c.name}
                    {c.primaryKey ? ' (PK)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {newColumn.notNull && newColumn.defaultValue.trim() === '' && (
          <p className="mt-1 text-xs text-amber-600">이미 행이 있는 테이블에 필수(NOT NULL) 컬럼을 추가하려면 기본값이 필요합니다.</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <ApplyButtons sql={addColumnSql} disabled={!canAdd} onInsert={onInsert} onRun={(sql) => { onRun(sql); setNewColumn(emptyColumn()) }} icon={<Plus size={14} />} />
        </div>
        <SqlPreview sql={addColumnSql} />
      </Section>

      <Section title="기존 컬럼">
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {table.columns.map((c) => {
            const renamed = renames[c.name] ?? c.name
            const changed = renamed.trim() !== '' && renamed.trim() !== c.name
            return (
              <li key={c.name} className="flex items-center gap-2 py-1.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-xs text-neutral-500">
                  {c.primaryKey && <span className="mr-1 text-amber-600">PK</span>}
                  {c.type}
                </span>
                <input value={renamed} onChange={(e) => setRenames({ ...renames, [c.name]: e.target.value })} className={inputClass} />
                <button
                  disabled={!changed}
                  onClick={() => {
                    onRun(buildRenameColumn(table.name, c.name, renamed.trim()))
                    setRenames((r) => {
                      const next = { ...r }
                      delete next[c.name]
                      return next
                    })
                  }}
                  title={buildRenameColumn(table.name, c.name, renamed.trim() || c.name)}
                  className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-600 dark:hover:bg-neutral-800"
                >
                  이름 변경
                </button>
                <button
                  disabled={c.primaryKey || table.columns.length === 1}
                  onClick={() => {
                    const sql = buildDropColumn(table.name, c.name)
                    if (window.confirm(`'${c.name}' 컬럼과 그 데이터를 삭제할까요?\n\n${sql}`)) onRun(sql)
                  }}
                  title={c.primaryKey ? 'PK 컬럼은 삭제할 수 없습니다' : buildDropColumn(table.name, c.name)}
                  className="shrink-0 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950"
                  aria-label="컬럼 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      </Section>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-medium text-neutral-500">{title}</h3>
      {children}
    </section>
  )
}

function ApplyButtons({ sql, disabled, onInsert, onRun, icon }: { sql: string; disabled: boolean; onInsert(sql: string): void; onRun(sql: string): void; icon?: React.ReactNode }) {
  return (
    <>
      <button
        disabled={disabled}
        onClick={() => onInsert(sql)}
        className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-600 dark:hover:bg-neutral-800"
      >
        에디터에 넣기
      </button>
      <button
        disabled={disabled}
        onClick={() => onRun(sql)}
        className="flex shrink-0 items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-40"
      >
        {icon}적용
      </button>
    </>
  )
}
