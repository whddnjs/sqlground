import type { QueryResult, SqlValue } from '../db/engine'

export interface GradeResult {
  ok: boolean
  message: string
}

// 셀 값을 문자열로 정규화할 때 쓰는 표식. 일반 데이터에 나오기 어려운 기호를 쓴다
const NULL_MARK = '␀NULL'
const BLOB_MARK = '␀BLOB'
const CELL_SEP = '␟'

function cell(v: SqlValue): string {
  if (v === null) return NULL_MARK
  if (v instanceof Uint8Array) return BLOB_MARK
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, '')
  // 숫자 모양 문자열은 숫자와 같게 본다 ('10' 과 10)
  if (/^-?\d+(\.\d+)?$/.test(v)) return cell(Number(v))
  return v
}

function rowsOf(r: QueryResult, sort: boolean): string[] {
  const rows = r.rows.map((row) => row.map(cell).join(CELL_SEP))
  return sort ? rows.sort() : rows
}

/** 값만 비교한다. 열 이름은 무시하고, orderMatters 가 아니면 행 순서도 무시한다 */
export function grade(mine: QueryResult, expected: QueryResult, orderMatters = false): GradeResult {
  if (mine.columns.length !== expected.columns.length) {
    return {
      ok: false,
      message: `열 개수가 다릅니다. 내 결과 ${mine.columns.length}열, 기대 ${expected.columns.length}열 (${expected.columns.join(', ')})`,
    }
  }
  if (mine.rows.length !== expected.rows.length) {
    return { ok: false, message: `행 수가 다릅니다. 내 결과 ${mine.rows.length}행, 기대 ${expected.rows.length}행` }
  }
  const a = rowsOf(mine, !orderMatters)
  const b = rowsOf(expected, !orderMatters)
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return {
        ok: false,
        message: orderMatters
          ? `${i + 1}번째 행이 다릅니다. 행 순서(ORDER BY)까지 확인하세요`
          : '값이 다른 행이 있습니다. 조건이나 계산식을 다시 확인하세요',
      }
    }
  }
  return { ok: true, message: '정답입니다!' }
}
