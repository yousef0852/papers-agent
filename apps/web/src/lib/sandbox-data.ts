/**
 * Shared constants and node definitions for the landing-page sandbox.
 * Imported by both HeroSandbox (client) and HeroSandboxSkeleton (server).
 * All functions are pure — no browser APIs — so SSR is safe.
 */
import type { Category } from './types'
import { CATEGORY_STYLES_LIGHT, hashId, jitter, rotationFor } from './data'

// ── Coordinate system ────────────────────────────────────────────────────────
// Deliberately smaller than the main app canvas so nodes are readable at demo scale.
export const SB_W         = 800
export const SB_H         = 420
export const SB_NODE_W    = 140
export const SB_NODE_H    = 58
export const SB_YEAR_MIN  = 1938
export const SB_YEAR_MAX  = 1976
export const SB_PAD       = 130   // horizontal padding around the node cluster in the viewBox
export const SB_MIN_VW    = 480   // minimum viewBox width to prevent over-zoom on one node

// Vertical lane fractions — more generous spacing than the main app so lanes don't crowd.
export const SB_LANE_Y: Record<Category, number> = {
  foundations:  0.25,   // y ≈ 105
  vision:       0.25,
  rl:           0.52,   // y ≈ 218
  architecture: 0.78,   // y ≈ 328
  language:     0.78,
  other:        0.78,
}

export const SANDBOX_CATEGORY_STYLES = CATEGORY_STYLES_LIGHT

// ── Node type ────────────────────────────────────────────────────────────────
export interface SNode {
  id:           string
  label:        string
  year:         number
  category:     Category
  x:            number
  y:            number
  rotation:     number
  visible:      boolean
  isNew:        boolean   // triggers elastic entrance animation
  staggerDelay: number    // ms delay for stagger on Beat 0
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export function sbX(year: number): number {
  const t = (year - SB_YEAR_MIN) / (SB_YEAR_MAX - SB_YEAR_MIN)
  return 60 + Math.max(0, Math.min(1, t)) * (SB_W - 120)
}

export function makeSNode(
  id: string, label: string, year: number, category: Category,
  staggerDelay = 0,
): SNode {
  const seed = hashId(id)
  const frac = SB_LANE_Y[category] ?? 0.5
  return {
    id, label, year, category,
    x: sbX(year),
    y: Math.max(55, Math.min(SB_H - 55, frac * SB_H + jitter(seed, 11))),
    rotation: rotationFor(seed + 3),
    visible: false,
    isNew: false,
    staggerDelay,
  }
}

export function sbViewBox(nodes: SNode[]): { vx: number; vw: number } {
  const vis = nodes.filter(n => n.visible)
  if (vis.length === 0) return { vx: 0, vw: SB_W }
  const xs   = vis.map(n => n.x)
  const left = Math.max(0, Math.min(...xs) - SB_NODE_W / 2 - SB_PAD)
  const right = Math.min(SB_W, Math.max(...xs) + SB_NODE_W / 2 + SB_PAD)
  const w    = Math.max(SB_MIN_VW, right - left)
  return { vx: Math.max(0, Math.min(SB_W - w, left)), vw: w }
}

// ── Node definitions ─────────────────────────────────────────────────────────
// Three seed nodes (Beat 0 stagger) — placed in three distinct lanes so they
// never overlap regardless of year spacing.
export const SEED_NODES: SNode[] = [
  makeSNode('mcculloch_pitts',    'McCulloch–Pitts',       1943, 'foundations',  0),
  makeSNode('turing_test',        'Turing Test',            1950, 'rl',         100),
  makeSNode('perceptron',         'Perceptron',             1958, 'foundations', 200),
]

// Injected nodes — start hidden, entrance is triggered by the script.
export const INJECT_BEAT2 = makeSNode('dartmouth_workshop',   'Dartmouth AI',      1956, 'architecture')
export const INJECT_BEAT4 = makeSNode('convergence_theorem',  'Convergence Thm.',  1962, 'rl')

// Year ticks visible in the 1938–1976 window
export const SB_TICKS = [1940, 1945, 1950, 1955, 1960, 1965, 1970, 1975]
