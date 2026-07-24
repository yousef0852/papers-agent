import type { GraphNode, Category, CategoryStylesMap, RelationLabelsMap, LaneFractions } from './types'

export const CANVAS_W = 1600
export const CANVAS_H = 720
export const NODE_W = 148
export const NODE_H = 60
export const NODE_LABEL_FONT = 12
export const NODE_LINE_HEIGHT = 14
export const YEAR_MIN = 1940
export const YEAR_MAX = 2026

export const STORAGE_KEY = 'ai-mind-state-v7'
export const CHANNEL_NAME = 'ai-mind-channel'

export const CATEGORY_STYLES_LIGHT: CategoryStylesMap = {
  foundations:  { fill: '#EDE5D0', stroke: '#A67C52', text: '#1A2332', label: 'Foundations' },
  vision:       { fill: '#D8E6D8', stroke: '#7A9B7F', text: '#1A2332', label: 'Vision' },
  language:     { fill: '#EAD8CC', stroke: '#C47A52', text: '#1A2332', label: 'Language' },
  rl:           { fill: '#D0D8E8', stroke: '#5A7AAA', text: '#1A2332', label: 'Reinforcement' },
  architecture: { fill: '#E8E0CC', stroke: '#A68C42', text: '#1A2332', label: 'Architecture' },
  other:        { fill: '#E2DCDA', stroke: '#8B8680', text: '#1A2332', label: 'Other' },
}

export const CATEGORY_STYLES_DARK: CategoryStylesMap = {
  foundations:  { fill: '#2A2418', stroke: '#D4956B', text: '#E8E6E1', label: 'Foundations' },
  vision:       { fill: '#1E2E20', stroke: '#7A9B7F', text: '#E8E6E1', label: 'Vision' },
  language:     { fill: '#2E2018', stroke: '#D4956B', text: '#E8E6E1', label: 'Language' },
  rl:           { fill: '#1A2030', stroke: '#7A9BAA', text: '#E8E6E1', label: 'Reinforcement' },
  architecture: { fill: '#2A2418', stroke: '#C8A852', text: '#E8E6E1', label: 'Architecture' },
  other:        { fill: '#252020', stroke: '#8B8680', text: '#E8E6E1', label: 'Other' },
}

export function getCategoryStyles(theme: 'light' | 'dark'): CategoryStylesMap {
  return theme === 'dark' ? CATEGORY_STYLES_DARK : CATEGORY_STYLES_LIGHT
}

export const LANE_FRACS: LaneFractions = {
  vision: 0.20,
  rl: 0.36,
  foundations: 0.52,
  architecture: 0.64,
  language: 0.80,
  other: 0.90,
}

export const REL_LABELS: RelationLabelsMap = {
  extends:     { en: 'extends',      dash: '' },
  enables:     { en: 'enables',      dash: '' },
  precedes:    { en: 'precedes',     dash: '' },
  applies:     { en: 'applies to',   dash: '4 3' },
  uses:        { en: 'uses',         dash: '4 3' },
  inspired_by: { en: 'inspired by',  dash: '2 4' },
  critiques:   { en: 'critiques',    dash: '6 3' },
}

/** Curated key points for seed papers (from design prototype). */
export const SEED_KEY_POINTS: Record<string, string[]> = {
  mp_neuron: [
    'Modeled a neuron as a binary threshold logic unit.',
    'Proved networks of them can compute any logical function.',
    'Purely theoretical — weights were fixed by hand, no learning yet.',
  ],
  perceptron: [
    'Added a learning rule that tunes weights from labeled examples.',
    'First model proven to converge on linearly-separable data.',
    "Minsky & Papert (1969) showed it can't solve XOR, cooling the field.",
  ],
  backprop: [
    'Computes gradients through many layers via the chain rule.',
    'Made training multi-layer networks practical for the first time.',
    'Still the core of how nearly every modern network learns.',
  ],
  cnn: [
    'Weight-sharing convolutions exploit the 2D structure of images.',
    'Far fewer parameters than a fully-connected net of the same reach.',
    'Powered early commercial digit recognition (cheques, ZIP codes).',
  ],
  lstm: [
    'Gated memory cells retain information across long sequences.',
    'Directly tackled the vanishing-gradient problem in RNNs.',
    'Dominated speech and translation until Transformers arrived.',
  ],
  transformer: [
    'Replaced recurrence with pure self-attention — fully parallel.',
    'Scales with data and compute better than any prior architecture.',
    'The foundation of GPT, BERT, and essentially every modern LLM.',
  ],
  word2vec: [
    'Learns dense word vectors where geometry encodes meaning.',
    'Famous for analogies: king − man + woman ≈ queen.',
    'Made transfer of semantic knowledge cheap and ubiquitous.',
  ],
  attention: [
    'Lets the decoder focus on the relevant source words dynamically.',
    'Removed the fixed-length bottleneck of seq2seq encoders.',
    'The conceptual seed the Transformer pushed to its limit.',
  ],
  seq2seq: [
    'Encoder compresses the input; decoder generates the output.',
    'Framed machine translation as end-to-end neural learning.',
    'Exposed the bottleneck that attention was invented to fix.',
  ],
  bert_gpt: [
    'Pretrain on raw text at scale, then fine-tune per task.',
    'BERT reads bidirectionally; GPT generates left-to-right.',
    'Kicked off the era of general-purpose foundation models.',
  ],
}

export function enrichNodesWithKeyPoints(nodes: GraphNode[]): GraphNode[] {
  return nodes.map((n) => {
    if (n.keyPoints?.length) return n
    const seed = SEED_KEY_POINTS[n.id]
    return seed ? { ...n, keyPoints: seed } : n
  })
}

export function jitter(seed: number, range: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 43758.5453
  return ((x - Math.floor(x)) * 2 - 1) * range
}

export function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

// The x-axis fits the notebook's actual year span instead of a fixed 1940–2026
// window, so a cluster of recent papers uses the full canvas width rather than
// being crammed into the right edge. layoutPaperNodes recomputes this from the
// current papers; xFromYear and the Graph axis ticks both read it, so nodes and
// tick labels stay aligned.
let axisLo = YEAR_MIN
let axisHi = YEAR_MAX

const MIN_AXIS_SPAN = 12

/** Padded [lo, hi] year window that fits these papers. Pure — no side effects. */
export function yearRangeOf(nodes: GraphNode[]): { lo: number; hi: number } {
  const years = nodes
    .filter((n) => n.kind !== 'concept' && Number.isFinite(n.year))
    .map((n) => n.year)
  if (years.length === 0) return { lo: YEAR_MIN, hi: YEAR_MAX }
  let lo = Math.min(...years)
  let hi = Math.max(...years)
  if (hi - lo < MIN_AXIS_SPAN) {
    const grow = Math.ceil((MIN_AXIS_SPAN - (hi - lo)) / 2)
    lo -= grow
    hi += grow
  }
  const pad = Math.max(2, Math.round((hi - lo) * 0.08))
  return { lo: lo - pad, hi: hi + pad }
}

export function getAxisRange(): { lo: number; hi: number } {
  return { lo: axisLo, hi: axisHi }
}

export function xFromYear(year: number): number {
  const left = 110
  const right = CANVAS_W - 110
  const span = axisHi - axisLo || 1
  const t = (year - axisLo) / span
  return left + Math.max(0, Math.min(1, t)) * (right - left)
}

export function yFromCategory(category: Category, seed: number): number {
  const frac = LANE_FRACS[category] ?? 0.5
  return frac * CANVAS_H + jitter(seed, 22)
}

export function rotationFor(seed: number): number {
  return jitter(seed + 7, 1.4)
}

export function wrapNodeLabel(label: string, maxChars = 16, maxLines = 2): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
      continue
    }
    if (current) lines.push(current)
    if (lines.length >= maxLines - 1) {
      const rest = [word, ...words.slice(words.indexOf(word) + 1)].join(' ')
      lines.push(rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest)
      return lines.slice(0, maxLines)
    }
    current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word
  }
  if (current) lines.push(current)
  return lines.slice(0, maxLines)
}

export function measurePaperNode(label: string): { w: number; h: number; lines: string[] } {
  const lines = wrapNodeLabel(label, 15, 2)
  const h = lines.length > 1 ? NODE_H + 12 : NODE_H
  return { w: NODE_W, h, lines }
}

export const CONCEPT_W = 86
export const CONCEPT_H = 28

export function measureConceptNode(label: string): { w: number; h: number; text: string } {
  const maxChars = 14
  const text = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label
  const w = Math.max(CONCEPT_W, Math.min(120, text.length * 6.5 + 20))
  return { w, h: CONCEPT_H, text }
}

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  padX: number, padY: number,
): boolean {
  return Math.abs(ax - bx) < (aw + bw) / 2 + padX
    && Math.abs(ay - by) < (ah + bh) / 2 + padY
}

function nodeSize(node: GraphNode): { w: number; h: number } {
  if (node.kind === 'concept') {
    const m = measureConceptNode(node.label)
    return { w: m.w, h: m.h }
  }
  const m = measurePaperNode(node.label)
  return { w: m.w, h: m.h }
}

export function nodesOverlap(a: GraphNode, b: GraphNode, padX = 16, padY = 14): boolean {
  if (a.kind === 'concept' || b.kind === 'concept') return false
  const sa = nodeSize(a)
  const sb = nodeSize(b)
  return rectsOverlap(a.x, a.y, sa.w, sa.h, b.x, b.y, sb.w, sb.h, padX, padY)
}

function clampPaperNode(node: GraphNode): void {
  const size = nodeSize(node)
  node.x = Math.max(80 + size.w / 2, Math.min(CANVAS_W - 80 - size.w / 2, node.x))
  node.y = Math.max(100 + size.h / 2, Math.min(CANVAS_H - 100 - size.h / 2, node.y))
}

/** Minimum horizontal gap between two papers on the same lane. */
const LANE_PAD_X = 26

function laneOf(node: GraphNode): Category {
  return (LANE_FRACS[node.category as Category] != null ? node.category : 'other') as Category
}

/**
 * Declutter one lane in place. Every paper stays on the lane line; collisions
 * resolve purely horizontally (lanes are too close together to stack rows
 * without bleeding into a neighbour). Order is preserved.
 *
 * 1. Push right so no two papers overlap.
 * 2. If the run overflows the right edge, pull it back from the edge leftward.
 * 3. If it still won't fit (lane physically over-full), distribute evenly.
 */
function declutterLane(lane: GraphNode[]): void {
  const n = lane.length
  if (n === 0) return
  const half = (i: number) => nodeSize(lane[i]).w / 2
  const cMin = (i: number) => 80 + half(i)
  const cMax = (i: number) => CANVAS_W - 80 - half(i)

  for (let i = 1; i < n; i++) {
    const minX = lane[i - 1].x + half(i - 1) + half(i) + LANE_PAD_X
    if (lane[i].x < minX) lane[i].x = minX
  }

  lane[n - 1].x = Math.min(lane[n - 1].x, cMax(n - 1))
  for (let i = n - 2; i >= 0; i--) {
    const maxX = lane[i + 1].x - half(i) - half(i + 1) - LANE_PAD_X
    if (lane[i].x > maxX) lane[i].x = maxX
  }

  if (lane[0].x < cMin(0)) {
    const lo = cMin(0)
    const hi = cMax(n - 1)
    const step = (hi - lo) / Math.max(1, n - 1)
    for (let i = 0; i < n; i++) lane[i].x = lo + i * step
  }
}

/**
 * Deterministic lane-respecting layout.
 *
 * The x-axis is first fitted to the papers' year span. Each paper then sits on
 * its category lane at its year tick; same-lane collisions are resolved
 * horizontally by declutterLane. Placement is a pure function of the node set —
 * no physics, no competing passes, no cross-lane bleed.
 */
export function layoutPaperNodes(nodes: GraphNode[]): GraphNode[] {
  const concepts = nodes.filter((n) => n.kind === 'concept')
  const papers = nodes
    .filter((n) => n.kind !== 'concept')
    .map((n) => ({ ...n, annotations: n.annotations || [], rotation: 0 }))

  const range = yearRangeOf(papers)
  axisLo = range.lo
  axisHi = range.hi

  const byLane = new Map<Category, GraphNode[]>()
  for (const n of papers) {
    const cat = laneOf(n)
    const arr = byLane.get(cat)
    if (arr) arr.push(n)
    else byLane.set(cat, [n])
  }

  for (const [cat, group] of byLane) {
    group.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id))
    const laneY = (LANE_FRACS[cat] ?? 0.5) * CANVAS_H
    for (const node of group) {
      node.x = xFromYear(node.year)
      node.y = laneY
    }
    declutterLane(group)
    for (const node of group) clampPaperNode(node)
  }

  return [...papers, ...concepts]
}

export function resolveNodeOverlaps(nodes: GraphNode[]): GraphNode[] {
  return layoutPaperNodes(nodes)
}

/**
 * Single-node placement for optimistic inserts. layoutPaperNodes re-runs
 * immediately afterwards, so this only needs a sane on-lane starting point.
 */
export function positionNode(node: GraphNode, _existingNodes: GraphNode[]): GraphNode {
  if (node.kind === 'concept') {
    return { ...node, x: 0, y: 0, rotation: rotationFor(hashId(node.id) + 3) }
  }
  const laneY = (LANE_FRACS[laneOf(node)] ?? 0.5) * CANVAS_H
  const placed: GraphNode = { ...node, x: xFromYear(node.year), y: laneY, rotation: 0 }
  clampPaperNode(placed)
  return placed
}
