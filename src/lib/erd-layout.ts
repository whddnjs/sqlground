import type { TableInfo } from '../db/engine'

export const BOX_WIDTH = 220
export const HEADER_HEIGHT = 30
export const ROW_HEIGHT = 22
export const PADDING_BOTTOM = 6
const GAP_X = 90
const GAP_Y = 60
const MARGIN = 30

export interface Box {
  table: string
  x: number
  y: number
  width: number
  height: number
}

export interface Edge {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
}

export function boxHeight(table: TableInfo): number {
  return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + PADDING_BOTTOM
}

/**
 * FK 방향 기준으로 열을 나눠 배치한다.
 * 아무것도 참조하지 않는 테이블(부모)이 0열, 그것을 참조하는 테이블이 1열… 순으로 놓여 선이 대체로 왼쪽→오른쪽으로 흐른다.
 * 열 안에서는 위에서 아래로 쌓는다. 참조 순환은 깊이 계산에서 끊는다.
 */
export function layeredLayout(tables: TableInfo[]): Box[] {
  const names = new Set(tables.map((t) => t.name))
  const depthOf = new Map<string, number>()
  const depth = (name: string, visiting: Set<string>): number => {
    const cached = depthOf.get(name)
    if (cached !== undefined) return cached
    if (visiting.has(name)) return 0
    visiting.add(name)
    const t = tables.find((x) => x.name === name)!
    const parents = t.foreignKeys.map((fk) => fk.refTable).filter((r) => r !== name && names.has(r))
    const d = parents.length === 0 ? 0 : 1 + Math.max(...parents.map((p) => depth(p, visiting)))
    depthOf.set(name, d)
    return d
  }
  for (const t of tables) depth(t.name, new Set())

  const columns = new Map<number, TableInfo[]>()
  for (const t of tables) {
    const d = depthOf.get(t.name) ?? 0
    columns.set(d, [...(columns.get(d) ?? []), t])
  }

  const boxes: Box[] = []
  for (const [d, col] of [...columns.entries()].sort((a, b) => a[0] - b[0])) {
    let y = MARGIN
    for (const t of col) {
      boxes.push({ table: t.name, x: MARGIN + d * (BOX_WIDTH + GAP_X), y, width: BOX_WIDTH, height: boxHeight(t) })
      y += boxHeight(t) + GAP_Y
    }
  }
  return boxes
}

/** FK 를 간선으로. 참조 컬럼이 비어 있으면 상대 테이블의 PK 를 가리킨다 */
export function edgesOf(tables: TableInfo[]): Edge[] {
  const edges: Edge[] = []
  for (const t of tables) {
    for (const fk of t.foreignKeys) {
      const target = tables.find((x) => x.name === fk.refTable)
      if (!target) continue
      const toColumn = fk.refColumn || target.columns.find((c) => c.primaryKey)?.name || target.columns[0]?.name || ''
      edges.push({ fromTable: t.name, fromColumn: fk.column, toTable: target.name, toColumn })
    }
  }
  return edges
}

/** 컬럼 행의 세로 중심 y (박스 기준 상대값) */
export function columnY(table: TableInfo, column: string): number {
  const i = Math.max(0, table.columns.findIndex((c) => c.name === column))
  return HEADER_HEIGHT + i * ROW_HEIGHT + ROW_HEIGHT / 2
}

export interface Point {
  x: number
  y: number
}

/** 두 박스 사이 간선의 양 끝점. 서로 가까운 쪽 옆면에서 나간다 */
export function edgeEndpoints(from: Box, fromY: number, to: Box, toY: number): { start: Point; end: Point } {
  const fromCenter = from.x + from.width / 2
  const toCenter = to.x + to.width / 2
  if (Math.abs(fromCenter - toCenter) < from.width) {
    // 위아래로 겹치면 같은 쪽(오른쪽)으로 나가서 돌아 들어간다
    return { start: { x: from.x + from.width, y: from.y + fromY }, end: { x: to.x + to.width, y: to.y + toY } }
  }
  const rightward = toCenter > fromCenter
  return {
    start: { x: rightward ? from.x + from.width : from.x, y: from.y + fromY },
    end: { x: rightward ? to.x : to.x + to.width, y: to.y + toY },
  }
}

export function canvasSize(boxes: Box[]): { width: number; height: number } {
  return {
    width: Math.max(...boxes.map((b) => b.x + b.width), 0) + MARGIN,
    height: Math.max(...boxes.map((b) => b.y + b.height), 0) + MARGIN,
  }
}
