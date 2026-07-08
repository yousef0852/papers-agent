import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { GraphNode, AppState } from '@/lib/types'
import {
  CANVAS_W, CANVAS_H, NODE_W, NODE_H, NODE_LABEL_FONT, NODE_LINE_HEIGHT,
  YEAR_MIN, YEAR_MAX,
  getCategoryStyles, LANE_FRACS, REL_LABELS, xFromYear, hashId,
  measurePaperNode, measureConceptNode,
} from '@/lib/data'

const CONCEPT_RADIUS = 105

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
  side?: 'left' | 'right'
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
  const bend = Math.min(72, 28 + len * 0.07) * bendSign
  const cx1 = mx + px * bend * 0.65
  const cy1 = my + py * bend * 0.65
  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`
}

// Zoom/pan helpers

const ZOOM_MIN = 0.55
const ZOOM_MAX = 2.2
const CANVAS_CX = CANVAS_W / 2
const CANVAS_CY = CANVAS_H / 2

function contentTransform(zoom: number, pan: { x: number; y: number }): string {
  return `translate(${pan.x} ${pan.y}) translate(${CANVAS_CX} ${CANVAS_CY}) scale(${zoom}) translate(${-CANVAS_CX} ${-CANVAS_CY})`
}

function panToCenterNode(node: GraphNode, zoom: number): { x: number; y: number } {
  return {
    x: -zoom * (node.x - CANVAS_CX),
    y: -zoom * (node.y - CANVAS_CY),
  }
}

function clampPan(pan: { x: number; y: number }, zoom: number): { x: number; y: number } {
  const margin = 120
  const maxX = CANVAS_W * 0.45 * zoom + margin
  const maxY = CANVAS_H * 0.45 * zoom + margin
  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  }
}

export function Graph({ state, onSelectNode, onClearSelection, selectedId, theme }: GraphProps) {
  const CATEGORY_STYLES = getCategoryStyles(theme)
  const { nodes, edges, focusId, newIds } = state
  const viewportRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const [userZoom, setUserZoom] = useState(1)
  const [panMode, setPanMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  )
  const [panning, setPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const newSet = useMemo(() => new Set(newIds || []), [newIds])

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

  const displayNodes = nodes
  const contentLayerTransform = useMemo(
    () => contentTransform(userZoom, panOffset),
    [userZoom, panOffset],
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
    setUserZoom((z) => {
      const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z * factor))
      setPanOffset((pan) => clampPan({
        x: pan.x * (next / z),
        y: pan.y * (next / z),
      }, next))
      return next
    })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    adjustZoom(e.deltaY > 0 ? 1.08 : 0.92)
  }, [adjustZoom])

  const fitAll = useCallback(() => {
    setUserZoom(1)
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
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    setPanOffset(clampPan({
      x: drag.panX + (clientX - drag.x) * scaleX,
      y: drag.panY + (clientY - drag.y) * scaleY,
    }, userZoom))
  }, [userZoom])

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
    if (!selectedId) return
    const node = nodes.find((n) => n.id === selectedId && n.kind !== 'concept')
    if (!node) return
    const zoom = 1.55
    setUserZoom(zoom)
    setPanOffset(panToCenterNode(node, zoom))
  }, [nodes, selectedId])

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

  const hoveredPaperId = useMemo(() => {
    if (!hoveredNodeId) return null
    const node = displayNodeById[hoveredNodeId]
    if (!node) return null
    if (node.kind === 'concept' && node.parent_id) return node.parent_id
    return hoveredNodeId
  }, [hoveredNodeId, displayNodeById])

  const hoveredEdges = useMemo(() => {
    if (!hoveredPaperId) return null
    const set = new Set<number>()
    edges.forEach((edge, i) => {
      if (edge.from === hoveredPaperId || edge.to === hoveredPaperId) set.add(i)
    })
    return set
  }, [hoveredPaperId, edges])

  const minPaperYear = displayPapers.length ? Math.min(...displayPapers.map(n => n.year)) : YEAR_MIN
  // Adaptive year ruler — subdivide the more room a decade occupies on screen.
  const unitsPerDecade = userZoom * (xFromYear(YEAR_MIN + 20) - xFromYear(YEAR_MIN + 10))
  let yearStep = 20
  if (unitsPerDecade >= 900) yearStep = 1
  else if (unitsPerDecade >= 420) yearStep = 2
  else if (unitsPerDecade >= 210) yearStep = 5
  else if (unitsPerDecade >= 95) yearStep = 10
  const axisYears: number[] = []
  for (let y = Math.ceil(YEAR_MIN / yearStep) * yearStep; y <= YEAR_MAX; y += yearStep) axisYears.push(y)
  if (axisYears[axisYears.length - 1] !== YEAR_MAX) axisYears.push(YEAR_MAX)
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
        <button type="button" className="graph-zoom-btn" onClick={() => adjustZoom(1.12)} title="Zoom in" aria-label="Zoom in">+</button>
        <button type="button" className="graph-zoom-btn" onClick={() => adjustZoom(0.89)} title="Zoom out" aria-label="Zoom out">−</button>
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
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
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

      <g className="graph-grid-bg">
        {lanes.map((lane) => {
          const yy = panOffset.y + CANVAS_CY * (1 - userZoom) + userZoom * (LANE_FRACS[lane] * CANVAS_H)
          if (yy < 24 || yy > CANVAS_H - 22) return null
          return (
            <g key={lane}>
              <line className="baseline" x1={80} x2={CANVAS_W - 80} y1={yy} y2={yy} strokeDasharray="1 5" />
              <text className="lane-label" x={84} y={yy - 6}>
                {CATEGORY_STYLES[lane].label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </g>

      <g className="graph-content" transform={contentLayerTransform}>
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
          const opacity = hoveredEdge === i ? 0.55 : dim ? 0.06 : highlight ? 0.82 : 0.14
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
                style={{ pointerEvents: 'none' }}/>
              <text className={`edge-label ${showLabel ? 'show' : ''}`} x={midX} y={midY} textAnchor="middle">
                {rel.en}
              </text>
            </g>
          )
        })}

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

        {/* Edge hit-stroke pass — invisible wide paths on top of nodes */}
        {edges.map((edge, i) => {
          const a = nodeById[edge.from]; const b = nodeById[edge.to]
          if (!a || !b || a.kind === 'concept' || b.kind === 'concept') return null
          const aw = measurePaperNode(a.label).w
          const ah = measurePaperNode(a.label).h
          const bw = measurePaperNode(b.label).w
          const bh = measurePaperNode(b.label).h
          const bendSign = hashId(`${edge.from}-${edge.to}`) % 2 === 0 ? 1 : -1
          const path = edgePath(a, b, aw, ah, bw, bh, bendSign)
          return (
            <path key={'hit-'+i} d={path} fill="none" stroke="transparent" strokeWidth={10}
              strokeLinecap="round"
              style={{ pointerEvents: panMode ? 'none' : 'stroke', cursor: panMode ? undefined : 'pointer' }}
              onMouseEnter={() => !panMode && setHoveredEdge(i)}
              onMouseLeave={() => !panMode && setHoveredEdge(null)}
              onClick={(e) => { e.stopPropagation() }} />
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
                   onMouseEnter={() => !panMode && setHoveredNodeId(c.id)}
                   onMouseLeave={() => !panMode && setHoveredNodeId(null)}
                   onClick={(e) => { e.stopPropagation(); onSelectNode(c.id) }}
                   style={{ pointerEvents: panMode ? 'none' : 'auto' }}>
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

      <g className="graph-axis" transform={contentLayerTransform}>
        {axisYears.map((year) => {
          const xx = xFromYear(year)
          const major = year % 10 === 0
          return (
            <g key={year}>
              <line className="axis-line" x1={xx} x2={xx} y1={40} y2={CANVAS_H - 36}
                strokeDasharray={major ? '3 6' : '1 6'} opacity={major ? 0.7 : 0.3}
                vectorEffect="non-scaling-stroke" />
              <text className="tick-label" x={xx} y={CANVAS_H - 16} textAnchor="middle" fontWeight={major || year === YEAR_MAX ? 600 : 400}>
                {year}
              </text>
            </g>
          )
        })}
      </g>

      <text className="tick-label" x={CANVAS_W / 2} y={28} textAnchor="middle" style={{ fontSize: 11 }}>
        a private chart of how machines learned to think · 1940 — 2026
      </text>
    </svg>
    </div>
  )
}

export function Inspector({ node, related, onClose, theme, side = 'right' }: InspectorProps) {
  if (!node) return null

  const style = getCategoryStyles(theme)[node.category] || getCategoryStyles(theme).other
  const annots = node.annotations || []
  const keyPoints = node.keyPoints || []

  return (
    <div className={`inspector inspector--${side}`}>
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
      {keyPoints.length > 0 && (
        <div className="insp-keypoints">
          <div className="insp-keypoints-head">Key points</div>
          <ul>
            {keyPoints.map((k, i) => <li key={i}>{k}</li>)}
          </ul>
        </div>
      )}
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
