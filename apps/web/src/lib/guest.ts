// Client-side guest question counter. Purely a UX nudge toward signing in —
// localStorage is trivially clearable, so this is not a real quota. Real
// enforcement needs a server-side counter tied to an account, which needs
// the auth backend (not built yet — see [[project-overview]]).

export const GUEST_TURN_KEY = 'ai-mind-guest-turns'
export const GUEST_LIMIT = 5

export function getGuestTurns(): number {
  try {
    return Number(localStorage.getItem(GUEST_TURN_KEY)) || 0
  } catch {
    return 0
  }
}

export function incrementGuestTurns(): number {
  const next = getGuestTurns() + 1
  try {
    localStorage.setItem(GUEST_TURN_KEY, String(next))
  } catch {}
  return next
}

export function guestTurnsRemaining(turns = getGuestTurns()): number {
  return Math.max(0, GUEST_LIMIT - turns)
}

export function isGuestLimitReached(turns = getGuestTurns()): boolean {
  return turns >= GUEST_LIMIT
}
