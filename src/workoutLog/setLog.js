// Small helpers shared by the set logging components (story #7). Kept free of React so they can be unit tested.

// Where the workout summary lives once a workout is completed. The summary page is a separate task;
// change this one line if its route ends up different.
export function summaryPath(sessionId) {
  return `/workouts/${sessionId}/summary`
}

export function formatWeight(weightLb) {
  return weightLb === 0 ? 'Bodyweight' : `${weightLb} lb`
}

export function formatSet(set) {
  return `${formatWeight(set.weight_lb)} × ${set.reps}`
}

// The number the next new set gets: one more than the highest so far, so it never repeats a number.
export function nextSetNumber(sets) {
  return sets.reduce((highest, set) => Math.max(highest, set.set_number), 0) + 1
}

// Adds a saved set, or replaces the one with the same id after a correction. Keeps sets in order.
export function upsertSet(sets, saved) {
  const others = sets.filter((set) => set.id !== saved.id)
  return [...others, saved].sort((a, b) => a.set_number - b.set_number)
}

export const SESSION_ENDED = 'Your session ended. Log in to keep logging.'

// What to tell the user when saving or correcting a set fails. err comes from workoutLogApi.js:
// { status, message, fieldErrors }, with status 0 when the server couldn't be reached.
export function saveErrorMessage(err) {
  if (err.status === 401) return SESSION_ENDED
  if (err.status === 409) return 'This workout is already completed, so its sets can no longer change.'
  if (err.status === 404) return "This set or workout couldn't be found. Reload the page and try again."
  if (err.status === 400 && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
    return 'Please fix the highlighted values.'
  }
  if (err.status === 400) return `Couldn't save this set: ${err.message}`
  return "Couldn't save this set. Check your connection and try again."
}

// A retry only makes sense when the failure could be temporary (offline or a server error).
export function isRetryable(err) {
  return err.status === 0 || err.status >= 500
}

export function completeErrorMessage(err) {
  if (err.status === 401) return 'Your session ended. Log in to complete this workout.'
  if (err.status === 400) return 'Log at least one set before completing.'
  if (err.status === 409) return 'This workout was already completed.'
  if (err.status === 404) return "This workout couldn't be found. Reload the page and try again."
  return "Couldn't complete the workout. Try again."
}
