// The slide between the entry screens (log in, create account) and the signed-in app.
// The two directions mirror each other:
// - "arrive": after a successful log in or sign-up the form slides away while the dark brand panel narrows to the
//   menu sidebar's width (to nothing after a sign-up, which opens the setup steps), then the app slides in beside it.
// - "leave": after Log out the page slides away to the right while the sidebar widens back into the brand panel,
//   then the log in form slides in.
// Between the two screens OnboardingGate checks the account, which takes a moment; while a handoff is pending it
// keeps the panel where the slide left it, so nothing flashes. The handoff lives in memory only: a reload never
// replays it. target says how wide the panel ends: 'sidebar' or 'none'.
const MAX_AGE_MS = 5000

let pending = null

export function startHandoff(kind, target = 'sidebar') {
  pending = { kind, target, at: Date.now() }
}

export function handoffTarget() {
  return pending?.target ?? 'sidebar'
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
