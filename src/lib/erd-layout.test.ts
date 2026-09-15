import { describe, expect, it } from 'vitest'
import type { TableInfo } from '../db/engine'
import { columnY, edgeEndpoints, edgesOf, gridLayout } from './erd-layout'

const col = (name: string, primaryKey = false) => ({ name, type: 'INTEGER', notNull: false, primaryKey, defaultValue: null })
const a: TableInfo = { name: 'a', columns: [col('id', true), col('x')], foreignKeys: [] }
const b: TableInfo = { name: 'b', columns: [col('id', true), col('a_id')], foreignKeys: [{ column: 'a_id', refTable: 'a', refColumn: '' }] }
const c: TableInfo = { name: 'c', columns: [col('id', true)], foreignKeys: [{ column: 'id', refTable: 'nope', refColumn: 'id' }] }

describe('erd-layout', () => {
  it('격자로 배치하고 겹치지 않는다', () => {
    const boxes = gridLayout([a, b, c])
    expect(boxes.map((x) => x.table)).toEqual(['a', 'b', 'c'])
    expect(boxes[0].y).toBe(boxes[1].y)
    expect(boxes[2].y).toBeGreaterThan(boxes[0].y + boxes[0].height)
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x + boxes[0].width)
  })

  it('참조 컬럼이 비어 있으면 PK 로, 없는 테이블 참조는 제외', () => {
    expect(edgesOf([a, b, c])).toEqual([{ fromTable: 'b', fromColumn: 'a_id', toTable: 'a', toColumn: 'id' }])
  })

  it('컬럼 위치와 간선 끝점은 가까운 옆면에서 나간다', () => {
    expect(columnY(b, 'a_id')).toBeGreaterThan(columnY(b, 'id'))
    const [ba, bb] = gridLayout([a, b])
    const { start, end } = edgeEndpoints(bb, columnY(b, 'a_id'), ba, columnY(a, 'id'))
    expect(start.x).toBe(bb.x)
    expect(end.x).toBe(ba.x + ba.width)
  })
})
