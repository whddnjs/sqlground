import { createEngine } from '../db/create-engine'
import type { DbEngine } from '../db/engine'
import { PRESETS } from '../db/presets'

/**
 * 학습 예제 전용 DB. 연습장 DB 와 분리돼 있어 예제를 마음껏 실행해도 내 작업이 안 바뀐다.
 * 쇼핑몰과 학교 샘플을 모두 실어 두고, 초기화하면 원래대로 돌아간다.
 */
let engine: DbEngine | null = null

export async function getLessonEngine(): Promise<DbEngine> {
  if (engine) return engine
  const e = createEngine()
  await e.init()
  loadSamples(e)
  engine = e
  return e
}

export async function resetLessonEngine(): Promise<DbEngine> {
  const e = await getLessonEngine()
  await e.reset()
  loadSamples(e)
  return e
}

export function loadSamples(e: DbEngine): void {
  for (const p of PRESETS) e.exec(p.sql)
}
