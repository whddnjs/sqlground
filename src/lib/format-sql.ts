import { format } from 'sql-formatter'

/**
 * 한 줄로 적어 둔 답안 SQL 을 읽기 좋게 줄 바꿈·들여쓰기한다.
 * 콘텐츠는 채점·테스트가 쓰기 쉽게 한 줄로 두고, 보여 줄 때만 정리한다.
 * 키워드를 오른쪽 끝에 맞추는 정렬(tabularRight)이라 키워드 열과 내용 열이 갈라져 절 구조가 한눈에 보인다.
 * 포맷터가 이해 못 하는 문장이면 원문을 그대로 돌려준다.
 */
export function formatSql(sql: string): string {
  try {
    return dedent(format(sql, { language: 'sqlite', keywordCase: 'preserve', tabWidth: 2, indentStyle: 'tabularRight' }))
  } catch {
    return sql
  }
}

/**
 * tabularRight 는 가장 긴 키워드(LEFT JOIN, 9자)에 맞춰 오른쪽 정렬하므로
 * 짧은 쿼리는 모든 줄 앞에 빈칸이 남는다. 문장(빈 줄로 나뉜 덩어리)마다 공통인 앞 빈칸만 걷어낸다.
 */
function dedent(text: string): string {
  return text
    .split('\n\n')
    .map((block) => {
      const lines = block.split('\n')
      const min = Math.min(...lines.filter((l) => l.trim() !== '').map((l) => l.length - l.trimStart().length))
      return min > 0 ? lines.map((l) => l.slice(min)).join('\n') : block
    })
    .join('\n\n')
}
