import type { DbEngine } from '../db/engine'
import { PRESETS } from '../db/presets'

/** 학습·문제풀이용 DB 에 싣는 샘플 전체. 워커 밖(테스트)에서 동기 엔진에 직접 넣을 때 쓴다 */
export function loadSamples(e: DbEngine): void {
  for (const p of PRESETS) e.exec(p.sql)
}
