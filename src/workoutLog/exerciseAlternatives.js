// Requests for the exercise alternatives dialog (task #82), against Surya's api/exercise_alternatives.php (#81):
//   GET api/exercise_alternatives.php?exercise=Bench%20press
//     -> 200 {exercise, movement, alternatives: [{name, level, equipment}, ...]}, 404 not supported, 401 logged out
// The dialog also needs the user's experience and equipment. #81 doesn't send them yet ("you" in the task's data
// agreement), so they come from GET api/setup.php instead; once #81 adds "you", "level" and "equipment" they are used
// and setup.php is no longer asked. Only GET requests: nothing here writes.
//
// fetchAlternatives resolves to {state, ...} and never throws. state is one of alternatives, noMatch, notCovered,
// loggedOut or failed. Answers that list alternatives (or none) are kept per exercise until the page reloads, so
// reopening is instant; failures are never kept, so reopening after one asks again.

const answers = new Map()

async function getJson(fetchImpl, path) {
  let response
  try {
    response = await fetchImpl(`${import.meta.env?.BASE_URL ?? '/'}api/${path}`, { credentials: 'same-origin' })
  } catch {
    return { status: 0, body: null }
  }
  try {
    return { status: response.status, body: await response.json() }
  } catch {
    // Not JSON, for example a PHP error page.
    return { status: response.status, body: null }
  }
}

// The state for api/exercise_alternatives.php's answer. A 404 only means "not covered" when it is the API's own JSON
// answer; anything the screen can't use is a failure that can be tried again.
export function alternativesState(status, body) {
  if (status === 401) return 'loggedOut'
  if (status === 404 && body) return 'notCovered'
  if (status === 200 && Array.isArray(body?.alternatives)) return body.alternatives.length > 0 ? 'alternatives' : 'noMatch'
  return 'failed'
}

function isSetup(value) {
  return Boolean(value) && Array.isArray(value.equipment)
}

export function cachedAlternatives(exercise) {
  return answers.get(exercise) ?? null
}

export async function fetchAlternatives(exercise, { fetchImpl = (...args) => fetch(...args) } = {}) {
  if (answers.has(exercise)) return answers.get(exercise)
  const { status, body } = await getJson(fetchImpl, `exercise_alternatives.php?exercise=${encodeURIComponent(exercise)}`)
  const state = alternativesState(status, body)
  if (state !== 'alternatives' && state !== 'noMatch') return { state }

  let you = body.you
  if (!isSetup(you)) {
    const setup = await getJson(fetchImpl, 'setup.php')
    if (setup.status === 401) return { state: 'loggedOut' }
    if (setup.status !== 200 || !isSetup(setup.body)) return { state: 'failed' }
    you = setup.body
  }

  const answer = {
    state,
    movement: body.movement,
    level: body.level ?? null,
    equipment: body.equipment ?? null,
    you: { experience: you.experience ?? null, equipment: you.equipment },
    alternatives: body.alternatives,
  }
  answers.set(exercise, answer)
  return answer
}
