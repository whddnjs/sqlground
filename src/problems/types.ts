/** 같은 결과를 내는 다른 풀이. 답이 여러 개 나올 만한 문제에만 적는다 */
export interface Alternative {
  sql: string
  /** 언제 이 풀이가 나은지, 모범 답안과 무엇이 다른지 */
  note: string
}

export interface Problem {
  id: string
  /** 연결된 학습 단원 id. 목록을 단원 순서로 묶고 "관련 단원 보기" 에 쓴다 */
  lessonId: string
  title: string
  /** 1 쉬움, 2 보통, 3 어려움 */
  difficulty: 1 | 2 | 3
  /** 마크다운. 요구하는 열과 순서를 분명히 적는다 */
  description: string
  /** 정답 쿼리. 사용자 결과와 값만 비교하므로 열 이름은 자유 */
  answerSql: string
  /** 모범 답안을 왜 이렇게 썼는지 한두 문장 (선택) */
  answerNote?: string
  /** 다른 풀이. 채점 기준으로 모범 답안과 같은 결과여야 하며 테스트가 검증한다 */
  alternatives?: Alternative[]
  hint: string
  /** true 면 행 순서까지 같아야 정답 */
  orderMatters?: boolean
  /**
   * 데이터 변경 문제(INSERT/UPDATE/DELETE/DDL)일 때만 지정.
   * 내 SQL 과 정답 SQL 을 같은 시작 상태에서 각각 실행한 뒤 이 조회 결과를 비교한다.
   * 실행과 채점이 끝나면 DB 는 시작 상태로 되돌아간다.
   */
  checkSql?: string
}
