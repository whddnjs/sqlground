import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TableInfo } from '../../db/engine'
import { SQLITE_TYPES, buildCreateTable, emptyColumn, type ColumnDef, type SqliteType } from '../../lib/sql-builder'
import { DialogActions, Modal, SqlPreview, inputClass } from '../ui/Modal'

interface Props {
  /** 참조(FK) 대상으로 고를 수 있는 기존 테이블 */
  tables: TableInfo[]
  onClose(): void
  onInsert(sql: string): void
  onRun(sql: string): void
}

const REF_SEP = '\t'

export function CreateTableDialog({ tables, onClose, onInsert, onRun }: Props) {
  const [name, setName] = useState('')
  const [columns, setColumns] = useState<ColumnDef[]>([
    { ...emptyColumn(), name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
    emptyColumn(),
  ])

  const valid = name.trim() !== '' && columns.length > 0 && columns.every((c) => c.name.trim() !== '')
  const sql = useMemo(() => buildCreateTable(name.trim() || '테이블명', columns.filter((c) => c.name.trim() !== '')), [name, columns])

  const update = (i: number, patch: Partial<ColumnDef>) =>
    setColumns((cols) =>
      cols.map((c, j) => {
        if (j === i) return { ...c, ...patch }
        // PK 는 하나만
        return patch.primaryKey ? { ...c, primaryKey: false, autoIncrement: false } : c
      }),
    )

  return (
    <Modal
      title="테이블 만들기"
      onClose={onClose}
      wide
      footer={<DialogActions sql={sql} disabled={!valid} onInsert={onInsert} onRun={onRun} />}
    >
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-neutral-500">테이블 이름</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="예: products" className={inputClass} />
      </label>

      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-xs text-neutral-500">
          <tr>
            <th className="pb-1 font-medium">컬럼 이름</th>
            <th className="pb-1 font-medium">타입</th>
            <th className="px-1 pb-1 text-center font-medium whitespace-nowrap" title="PRIMARY KEY">PK</th>
            <th className="px-1 pb-1 text-center font-medium whitespace-nowrap" title="AUTOINCREMENT (INTEGER PK 만)">자동증가</th>
            <th className="px-1 pb-1 text-center font-medium whitespace-nowrap" title="NOT NULL">필수</th>
            <th className="px-1 pb-1 text-center font-medium whitespace-nowrap" title="UNIQUE">유일</th>
            <th className="pb-1 pl-2 font-medium whitespace-nowrap">기본값</th>
            <th className="pb-1 font-medium whitespace-nowrap" title="FOREIGN KEY. 다른 테이블의 컬럼을 참조">참조 (FK)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {columns.map((c, i) => (
            <tr key={i} className="align-middle">
              <td className="py-1 pr-2">
                <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="예: name" className={inputClass} />
              </td>
              <td className="py-1 pr-2">
                <select value={c.type} onChange={(e) => update(i, { type: e.target.value as ColumnDef['type'] })} className={inputClass}>
                  {SQLITE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </td>
              <td className="px-1 py-1 text-center">
                <input type="checkbox" checked={c.primaryKey} onChange={(e) => update(i, { primaryKey: e.target.checked, autoIncrement: e.target.checked && c.type === 'INTEGER' })} />
              </td>
              <td className="px-1 py-1 text-center">
                <input type="checkbox" checked={c.autoIncrement} disabled={!c.primaryKey || c.type !== 'INTEGER'} onChange={(e) => update(i, { autoIncrement: e.target.checked })} />
              </td>
              <td className="px-1 py-1 text-center">
                <input type="checkbox" checked={c.notNull} disabled={c.primaryKey} onChange={(e) => update(i, { notNull: e.target.checked })} />
              </td>
              <td className="px-1 py-1 text-center">
                <input type="checkbox" checked={c.unique} disabled={c.primaryKey} onChange={(e) => update(i, { unique: e.target.checked })} />
              </td>
              <td className="py-1 pr-2">
                <input value={c.defaultValue} onChange={(e) => update(i, { defaultValue: e.target.value })} placeholder="예: 0, 'N', CURRENT_TIMESTAMP" className={inputClass} />
              </td>
              <td className="py-1 pr-2">
                <select
                  value={c.references ? c.references.table + REF_SEP + c.references.column : ''}
                  disabled={tables.length === 0}
                  title={tables.length === 0 ? '참조할 테이블이 아직 없습니다' : undefined}
                  onChange={(e) => {
                    if (e.target.value === '') return update(i, { references: null })
                    const [table, column] = e.target.value.split(REF_SEP)
                    const refType = tables.find((t) => t.name === table)?.columns.find((col) => col.name === column)?.type.toUpperCase()
                    const type = SQLITE_TYPES.find((t) => t === refType) as SqliteType | undefined
                    update(i, { references: { table, column }, ...(type ? { type } : {}) })
                  }}
                  className={inputClass}
                >
                  <option value="">없음</option>
                  {tables.map((t) => (
                    <optgroup key={t.name} label={t.name}>
                      {[...t.columns].sort((a, b) => Number(b.primaryKey) - Number(a.primaryKey)).map((col) => (
                        <option key={col.name} value={t.name + REF_SEP + col.name}>
                          {t.name}.{col.name}
                          {col.primaryKey ? ' (PK)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </td>
              <td className="py-1">
                <button
                  onClick={() => setColumns((cols) => cols.filter((_, j) => j !== i))}
                  disabled={columns.length === 1}
                  className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 disabled:opacity-30 dark:hover:bg-neutral-800"
                  aria-label="컬럼 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => setColumns((cols) => [...cols, emptyColumn()])}
        className="mt-2 flex items-center gap-1 rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
      >
        <Plus size={14} /> 컬럼 추가
      </button>

      <SqlPreview sql={sql} />
    </Modal>
  )
}
