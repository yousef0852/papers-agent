/** Minimal long-tail arrow, used wherever a link/button needs directional
 * affordance — replaces plain "←"/"→"/"↓" glyphs, which read as cheap. */
export function ArrowIcon({ direction }: { direction: 'left' | 'right' | 'down' }) {
  if (direction === 'down') {
    return (
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true" className="arrow-icon arrow-icon--down">
        <path d="M5 0.5v11.5M1 8l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  const d = direction === 'right'
    ? 'M0.5 5h11.5M8 1l4.5 4-4.5 4'
    : 'M13.5 5H2M6 1L1.5 5 6 9'
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true" className={`arrow-icon arrow-icon--${direction}`}>
      <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
