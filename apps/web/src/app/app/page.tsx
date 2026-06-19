'use client'

import { useState, useMemo, useEffect } from 'react'
import { Graph, Inspector } from '@/components/Graph'
import { ChatPanel } from '@/components/ChatPanel'
import { loadState, saveState, resetState, resetNotebookOnApi, setFocus, sendUserMessage } from '@/lib/store'
import { getCategoryStyles, REL_LABELS } from '@/lib/data'
import { API_BASE_URL } from '@/lib/config'
import { capture } from '@/lib/analytics'
import type { AppState } from '@/lib/types'

const THEME_KEY = 'ai-mind-theme'

function mapSeedToState(data: any): AppState {
  const nodes = (data.nodes ?? []).map((n: any) => ({
    ...n,
    parent_id: n.parent_id ?? undefined,
    rotation: n.rotation ?? 0,
    annotations: (n.annotations ?? []).map((a: any) =>
      typeof a === 'string' ? { text: a, ts: Date.now() } : a
    ),
  }))
  return {
    nodes,
    edges: data.edges ?? [],
    messages: (data.messages ?? []).map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
    focusId: null,
    newIds: [],
  };

  }

async function fetchSeedState(): Promise<AppState> {
  const res = await fetch(`${API_BASE_URL}/notebooks/seed`)
  if (!res.ok) throw new Error(`seed ${res.status}`)
  return mapSeedToState(await res.json())
}

export default function Home() {
  const [state, setState] = useState<AppState>({ nodes: [], edges: [], messages: [], focusId: null, newIds: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatFullscreen, setChatFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    capture('notebook_opened')
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      // Returning user: keep their accumulated notebook. Never overwrite it with the seed.
      const existing = loadState()
      if (existing.nodes.length > 0) {
        if (!cancelled) {
          setState(existing)
          setLoading(false)
        }
        return
      }
      // First visit: load the starter graph from the API.
      try {
        const next = await fetchSeedState()
        saveState(next)
        if (!cancelled) setState(next)
      } catch (err) {
        console.warn('API seed load failed, using localStorage:', err)
        if (!cancelled) setState(loadState())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'ai-mind-state-v7' && e.newValue) {
        try { setState(JSON.parse(e.newValue)) } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (showResetConfirm) {
        setShowResetConfirm(false)
        return
      }
      if (chatFullscreen) setChatFullscreen(false)
      else if (chatOpen) setChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showResetConfirm, chatOpen, chatFullscreen])

  const focused = state.focusId ? state.nodes.find((n) => n.id === state.focusId) ?? null : null
  const selectedNode = selectedId ? state.nodes.find((n) => n.id === selectedId) ?? null : null
  const inspectorNode = selectedNode || focused

  const relatedForInspector = useMemo(() => {
    if (!inspectorNode) return []
    const id = inspectorNode.id
    const out: { label: string }[] = []
    for (const e of state.edges) {
      if (e.from === id) {
        const n = state.nodes.find((x) => x.id === e.to)
        const rel = REL_LABELS[e.type]
        if (n && rel) out.push({ label: `${rel.en} → ${n.label}` })
      } else if (e.to === id) {
        const n = state.nodes.find((x) => x.id === e.from)
        const rel = REL_LABELS[e.type]
        if (n && rel) out.push({ label: `${n.label} ${rel.en} →` })
      }
    }
    return out
  }, [inspectorNode, state.edges, state.nodes])

  function handleSelect(id: string) {
    setSelectedId(id)
    setFocus(id)
  }

  function handleClearSelection() {
    setSelectedId(null)
    setFocus(null)
  }

  async function handleReset() {
    resetState()
    setSelectedId(null)
    setLoading(true)
    try {
      const data = await resetNotebookOnApi()
      const next = mapSeedToState(data)
      saveState(next)
      setState(next)
      capture('notebook_reset')
    } catch (err) {
      console.warn('Reset re-seed failed:', err)
      setState(loadState())
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    const s = loadState()
    const payload = {
      exportedAt: new Date().toISOString(),
      nodes: s.nodes,
      edges: s.edges,
      messages: s.messages,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-mind-notebook-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    capture('graph_exported', { nodes: s.nodes.length, edges: s.edges.length })
  }

  async function handleSendMessage(text: string) {
    const optimistic = loadState()
    optimistic.messages.push({ role: 'user', content: text })
    optimistic.pending = true
    saveState(optimistic)
    setState(optimistic)
    const turnCount = optimistic.messages.filter((m) => m.role === 'user').length
    capture('tutor_message_sent', { turn: turnCount, length: text.length })

    const next = await sendUserMessage(text)
    setState(next)
  }

  return (
    <div className="app graph-only">
      <header className="header">
        <div className="brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="14" cy="14" r="5" fill="#A67C52"/>
            <circle cx="6" cy="8" r="3" fill="#A67C52" opacity="0.7"/>
            <circle cx="22" cy="8" r="3.5" fill="#A67C52" opacity="0.85"/>
            <circle cx="5" cy="20" r="2.5" fill="#7A9B7F" opacity="0.8"/>
            <circle cx="22" cy="20" r="2" fill="#7A9B7F" opacity="0.7"/>
            <circle cx="14" cy="4" r="2" fill="#A67C52" opacity="0.5"/>
            <line x1="14" y1="14" x2="6" y2="8" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="22" y2="8" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="5" y2="20" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="22" y2="20" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="6" y1="8" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="0.75"/>
          </svg>
          <span className="brand-mark">AI Mind</span>
        </div>
        <div className="legend">
          {(['foundations', 'vision', 'language', 'rl', 'architecture'] as const).map((cat) => {
            const cs = getCategoryStyles(theme)[cat]
            return (
              <div key={cat} className="legend-item">
                <span className="legend-swatch" style={{ background: cs.fill, color: cs.stroke }} />
                <span>{cs.label}</span>
              </div>
            )
          })}
          <span className="legend-stat">
            {state.nodes.length} nodes · {state.edges.length} edges
          </span>
          <button className="header-btn ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? '☽ Dark' : '☼ Light'}
          </button>
          <button className="header-btn ghost" onClick={handleExport} title="Export notebook as JSON">Export</button>
          <button className="header-btn ghost" onClick={() => setShowResetConfirm(true)} title="Reset notebook">Reset</button>
        </div>
      </header>

      <div className="canvas-wrap">
        <Graph
          state={state}
          selectedId={selectedId}
          onSelectNode={handleSelect}
          onClearSelection={handleClearSelection}
          theme={theme}
        />
        <Inspector
          node={inspectorNode}
          related={relatedForInspector}
          onClose={handleClearSelection}
        />
        {loading && state.nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--ink-muted, #6b5d4f)',
              pointerEvents: 'none',
            }}
          >
            Opening your notebook…
          </div>
        )}
        <div className="folio">folio I · {new Date().getFullYear()}</div>
      </div>

      <button
        className={`chat-fab${chatOpen ? ' chat-fab--hidden' : ''}`}
        onClick={() => setChatOpen(true)}
        aria-label="Open AI Tutor"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l3-3h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        </svg>
        <span>Chat with Tutor</span>
      </button>

      <ChatPanel
        messages={state.messages}
        pending={state.pending}
        onSendMessage={handleSendMessage}
        open={chatOpen}
        fullscreen={chatFullscreen}
        onClose={() => { setChatOpen(false); setChatFullscreen(false) }}
        onToggleFullscreen={() => { setChatFullscreen(f => !f); if (!chatOpen) setChatOpen(true) }}
      />

      {showResetConfirm && (
        <div
          className="reset-modal-backdrop"
          onClick={() => setShowResetConfirm(false)}
          role="presentation"
        >
          <div
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reset-modal-title" id="reset-modal-title">Reset notebook?</div>
            <div className="reset-modal-body">
              All discussion and added nodes will be cleared on this device and the server.
              This cannot be undone.
            </div>
            <div className="reset-modal-actions">
              <button
                type="button"
                className="reset-modal-btn cancel"
                onClick={() => setShowResetConfirm(false)}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="reset-modal-btn confirm"
                onClick={() => {
                  setShowResetConfirm(false)
                  void handleReset()
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
