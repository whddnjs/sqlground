import type { DbEngine, ExecOutcome } from './engine'
import type { SnapshotStack } from './snapshot'

export interface RunResult {
  outcome: ExecOutcome
  /** 이 실행이 DB 를 바꿨는지. 바뀐 경우에만 스냅샷이 쌓이고 저장이 필요하다 */
  changed: boolean
}

/**
 * SQL 을 실행하되, DB 가 실제로 바뀐 경우에만 실행 전 상태를 되돌리기 스택에 쌓는다.
 * 조회만 한 실행이 되돌리기 단계를 소모하지 않게 하기 위함이다.
 *
 * 트랜잭션이 열려 있는 동안에는 스냅샷을 찍지 않는다. sql.js 의 export 가 연결을 다시 열어
 * 진행 중인 트랜잭션을 없애 버리기 때문이다. 그 구간의 변경은 ROLLBACK 으로 되돌릴 수 있다.
 */
export function runWithSnapshot(
  engine: DbEngine,
  snapshots: Pick<SnapshotStack, 'push'>,
  sql: string,
  /** 실행 직전에 찍은 스냅샷을 먼저 넘겨받는다. 실행이 끝나지 않을 때(중단)의 복구 지점으로 쓴다 */
  onBeforeExec?: (snapshot: Uint8Array) => void,
): RunResult {
  if (engine.inTransaction()) {
    const before = engine.changeToken()
    const outcome = engine.exec(sql)
    return { outcome, changed: engine.changeToken() !== before }
  }

  const snapshot = engine.export()
  onBeforeExec?.(snapshot)
  const before = engine.changeToken()
  const outcome = engine.exec(sql)
  const changed = engine.changeToken() !== before
  if (changed) snapshots.push(snapshot)
  return { outcome, changed }
}
