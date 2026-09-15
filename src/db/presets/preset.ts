export interface Preset {
  id: string
  name: string
  description: string
  /** 이 프리셋이 만드는 테이블. 기존 테이블 덮어쓰기 안내용 */
  tables: string[]
  /** DROP TABLE IF EXISTS 로 시작하는 자기완결 SQL */
  sql: string
}
