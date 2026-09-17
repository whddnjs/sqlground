import { Eye, Minus, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  columnY,
  edgeEndpoints,
  edgesOf,
  layeredLayout,
  type Box,
} from '../lib/erd-layout'
import type { TableInfo } from '../db/engine'
import { useDbStore } from '../store/db-store'
import { useDescriptionStore } from '../store/description-store'

interface Props {
  onClose(): void
  onSelectTable(table: TableInfo): void
  onInsertRow(table: TableInfo): void
  onAlterTable(table: TableInfo): void
  onDropTable(table: TableInfo): void
}

const ZOOM_MIN = 0.3
const ZOOM_MAX = 2.5

type Drag = { kind: 'box'; table: string; dx: number; dy: number } | { kind: 'pan'; startX: number; startY: number; panX: number; panY: number }

export function ErdView({ onClose, onSelectTable, onInsertRow, onAlterTable, onDropTable }: Props) {
  const tables = useDbStore((s) => s.tables)
  const [selected, setSelected] = useState<string | null>(null)
  const selectedTable = tables.find((t) => t.name === selected) ?? null
  const describe = useDescriptionStore((s) => s.get)
  // 드래그로 옮긴 위치만 상태로 두고, 기본 배치는 테이블 구성에서 매번 계산한다
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({})
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [panning, setPanning] = useState(false)
  const drag = useRef<Drag | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const boxes: Box[] = useMemo(
    () => layeredLayout(tables).map((b) => (moved[b.table] ? { ...b, ...moved[b.table] } : b)),
    [tables, moved],
  )
  const byName = useMemo(() => new Map(tables.map((t) => [t.name, t])), [tables])
  const boxOf = (name: string) => boxes.find((b) => b.table === name)
  const edges = useMemo(() => edgesOf(tables), [tables])

  /** 화면 좌표 → 다이어그램 좌표 (pan, zoom 반영) */
  const toDiagram = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom }
  }

  const resetView = () => {
    setMoved({})
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }
  const zoomBy = (factor: number) => setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor)))

  const actionButton = 'btn btn-sm btn-ghost'

  return (
    <div className="flex h-full flex-col bg-surface text-fg">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-xs text-fg-muted">
        <span className="font-medium text-fg">관계도</span>
        {selectedTable ? (
          <div className="flex items-center gap-1">
            <span className="mr-1 rounded bg-accent-soft px-1.5 py-0.5 font-mono text-accent-fg">{selectedTable.name}</span>
            <button onClick={() => onSelectTable(selectedTable)} className={actionButton} title="조회 (SELECT)"><Eye size={12} /> 조회</button>
            <button onClick={() => onInsertRow(selectedTable)} className={actionButton} title="행 추가 (INSERT)"><Plus size={12} /> 행 추가</button>
            <button onClick={() => onAlterTable(selectedTable)} className={actionButton} title="구조 변경 (ALTER TABLE)"><Settings2 size={12} /> 구조 변경</button>
            <button onClick={() => onDropTable(selectedTable)} className={`${actionButton} text-red-600`} title="테이블 삭제 (DROP)"><Trash2 size={12} /> 삭제</button>
          </div>
        ) : (
          <span>테이블을 클릭하면 조회·수정 버튼이 나옵니다. 더블클릭은 구조 변경. 빈 곳을 드래그하면 화면이 움직입니다.</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => zoomBy(1 / 1.2)} title="축소" className="rounded p-1 hover:bg-hover">
            <Minus size={14} />
          </button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomBy(1.2)} title="확대" className="rounded p-1 hover:bg-hover">
            <Plus size={14} />
          </button>
          <button onClick={resetView} className="ml-2 flex items-center gap-1 rounded px-2 py-1 hover:bg-hover">
            <RotateCcw size={12} /> 배치 초기화
          </button>
          <button onClick={onClose} title="닫기 (Esc)" className="ml-2 rounded p-1 hover:bg-hover" aria-label="관계도 닫기">
            <X size={16} />
          </button>
        </div>
      </div>
      {tables.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-sm text-fg-muted">테이블이 없습니다. 테이블을 만들거나 샘플을 불러오면 관계도가 그려집니다.</div>
      )}
      {tables.length > 0 && <div className="dot-grid min-h-0 flex-1 overflow-hidden bg-canvas">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className={['select-none', panning ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
          onPointerDown={(e) => {
            // 박스 위에서 시작한 드래그는 박스 쪽 핸들러가 먼저 잡는다
            if (drag.current) return
            setSelected(null)
            drag.current = { kind: 'pan', startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
            setPanning(true)
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            if (d.kind === 'pan') {
              setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) })
            } else {
              const p = toDiagram(e)
              setMoved((m) => ({ ...m, [d.table]: { x: p.x - d.dx, y: p.y - d.dy } }))
            }
          }}
          onPointerUp={() => {
            drag.current = null
            setPanning(false)
          }}
          onPointerCancel={() => {
            drag.current = null
            setPanning(false)
          }}
          onWheel={(e) => {
            // Ctrl/Cmd + 휠로 확대·축소, 그냥 휠은 이동
            if (e.ctrlKey || e.metaKey) zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1)
            else setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
          }}
        >
          <defs>
            <marker id="erd-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,1 L9,5 L0,9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            <g className="text-fg-subtle">
              {edges.map((e, i) => {
                const from = boxOf(e.fromTable)
                const to = boxOf(e.toTable)
                const ft = byName.get(e.fromTable)
                const tt = byName.get(e.toTable)
                if (!from || !to || !ft || !tt) return null
                const { start, end } = edgeEndpoints(from, columnY(ft, e.fromColumn), to, columnY(tt, e.toColumn))
                const bend = Math.max(40, Math.abs(end.x - start.x) / 2)
                const sDir = start.x >= from.x + from.width ? 1 : -1
                const eDir = end.x >= to.x + to.width ? 1 : -1
                const d = `M${start.x},${start.y} C${start.x + sDir * bend},${start.y} ${end.x + eDir * bend},${end.y} ${end.x},${end.y}`
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#erd-arrow)" />
                    <circle cx={start.x} cy={start.y} r="3" fill="currentColor" />
                  </g>
                )
              })}
            </g>

            {boxes.map((b) => {
              const t = byName.get(b.table)
              if (!t) return null
              return (
                <g
                  key={b.table}
                  transform={`translate(${b.x},${b.y})`}
                  className="cursor-move"
                  onDoubleClick={() => onAlterTable(t)}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setSelected(b.table)
                    const p = toDiagram(e)
                    drag.current = { kind: 'box', table: b.table, dx: p.x - b.x, dy: p.y - b.y }
                    svgRef.current?.setPointerCapture(e.pointerId)
                  }}
                >
                  <rect width={b.width} height={b.height} rx="6" className={selected === b.table ? 'fill-white stroke-accent' : 'fill-white stroke-line-strong'} strokeWidth={selected === b.table ? 2 : 1} />
                  <rect width={b.width} height={HEADER_HEIGHT} rx="6" className="fill-accent" />
                  <rect y={HEADER_HEIGHT - 6} width={b.width} height="6" className="fill-accent" />
                  <text x="10" y={HEADER_HEIGHT / 2 + 4} className="fill-white text-[13px] font-semibold">
                    {t.name}
                  </text>
                  {t.columns.map((c, i) => {
                    const y = HEADER_HEIGHT + i * ROW_HEIGHT
                    const isFk = t.foreignKeys.some((fk) => fk.column === c.name)
                    const desc = describe(t.name, c.name)
                    return (
                      <g key={c.name} transform={`translate(0,${y})`}>
                        <title>{desc ? `${c.name}: ${desc}` : c.name}</title>
                        <text x="10" y={ROW_HEIGHT / 2 + 4} className="fill-fg font-mono text-[11px]">
                          {c.primaryKey && <tspan className="fill-amber-600 font-sans font-semibold">PK </tspan>}
                          {isFk && !c.primaryKey && <tspan className="fill-accent font-sans font-semibold">FK </tspan>}
                          {c.name}
                        </text>
                        <text x={b.width - 10} y={ROW_HEIGHT / 2 + 4} textAnchor="end" className="fill-fg-subtle font-mono text-[10px]">
                          {c.type}
                        </text>
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </g>
        </svg>
      </div>}
    </div>
  )
}
