import { createContext, useContext } from 'react'
import type { ExecOutcome, TableInfo } from '../db/engine'

/**
 * 학습 예제 블록이 공유하는 값.
 * props 대신 컨텍스트로 내려서, 값이 바뀌어도 마크다운 렌더러(components)를 새로 만들 필요가 없게 한다.
 * 렌더러가 바뀌면 react-markdown 이 예제 블록을 다시 마운트해 실행 결과가 사라진다.
 */
export interface LessonDb {
  tables: TableInfo[]
  run(sql: string): Promise<{ outcome: ExecOutcome; changed: boolean }>
  /** 실행 중인 예제를 중단한다 */
  cancel(): void
  openInPlayground(sql: string): void
}

export const LessonDbContext = createContext<LessonDb | null>(null)

export function useLessonDb(): LessonDb {
  const value = useContext(LessonDbContext)
  if (!value) throw new Error('LessonDbContext 가 없습니다')
  return value
}
