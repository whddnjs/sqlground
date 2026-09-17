import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { AsyncDbEngine, ExecOptions, ExecOutcome, RunOutcome, TableInfo } from '../engine'
import type { ExecValue, Request, Response, RunValue } from './protocol'

type Pending = { resolve(value: unknown): void; reject(error: Error): void }

/** 실행 중인 쿼리. 중단 시 이 요청만 "중단됨" 결과로 끝내고 나머지는 실패 처리한다 */
interface Active {
  id: number
  sql: string
  kind: 'exec' | 'run'
  pre: Uint8Array | null
  timer: ReturnType<typeof setTimeout> | undefined
}

// Omit 은 유니온에 분배되지 않아 op 별 필드가 사라진다. 분배되는 버전을 쓴다
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

/**
 * Web Worker 안의 SqliteEngine 과 메시지로 통신한다.
 *
 * 중단(cancel, 시간 초과)은 워커를 종료하고 새로 띄운 뒤 복구 지점으로 되돌리는 방식이다.
 * sql.js 는 실행 중인 쿼리를 밖에서 멈출 방법이 없기 때문이다.
 * 복구 지점은 run() 이 실행 직전에 보내는 스냅샷, 또는 checkpoint() 로 기억한 상태다.
 */
export class WorkerEngine implements AsyncDbEngine {
  private worker: Worker | null = null
  private ready: Promise<void> = Promise.resolve()
  private pending = new Map<number, Pending>()
  private seq = 0
  private active: Active | null = null
  private lastGood: Uint8Array | null = null
  private foreignKeys = true

  init(): Promise<void> {
    if (!this.worker) this.ready = this.spawn()
    return this.ready
  }

  private spawn(): Promise<void> {
    const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<Response>) => this.onMessage(e.data)
    worker.onerror = (e) => this.failAll(new Error(e.message || 'DB 워커에서 오류가 났습니다'))
    this.worker = worker
    return this.send({ op: 'init', wasmUrl, foreignKeys: this.foreignKeys }).then(() => undefined)
  }

  private send(req: WithoutId<Request>): Promise<unknown> {
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker!.postMessage({ ...req, id } as Request)
    })
  }

  /** ready 를 기다린 뒤 보낸다. 복구 중에 들어온 요청은 복구가 끝난 뒤 처리된다 */
  private async call<T>(req: WithoutId<Request>): Promise<T> {
    await this.ready
    return (await this.send(req)) as T
  }

  private onMessage(res: Response) {
    if (res.kind === 'pre') {
      this.lastGood = res.snapshot
      if (this.active?.id === res.id) this.active.pre = res.snapshot
      return
    }
    const p = this.pending.get(res.id)
    if (!p) return
    this.pending.delete(res.id)
    if (res.kind === 'done') p.resolve(res.value)
    else p.reject(new Error(res.message))
  }

  private failAll(error: Error) {
    for (const p of this.pending.values()) p.reject(error)
    this.pending.clear()
  }

  private async execute<T extends ExecValue>(kind: 'exec' | 'run', sql: string, options: ExecOptions): Promise<{ value: T; pre: Uint8Array | null }> {
    await this.ready
    const id = this.seq + 1
    const active: Active = { id, sql, kind, pre: null, timer: undefined }
    this.active = active
    if (options.timeoutMs) {
      active.timer = setTimeout(() => {
        void this.interrupt(`실행 시간이 ${Math.round(options.timeoutMs! / 1000)}초를 넘어 중단했습니다. 끝나지 않는 재귀나 너무 큰 결과가 아닌지 확인하세요.`)
      }, options.timeoutMs)
    }
    try {
      const value = (await this.send({ op: kind, sql })) as T
      return { value, pre: active.pre }
    } finally {
      clearTimeout(active.timer)
      if (this.active === active) this.active = null
    }
  }

  async exec(sql: string, options: ExecOptions = {}) {
    const { value } = await this.execute<ExecValue>('exec', sql, options)
    return value
  }

  async run(sql: string, options: ExecOptions = {}): Promise<RunOutcome> {
    const { value, pre } = await this.execute<RunValue>('run', sql, options)
    return { ...value, snapshot: value.changed ? pre : null }
  }

  cancel(): void {
    if (this.active) void this.interrupt('실행을 중단했습니다.')
  }

  /** 워커를 종료하고 새로 띄워 복구 지점으로 되돌린 다음, 실행 중이던 요청을 "중단됨" 결과로 끝낸다 */
  private interrupt(message: string): Promise<void> {
    const active = this.active
    if (!active || !this.worker) return Promise.resolve()
    this.active = null
    clearTimeout(active.timer)

    const interrupted = this.pending.get(active.id)
    this.pending.delete(active.id)
    this.worker.terminate()
    this.worker = null
    this.failAll(new Error('DB 엔진을 다시 시작하는 중이라 요청이 취소됐습니다'))

    const restore = this.lastGood
    this.ready = this.spawn().then(async () => {
      if (restore) await this.send({ op: 'import', data: restore })
    })

    return this.ready.then(async () => {
      const tables = (await this.send({ op: 'getTables' })) as TableInfo[]
      const outcome: ExecOutcome = { results: [], error: { message, sql: active.sql }, interrupted: true }
      const value: RunValue = { outcome, tables, changed: false, inTransaction: false }
      interrupted?.resolve(value)
    })
  }

  getTables() {
    return this.call<TableInfo[]>({ op: 'getTables' })
  }

  export() {
    return this.call<Uint8Array>({ op: 'export' })
  }

  async import(data: Uint8Array) {
    await this.call({ op: 'import', data })
    this.lastGood = data
  }

  async reset() {
    await this.call({ op: 'reset' })
    this.lastGood = null
  }

  async setForeignKeys(enabled: boolean) {
    this.foreignKeys = enabled
    await this.call({ op: 'setForeignKeys', enabled })
  }

  inTransaction() {
    return this.call<boolean>({ op: 'inTransaction' })
  }

  async checkpoint() {
    this.lastGood = await this.export()
  }
}
