import type { AsyncDbEngine, QueryResult, SqlValue, TableInfo } from '../db/engine'
import { PRESETS } from '../db/presets'
import { tablesMentioned } from '../lib/editor-schema'
import { identifier } from '../lib/sql-builder'
import type { Problem } from './types'

/** 미리보기로 보여 줄 행 수 */
export const PREVIEW_ROWS = 5
export const EXPECTED_ROWS = 8

export interface TablePreview {
  table: TableInfo
  rows: SqlValue[][]
  total: number
}

/** 샘플 데이터의 컬럼 한글 설명. 문제풀이 DB 는 샘플 3종을 모두 싣고 있다 */
export const SAMPLE_DESCRIPTIONS: Record<string, string> = Object.assign({}, ...PRESETS.map((p) => p.descriptions))

/** 문제가 쓰는 테이블. 정답 쿼리와 확인 쿼리에 이름이 등장하는 것만 고른다 */
export function relatedTables(problem: Problem, tables: TableInfo[]): TableInfo[] {
  return tablesMentioned(`${problem.answerSql} ${problem.checkSql ?? ''}`, tables)
}

export async function loadTablePreviews(engine: AsyncDbEngine, tables: TableInfo[]): Promise<TablePreview[]> {
  const previews: TablePreview[] = []
  for (const table of tables) {
    const name = identifier(table.name)
    const { outcome } = await engine.exec(`SELECT * FROM ${name} LIMIT ${PREVIEW_ROWS}; SELECT count(*) FROM ${name};`)
    const [rows, count] = outcome.results
    previews.push({ table, rows: rows?.rows ?? [], total: Number(count?.rows[0]?.[0] ?? 0) })
  }
  return previews
}

/** 여러 문장을 실행했다면 마지막 조회 결과가 채점·미리보기 대상이다 */
export function lastQueryResult(results: QueryResult[]): QueryResult | null {
  return [...results].reverse().find((r) => r.columns.length > 0) ?? results[results.length - 1] ?? null
}

/** 기대 결과 패널 제목 옆에 붙는 요약. 예: "4행 2열 · 순서도 같아야 함" */
export function expectedMeta(problem: Problem, expected: QueryResult | null): string {
  if (!expected) return ''
  return `${expected.rows.length.toLocaleString()}행 ${expected.columns.length}열${problem.orderMatters ? ' · 순서도 같아야 함' : ''}`
}
