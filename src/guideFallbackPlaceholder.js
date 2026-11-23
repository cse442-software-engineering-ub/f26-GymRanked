// TEMPORARY, task #91. Gets the stand-in fallback steps from api/exercise_guide_placeholder.php until Surya's backup
// pictures and instructions (task #92) exist. Delete this file and that endpoint when #92's data is in, and have
// src/ExerciseGuide.jsx pass #92's steps to GuideFallback instead.
//
// The steps are fetched when the exercise page opens and kept in memory per exercise, so they are already here if
// the connection drops before the guide is opened. If even that request fails, the same sentence is built here.

const API_URL = `${import.meta.env.BASE_URL}api/exercise_guide_placeholder.php`

const placeholders = new Map()

function localSteps(name) {
  return [{
    image: null,
    instruction: `Do each rep of the ${name} slowly and under control through its full range of motion, keeping your core braced and your form steady.`,
    credit: 'Placeholder text from GymRank until backup pictures are added.',
  }]
}

export function placeholderSteps(name) {
  return placeholders.get(name) ?? localSteps(name)
}

export function loadPlaceholderSteps(name) {
  if (placeholders.has(name)) return
  fetch(`${API_URL}?name=${encodeURIComponent(name)}`, { credentials: 'same-origin' })
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      if (Array.isArray(body?.steps) && body.steps.length > 0) placeholders.set(name, body.steps)
    })
    .catch(() => {})
}
