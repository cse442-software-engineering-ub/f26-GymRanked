// The slide between the entry screens (log in, create account) and the signed-in app.
// - "arrive": after a successful log in or sign-up the entry screen fades its form out, then the app slides in from
//   the right while the dark brand panel narrows into the menu sidebar.
// - "leave": after Log out the page slides away to the right while the sidebar widens back into the brand panel,
//   then the log in form slides in.
// Between the two screens OnboardingGate checks the account, which takes a moment; while a handoff is pending it
// keeps the brand panel on screen so nothing flashes. The handoff lives in memory only: a reload never replays it.

export const EXIT_MS = 220
const MAX_AGE_MS = 5000

let pending = null

export function startHandoff(kind) {
  pending = { kind, at: Date.now() }
}

// 'arrive', 'leave' or null. A handoff that never finished (say the account check failed) expires on its own.
export function peekHandoff() {
  if (pending && Date.now() - pending.at > MAX_AGE_MS) pending = null
  return pending?.kind ?? null
}

export function endHandoff() {
  pending = null
}

// People who ask their system for less motion get the same pages with no slide.
export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
