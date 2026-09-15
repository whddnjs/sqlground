import { describe, expect, it } from 'vitest'
import type { TableInfo } from '../db/engine'
import { columnY, edgeEndpoints, edgesOf, layeredLayout } from './erd-layout'

const col = (name: string, primaryKey = false) => ({ name, type: 'INTEGER', notNull: false, primaryKey, defaultValue: null })
const a: TableInfo = { name: 'a', columns: [col('id', true), col('x')], foreignKeys: [] }
const b: TableInfo = { name: 'b', columns: [col('id', true), col('a_id')], foreignKeys: [{ column: 'a_id', refTable: 'a', refColumn: '' }] }
const c: TableInfo = { name: 'c', columns: [col('id', true)], foreignKeys: [{ column: 'id', refTable: 'nope', refColumn: 'id' }] }

describe('erd-layout', () => {
  it('부모 테이블은 왼쪽 열, 참조하는 테이블은 오른쪽 열에 놓인다', () => {
    const d: TableInfo = { name: 'd', columns: [col('id', true), col('b_id')], foreignKeys: [{ column: 'b_id', refTable: 'b', refColumn: 'id' }] }
    const boxes = layeredLayout([d, b, a, c])
    const x = (n: string) => boxes.find((x) => x.table === n)!.x
    expect(x('a')).toBe(x('c')) // 둘 다 부모 (c 는 없는 테이블만 참조)
    expect(x('b')).toBeGreaterThan(x('a'))
    expect(x('d')).toBeGreaterThan(x('b'))
    const [ba, bc] = boxes.filter((x) => x.table === 'a' || x.table === 'c')
    expect(bc.y).toBeGreaterThan(ba.y + ba.height) // 같은 열은 아래로 쌓임
  })

  it('참조 순환이 있어도 끝난다', () => {
    const p: TableInfo = { name: 'p', columns: [col('id', true)], foreignKeys: [{ column: 'id', refTable: 'q', refColumn: 'id' }] }
    const q: TableInfo = { name: 'q', columns: [col('id', true)], foreignKeys: [{ column: 'id', refTable: 'p', refColumn: 'id' }] }
    expect(layeredLayout([p, q])).toHaveLength(2)
  })

  it('참조 컬럼이 비어 있으면 PK 로, 없는 테이블 참조는 제외', () => {
    expect(edgesOf([a, b, c])).toEqual([{ fromTable: 'b', fromColumn: 'a_id', toTable: 'a', toColumn: 'id' }])
  })

  it('컬럼 위치와 간선 끝점은 가까운 옆면에서 나간다', () => {
    expect(columnY(b, 'a_id')).toBeGreaterThan(columnY(b, 'id'))
    const [ba, bb] = layeredLayout([a, b])
    const { start, end } = edgeEndpoints(bb, columnY(b, 'a_id'), ba, columnY(a, 'id'))
    expect(start.x).toBe(bb.x)
    expect(end.x).toBe(ba.x + ba.width)
  })
})
