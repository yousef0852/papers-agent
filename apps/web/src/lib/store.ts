import type { AppState, ChatMessage } from './types'
import { STORAGE_KEY, CATEGORY_STYLES_LIGHT, REL_LABELS, positionNode, resolveNodeOverlaps } from './data'
import { API_BASE_URL } from './config'
import { capture } from './analytics'

const NOTEBOOK_ID = 'seed'

/** Bumped on reset so in-flight PUTs from chat cannot overwrite a cleared notebook. */
let notebookSyncGeneration = 0

export function cancelPendingNotebookSync() {
  notebookSyncGeneration += 1
}

interface TutorResponse {
  reply?: string
  focus?: string | null
  new_nodes?: Array<{
    id: string
    kind: string
    parent_id?: string
    label: string
    year: number
    category: string
    summary: string
  }>
  new_edges?: Array<{
    from: string
    to: string
    type: string
  }>
  annotations?: Array<{
    node_id: string
    text: string
  }>
}

export function createInitialState(): AppState {
  return {
    nodes: [],
    edges: [],
    messages: [],
    focusId: null,
    newIds: [],
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    if (!parsed.nodes || !parsed.messages) return createInitialState()
    const positioned: any[] = []
    for (const n of parsed.nodes) {
      const missing = n.kind !== 'concept' && (n.x == null || n.y == null || !Number.isFinite(n.x))
      const node = { ...n, annotations: n.annotations || [] }
      positioned.push(missing ? positionNode(node, positioned) : node)
    }
    parsed.nodes = positioned
    parsed.nodes = resolveNodeOverlaps(parsed.nodes)
    parsed.newIds = []
    return parsed as AppState
  } catch {
    return createInitialState()
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function resetState(): AppState {
  const s = createInitialState()
  saveState(s)
  return s
}

function parseTutorResponse(raw: unknown): TutorResponse {
  if (!raw) throw new Error('empty')
  let txt = String(raw).trim()
  txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  try { return JSON.parse(txt) } catch {}
  const m = txt.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) } catch {}
  }
  throw new Error('parse failed')
}

function buildTutorSystemPrompt(state: AppState): string {
  const nodeSummary = state.nodes
    .map((n) => `${n.id}=${n.label}(${n.year})`)
    .join('; ')
  const validCategories = Object.keys(CATEGORY_STYLES_LIGHT).join('|')
  const validRelTypes = Object.keys(REL_LABELS).join('|')

  return `You are a scholarly tutor on the history of artificial intelligence, writing inside a personal knowledge-graph notebook. Respond ONLY with a valid JSON object (no markdown fences, no preamble, no text outside the JSON). Shape:
  {
    "reply": "Your teaching answer to the user, as plain text inside this JSON string.",
    "focus": "id_of_node_the_conversation_is_about_or_null",
    "new_nodes": [ { "id": "snake_case", "kind": "paper|concept", "parent_id": "id_of_paper_if_kind_is_concept_else_null", "label": "Short name", "year": INT, "category": "${validCategories}", "summary": "One sentence in English." } ],
    "new_edges": [ { "from": "id", "to": "id", "type": "${validRelTypes}" } ],
    "annotations": [ { "node_id": "existing_or_new_id", "text": "3-7 word marginal note pulled from the conversation" } ]
  }

  REPLY rules — important:
  - Reply in the same language the user wrote in.
  - Match the depth the user asks for:
    - Brief question → 2-4 short sentences.
    - "Explain", "in detail", "simple words", or a word-count request → a thorough explanation (up to ~500 words if they asked for it).
    - Use clear structure: short paragraphs, examples, and plain language when they ask for simplicity.
  - Put the FULL teaching answer in "reply". Do NOT save the long explanation only in annotations.
  - Use \\n for paragraph breaks inside the reply string. Escape any double quotes as \\".
  - Scholarly but warm tone. Historically accurate.

  Node KIND rules — important:
  - kind="paper" for a landmark paper, model, breakthrough, or person (AlexNet, GAN, AlphaGo, Hinton). These render as full-size boxes on the timeline.
  - kind="concept" for a sub-idea that belongs INSIDE a paper (self-attention is a concept of Transformer, ReLU is a concept of AlexNet, dropout is a concept of AlexNet, convolution is a concept of CNN). Concepts MUST have parent_id pointing to the paper they belong to. They render as small chips that appear when the parent is selected.
  - If the user asks about a sub-mechanism ("what is multi-head attention?"), add it as kind="concept" with parent_id of the relevant paper, not as a top-level paper.
  - prefix concept IDs with "c_" for clarity (c_dropout, c_relu, c_self_attn).
  - If unsure, default to kind="paper".

  Existing node IDs (reuse these; never recreate): ${nodeSummary}.

  Rules:
  - "focus": pick the single node the user is asking about right now (existing ID, or an ID you are creating in new_nodes).
  - "annotations" are SHORT marginal notes (3-7 words each) — key phrases from the discussion for the graph margin, not a substitute for the reply.
  - Annotations may attach to existing nodes OR to new_nodes you are creating in the same turn.
  - If the user asks about a concept already present, return new_nodes=[] but still add annotations capturing the discussion.
  - Historically accurate years. snake_case IDs only. No duplicates.
  - Edges should genuinely follow from the discussion — don't invent spurious relationships.
  - Output must be valid JSON only. If the reply is long, keep it inside the "reply" field as one JSON string.`
}

async function callTutor(state: AppState, _userText: string): Promise<TutorResponse> {
  // state.messages already contains the current user message (pushed by the
  // optimistic update before sendUserMessage was called). Build history directly
  // from it — no extra push needed.
  const history = state.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))

  const sys = buildTutorSystemPrompt(state)

  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: sys, messages: history }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return parseTutorResponse(data.content)
}

export function applyTutorResult(state: AppState, data: TutorResponse): AppState {
  const reply = (data && data.reply) ? String(data.reply) : '—'
  const incomingNodes = Array.isArray(data?.new_nodes) ? data.new_nodes : []
  const incomingEdges = Array.isArray(data?.new_edges) ? data.new_edges : []
  const incomingAnnots = Array.isArray(data?.annotations) ? data.annotations : []
  const focusId = (data && data.focus) ? String(data.focus) : null

  const next: AppState = {
    ...state,
    nodes: state.nodes.slice(),
    edges: state.edges.slice(),
    messages: state.messages.slice(),
    newIds: [],
  }

  const existingIds = new Set(next.nodes.map((n) => n.id))
  const accepted: string[] = []

  for (const cand of incomingNodes) {
    if (!cand || !cand.id || existingIds.has(cand.id)) continue
    const node: any = { ...cand, annotations: [] }
    if (typeof node.category !== 'string' || !CATEGORY_STYLES_LIGHT[node.category as keyof typeof CATEGORY_STYLES_LIGHT]) node.category = 'other'
    if (typeof node.year !== 'number') node.year = 2020
    if (node.kind !== 'concept' && node.kind !== 'paper') node.kind = 'paper'
    if (node.kind === 'concept') {
      if (!node.parent_id || (!existingIds.has(node.parent_id) && !incomingNodes.some((x: any) => x?.id === node.parent_id && x.kind !== 'concept'))) {
        node.kind = 'paper'
        node.parent_id = null
      }
    } else {
      node.parent_id = null
    }
    const positioned = positionNode(node, next.nodes)
    next.nodes.push(positioned)
    accepted.push(positioned.id)
    existingIds.add(node.id)
  }

  if (incomingAnnots.length) {
    const annotsById: Record<string, string[]> = {}
    for (const a of incomingAnnots) {
      if (!a || !a.node_id || !a.text) continue
      ;(annotsById[a.node_id] ||= []).push(String(a.text).trim())
    }
    next.nodes = next.nodes.map((n) => {
      const add = annotsById[n.id]
      if (!add || add.length === 0) return n
      const existing = (n.annotations || []).map((x) => x.text.toLowerCase())
      const fresh = add
        .filter((t) => !existing.includes(t.toLowerCase()))
        .map((t) => ({ text: t, ts: Date.now() }))
      if (fresh.length === 0) return n
      return { ...n, annotations: [...(n.annotations || []), ...fresh].slice(-8) }
    })
  }

  const known = new Set(next.edges.map((e) => `${e.from}->${e.to}->${e.type}`))
  const allNodeIds = new Set(next.nodes.map((n) => n.id))
  for (const e of incomingEdges) {
    if (!e || !e.from || !e.to) continue
    if (!REL_LABELS[e.type as keyof typeof REL_LABELS]) e.type = 'extends'
    const key = `${e.from}->${e.to}->${e.type}`
    if (known.has(key)) continue
    if (!allNodeIds.has(e.from) || !allNodeIds.has(e.to)) continue
    known.add(key)
    next.edges.push({ from: e.from, to: e.to, type: e.type } as any)
  }

  next.messages.push({
    role: 'assistant',
    content: reply,
    addedNodes: accepted.length,
    addedAnnots: incomingAnnots.length,
  })
  next.newIds = accepted
  if (focusId && allNodeIds.has(focusId)) next.focusId = focusId
  else if (accepted.length) next.focusId = accepted[0]

  if (accepted.length) next.nodes = resolveNodeOverlaps(next.nodes)

  return next
}

function stateToApiPayload(state: AppState) {
  return {
    nodes: state.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      parent_id: n.parent_id || null,
      label: n.label,
      year: n.year,
      category: n.category,
      summary: n.summary,
      x: n.x,
      y: n.y,
      annotations: (n.annotations || []).map((ann) =>
        typeof ann === 'string' ? ann : ann.text
      ),
    })),
    edges: state.edges.map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type,
    })),
    messages: state.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
  };
}

export async function persistNotebookToApi(state: AppState) {
  const generation = notebookSyncGeneration
  const payload = stateToApiPayload(state)
  const res = await fetch(`${API_BASE_URL}/notebooks/${NOTEBOOK_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (generation !== notebookSyncGeneration) return
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export async function resetNotebookOnApi(): Promise<unknown> {
  cancelPendingNotebookSync()
  const res = await fetch(`${API_BASE_URL}/notebooks/${NOTEBOOK_ID}/reset`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`reset ${res.status}`)
  return res.json()
}

function wasResetDuring(generationAtStart: number): boolean {
  return generationAtStart !== notebookSyncGeneration
}

export async function sendUserMessage(text: string): Promise<AppState> {
  // The optimistic update in handleSendMessage (page.tsx) has already pushed the
  // user message and saved it to localStorage before this function is called.
  // Loading state here gives us the version that already contains the user message.
  const generationAtStart = notebookSyncGeneration
  const state = loadState()
  state.pending = true
  saveState(state)

  try {
    const data = await callTutor(state, text)
    if (wasResetDuring(generationAtStart)) return loadState()
    const next = applyTutorResult(state, data)
    next.pending = false
    if (wasResetDuring(generationAtStart)) return loadState()
    saveState(next)
    persistNotebookToApi(next).catch((err) => console.warn('Notebook sync failed:', err))
    if (next.newIds.length) capture('node_added', { count: next.newIds.length })
    return next
  } catch (err) {
    if (wasResetDuring(generationAtStart)) return loadState()
    console.error(err)
    const s = loadState()
    s.messages.push({ role: 'assistant', content: '⚠️ Couldn\'t process the reply. Please try again.' })
    s.pending = false
    saveState(s)
    return s
  }
}

export function setFocus(id: string | null) {
  const s = loadState()
  s.focusId = id
  saveState(s)
}
