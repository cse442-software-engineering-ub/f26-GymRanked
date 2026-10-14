// In-memory stand-in for the set logging endpoints (story #7), with the same functions and errors as
// workoutLogApi.js. Used by the dev-only preview page until the real backend exists; never shipped.
// The switches let you reproduce the task tests' failure cases without touching the network.

import { ApiError } from './workoutLogApi.js'
import { validateSet } from './setValidation.js'

export function createMockWorkoutLogApi({ delayMs = 600 } = {}) {
  const sets = new Map()
  const completed = new Set()
  let nextId = 1
  const switches = { offline: false, loggedOut: false, serverError: false }

  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs))

  // Same order of checks a real server would use: reachable, then logged in, then working.
  async function gate() {
    await wait()
    if (switches.offline) throw new ApiError(0, "Can't reach the server.")
    if (switches.loggedOut) throw new ApiError(401, 'Please log in.')
    if (switches.serverError) throw new ApiError(500, 'Database error')
  }

  // The server must refuse bad values even if a client skipped its own checks.
  function checkValues(weightLb, reps) {
    const result = validateSet({ weight: String(weightLb), reps: String(reps) })
    if (!result.ok) {
      const errors = {}
      if (result.errors.weight) errors.weight = result.errors.weight
      if (result.errors.reps) errors.reps = result.errors.reps
      throw new ApiError(400, 'Invalid set', errors)
    }
  }

  return {
    switches,

    async saveSet({ sessionId, exercise, setNumber, weightLb, reps }) {
      await gate()
      if (completed.has(sessionId)) throw new ApiError(409, 'Workout already completed')
      checkValues(weightLb, reps)
      const set = { id: nextId++, session_id: sessionId, exercise, set_number: setNumber, weight_lb: weightLb, reps }
      sets.set(set.id, set)
      const { session_id, ...publicSet } = set
      return publicSet
    },

    async updateSet({ id, weightLb, reps }) {
      await gate()
      const existing = sets.get(id)
      if (!existing) throw new ApiError(404, 'Set not found')
      if (completed.has(existing.session_id)) throw new ApiError(409, 'Workout already completed')
      checkValues(weightLb, reps)
      const set = { ...existing, weight_lb: weightLb, reps }
      sets.set(id, set)
      const { session_id, ...publicSet } = set
      return publicSet
    },

    async completeWorkout(sessionId) {
      await gate()
      if (completed.has(sessionId)) throw new ApiError(409, 'Workout already completed')
      const logged = [...sets.values()].some((set) => set.session_id === sessionId)
      if (!logged) throw new ApiError(400, 'Log at least one set')
      completed.add(sessionId)
      return { session_id: sessionId, completed_at: new Date().toISOString() }
    },
  }
}
