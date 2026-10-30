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
  return body.session
}

// Read the signed-in user's current unfinished session without opening or creating one. This also works in
// a fresh browser where the session was started earlier. Never rejects.
export async function fetchUnfinishedSession() {
  try {
    const res = await fetch(`${API_URL}?current=1`, { credentials: 'same-origin' })
    const body = await res.json().catch(() => null)
    const session = res.ok ? body?.session : null
    return session && !session.completed_at ? session : null
  } catch {
    return null
  }
}
