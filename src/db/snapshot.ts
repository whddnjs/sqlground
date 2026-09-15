/** 실행 전 DB 바이너리를 쌓아 두는 되돌리기 스택. 최근 N개만 유지 */
export class SnapshotStack {
  private items: Uint8Array[] = []
  private readonly limit: number

  constructor(limit = 10) {
    this.limit = limit
  }

  push(data: Uint8Array): void {
    this.items.push(data)
    if (this.items.length > this.limit) this.items.shift()
  }

  pop(): Uint8Array | undefined {
    return this.items.pop()
  }

  get size(): number {
    return this.items.length
  }

  clear(): void {
    this.items = []
  }
}
