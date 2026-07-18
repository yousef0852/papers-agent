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

export function xFromYear(year: number): number {
  const left = 110
  const right = CANVAS_W - 110
  const t = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)
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

function separatePair(a: GraphNode, b: GraphNode, padX = 34, padY = 28): boolean {
  const sa = nodeSize(a)
  const sb = nodeSize(b)
  const halfW = (sa.w + sb.w) / 2 + padX
  const halfH = (sa.h + sb.h) / 2 + padY
  let dx = b.x - a.x
  let dy = b.y - a.y
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    const seed = hashId(a.id) ^ hashId(b.id)
    dx = jitter(seed, 1)
    dy = jitter(seed + 3, 1)
  }
  const overlapX = halfW - Math.abs(dx)
  const overlapY = halfH - Math.abs(dy)
  if (overlapX <= 0 || overlapY <= 0) return false

  // Prefer vertical separation always so the year axis stays chronological.
  // Same-year papers may nudge slightly horizontally only when almost stacked.
  const sameYear = a.year === b.year
  if (!sameYear || overlapY <= overlapX * 1.25) {
    const push = (overlapY / 2) * (dy >= 0 ? 1 : -1)
    a.y -= push
    b.y += push
  } else {
    const maxPush = pxPerYear() * 0.8
    const push = Math.min(overlapX / 2, maxPush) * (dx >= 0 ? 1 : -1)
    a.x -= push
    b.x += push
  }
  clampPaperNode(a)
  clampPaperNode(b)
  return true
}

/** Pixels between consecutive years on the timeline axis. */
function pxPerYear(): number {
  return (CANVAS_W - 220) / (YEAR_MAX - YEAR_MIN)
}

/**
 * Keep each paper near its year tick.
 * Cap drift to ~1.5 years so dense clusters can't visually jump a decade.
 */
function snapXToYear(papers: GraphNode[]): void {
  const maxDrift = Math.max(18, pxPerYear() * 1.5)
  for (const n of papers) {
    const anchor = xFromYear(n.year)
    n.x = Math.max(anchor - maxDrift, Math.min(anchor + maxDrift, n.x))
    clampPaperNode(n)
  }
}

function separateAll(papers: GraphNode[], iterations = 64): void {
  for (let pass = 0; pass < iterations; pass++) {
    let moved = false
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        if (separatePair(papers[i], papers[j])) moved = true
      }
    }
    if (!moved) break
  }
  snapXToYear(papers)
  // After snapping X, clear leftover overlaps with vertical-only pushes.
  for (let pass = 0; pass < 24; pass++) {
    let moved = false
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const a = papers[i]
        const b = papers[j]
        if (!nodesOverlap(a, b, 34, 28)) continue
        const dy = b.y - a.y || (hashId(a.id) > hashId(b.id) ? 1 : -1)
        const push = ((nodeSize(a).h + nodeSize(b).h) / 2 + 28 - Math.abs(b.y - a.y)) / 2
        if (push <= 0) continue
        a.y -= (dy >= 0 ? 1 : -1) * push
        b.y += (dy >= 0 ? 1 : -1) * push
        clampPaperNode(a)
        clampPaperNode(b)
        moved = true
      }
    }
    if (!moved) break
  }
  snapXToYear(papers)
}

/** Stack same-year papers vertically on the year tick — never sideways across decades. */
function spreadDenseYearGroups(papers: GraphNode[]): void {
  const byYear = new Map<number, GraphNode[]>()
  for (const n of papers) {
    if (!byYear.has(n.year)) byYear.set(n.year, [])
    byYear.get(n.year)!.push(n)
  }

  const rowH = NODE_H + 36
  const microX = Math.min(14, pxPerYear() * 0.6)

  for (const [year, group] of byYear) {
    if (group.length <= 1) continue
    group.sort((a, b) => a.id.localeCompare(b.id))
    const anchorX = xFromYear(year)

    group.forEach((n, i) => {
      const row = i
      // Tiny alternating x jitter only — keeps labels readable without breaking chronology.
      n.x = anchorX + (i % 2 === 0 ? -microX : microX)
      n.y = n.y + (row - (group.length - 1) / 2) * rowH
      clampPaperNode(n)
    })
  }
}

/** Full deterministic layout — ignores saved x/y so clusters never stack. */
export function layoutPaperNodes(nodes: GraphNode[]): GraphNode[] {
  const concepts = nodes.filter((n) => n.kind === 'concept')
  const papers = nodes
    .filter((n) => n.kind !== 'concept')
    .map((n) => ({ ...n, annotations: n.annotations || [] }))

  papers.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id))

  const placed: GraphNode[] = []
  for (const node of papers) {
    placed.push(positionNode(node, placed))
  }

  spreadDenseYearGroups(placed)
  separateAll(placed)
  return [...placed, ...concepts]
}

export function resolveNodeOverlaps(nodes: GraphNode[]): GraphNode[] {
  return layoutPaperNodes(nodes)
}

export function positionNode(node: GraphNode, existingNodes: GraphNode[]): GraphNode {
  if (node.kind === 'concept') {
    return { ...node, x: 0, y: 0, rotation: rotationFor(hashId(node.id) + 3) }
  }

  const size = nodeSize(node)
  const nearby = existingNodes.filter(
    (o) => o.kind !== 'concept' && Math.abs(o.year - node.year) <= 2,
  )
  const stackIndex = nearby.length
  const stackBand = Math.floor(stackIndex / 4)
  const stackSlot = stackIndex % 4
  const stackOffsets = [-120, -44, 44, 120]
  // Keep base X on the year tick; only tiny jitter (±~1 year).
  const yearPx = pxPerYear()
  const baseX = xFromYear(node.year) + jitter(hashId(node.id), yearPx * 0.4)
  const laneY = (LANE_FRACS[node.category as Category] ?? 0.5) * CANVAS_H
  const baseY = laneY + stackOffsets[stackSlot] + stackBand * (stackSlot % 2 === 0 ? 62 : -62)

  // Prefer vertical offsets so papers stay near their year on the x-axis.
  const maxDx = yearPx * 1.2
  const candidates: [number, number][] = [[0, 0]]
  for (let ring = 1; ring <= 14; ring++) {
    const rY = ring * 68
    candidates.push([0, -rY], [0, rY])
    for (let step = 1; step <= Math.min(ring, 2); step++) {
      const dx = Math.min(step * 10, maxDx)
      candidates.push(
        [dx, -rY], [-dx, -rY], [dx, rY], [-dx, rY],
        [dx, -rY / 2], [-dx, rY / 2],
      )
    }
  }

  let chosenX = baseX
  let chosenY = baseY

  for (const [dx, dy] of candidates) {
    const tx = baseX + dx
    const ty = baseY + dy
    let collide = false
    for (const other of existingNodes) {
      if (other.id === node.id) continue
      if (other.kind === 'concept') continue
      const os = nodeSize(other)
      if (rectsOverlap(tx, ty, size.w, size.h, other.x, other.y, os.w, os.h, 30, 26)) {
        collide = true
        break
      }
    }
    if (!collide) {
      chosenX = tx
      chosenY = ty
      break
    }
  }

  const placed: GraphNode = {
    ...node,
    x: chosenX,
    y: chosenY,
    rotation: 0,
  }
  clampPaperNode(placed)
  return placed
}
