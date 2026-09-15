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

/** 테이블을 정사각형에 가까운 격자로 배치한다. 줄 높이는 그 줄에서 가장 큰 박스에 맞춘다 */
export function gridLayout(tables: TableInfo[]): Box[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)))
  const boxes: Box[] = []
  let y = MARGIN
  for (let i = 0; i < tables.length; i += cols) {
    const row = tables.slice(i, i + cols)
    row.forEach((t, j) => {
      boxes.push({ table: t.name, x: MARGIN + j * (BOX_WIDTH + GAP_X), y, width: BOX_WIDTH, height: boxHeight(t) })
    })
    y += Math.max(...row.map(boxHeight)) + GAP_Y
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
