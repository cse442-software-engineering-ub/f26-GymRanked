// The set the user is in the middle of on an exercise page: the set timer, the weight and reps typed but not
// logged yet, and the rest countdown. Kept in this browser (localStorage) per session and exercise, so leaving
// the page or reloading doesn't lose it. The timer is stored as timestamps, so it keeps counting while away.
// Storage can be blocked or empty; then the page just starts from a fresh set.
//
// draft = { timer: 'idle'|'running'|'paused'|'ended', accumulatedMs, runningSince, weight, reps, restEndsAt, restTotal }
const key = (sessionId, exercise) => `gymrank.setDraft.${sessionId}.${exercise}`

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
