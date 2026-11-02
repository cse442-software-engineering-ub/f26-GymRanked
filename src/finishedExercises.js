// Which exercises of a workout session the user has marked finished. The server only stores sets, so this
// is kept in this browser (localStorage), per session; it is a convenience for the ticks on the active
// workout page, and the page works without it if storage is blocked.
const key = (sessionId) => `gymrank.finishedExercises.${sessionId}`

export function loadFinished(sessionId) {
  try {
    const names = JSON.parse(localStorage.getItem(key(sessionId)) ?? '[]')
    return new Set(Array.isArray(names) ? names : [])
  } catch {
    return new Set()
  }
}

export function markFinished(sessionId, exerciseName) {
  try {
    const finished = loadFinished(sessionId).add(exerciseName)
    localStorage.setItem(key(sessionId), JSON.stringify([...finished]))
  } catch {
    // Storage is unavailable: the exercise just isn't ticked.
  }
}
