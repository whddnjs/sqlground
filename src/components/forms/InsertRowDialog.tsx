import { useMemo, useState } from 'react'
import type { TableInfo } from '../../db/engine'
import { buildInsert, type InsertValue } from '../../lib/sql-builder'
import { useDescriptionStore } from '../../store/description-store'
import { DialogActions, Modal, SqlPreview, inputClass } from '../ui/Modal'

interface Props {
  table: TableInfo
  onClose(): void
  onInsert(sql: string): void
  onRun(sql: string): void
}

interface Field {
  value: string
  isNull: boolean
}

export function InsertRowDialog({ table, onClose, onInsert, onRun }: Props) {
  const describe = useDescriptionStore((s) => s.get)
  const [fields, setFields] = useState<Record<string, Field>>(() =>
    Object.fromEntries(table.columns.map((c) => [c.name, { value: '', isNull: false }])),
  )

  const values = useMemo<InsertValue[]>(() => {
    const out: InsertValue[] = []
    for (const c of table.columns) {
      const f = fields[c.name]
      if (f.isNull) {
        out.push({ column: c.name, type: c.type, value: null })
        continue
      }
      // 비워 두면 자동 증가 PK 나 기본값이 있는 컬럼은 생략해 DB 가 채우게 한다
      const autoPk = c.primaryKey && c.type.toUpperCase() === 'INTEGER'
      if (f.value === '' && (autoPk || c.defaultValue !== null || !c.notNull)) continue
      out.push({ column: c.name, type: c.type, value: f.value })
    }
    return out
  }, [fields, table])

  const sql = useMemo(() => buildInsert(table.name, values), [table.name, values])
  const setField = (name: string, patch: Partial<Field>) => setFields((f) => ({ ...f, [name]: { ...f[name], ...patch } }))

  return (
    <Modal
      title={`${table.name} 에 행 추가`}
      onClose={onClose}
      footer={<DialogActions sql={sql} disabled={values.length === 0} onInsert={onInsert} onRun={onRun} />}
    >
      <div className="flex flex-col gap-3">
        {table.columns.map((c, i) => {
          const f = fields[c.name]
          const autoPk = c.primaryKey && c.type.toUpperCase() === 'INTEGER'
          const placeholder = autoPk ? '비우면 자동 증가' : c.defaultValue !== null ? `비우면 기본값 ${c.defaultValue}` : c.notNull ? '필수' : '비우면 NULL'
          return (
            <label key={c.name} className="block text-sm">
              <span className="mb-1 flex items-baseline gap-2 text-xs">
                <span className="font-medium">{c.name}</span>
                <span className="text-fg-subtle">{c.type}</span>
                {c.primaryKey && <span className="text-amber-600">PK</span>}
                {c.notNull && !c.primaryKey && <span className="text-fg-subtle">NOT NULL</span>}
                {describe(table.name, c.name) && <span className="text-fg-muted">· {describe(table.name, c.name)}</span>}
              </span>
              <span className="flex items-center gap-2">
                <input
                  autoFocus={i === 0}
                  value={f.value}
                  disabled={f.isNull}
                  onChange={(e) => setField(c.name, { value: e.target.value })}
                  placeholder={placeholder}
                  className={inputClass}
                />
                {!c.notNull && !c.primaryKey && (
                  <label className="flex shrink-0 items-center gap-1 text-xs text-fg-muted">
                    <input type="checkbox" checked={f.isNull} onChange={(e) => setField(c.name, { isNull: e.target.checked })} />
                    NULL
                  </label>
                )}
              </span>
            </label>
          )
        })}
      </div>
      <SqlPreview sql={sql} />
    </Modal>
  )
}
