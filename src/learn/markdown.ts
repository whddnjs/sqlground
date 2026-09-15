/** 마크다운에서 ```sql 블록의 SQL 만 순서대로 뽑는다. 콘텐츠 검증 테스트와 연습장 보내기에 쓴다 */
export function extractSqlBlocks(markdown: string): string[] {
  const blocks: string[] = []
  const re = /```sql\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) blocks.push(m[1].trim())
  return blocks
}
