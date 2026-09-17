import { describe, expect, it } from 'vitest'
import { isRecord, stringArray, stringRecord } from './storage'

describe('storage 검증 헬퍼', () => {
  it('배열이 아니거나 문자열이 아닌 원소는 걸러 낸다', () => {
    expect(stringArray(5)).toEqual([])
    expect(stringArray(['a', 1, null, 'b'])).toEqual(['a', 'b'])
  })
  it('객체가 아니면 빈 객체, 문자열 값만 남긴다', () => {
    expect(stringRecord('x')).toEqual({})
    expect(stringRecord(['a'])).toEqual({})
    expect(stringRecord({ a: 'x', b: 1 })).toEqual({ a: 'x' })
  })
  it('isRecord', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord([])).toBe(false)
  })
})
