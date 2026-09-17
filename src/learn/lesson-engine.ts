import { createEngine } from '../db/create-engine'
import type { AsyncDbEngine } from '../db/engine'
import { PRESETS } from '../db/presets'

/** 학습 예제와 문제풀이에서 끝나지 않는 쿼리를 끊는 한도 */
export const LESSON_TIMEOUT_MS = 10_000

/**
 * 학습 예제 전용 DB. 연습장 DB 와 분리돼 있어 예제를 마음껏 실행해도 내 작업이 안 바뀐다.
 * 샘플 3종을 모두 실어 두고, 초기화하면 원래대로 돌아간다.
 * 쿼리가 중단되면 엔진이 마지막 복구 지점(샘플만 실린 상태)으로 돌아간다.
 */
let loading: Promise<AsyncDbEngine> | null = null

async function seed(e: AsyncDbEngine): Promise<void> {
  for (const p of PRESETS) await e.exec(p.sql)
  await e.checkpoint()
}

export function getLessonEngine(): Promise<AsyncDbEngine> {
  loading ??= (async () => {
    const e = createEngine()
    await e.init()
    await seed(e)
    return e
  })()
  return loading
}

export async function resetLessonEngine(): Promise<AsyncDbEngine> {
  const e = await getLessonEngine()
  await e.reset()
  await seed(e)
  return e
}
