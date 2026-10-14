const API_URL = `${import.meta.env.BASE_URL}api/workout_session.php`

// Starts today's workout from the user's selected plan, or reopens the session already started in the last
// 24 hours (the API returns the same session for both). Rejects with an Error carrying the HTTP `status`:
// 401 not logged in, 409 no plan selected, rest day, or a day with no exercises.
export async function startSession() {
  const res = await fetch(API_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.session) {
    const error = new Error(body?.error || `HTTP ${res.status}`)
    error.status = res.status
    throw error
  }
  rememberSession(body.session.id)
  return body.session
}

// The id of the session this browser last opened, so the weekly plan can tell whether a workout is still
// unfinished without starting a new session (the API has no read-only "current session" call). Kept in
// localStorage; without it the weekly plan simply offers to start the workout, which reopens the same session.
const SESSION_KEY = 'gymrank.currentSessionId'

function rememberSession(id) {
  try {
    localStorage.setItem(SESSION_KEY, String(id))
  } catch {
    // Storage is unavailable: no Resume button, but starting the workout still reopens the session.
  }
}

// Resolves to the remembered session if it is still unfinished and was started in the last 24 hours (the
// window in which the API reopens a session), otherwise null. Never rejects.
export async function fetchUnfinishedSession() {
  try {
    const id = Number(localStorage.getItem(SESSION_KEY))
    if (!Number.isInteger(id) || id < 1) return null
    const res = await fetch(`${API_URL}?id=${id}`, { credentials: 'same-origin' })
    const body = await res.json().catch(() => null)
    const session = res.ok ? body?.session : null
    if (!session || session.completed_at) return null
    if (Date.now() - Date.parse(session.started_at) > 24 * 60 * 60 * 1000) return null
    return session
  } catch {
    return null
  }
}
