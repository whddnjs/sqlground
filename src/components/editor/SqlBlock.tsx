import { SQLite, sql } from '@codemirror/lang-sql'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { formatSql } from '../../lib/format-sql'
import { editorTheme } from './editor-theme'

// 읽기 전용이라 자동완성·커서 없이 색만 입힌다
const EXTENSIONS = [editorTheme, sql({ dialect: SQLite }), EditorView.editable.of(false), EditorState.readOnly.of(true), EditorView.lineWrapping]

/** 답안·확인 쿼리처럼 보여 주기만 하는 SQL. 줄 바꿈·들여쓰기를 정리하고 에디터와 같은 색으로 강조한다 */
export function SqlBlock({ sql: source, label }: { sql: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-subtle text-xs" role="figure" aria-label={label}>
      <CodeMirror value={formatSql(source)} extensions={EXTENSIONS} theme="none" editable={false} basicSetup={false} style={{ fontSize: 12.5 }} />
    </div>
  )
}
