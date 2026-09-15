import type { QueryResult, SqlValue } from '../db/engine'

function cell(v: SqlValue): string {
  if (v === null) return ''
  if (v instanceof Uint8Array) return `<BLOB ${v.length} bytes>`
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** 결과를 CSV 문자열로. 엑셀 호환을 위해 BOM 은 다운로드 쪽에서 붙인다 */
export function toCsv(result: QueryResult): string {
  const lines = [result.columns.map((c) => cell(c)).join(',')]
  for (const row of result.rows) lines.push(row.map(cell).join(','))
  return lines.join('\r\n')
}

export function downloadCsv(result: QueryResult, filename: string): void {
  const blob = new Blob(['﻿' + toCsv(result)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
