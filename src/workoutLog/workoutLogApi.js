// Workout session, set, completion and history requests. The logging components take an `api` prop, so the
// in-memory stand-in (mockWorkoutLogApi.js) can still replace the set and completion requests in the preview.
//
// Contract agreed with the backend task:
//   POST api/workout_session.php {}                                         -> {session}
//   GET  api/workout_session.php?id=N                                       -> {session}
//   POST api/workout_sets.php     {session_id, exercise, set_number, weight_lb, reps} -> 201 {set}
//   POST api/workout_sets.php     {id, weight_lb, reps}                               -> 200 {set}  (correction)
//   POST api/complete_workout.php {session_id}                                        -> 200 {session_id, completed_at}
//   GET  api/workout_history.php                                            -> {sessions}
//   set = {id, exercise, set_number, weight_lb, reps}
//   Errors are JSON {error, errors?}: 400 bad input (errors.weight_lb / errors.reps per field),
//   401 not logged in, 404 unknown set or session, 409 workout already completed.
//
// Every function resolves with the response data or rejects with an ApiError
// ({status, message, fieldErrors}); status is 0 when the server couldn't be reached.

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// The server names fields weight_lb / reps; the form names them weight / reps.
function formFieldErrors(errors) {
  if (!errors || typeof errors !== 'object') return {}
  const result = {}
  if (typeof errors.weight_lb === 'string') result.weight = errors.weight_lb
  if (typeof errors.reps === 'string') result.reps = errors.reps
  return result
}

export function createWorkoutLogApi({ baseUrl, fetchImpl = (...args) => fetch(...args) } = {}) {
  const apiBase = `${baseUrl ?? import.meta.env?.BASE_URL ?? '/'}api/`

  async function request(path, { method = 'GET', body } = {}) {
    let response
    try {
      response = await fetchImpl(apiBase + path, {
        method,
        credentials: 'same-origin',
        ...(body === undefined ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      })
    } catch {
      throw new ApiError(0, "Can't reach the server.")
    }

    let data = null
    try {
      data = await response.json()
    } catch {
      // Not JSON, for example a PHP error page or a missing endpoint served as index.html.
    }
    if (!response.ok || data === null || typeof data !== 'object') {
      const status = response.ok ? 502 : response.status
      throw new ApiError(status, data?.error || `Request failed (${status}).`, formFieldErrors(data?.errors))
    }
    return data
  }

  const post = (path, body) => request(path, { method: 'POST', body })

  return {
    async startSession() {
      const data = await post('workout_session.php', {})
      return data.session
    },

    async getSession(sessionId) {
      const data = await request(`workout_session.php?id=${encodeURIComponent(sessionId)}`)
      return data.session
    },

    async getHistory() {
      const data = await request('workout_history.php')
      return data.sessions
    },

    async saveSet({ sessionId, exercise, setNumber, weightLb, reps }) {
      const data = await post('workout_sets.php', {
        session_id: sessionId,
        exercise,
        set_number: setNumber,
        weight_lb: weightLb,
        reps,
      })
      return data.set
    },

    async updateSet({ id, weightLb, reps }) {
      const data = await post('workout_sets.php', { id, weight_lb: weightLb, reps })
      return data.set
    },

    async completeWorkout(sessionId) {
      return post('complete_workout.php', { session_id: sessionId })
    },
  }
}

const workoutLogApi = createWorkoutLogApi()
export default workoutLogApi
