// The set the user is in the middle of on an exercise page: the set timer, the weight and reps typed but not
// logged yet, and the rest countdown. Kept in this browser (localStorage) per session and exercise, so leaving
// the page or reloading doesn't lose it. The timer is stored as timestamps, so it keeps counting while away.
// Storage can be blocked or empty; then the page just starts from a fresh set.
//
// Drafts are keyed by the logged-in account as well (task #82, "Refresh after settings or account changes"):
// OnboardingGate calls setDraftOwner with the account's id after each account check, and when that is a different
// account from the drafts in this browser, the other accounts' drafts are removed, so a second account never sees
// the first one's typed numbers. Logging out and back in as the same account keeps them.
//
// draft = { timer: 'idle'|'running'|'paused'|'ended', accumulatedMs, runningSince, weight, reps, restEndsAt, restTotal }
const PREFIX = 'gymrank.setDraft.'
let owner = null
const ownerPrefix = () => `${PREFIX}u${owner ?? 'none'}.`
const key = (sessionId, exercise) => `${ownerPrefix()}${sessionId}.${exercise}`

// Sets whose drafts are read and written from now on, and removes every draft in this browser that belongs to
// another account (including drafts from before drafts were keyed by account, whose owner can't be told).
export function setDraftOwner(userId) {
  if (userId === undefined || userId === null || String(userId) === String(owner)) return
  owner = userId
  try {
    const mine = ownerPrefix()
    const stale = []
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i)
      if (name?.startsWith(PREFIX) && !name.startsWith(mine)) stale.push(name)
    }
    stale.forEach((name) => localStorage.removeItem(name))
  } catch {
    // Storage is unavailable: there is nothing stored to remove.
  }
}

export const EMPTY_DRAFT = {
  timer: 'idle',
  accumulatedMs: 0,
  runningSince: null,
  weight: '',
  reps: '',
  restEndsAt: null,
  restTotal: null,
}

const TIMERS = ['idle', 'running', 'paused', 'ended']

export function loadDraft(sessionId, exercise) {
  try {
    const saved = JSON.parse(localStorage.getItem(key(sessionId, exercise)))
    if (!saved || !TIMERS.includes(saved.timer)) return { ...EMPTY_DRAFT }
    const draft = {
      timer: saved.timer,
      accumulatedMs: Number.isFinite(saved.accumulatedMs) ? saved.accumulatedMs : 0,
      runningSince: Number.isFinite(saved.runningSince) ? saved.runningSince : null,
      weight: typeof saved.weight === 'string' ? saved.weight : '',
      reps: typeof saved.reps === 'string' ? saved.reps : '',
      restEndsAt: Number.isFinite(saved.restEndsAt) && saved.restEndsAt > Date.now() ? saved.restEndsAt : null,
      restTotal: Number.isFinite(saved.restTotal) ? saved.restTotal : null,
    }
    if (draft.timer === 'running' && draft.runningSince === null) draft.timer = 'paused'
    return draft
  } catch {
    return { ...EMPTY_DRAFT }
  }
}

// An untouched draft (nothing started, typed or resting) is removed instead of stored.
export function saveDraft(sessionId, exercise, draft) {
  try {
    const untouched = draft.timer === 'idle' && draft.weight === '' && draft.reps === '' && draft.restEndsAt === null
    if (untouched) localStorage.removeItem(key(sessionId, exercise))
    else localStorage.setItem(key(sessionId, exercise), JSON.stringify(draft))
  } catch {
    // Storage is unavailable: the set just isn't remembered.
  }
}

// True while a set has been started or has weight or reps typed but isn't logged yet. A draft that only holds a
// rest countdown (the set was just logged) is not an unlogged set.
export function hasUnloggedSet(draft) {
  if (draft.timer === 'ended' && draft.restEndsAt && draft.weight.trim() === '' && draft.reps.trim() === '') return false
  return draft.timer !== 'idle' || draft.weight.trim() !== '' || draft.reps.trim() !== ''
}

// The first of these exercises (in order) with an unlogged set in this browser, or null.
export function findUnloggedExercise(sessionId, exerciseNames) {
  return exerciseNames.find((name) => hasUnloggedSet(loadDraft(sessionId, name))) ?? null
}

// Throws away the unlogged set of each exercise but keeps nothing else: the next visit starts a fresh set.
export function clearUnloggedSets(sessionId, exerciseNames) {
  exerciseNames.forEach((name) => {
    if (hasUnloggedSet(loadDraft(sessionId, name))) saveDraft(sessionId, name, EMPTY_DRAFT)
  })
}
