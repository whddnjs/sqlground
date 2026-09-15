import { describe, expect, it } from 'vitest'
import type { QueryResult } from '../db/engine'
import { grade } from './grade'

const r = (columns: string[], rows: QueryResult['rows']): QueryResult => ({ sql: '', columns, rows, rowsAffected: 0, durationMs: 0 })

describe('grade', () => {
  it('열 이름과 행 순서가 달라도 값이 같으면 정답', () => {
    expect(grade(r(['a', 'b'], [[1, 'x'], [2, 'y']]), r(['id', 'name'], [[2, 'y'], [1, 'x']])).ok).toBe(true)
  })
  it('orderMatters 면 행 순서도 봐야 한다', () => {
    expect(grade(r(['a'], [[1], [2]]), r(['a'], [[2], [1]]), true).ok).toBe(false)
    expect(grade(r(['a'], [[2], [1]]), r(['a'], [[2], [1]]), true).ok).toBe(true)
  })
  it('열 개수, 행 수, 값 차이를 구분해서 알려 준다', () => {
    expect(grade(r(['a'], [[1]]), r(['a', 'b'], [[1, 2]])).message).toContain('열 개수')
    expect(grade(r(['a'], [[1]]), r(['a'], [[1], [2]])).message).toContain('행 수')
    expect(grade(r(['a'], [[1]]), r(['a'], [[3]])).message).toContain('값이 다른')
  })
  it('실수 오차와 숫자 모양 문자열은 같게 본다', () => {
    expect(grade(r(['a'], [[0.1 + 0.2]]), r(['a'], [[0.3]])).ok).toBe(true)
    expect(grade(r(['a'], [['10']]), r(['a'], [[10]])).ok).toBe(true)
    expect(grade(r(['a'], [[null]]), r(['a'], [[null]])).ok).toBe(true)
    expect(grade(r(['a'], [[null]]), r(['a'], [['']])).ok).toBe(false)
  })
})
