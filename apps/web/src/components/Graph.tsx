import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { GraphNode, AppState } from '@/lib/types'
import {
  CANVAS_W, CANVAS_H, NODE_W, NODE_H, YEAR_MIN, YEAR_MAX,
  getCategoryStyles, LANE_FRACS, REL_LABELS, xFromYear, hashId,
  measurePaperNode, measureConceptNode, CONCEPT_W, CONCEPT_H,
} from '@/lib/data'

const CONCEPT_RADIUS = 105
const VIEW_PAD = 96
const MIN_VW = 560
const MIN_VH = 420

interface GraphProps {
  state: AppState
  selectedId: string | null
  onSelectNode: (id: string) => void
  onClearSelection: () => void
  theme: 'light' | 'dark'
}

interface InspectorProps {
  node: GraphNode | null
  related: { label: string }[]
  onClose: () => void
}

interface ConceptPosition extends GraphNode {
  cx: number
  cy: number
  angle: number
}

interface AnnotationPosition {
  text: string
  x: number
  y: number
  anchor: 'start' | 'end'
}

const ANNOT_SLOTS: { dx: number; dy: number; anchor: 'start' | 'end'; align: string }[] = [
  { dx: -130, dy: -52, anchor: 'end',   align: 'right' },
  { dx:  130, dy: -52, anchor: 'start', align: 'left'  },
  { dx: -140, dy:  16, anchor: 'end',   align: 'right' },
  { dx:  140, dy:  16, anchor: 'start', align: 'left'  },
  { dx:  -78, dy:  64, anchor: 'end',   align: 'right' },
  { dx:   78, dy:  64, anchor: 'start', align: 'left'  },
  { dx: -150, dy: -10, anchor: 'end',   align: 'right' },
  { dx:  150, dy: -10, anchor: 'start', align: 'left'  },
]

function conceptPositions(parent: GraphNode, children: GraphNode[]): ConceptPosition[] {
  const n = children.length
  if (n === 0) return []
  const startAngle = -Math.PI * 0.75
  const endAngle = Math.PI * 0.75
  const step = n === 1 ? 0 : (endAngle - startAngle) / (n - 1)
  return children.map((c, i) => {
    const a = startAngle + i * step
    const r = CONCEPT_RADIUS + (i % 2 === 0 ? 0 : 18)
    return {
      ...c,
      cx: parent.x + Math.cos(a) * r,
      cy: parent.y + Math.sin(a) * r * 0.85,
      angle: a,
    }
  })
}

function edgePath(
  a: GraphNode, b: GraphNode,
  aw: number, ah: number, bw: number, bh: number,
): string {
  const ax = a.x, ay = a.y, bx = b.x, by = b.y
  const dx = bx - ax, dy = by - ay
  const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
  const ux = dx / len, uy = dy / len
  const ahx = aw / 2 - 4
  const ahy = ah / 2 - 4
  const bhx = bw / 2 - 4
  const bhy = bh / 2 - 4
  const startX = ax + ux * (Math.abs(ux) > Math.abs(uy) ? ahx : ahx * 0.6)
  const startY = ay + uy * (Math.abs(uy) > Math.abs(ux) ? ahy : ahy * 0.6)
  const endX = bx - ux * (Math.abs(ux) > Math.abs(uy) ? bhx : bhx * 0.6)
  const endY = by - uy * (Math.abs(uy) > Math.abs(ux) ? bhy : bhy * 0.6)
  const mx = (startX + endX) / 2
  const my = (startY + endY) / 2
  const px = -uy, py = ux
  const bend = 28 + Math.min(80, len * 0.06)
  const cx1 = mx + px * bend * 0.6
  const cy1 = my + py * bend * 0.6
  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`
}

function annotationLayout(node: GraphNode, edges: AppState['edges'], allNodes: GraphNode[]): AnnotationPosition[] {
  const annots = (node.annotations || []).slice(-6)
  if (!annots.length) return []

  const sideUsage = { left: 0, right: 0, top: 0, bottom: 0 }
  for (const e of edges) {
    if (e.from !== node.id && e.to !== node.id) continue
    const other = allNodes.find((n) => n.id === (e.from === node.id ? e.to : e.from))
    if (!other) continue
    if (other.x < node.x - 30) sideUsage.left++
    else if (other.x > node.x + 30) sideUsage.right++
    if (other.y < node.y - 30) sideUsage.top++
    else if (other.y > node.y + 30) sideUsage.bottom++
  }

  const slotPool = ANNOT_SLOTS.slice().sort((a, b) => {
    const aBusy = (a.dx < 0 ? sideUsage.left : sideUsage.right) + (a.dy < 0 ? sideUsage.top : sideUsage.bottom)
    const bBusy = (b.dx < 0 ? sideUsage.left : sideUsage.right) + (b.dy < 0 ? sideUsage.top : sideUsage.bottom)
    return aBusy - bBusy
  })

  const baseSeed = hashId(node.id)
  return annots.map((ann, i) => {
    const slot = slotPool[i % slotPool.length]
    const jitterX = ((Math.sin(baseSeed + i * 13) + 1) / 2 - 0.5) * 12
    const jitterY = ((Math.sin(baseSeed + i * 17 + 1) + 1) / 2 - 0.5) * 10
    return {
      text: ann.text,
      x: slot.dx + jitterX,
      y: slot.dy + jitterY,
      anchor: slot.anchor,
    }
  })
}

// Horizontal padding around the node cluster (covers ±150px annotation slots + breathing room)

interface ViewBox {
  vx: number
  vy: number
  vw: number
  vh: number
}

function clampViewBox(box: ViewBox): ViewBox {
  const vw = Math.min(CANVAS_W, Math.max(MIN_VW, box.vw))
  const vh = Math.min(CANVAS_H, Math.max(MIN_VH, box.vh))
  return {
    vw,
    vh,
    vx: Math.max(0, Math.min(CANVAS_W - vw, box.vx)),
    vy: Math.max(0, Math.min(CANVAS_H - vh, box.vy)),
  }
}

function applyZoom(box: ViewBox, zoom: number): ViewBox {
  if (zoom === 1) return box
  const cx = box.vx + box.vw / 2
  const cy = box.vy + box.vh / 2
  const vw = box.vw / zoom
  const vh = box.vh / zoom
  return clampViewBox({ vx: cx - vw / 2, vy: cy - vh / 2, vw, vh })
}

function computeViewBox(
  nodes: GraphNode[],
  focusTarget: string | null,
  zoom: number,
): ViewBox {
  const papers = nodes.filter((n) => n.kind !== 'concept' && n.x != null && Number.isFinite(n.x))
  if (papers.length === 0) {
    return applyZoom({ vx: 0, vy: 0, vw: CANVAS_W, vh: CANVAS_H }, zoom)
  }

  if (focusTarget) {
    const node = papers.find((n) => n.id === focusTarget)
    if (node) {
      const { w, h } = measurePaperNode(node.label)
      const vw = Math.max(440, w + VIEW_PAD * 2.2)
      const vh = Math.max(340, h + VIEW_PAD * 2)
      return applyZoom(clampViewBox({
        vx: node.x - vw / 2,
        vy: node.y - vh / 2,
        vw,
        vh,
      }), zoom)
    }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const n of papers) {
    const { w, h } = measurePaperNode(n.label)
    minX = Math.min(minX, n.x - w / 2)
    maxX = Math.max(maxX, n.x + w / 2)
    minY = Math.min(minY, n.y - h / 2)
    maxY = Math.max(maxY, n.y + h / 2)
  }

  const spreadX = maxX - minX
  const spreadY = maxY - minY
  const crowded = papers.length >= 3 && (spreadX < 520 || spreadY < 180)
  const boostX = crowded ? 1.45 + papers.length * 0.04 : 1.12
  const boostY = crowded ? 1.55 + papers.length * 0.03 : 1.1

  const vw = Math.max(MIN_VW, spreadX * boostX + VIEW_PAD * 2)
  const vh = Math.max(MIN_VH, spreadY * boostY + VIEW_PAD * 2, CANVAS_H * 0.52)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  return applyZoom(clampViewBox({
    vx: cx - vw / 2,
    vy: cy - vh / 2,
    vw,
    vh,
  }), zoom)
}

export function Graph({ state, onSelectNode, onClearSelection, selectedId, theme }: GraphProps) {
  const CATEGORY_STYLES = getCategoryStyles(theme)
  const { nodes, edges, focusId, newIds } = state
  const papers = nodes.filter((n) => n.kind !== 'concept')
  const viewportRef = useRef<HTMLDivElement>(null)

  const [userZoom, setUserZoom] = useState(1)
  const [focusZoomId, setFocusZoomId] = useState<string | null>(null)

  useEffect(() => {
    setFocusZoomId(selectedId)
  }, [selectedId])

  const focusTarget = focusZoomId || selectedId || null
  const viewBox = useMemo(
    () => computeViewBox(nodes, focusTarget, userZoom),
    [nodes, focusTarget, userZoom],
  )

  const adjustZoom = useCallback((factor: number) => {
    setUserZoom((z) => Math.max(0.35, Math.min(2.5, z * factor)))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    adjustZoom(e.deltaY > 0 ? 1.08 : 0.92)
  }, [adjustZoom])

  const fitAll = useCallback(() => {
    setUserZoom(1)
    setFocusZoomId(null)
  }, [])

  const zoomToSelected = useCallback(() => {
    if (selectedId) {
      setFocusZoomId(selectedId)
      setUserZoom(1.35)
    }
  }, [selectedId])

  const conceptsByParent = useMemo(() => {
    const m: Record<string, GraphNode[]> = {}
    for (const n of nodes) {
      if (n.kind === 'concept' && n.parent_id) {
        (m[n.parent_id] ||= []).push(n)
      }
    }
    return m
  }, [nodes])

  const newSet = useMemo(() => new Set(newIds || []), [newIds])
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)

  const nodeById = useMemo(() => {
    const m: Record<string, GraphNode> = {}
    for (const n of nodes) m[n.id] = n
    return m
  }, [nodes])

  const active = selectedId || focusId

  const related = useMemo(() => {
    if (!active) return null
    const r = new Set([active])
    const e = new Set<number>()
    edges.forEach((edge, i) => {
      if (edge.from === active || edge.to === active) {
        r.add(edge.from); r.add(edge.to); e.add(i)
      }
    })
    for (const n of nodes) {
      if (n.kind === 'concept' && n.parent_id === active) r.add(n.id)
    }
    return { nodes: r, edges: e }
  }, [active, edges, nodes])

  const minPaperYear = papers.length ? Math.min(...papers.map(n => n.year)) : YEAR_MIN
  const tickStart = Math.floor(Math.min(minPaperYear, YEAR_MIN) / 10) * 10
  const ticks: number[] = []
  for (let y = tickStart; y < YEAR_MAX; y += 10) ticks.push(y)
  ticks.push(YEAR_MAX)
  const lanes = ['vision', 'rl', 'foundations', 'architecture', 'language'] as const

  return (
    <div
      className="graph-viewport"
      ref={viewportRef}
      onWheel={handleWheel}
    >
      <div className="graph-zoom-controls" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="graph-zoom-btn" onClick={() => adjustZoom(1.15)} title="Zoom in" aria-label="Zoom in">+</button>
        <button type="button" className="graph-zoom-btn" onClick={() => adjustZoom(0.87)} title="Zoom out" aria-label="Zoom out">−</button>
        <button type="button" className="graph-zoom-btn graph-zoom-btn--text" onClick={zoomToSelected} disabled={!selectedId} title="Zoom to selected node">
          Focus
        </button>
        <button type="button" className="graph-zoom-btn graph-zoom-btn--text" onClick={fitAll} title="Fit all nodes">
          Fit
        </button>
      </div>
      <svg
        className="board"
        width="100%"
        height={CANVAS_H}
        viewBox={`${viewBox.vx} ${viewBox.vy} ${viewBox.vw} ${viewBox.vh}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={onClearSelection}
      >
      <defs>
        <marker id="arrow-soft" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
          <path d="M1 1 L11 6 L1 11" fill="none" stroke="var(--svg-arrow)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
        </marker>
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2a2418" floodOpacity="0.09"/>
        </filter>
        <filter id="node-shadow-strong" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2a2418" floodOpacity="0.22"/>
        </filter>
      </defs>

      {lanes.map((lane) => {
        const y = LANE_FRACS[lane] * CANVAS_H
        return (
          <g key={lane}>
            <line className="baseline" x1={80} x2={CANVAS_W - 80} y1={y} y2={y} strokeDasharray="1 5" />
            <text className="lane-label" x={84} y={y - 6}>
              {CATEGORY_STYLES[lane].label.toUpperCase()}
            </text>
          </g>
        )
      })}

      {ticks.map((year) => {
        const x = xFromYear(year)
        const major = year % 20 === 0
        return (
          <g key={year}>
            <line className="axis-line" x1={x} x2={x} y1={40} y2={CANVAS_H - 36}
              strokeDasharray={major ? '3 6' : '1 6'} opacity={major ? 0.7 : 0.4} />
            <text className="tick-label" x={x} y={CANVAS_H - 16} textAnchor="middle" fontWeight={major || year === YEAR_MAX ? 600 : 400}>
              {year}
            </text>
          </g>
        )
      })}

      <text className="tick-label" x={CANVAS_W / 2} y={28} textAnchor="middle" style={{ fontSize: 11 }}>
        a private chart of how machines learned to think · 1940 — 2026
      </text>

      <g>
        {edges.map((edge, i) => {
          const a = nodeById[edge.from]; const b = nodeById[edge.to]
          if (!a || !b || a.kind === 'concept' || b.kind === 'concept') return null
          const rel = REL_LABELS[edge.type] || REL_LABELS.extends
          const dim = related && !related.edges.has(i)
          const highlight = related && related.edges.has(i)
          const opacity = dim ? 0.1 : highlight ? 0.85 : 0.5
          const path = edgePath(a, b, measurePaperNode(a.label).w, measurePaperNode(a.label).h, measurePaperNode(b.label).w, measurePaperNode(b.label).h)
          const midX = (a.x + b.x) / 2
          const midY = (a.y + b.y) / 2 - 6
          const showLabel = highlight || hoveredEdge === i
          return (
            <g key={i}>
              <path className="edge-path" d={path} fill="none" stroke="var(--svg-edge)"
                strokeWidth={highlight ? 1.6 : 1.1} strokeLinecap="round"
                strokeDasharray={rel.dash} opacity={opacity} markerEnd="url(#arrow-soft)"
                onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)}
                onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'stroke' }}/>
              <text className={`edge-label ${showLabel ? 'show' : ''}`} x={midX} y={midY} textAnchor="middle">
                {rel.en}
              </text>
            </g>
          )
        })}
      </g>

      <g>
        {papers.map((node) => {
          const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES.other
          const selected = selectedId === node.id
          const focused = focusId === node.id
          const dim = related && !related.nodes.has(node.id)
          const isNew = newSet.has(node.id)
          const showAnnots = focused || selected
          const annots = showAnnots ? annotationLayout(node, edges, nodes) : []
          const scale = selected ? 1.06 : focused ? 1.03 : 1
          const { w, h, lines } = measurePaperNode(node.label)
          const labelStartY = lines.length > 1 ? -(lines.length - 1) * 7 + 2 : 6

          return (
            <g key={node.id}
              className={`node-g ${isNew ? 'new' : ''} ${focused ? 'focused' : ''}`}
              transform={`translate(${node.x} ${node.y}) rotate(${node.rotation}) scale(${scale})`}
              opacity={dim ? 0.22 : 1}
              onClick={(e) => { e.stopPropagation(); onSelectNode(node.id) }}
            >
              {focused && (
                <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12}
                  rx={5} ry={5} fill="none" stroke={style.stroke} strokeWidth="0.6"
                  strokeDasharray="2 3" opacity="0.6"/>
              )}
              <rect className="node-rect" x={-w / 2} y={-h / 2} width={w} height={h}
                rx={3} ry={3} fill={style.fill} stroke={style.stroke}
                strokeWidth={selected ? 2.2 : focused ? 1.8 : 1.5}
                filter={(selected || focused) ? 'url(#node-shadow-strong)' : 'url(#node-shadow)'}/>
              <line x1={-w / 2 + 6} y1={-h / 2 + 4} x2={-w / 2 + 10} y2={-h / 2 + 4}
                stroke={style.stroke} strokeWidth="0.8" opacity="0.7" />
              <text x={-w / 2 + 8} y={-h / 2 + 14}
                fontFamily="Fraunces, serif" fontStyle="italic" fontSize="10"
                fill={style.text} opacity="0.7">{node.year}</text>
              <text
                x={0}
                y={labelStartY}
                fontFamily="Fraunces, serif"
                fontWeight="600"
                fontSize={lines.some((l) => l.length > 18) ? 11.5 : 13}
                fill={style.text}
                textAnchor="middle"
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={0} dy={i === 0 ? 0 : 14}>{line}</tspan>
                ))}
              </text>

              {annots.map((a, i) => (
                <g key={i} className="annot-g">
                  <line
                    x1={a.x < 0 ? -w / 2 + 2 : w / 2 - 2}
                    y1={Math.max(-h / 2 + 8, Math.min(h / 2 - 8, a.y * 0.3))}
                    x2={a.x + (a.anchor === 'end' ? 6 : -6)}
                    y2={a.y - 2}
                    stroke={style.stroke}
                    strokeWidth="0.6"
                    strokeDasharray="1.5 2"
                    opacity="0.55"
                  />
                  <text
                    x={a.x}
                    y={a.y}
                    fontFamily="Fraunces, serif"
                    fontStyle="italic"
                    fontSize="10.5"
                    fill="var(--svg-annot-ink)"
                    textAnchor={a.anchor}
                    opacity="0.85"
                    className="annot-text"
                  >
                    {a.text.length > 28 ? `${a.text.slice(0, 27)}…` : a.text}
                  </text>
                </g>
              ))}
            </g>
          )
        })}

        {active && conceptsByParent[active] && (() => {
          const parent = nodes.find((n) => n.id === active)
          if (!parent || parent.kind === 'concept') return null
          const style = CATEGORY_STYLES[parent.category] || CATEGORY_STYLES.other
          const placed = conceptPositions(parent, conceptsByParent[active])
          return (
            <g className="concept-group">
              {placed.map((c) => {
                const cm = measureConceptNode(c.label)
                return (
                <g key={c.id} className="concept-node"
                   transform={`translate(${c.cx} ${c.cy})`}
                   onClick={(e) => { e.stopPropagation(); onSelectNode(c.id) }}>
                  <line x1={parent.x - c.cx} y1={parent.y - c.cy}
                    x2={0} y2={0}
                    stroke={style.stroke} strokeWidth="0.8"
                    strokeDasharray="2 2" opacity="0.55" />
                  <rect x={-cm.w / 2} y={-cm.h / 2}
                    width={cm.w} height={cm.h}
                    rx={cm.h / 2} ry={cm.h / 2}
                    fill="var(--svg-concept-fill)"
                    stroke={style.stroke}
                    strokeWidth="1"
                    opacity={selectedId === c.id ? 1 : 0.92} />
                  <text x={0} y={4}
                    fontFamily="Fraunces, serif"
                    fontStyle="italic"
                    fontWeight="500"
                    fontSize="10.5"
                    fill={style.text}
                    textAnchor="middle">
                    {cm.text}
                  </text>
                </g>
              )})}
            </g>
          )
        })()}
      </g>
    </svg>
    </div>
  )
}

export function Inspector({ node, related, onClose }: InspectorProps) {
  if (!node) return null

  const style = getCategoryStyles('light')[node.category] || getCategoryStyles('light').other
  const annots = node.annotations || []

  return (
    <div className="inspector">
      <div className="insp-row">
        <span className="insp-year">{node.year}</span>
        <div className="insp-row-actions">
          <span className="insp-badge" style={{ color: style.stroke, background: style.fill + 'aa' }}>
            {style.label}
          </span>
          <button type="button" className="insp-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      </div>
      <div className="insp-title">{node.label}</div>
      <div className="insp-summary">{node.summary}</div>
      {annots.length > 0 && (
        <div className="insp-annots">
          <div className="insp-annots-head">From the margins</div>
          <ul>
            {annots.slice().reverse().map((a, i) => (
              <li key={i}>{a.text}</li>
            ))}
          </ul>
        </div>
      )}
      {related && related.length > 0 && (
        <div className="insp-rel">
          <span className="insp-rel-head">Connections</span>
          <ul>
            {related.map((r, i) => <li key={i}>{r.label}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
