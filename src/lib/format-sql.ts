import { format } from 'sql-formatter'

/**
 * 한 줄로 적어 둔 답안 SQL 을 읽기 좋게 줄 바꿈·들여쓰기한다.
 * 콘텐츠는 채점·테스트가 쓰기 쉽게 한 줄로 두고, 보여 줄 때만 정리한다.
 * 포맷터가 이해 못 하는 문장이면 원문을 그대로 돌려준다.
 */
export function formatSql(sql: string): string {
  try {
    return format(sql, { language: 'sqlite', keywordCase: 'preserve', tabWidth: 2 })
  } catch {
    return sql
  }
}
