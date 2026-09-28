import { describe, expect, it } from 'vitest'
import { PROBLEMS } from '../problems/content'
import { formatSql } from './format-sql'

describe('답안 SQL 정리', () => {
  it('절마다 줄을 나누고 키워드를 오른쪽 끝에 맞춘다', () => {
    expect(formatSql("SELECT name, city FROM customers WHERE city IN ('서울', '부산')")).toBe(
      "SELECT name,\n       city\n  FROM customers\n WHERE city IN ('서울', '부산')",
    )
  })

  it('모든 문제의 모범 답안·다른 풀이·확인 쿼리를 정리할 수 있다 (FROM 이 있는 조회는 여러 줄이 된다)', () => {
    for (const p of PROBLEMS) {
      const all = [p.answerSql, ...(p.alternatives ?? []).map((a) => a.sql), ...(p.checkSql ? [p.checkSql] : [])]
      for (const sql of all) {
        const out = formatSql(sql)
        // 띄어쓰기만 달라지고 내용은 그대로여야 한다
        expect(out.replace(/\s+/g, ''), `${p.title}: ${sql}`).toBe(sql.replace(/\s+/g, '').replace(/;$/, ''))
        if (/ FROM /.test(sql)) expect(out, `${p.title}: ${sql}`).toContain('\n')
      }
    }
  })

  it('이해 못 하는 문장은 원문을 돌려준다', () => {
    const weird = 'SELECT ((( FROM'
    expect(formatSql(weird)).toBe(weird)
  })
})
