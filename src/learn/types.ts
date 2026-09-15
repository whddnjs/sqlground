export interface Lesson {
  id: string
  title: string
  /** 문법 사전 검색용 키워드 (예: SELECT, WHERE) */
  keywords: string[]
  /** 마크다운. ```sql 블록은 학습용 DB 에서 바로 실행할 수 있는 예제가 된다 */
  body: string
}

export interface Chapter {
  id: string
  title: string
  lessons: Lesson[]
}
