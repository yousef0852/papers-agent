'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { SANDBOX_CATEGORY_STYLES, SEED_NODES, INJECT_BEAT2, INJECT_BEAT4,
  SB_W, SB_H, SB_NODE_W, SB_NODE_H, SB_TICKS, sbViewBox, type SNode,
} from '@/lib/sandbox-data'
import { useLocale } from '@/lib/i18n'
import { ArrowIcon } from '@/components/ArrowIcon'

// ── Types ────────────────────────────────────────────────────────────────────
interface SEdge { id: string; from: string; to: string; visible: boolean }
interface ChatLine { id: number; role: 'user' | 'tutor'; text: string }

// ── Edge path ────────────────────────────────────────────────────────────────
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
      <g className={cls} style={{ animationDelay: delay }}>
        <rect
          x={-SB_NODE_W / 2} y={-SB_NODE_H / 2}
          width={SB_NODE_W} height={SB_NODE_H}
          rx="5" fill={cs.fill} stroke={cs.stroke}
          strokeWidth="1.25" filter="url(#sb-shadow)"
        />
        <text x="0" y="-6" textAnchor="middle" fontSize="11" fontWeight="600"
          fill={cs.stroke} fontFamily="'Inter', sans-serif">{node.label}</text>
        <text x="0" y="11" textAnchor="middle" fontSize="10"
          fill="var(--ink-muted)" fontFamily="'Inter', sans-serif">{node.year}</text>
      </g>
    </g>
  )
}

// ── TypingDots ────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="sb-thinking" aria-label="Tutor is thinking">
      <span /><span /><span />
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeroSandbox() {
  const { t, isRTL } = useLocale()
  const fwd = isRTL ? 'left' : 'right'

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

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, typing])

  const run = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    const at = (delay: number, fn: () => void) => {
      timers.current.push(setTimeout(fn, delay))
    }
    const msg = (role: 'user' | 'tutor', text: string): ChatLine =>
      ({ id: msgIdRef.current++, role, text })

    setNodes(SEED_NODES.map(n => ({ ...n, visible: false, isNew: false })))
    setEdges([])
    setMsgs([])
    setTyping(false)
    setChatVisible(false)
    setNudgeVisible(false)

    at( 350, () => setNodes(ns => ns.map((n, i) => i === 0 ? { ...n, visible: true } : n)))
    at( 450, () => setNodes(ns => ns.map((n, i) => i === 1 ? { ...n, visible: true } : n)))
    at( 550, () => setNodes(ns => ns.map((n, i) => i === 2 ? { ...n, visible: true } : n)))
    at( 950, () => setChatVisible(true))

    at(1500, () => {
      setMsgs([msg('user', t.sandbox_beat1_user)])
      setTyping(true)
    })

    at(3100, () => {
      setTyping(false)
      setMsgs(m => [...m, msg('tutor', t.sandbox_beat2_tutor)])
      setNodes(ns => [...ns, { ...INJECT_BEAT2, visible: true, isNew: true }])
    })
    at(3250, () =>
      setEdges([{ id: 'e1', from: 'dartmouth_workshop', to: 'perceptron', visible: true }])
    )

    at(5600, () => {
      setMsgs(m => [...m, msg('user', t.sandbox_beat3_user)])
      setTyping(true)
    })

    at(7200, () => {
      setTyping(false)
      setMsgs(m => [...m, msg('tutor', t.sandbox_beat4_tutor)])
      setNodes(ns => [...ns, { ...INJECT_BEAT4, visible: true, isNew: true }])
    })
    at(7350, () =>
      setEdges(es => [...es, { id: 'e2', from: 'perceptron', to: 'convergence_theorem', visible: true }])
    )

    at( 9800, () => setNudgeVisible(true))
    at(13500, () => loopRef.current())
  }, [t])

  loopRef.current = run

  useEffect(() => {
    run()
    return () => timers.current.forEach(clearTimeout)
  }, [run])

  const visibleNodes = nodes.filter(n => n.visible)

  return (
    <div className="sandbox-card">
      {/* ── SVG canvas — always LTR ── */}
      <div className="sandbox-svg-wrap" dir="ltr">
        <svg
          className="sandbox-svg"
          viewBox={`${vx} 0 ${vw} ${SB_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ transition: 'viewBox 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }}
        >
          <defs>
            <marker id="sb-arrow" markerWidth="7" markerHeight="7"
              refX="5" refY="2.5" orient="auto">
              <path d="M0 0 L0 5 L6 2.5 z" fill="var(--svg-arrow)" />
            </marker>
            <filter id="sb-shadow" x="-20%" y="-25%" width="140%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(26,35,50,0.14)" />
            </filter>
          </defs>

          {[0.25, 0.52, 0.78].map(frac => (
            <line key={frac}
              x1={60} x2={SB_W - 60}
              y1={frac * SB_H} y2={frac * SB_H}
              stroke="var(--rule-soft)" strokeWidth="0.75" strokeDasharray="2 6"
            />
          ))}

          {SB_TICKS.map(yr => {
            const tx = 60 + ((yr - 1938) / (1976 - 1938)) * (SB_W - 120)
            return (
              <g key={yr}>
                <line x1={tx} x2={tx} y1={SB_H - 28} y2={SB_H - 18}
                  stroke="var(--rule)" strokeWidth="0.75" />
                <text x={tx} y={SB_H - 6} textAnchor="middle" fontSize="9.5"
                  fill="var(--ink-faded)" fontFamily="'Inter', sans-serif">{yr}</text>
              </g>
            )
          })}

          {edges.map(e => (
            <AnimatedEdge key={e.id} edge={e} nodes={visibleNodes} />
          ))}

          {visibleNodes.map(n => (
            <SandboxNode key={n.id} node={n} />
          ))}
        </svg>
      </div>

      {/* ── Floating chat card ── */}
      <div className={`sb-chat${chatVisible ? ' sb-chat--visible' : ''}`}>
        <div className="sb-chat-head">
          <span className="sb-chat-dot" />
          {t.sandbox_chat_head}
        </div>

        <div className="sb-chat-msgs" ref={scrollRef}>
          {msgs.map(m => (
            <div key={m.id} className={`sb-msg sb-msg--${m.role}`}>
              <div className="sb-msg-who">{m.role === 'user' ? t.sandbox_user_label : t.sandbox_tutor_label}</div>
              <div className="sb-msg-text">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="sb-msg sb-msg--tutor">
              <div className="sb-msg-who">{t.sandbox_tutor_label}</div>
              <div className="sb-msg-text"><TypingDots /></div>
            </div>
          )}
        </div>

        <div className="sb-chat-foot">
          <Link href="/app" className="sb-cta arrow-link">
            {t.sandbox_cta}
            <ArrowIcon direction={fwd} />
          </Link>
        </div>
      </div>

      {/* ── CTA nudge ── */}
      <div className={`sb-nudge${nudgeVisible ? ' sb-nudge--visible' : ''}`}>
        <Link href="/app" className="arrow-link">
          {t.sandbox_nudge}
          <ArrowIcon direction={fwd} />
        </Link>
      </div>
    </div>
  )
}
