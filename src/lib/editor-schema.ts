import type { Completion, CompletionSource } from '@codemirror/autocomplete'
import { SQLite, sql } from '@codemirror/lang-sql'
import type { Extension } from '@codemirror/state'
import { editorTheme } from '../components/editor/editor-theme'
import type { TableInfo } from '../db/engine'

/** CodeMirror SQL 자동완성용 스키마. 테이블 이름 → 컬럼 이름 목록 */
export function editorSchema(tables: TableInfo[]): Record<string, string[]> {
  return Object.fromEntries(tables.map((t) => [t.name, t.columns.map((c) => c.name)]))
}

/** 에디터 본문에 이름이 등장한 테이블만 고른다 (대소문자 무시, 단어 단위) */
export function tablesMentioned(text: string, tables: TableInfo[]): TableInfo[] {
  const lower = text.toLowerCase()
  return tables.filter((t) => {
    const name = t.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^\\w])${name}([^\\w]|$)`).test(lower)
  })
}

/** 컬럼 제안 목록. 같은 이름이 여러 테이블에 있으면 하나로 합치고 출처를 detail 에 적는다 */
export function columnOptions(tables: TableInfo[]): Completion[] {
  const byName = new Map<string, { type: string; from: string[] }>()
  for (const t of tables) {
    for (const c of t.columns) {
      const entry = byName.get(c.name) ?? { type: c.type, from: [] }
      entry.from.push(t.name)
      byName.set(c.name, entry)
    }
  }
  return [...byName.entries()].map(([label, v]) => ({
    label,
    type: 'property',
    detail: `${v.from.join(', ')} · ${v.type}`,
    boost: 10,
  }))
}

/**
 * lang-sql 은 `테이블.` 뒤에서만 컬럼을 제안한다. 초보자는 점 없이 쓰므로,
 * 쿼리에 등장한 테이블의 컬럼을 점 없이도 제안하는 보조 소스를 더한다.
 */
function columnCompletionSource(tables: TableInfo[]): CompletionSource {
  return (ctx) => {
    const word = ctx.matchBefore(/[\w가-힣]+/)
    if (!word || (word.from === word.to && !ctx.explicit)) return null
    // 점 뒤는 lang-sql 이 해당 테이블 컬럼으로 정확히 제안한다
    if (word.from > 0 && ctx.state.sliceDoc(word.from - 1, word.from) === '.') return null
    const mentioned = tablesMentioned(ctx.state.doc.toString(), tables)
    if (mentioned.length === 0) return null
    return { from: word.from, options: columnOptions(mentioned), validFor: /^[\w가-힣]*$/ }
  }
}

/** 모든 SQL 에디터(연습장, 학습 예제, 문제풀이)가 공통으로 쓰는 언어 확장 */
export function sqlExtensions(tables: TableInfo[]): Extension[] {
  return [
    editorTheme,
    sql({ dialect: SQLite, schema: editorSchema(tables), upperCaseKeywords: true }),
    SQLite.language.data.of({ autocomplete: columnCompletionSource(tables) }),
  ]
}
