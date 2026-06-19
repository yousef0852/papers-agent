import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { GraphNode, AppState } from '@/lib/types'
import {
  CANVAS_W, CANVAS_H, NODE_W, NODE_H, NODE_LABEL_FONT, NODE_LINE_HEIGHT,
  YEAR_MIN, YEAR_MAX,
  getCategoryStyles, LANE_FRACS, REL_LABELS, xFromYear, hashId,
  measurePaperNode, measureConceptNode,
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
  theme: 'light' | 'dark'
}

interface ConceptPosition extends GraphNode {
  cx: number
  cy: number
  angle: number
}

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
  bendSign = 1,
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
  const bend = (36 + Math.min(120, len * 0.1)) * bendSign
  const cx1 = mx + px * bend * 0.65
  const cy1 = my + py * bend * 0.65
  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`
}

// Horizontal padding around the node cluster

interface ViewBox {
  vx: number
  vy: number
  vw: number
  vh: number
}

function clampViewBox(box: ViewBox): ViewBox {
  const vw = Math.max(MIN_VW, box.vw)
  const vh = Math.max(MIN_VH, box.vh)
  const maxW = CANVAS_W * 2.2
  const maxH = CANVAS_H * 1.8
  return {
    vw: Math.min(maxW, vw),
    vh: Math.min(maxH, vh),
    vx: Math.max(-CANVAS_W * 0.3, Math.min(maxW - vw, box.vx)),
    vy: Math.max(-CANVAS_H * 0.15, Math.min(maxH - vh, box.vy)),
  }
}

function spreadNodesAroundCenter(nodes: GraphNode[], spacingScale: number): GraphNode[] {
  if (spacingScale === 1) return nodes
  const papers = nodes.filter((n) => n.kind !== 'concept' && Number.isFinite(n.x))
  if (papers.length === 0) return nodes

  const cx = papers.reduce((s, n) => s + n.x, 0) / papers.length
  const cy = papers.reduce((s, n) => s + n.y, 0) / papers.length

  return nodes.map((n) => {
    if (n.kind === 'concept') return n
    return {
      ...n,
      x: cx + (n.x - cx) * spacingScale,
      y: cy + (n.y - cy) * spacingScale,
    }
  })
}

function spacingScaleForZoom(userZoom: number): number {
  // Zoom out → more space between nodes; zoom in → tighter cluster
  return Math.max(0.35, Math.min(3.5, 1 / userZoom))
}

// Camera zoom uses a softer curve so node spacing changes are visible on screen
const CAMERA_ZOOM_POWER = 0.55

function computeLayoutViewBox(
  nodes: GraphNode[],
  focusTarget: string | null,
): ViewBox {
  const papers = nodes.filter((n) => n.kind !== 'concept' && n.x != null && Number.isFinite(n.x))
  if (papers.length === 0) {
    return { vx: 0, vy: 0, vw: CANVAS_W, vh: CANVAS_H }
  }

  if (focusTarget) {
    const node = papers.find((n) => n.id === focusTarget)
    if (node) {
      const { w, h } = measurePaperNode(node.label)
      const vw = Math.max(440, w + VIEW_PAD * 2.2)
      const vh = Math.max(340, h + VIEW_PAD * 2)
      return clampViewBox({
        vx: node.x - vw / 2,
        vy: node.y - vh / 2,
        vw,
        vh,
      })
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
  const pad = VIEW_PAD
  const vw = Math.max(MIN_VW, spreadX + pad * 2)
  const vh = Math.max(MIN_VH, spreadY + pad * 2, CANVAS_H * 0.45)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  return clampViewBox({
    vx: cx - vw / 2,
    vy: cy - vh / 2,
    vw,
    vh,
  })
}

function applyCameraZoom(box: ViewBox, userZoom: number, panOffset: { x: number; y: number }): ViewBox {
  const scale = Math.pow(userZoom, CAMERA_ZOOM_POWER)
  const cx = box.vx + box.vw / 2
  const cy = box.vy + box.vh / 2
  const vw = box.vw / scale
  const vh = box.vh / scale
  return {
    vx: cx - vw / 2 + panOffset.x,
    vy: cy - vh / 2 + panOffset.y,
    vw,
    vh,
  }
}

export function Graph({ state, onSelectNode, onClearSelection, selectedId, theme }: GraphProps) {
  const CATEGORY_STYLES = getCategoryStyles(theme)
  const { nodes, edges, focusId, newIds } = state
  const papers = nodes.filter((n) => n.kind !== 'concept')
  const viewportRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const [userZoom, setUserZoom] = useState(1)
  const [focusZoomId, setFocusZoomId] = useState<string | null>(null)
  const [panMode, setPanMode] = useState(false)
  const [panning, setPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const newSet = useMemo(() => new Set(newIds || []), [newIds])

  useEffect(() => {
    setFocusZoomId(selectedId)
  }, [selectedId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'h' || e.key === 'H') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        setPanMode((m) => !m)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const focusTarget = focusZoomId || selectedId || null
  const spacingScale = spacingScaleForZoom(userZoom)
  const displayNodes = useMemo(
    () => spreadNodesAroundCenter(nodes, spacingScale),
    [nodes, spacingScale],
  )
  const layoutViewBox = useMemo(
    () => computeLayoutViewBox(nodes, focusTarget),
    [nodes, focusTarget],
  )
  const viewBox = useMemo(
    () => applyCameraZoom(layoutViewBox, userZoom, panOffset),
    [layoutViewBox, userZoom, panOffset],
  )

  const displayNodeById = useMemo(() => {
    const m: Record<string, GraphNode> = {}
    for (const n of displayNodes) m[n.id] = n
    return m
  }, [displayNodes])

  const displayPapers = useMemo(
    () => displayNodes.filter((n) => n.kind !== 'concept'),
    [displayNodes],
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
    setPanOffset({ x: 0, y: 0 })
  }, [])

  const togglePanMode = useCallback(() => {
    setPanMode((m) => !m)
  }, [])

  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    if (!panMode) return
    dragRef.current = { x: clientX, y: clientY, panX: panOffset.x, panY: panOffset.y }
    setPanning(true)
  }, [panMode, panOffset])

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current
    const el = svgRef.current
    if (!drag || !el) return
    const rect = el.getBoundingClientRect()
    const scaleX = viewBox.vw / rect.width
    const scaleY = viewBox.vh / rect.height
    setPanOffset({
      x: drag.panX - (clientX - drag.x) * scaleX,
      y: drag.panY - (clientY - drag.y) * scaleY,
    })
  }, [viewBox.vh, viewBox.vw])

  const handlePanEnd = useCallback(() => {
    dragRef.current = null
    setPanning(false)
  }, [])

  useEffect(() => {
    if (!panning) return
    function onMove(e: MouseEvent) { handlePanMove(e.clientX, e.clientY) }
    function onUp() { handlePanEnd() }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [panning, handlePanMove, handlePanEnd])

  const zoomToSelected = useCallback(() => {
    if (selectedId) {
      setFocusZoomId(selectedId)
      setUserZoom(1.35)
    }
  }, [selectedId])

  const nodeById = displayNodeById

  const conceptsByParent = useMemo(() => {
    const m: Record<string, GraphNode[]> = {}
    for (const n of displayNodes) {
      if (n.kind === 'concept' && n.parent_id) {
        (m[n.parent_id] ||= []).push(n)
      }
    }
    return m
  }, [displayNodes])

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
    for (const n of displayNodes) {
      if (n.kind === 'concept' && n.parent_id === active) r.add(n.id)
    }
    return { nodes: r, edges: e }
  }, [active, edges, displayNodes])

  const hoveredEdges = useMemo(() => {
    if (!hoveredNodeId) return null
    const set = new Set<number>()
    edges.forEach((edge, i) => {
      if (edge.from === hoveredNodeId || edge.to === hoveredNodeId) set.add(i)
    })
    return set
  }, [hoveredNodeId, edges])

  const minPaperYear = displayPapers.length ? Math.min(...displayPapers.map(n => n.year)) : YEAR_MIN
  const tickStart = Math.floor(Math.min(minPaperYear, YEAR_MIN) / 10) * 10
  const ticks: number[] = []
  for (let y = tickStart; y < YEAR_MAX; y += 10) ticks.push(y)
  ticks.push(YEAR_MAX)
  const lanes = ['vision', 'rl', 'foundations', 'architecture', 'language'] as const

  return (
    <div
      className={`graph-viewport${panMode ? ' pan-mode' : ''}${panning ? ' panning' : ''}`}
      ref={viewportRef}
      onWheel={handleWheel}
      onMouseDown={(e) => {
        if (panMode && e.button === 0) {
          e.preventDefault()
          handlePanStart(e.clientX, e.clientY)
        }
      }}
    >
      <div className="graph-zoom-controls" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="graph-zoom-btn" onClick={() => adjustZoom(1.15)} title="Zoom in (nodes closer)" aria-label="Zoom in">+</button>
        <button type="button" className="graph-zoom-btn" onClick={() => adjustZoom(0.87)} title="Zoom out (nodes spread apart)" aria-label="Zoom out">−</button>
        <button
          type="button"
          className={`graph-zoom-btn graph-zoom-btn--text${panMode ? ' active' : ''}`}
          onClick={togglePanMode}
          title="Pan mode (H) — drag to move canvas"
        >
          Hand
        </button>
        <button type="button" className="graph-zoom-btn graph-zoom-btn--text" onClick={zoomToSelected} disabled={!selectedId} title="Zoom to selected node">
          Focus
        </button>
        <button type="button" className="graph-zoom-btn graph-zoom-btn--text" onClick={fitAll} title="Reset zoom and pan">
          Fit
        </button>
      </div>
      <svg
        ref={svgRef}
        className="board"
        width="100%"
        height={CANVAS_H}
        viewBox={`${viewBox.vx} ${viewBox.vy} ${viewBox.vw} ${viewBox.vh}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={panMode ? undefined : onClearSelection}
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
          const aw = measurePaperNode(a.label).w
          const ah = measurePaperNode(a.label).h
          const bw = measurePaperNode(b.label).w
          const bh = measurePaperNode(b.label).h
          const bendSign = hashId(`${edge.from}-${edge.to}`) % 2 === 0 ? 1 : -1
          const inSelection = related && related.edges.has(i)
          const inHover = hoveredEdges?.has(i)
          const dim = related && !inSelection
          const highlight = inSelection || inHover
          const opacity = dim ? 0.06 : highlight ? 0.82 : hoveredEdge === i ? 0.55 : 0.14
          const path = edgePath(a, b, aw, ah, bw, bh, bendSign)
          const midX = (a.x + b.x) / 2
          const midY = (a.y + b.y) / 2 - 6
          const showLabel = highlight || hoveredEdge === i
          return (
            <g key={i}>
              <path className="edge-path" d={path} fill="none" stroke="var(--svg-edge)"
                strokeWidth={highlight ? 1.8 : 1}
                strokeLinecap="round"
                strokeDasharray={rel.dash} opacity={opacity} markerEnd={highlight ? 'url(#arrow-soft)' : undefined}
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
        {displayPapers.map((node) => {
          const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES.other
          const selected = selectedId === node.id
          const focused = focusId === node.id
          const dim = related && !related.nodes.has(node.id)
          const isNew = newSet.has(node.id)
          const scale = selected ? 1.05 : focused ? 1.02 : 1
          const { w, h, lines } = measurePaperNode(node.label)
          const labelStartY = lines.length > 1 ? -(NODE_LINE_HEIGHT / 2) + 2 : 5
          const strokeW = selected ? 2.4 : focused ? 2 : dim ? 1.4 : 1.6

          return (
            <g key={node.id}
              className={`node-g ${isNew ? 'new' : ''} ${focused ? 'focused' : ''} ${dim ? 'dimmed' : ''}`}
              transform={`translate(${node.x} ${node.y}) scale(${scale})`}
              opacity={dim ? 0.62 : 1}
              onMouseEnter={() => !panMode && setHoveredNodeId(node.id)}
              onMouseLeave={() => !panMode && setHoveredNodeId(null)}
              onClick={(e) => {
                if (panMode) return
                e.stopPropagation()
                onSelectNode(node.id)
              }}
              style={{ pointerEvents: panMode ? 'none' : 'auto' }}
            >
              {focused && (
                <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12}
                  rx={5} ry={5} fill="none" stroke={style.stroke} strokeWidth="0.6"
                  strokeDasharray="2 3" opacity="0.6"/>
              )}
              <rect className="node-rect" x={-w / 2} y={-h / 2} width={w} height={h}
                rx={4} ry={4} fill={style.fill} stroke={style.stroke}
                strokeWidth={strokeW}
                filter={(selected || focused) ? 'url(#node-shadow-strong)' : 'url(#node-shadow)'}/>
              <clipPath id={`clip-${node.id}`}>
                <rect x={-w / 2 + 6} y={-h / 2 + 14} width={w - 12} height={h - 20} rx={2}/>
              </clipPath>
              <text x={-w / 2 + 8} y={-h / 2 + 14}
                fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500"
                fill={style.text} opacity="0.75">{node.year}</text>
              <text
                x={0}
                y={labelStartY}
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                fontSize={NODE_LABEL_FONT}
                fill={style.text}
                textAnchor="middle"
                clipPath={`url(#clip-${node.id})`}
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={0} dy={i === 0 ? 0 : NODE_LINE_HEIGHT}>{line}</tspan>
                ))}
              </text>
            </g>
          )
        })}

        {active && conceptsByParent[active] && (() => {
          const parent = displayNodeById[active]
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

export function Inspector({ node, related, onClose, theme }: InspectorProps) {
  if (!node) return null

  const style = getCategoryStyles(theme)[node.category] || getCategoryStyles(theme).other
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
