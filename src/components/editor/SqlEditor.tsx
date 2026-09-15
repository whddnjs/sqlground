import { SQLite, sql } from '@codemirror/lang-sql'
import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import type { TableInfo } from '../../db/engine'
import { sqlToRun } from './sql-to-run'

interface Props {
  value: string
  onChange(value: string): void
  /** 선택 영역이 있으면 선택 부분, 없으면 전체를 넘긴다 */
  onRun(sql: string): void
  tables: TableInfo[]
}

export function SqlEditor({ value, onChange, onRun, tables }: Props) {
  const extensions = useMemo(() => {
    const schema = Object.fromEntries(tables.map((t) => [t.name, t.columns.map((c) => c.name)]))
    return [
      sql({ dialect: SQLite, schema, upperCaseKeywords: true }),
      Prec.highest(
        keymap.of([
          // Mac 에서는 Cmd+Enter 와 Ctrl+Enter 둘 다 실행되게 한다
          { key: 'Mod-Enter', run: (view) => (onRun(sqlToRun(view)), true) },
          { key: 'Ctrl-Enter', run: (view) => (onRun(sqlToRun(view)), true) },
        ]),
      ),
    ]
  }, [tables, onRun])

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      className="h-full text-sm [&_.cm-editor]:h-full"
    />
  )
}
