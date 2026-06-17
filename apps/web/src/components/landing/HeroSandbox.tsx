'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { SANDBOX_CATEGORY_STYLES, SEED_NODES, INJECT_BEAT2, INJECT_BEAT4,
  SB_W, SB_H, SB_NODE_W, SB_NODE_H, SB_TICKS, sbViewBox, type SNode,
} from '@/lib/sandbox-data'

// ── Types ────────────────────────────────────────────────────────────────────
interface SEdge { id: string; from: string; to: string; visible: boolean }
interface ChatLine { id: number; role: 'user' | 'tutor'; text: string }

// ── Edge path (smooth S-curve between node centres) ──────────────────────────
function edgePath(a: SNode, b: SNode): string {
  const cx = (a.x + b.x) / 2
  return `M ${a.x} ${a.y} C ${cx} ${a.y} ${cx} ${b.y} ${b.x} ${b.y}`
}

// ── AnimatedEdge ─────────────────────────────────────────────────────────────
function AnimatedEdge({ edge, nodes }: { edge: SEdge; nodes: SNode[] }) {
  const from = nodes.find(n => n.id === edge.from)
  const to   = nodes.find(n => n.id === edge.to)
  if (!from || !to) return null
  const d = edgePath(from, to)
  return (
    <path
      d={d}
      fill="none"
      stroke="var(--svg-edge)"
      strokeWidth="1.25"
      markerEnd="url(#sb-arrow)"
      pathLength="1"
      strokeDasharray="1 0"
      strokeDashoffset={edge.visible ? 0 : 1}
      style={{
        transition: edge.visible
          ? 'stroke-dashoffset 0.55s cubic-bezier(0.25, 1, 0.5, 1)'
          : 'none',
      }}
    />
  )
}

// ── SandboxNode ───────────────────────────────────────────────────────────────
function SandboxNode({ node }: { node: SNode }) {
  const cs = SANDBOX_CATEGORY_STYLES[node.category]
  const cls = node.isNew ? 'sb-node-inner sb-node-new' : 'sb-node-inner sb-node-seed'
  const delay = node.staggerDelay > 0 ? `${node.staggerDelay}ms` : '0ms'

  return (
    <g transform={`translate(${node.x}, ${node.y}) rotate(${node.rotation})`}>
      <g
        className={cls}
        style={{ animationDelay: delay }}
      >
        <rect
          x={-SB_NODE_W / 2}
          y={-SB_NODE_H / 2}
          width={SB_NODE_W}
          height={SB_NODE_H}
          rx="5"
          fill={cs.fill}
          stroke={cs.stroke}
          strokeWidth="1.25"
          filter="url(#sb-shadow)"
        />
        <text
          x="0"
          y="-6"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill={cs.stroke}
          fontFamily="'Inter', sans-serif"
        >
          {node.label}
        </text>
        <text
          x="0"
          y="11"
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-muted)"
          fontFamily="'Inter', sans-serif"
        >
          {node.year}
        </text>
      </g>
    </g>
  )
}

// ── TypingDots ────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="sb-thinking" aria-label="Tutor is thinking">
      <span />
      <span />
      <span />
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeroSandbox() {
  const [nodes, setNodes]         = useState<SNode[]>(() =>
    SEED_NODES.map(n => ({ ...n, visible: false, isNew: false }))
  )
  const [edges, setEdges]         = useState<SEdge[]>([])
  const [msgs, setMsgs]           = useState<ChatLine[]>([])
  const [typing, setTyping]       = useState(false)
  const [chatVisible, setChatVisible] = useState(false)
  const [nudgeVisible, setNudgeVisible] = useState(false)

  const timers  = useRef<ReturnType<typeof setTimeout>[]>([])
  const loopRef = useRef<() => void>(() => undefined)
  const msgIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { vx, vw } = useMemo(() => sbViewBox(nodes), [nodes])

  // Auto-scroll chat to bottom
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, typing])

  const run = useCallback(() => {
    // Clear any pending timers
    timers.current.forEach(clearTimeout)
    timers.current = []

    const at = (delay: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, delay))
    }

    const msg = (role: 'user' | 'tutor', text: string): ChatLine =>
      ({ id: msgIdRef.current++, role, text })

    // ── Reset ────────────────────────────────────────────────────────────
    setNodes(SEED_NODES.map(n => ({ ...n, visible: false, isNew: false })))
    setEdges([])
    setMsgs([])
    setTyping(false)
    setChatVisible(false)
    setNudgeVisible(false)

    // ── Beat 0 — seed nodes stagger in (easeOutQuart, 100ms apart) ───────
    at( 350, () => setNodes(ns => ns.map((n, i) => i === 0 ? { ...n, visible: true } : n)))
    at( 450, () => setNodes(ns => ns.map((n, i) => i === 1 ? { ...n, visible: true } : n)))
    at( 550, () => setNodes(ns => ns.map((n, i) => i === 2 ? { ...n, visible: true } : n)))

    // Chat card slides up
    at( 950, () => setChatVisible(true))

    // ── Beat 1 — user asks ───────────────────────────────────────────────
    at(1500, () => {
      setMsgs([msg('user', "Tell me about Rosenblatt's Perceptron")])
      setTyping(true)
    })

    // ── Beat 2 — tutor replies, Dartmouth node injected ──────────────────
    at(3100, () => {
      setTyping(false)
      setMsgs(m => [...m, msg('tutor',
        "Rosenblatt's 1958 Perceptron was the first trainable neural network. It was born from the 1956 Dartmouth workshop — the gathering that coined the term 'artificial intelligence.'"
      )])
      setNodes(ns => [...ns, { ...INJECT_BEAT2, visible: true, isNew: true }])
    })
    at(3250, () =>
      setEdges([{ id: 'e1', from: 'dartmouth_workshop', to: 'perceptron', visible: true }])
    )

    // ── Beat 3 — user asks follow-up ─────────────────────────────────────
    at(5600, () => {
      setMsgs(m => [...m, msg('user', "What theorem proved it works?")])
      setTyping(true)
    })

    // ── Beat 4 — tutor replies, Convergence Theorem injected ─────────────
    at(7200, () => {
      setTyping(false)
      setMsgs(m => [...m, msg('tutor',
        "The 1962 Convergence Theorem proved the Perceptron always finds a solution if one exists — the first mathematical guarantee that a machine could learn."
      )])
      setNodes(ns => [...ns, { ...INJECT_BEAT4, visible: true, isNew: true }])
    })
    at(7350, () =>
      setEdges(es => [...es, { id: 'e2', from: 'perceptron', to: 'convergence_theorem', visible: true }])
    )

    // ── Beat 5 — nudge, then loop ─────────────────────────────────────────
    at( 9800, () => setNudgeVisible(true))
    at(13500, () => loopRef.current())
  }, [])

  // Keep the ref fresh so the recursive call always calls the latest run
  loopRef.current = run

  useEffect(() => {
    run()
    return () => timers.current.forEach(clearTimeout)
  }, [run])

  const visibleNodes = nodes.filter(n => n.visible)

  return (
    <div className="sandbox-card">
      {/* ── SVG canvas ── */}
      <div className="sandbox-svg-wrap">
        <svg
          className="sandbox-svg"
          viewBox={`${vx} 0 ${vw} ${SB_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ transition: 'viewBox 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }}
        >
          <defs>
            <marker id="sb-arrow" markerWidth="7" markerHeight="7"
              refX="5" refY="2.5" orient="auto"
            >
              <path d="M0 0 L0 5 L6 2.5 z" fill="var(--svg-arrow)" />
            </marker>
            <filter id="sb-shadow" x="-20%" y="-25%" width="140%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5"
                floodColor="rgba(26,35,50,0.14)" />
            </filter>
          </defs>

          {/* Lane baselines */}
          {[0.25, 0.52, 0.78].map(frac => (
            <line key={frac}
              x1={60} x2={SB_W - 60}
              y1={frac * SB_H} y2={frac * SB_H}
              stroke="var(--rule-soft)" strokeWidth="0.75" strokeDasharray="2 6"
            />
          ))}

          {/* Year ticks */}
          {SB_TICKS.map(yr => {
            const tx = 60 + ((yr - 1938) / (1976 - 1938)) * (SB_W - 120)
            return (
              <g key={yr}>
                <line x1={tx} x2={tx} y1={SB_H - 28} y2={SB_H - 18}
                  stroke="var(--rule)" strokeWidth="0.75" />
                <text x={tx} y={SB_H - 6}
                  textAnchor="middle" fontSize="9.5"
                  fill="var(--ink-faded)" fontFamily="'Inter', sans-serif"
                >
                  {yr}
                </text>
              </g>
            )
          })}

          {/* Edges (below nodes) */}
          {edges.map(e => (
            <AnimatedEdge key={e.id} edge={e} nodes={visibleNodes} />
          ))}

          {/* Nodes */}
          {visibleNodes.map(n => (
            <SandboxNode key={n.id} node={n} />
          ))}
        </svg>
      </div>

      {/* ── Floating chat card ── */}
      <div className={`sb-chat${chatVisible ? ' sb-chat--visible' : ''}`}>
        <div className="sb-chat-head">
          <span className="sb-chat-dot" />
          Knowledge Assistant
        </div>

        <div className="sb-chat-msgs" ref={scrollRef}>
          {msgs.map(m => (
            <div key={m.id} className={`sb-msg sb-msg--${m.role}`}>
              <div className="sb-msg-who">{m.role === 'user' ? 'You' : 'Tutor'}</div>
              <div className="sb-msg-text">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="sb-msg sb-msg--tutor">
              <div className="sb-msg-who">Tutor</div>
              <div className="sb-msg-text"><TypingDots /></div>
            </div>
          )}
        </div>

        <div className="sb-chat-foot">
          <Link href="/app" className="sb-cta">Open your notebook →</Link>
        </div>
      </div>

      {/* ── CTA nudge (Beat 5) ── */}
      <div className={`sb-nudge${nudgeVisible ? ' sb-nudge--visible' : ''}`}>
        <Link href="/app">Start your own timeline →</Link>
      </div>
    </div>
  )
}
