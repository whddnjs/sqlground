import { describe, expect, it } from 'vitest'
import { SnapshotStack } from './snapshot'

describe('SnapshotStack', () => {
  it('마지막에 넣은 것부터 꺼낸다', () => {
    const s = new SnapshotStack()
    s.push(new Uint8Array([1]))
    s.push(new Uint8Array([2]))
    expect(s.pop()).toEqual(new Uint8Array([2]))
    expect(s.size).toBe(1)
  })

  it('한도를 넘으면 가장 오래된 것을 버린다', () => {
    const s = new SnapshotStack(2)
    s.push(new Uint8Array([1]))
    s.push(new Uint8Array([2]))
    s.push(new Uint8Array([3]))
    expect(s.size).toBe(2)
    expect(s.pop()).toEqual(new Uint8Array([3]))
    expect(s.pop()).toEqual(new Uint8Array([2]))
    expect(s.pop()).toBeUndefined()
  })
})
