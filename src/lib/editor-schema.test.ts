import { describe, expect, it } from 'vitest'
import type { TableInfo } from '../db/engine'
import { columnOptions, editorSchema, tablesMentioned } from './editor-schema'

const col = (name: string, type = 'TEXT') => ({ name, type, notNull: false, primaryKey: false, defaultValue: null })
const customers: TableInfo = { name: 'customers', columns: [col('id', 'INTEGER'), col('name'), col('city')], foreignKeys: [] }
const orders: TableInfo = { name: 'orders', columns: [col('id', 'INTEGER'), col('customer_id', 'INTEGER')], foreignKeys: [] }
const order_items: TableInfo = { name: 'order_items', columns: [col('quantity', 'INTEGER')], foreignKeys: [] }
const tables = [customers, orders, order_items]

describe('editor-schema', () => {
  it('스키마는 테이블 → 컬럼 이름 목록', () => {
    expect(editorSchema([orders])).toEqual({ orders: ['id', 'customer_id'] })
  })

  it('본문에 등장한 테이블만 고르고, 다른 이름의 일부로 들어간 경우는 제외한다', () => {
    expect(tablesMentioned('select * from Customers where ', tables).map((t) => t.name)).toEqual(['customers'])
    expect(tablesMentioned('SELECT * FROM order_items', tables).map((t) => t.name)).toEqual(['order_items'])
    expect(tablesMentioned('SELECT 1', tables)).toEqual([])
  })

  it('같은 이름의 컬럼은 하나로 합치고 출처 테이블을 모두 적는다', () => {
    const options = columnOptions([customers, orders])
    expect(options.map((o) => o.label)).toEqual(['id', 'name', 'city', 'customer_id'])
    expect(options[0].detail).toBe('customers, orders · INTEGER')
  })
})
