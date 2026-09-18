/// <reference lib="webworker" />
import { runWithSnapshot } from '../run-with-snapshot'
import { SqliteEngine } from '../sqlite/sqlite-engine'
import type { ExecValue, Request, Response, RunValue } from './protocol'

let engine: SqliteEngine | null = null

const post = (message: Response, transfer: Transferable[] = []) => (self as DedicatedWorkerGlobalScope).postMessage(message, transfer)

function requireEngine(): SqliteEngine {
  if (!engine) throw new Error('엔진이 초기화되지 않았습니다')
  return engine
}

async function handle(req: Request): Promise<{ value: unknown; transfer?: Transferable[] }> {
  switch (req.op) {
    case 'init': {
      engine = new SqliteEngine({ wasmUrl: req.wasmUrl, foreignKeys: req.foreignKeys })
      await engine.init()
      return { value: null }
    }
    case 'exec': {
      const e = requireEngine()
      const before = e.changeToken()
      const outcome = e.exec(req.sql)
      const value: ExecValue = { outcome, tables: e.getTables(), changed: e.changeToken() !== before }
      return { value }
    }
    case 'run': {
      const e = requireEngine()
      // 되돌리기 스택은 화면 쪽에 있다. 여기서는 실행 직전 스냅샷을 먼저 보내고 변경 여부만 알려 준다
      const { outcome, changed } = runWithSnapshot(e, { push() {} }, req.sql, (snapshot) => {
        post({ id: req.id, kind: 'pre', snapshot }, [snapshot.buffer])
      })
      const value: RunValue = { outcome, changed, tables: e.getTables(), inTransaction: e.inTransaction() }
      return { value }
    }
    case 'getTables':
      return { value: requireEngine().getTables() }
    case 'export': {
      const data = requireEngine().export()
      return { value: data, transfer: [data.buffer] }
    }
    case 'import':
      await requireEngine().import(req.data)
      return { value: null }
    case 'reset':
      await requireEngine().reset()
      return { value: null }
    case 'setForeignKeys':
      requireEngine().setForeignKeys(req.enabled)
      return { value: null }
    case 'inTransaction':
      return { value: requireEngine().inTransaction() }
  }
}

self.onmessage = (event: MessageEvent<Request>) => {
  const req = event.data
  handle(req).then(
    ({ value, transfer }) => post({ id: req.id, kind: 'done', value }, transfer),
    (e: unknown) => post({ id: req.id, kind: 'error', message: e instanceof Error ? e.message : String(e) }),
  )
}
