import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('쉼표, 따옴표, 줄바꿈이 있는 값은 감싸고 NULL 은 빈 칸', () => {
    const csv = toCsv({
      sql: '',
      columns: ['id', 'name', 'memo'],
      rows: [
        [1, '김, 민수', null],
        [2, 'say "hi"', 'a\nb'],
      ],
      rowsAffected: 0,
      durationMs: 0,
    })
    expect(csv).toBe('id,name,memo\r\n1,"김, 민수",\r\n2,"say ""hi""","a\nb"')
  })
})
