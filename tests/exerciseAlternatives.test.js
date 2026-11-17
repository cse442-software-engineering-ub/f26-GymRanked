import test from 'node:test'
import assert from 'node:assert/strict'
import { alternativesState, cachedAlternatives, fetchAlternatives } from '../src/workoutLog/exerciseAlternatives.js'
import {
  countText, equipmentTag, exerciseLine, introText, levelTag, noMatchText, notCoveredText, notCoveredTitle, reasonText,
  setupLine,
} from '../src/workoutLog/exerciseAlternativesFormat.js'

const alex = { experience: 'intermediate', equipment: ['dumbbells'] }
const gio = { experience: 'advanced', equipment: ['full_gym'] }

test('tags for every level and equipment value in migration 016', () => {
  assert.deepEqual(['beginner', 'intermediate', 'advanced'].map(levelTag), ['Beginner', 'Intermediate', 'Advanced'])
  assert.deepEqual(
    ['bodyweight', 'dumbbells', 'barbell', 'kettlebells', 'resistance_bands', 'cable_machine', 'pullup_bar', 'full_gym'].map(equipmentTag),
    ['No equipment', 'Dumbbells', 'Barbell', 'Kettlebells', 'Resistance bands', 'Cable machine', 'Pull-up bar', 'Gym machine'],
  )
  assert.equal(exerciseLine('intermediate', 'barbell'), 'Intermediate · Barbell')
  assert.equal(exerciseLine('intermediate', 'pullup_bar'), 'Intermediate · Pull-up bar')
})

test('the setup line names the saved experience and equipment', () => {
  assert.equal(setupLine(alex), 'Your setup: Intermediate · Dumbbells')
  assert.equal(setupLine(gio), 'Your setup: Advanced · Full gym access')
  assert.equal(setupLine({ experience: null, equipment: [] }), 'Your setup: Not saved · No equipment saved')
  assert.equal(setupLine({ experience: 'beginner', equipment: ['bodyweight'] }), 'Your setup: Beginner · Bodyweight only')
})

test('reasons for story #80, Acceptance Tests 1 and 2', () => {
  const reason = (you, source, sourceLevel, name, level, equipment) =>
    reasonText({ source, sourceLevel, alternative: { name, level, equipment }, you })

  assert.equal(reason(alex, 'Bench press', 'intermediate', 'Incline dumbbell press', 'intermediate', 'dumbbells'),
    'Same difficulty as Bench press. Uses dumbbells, which you have.')
  assert.equal(reason(alex, 'Bench press', 'intermediate', 'Dumbbell press', 'beginner', 'dumbbells'),
    'One level easier than Bench press. Uses dumbbells, which you have.')
  assert.equal(reason(alex, 'Bench press', 'intermediate', 'Incline push-up', 'beginner', 'bodyweight'),
    'One level easier than Bench press. Needs no equipment.')
  assert.equal(reason(alex, 'Bench press', 'intermediate', 'Push-up', 'beginner', 'bodyweight'),
    'One level easier than Bench press. Needs no equipment.')

  assert.equal(reason(gio, 'Bench press', 'intermediate', 'Close-grip bench press', 'intermediate', 'barbell'),
    'Same difficulty as Bench press. Uses a barbell, which your full gym access covers.')
  assert.equal(reason(gio, 'Bench press', 'intermediate', 'Incline dumbbell press', 'intermediate', 'dumbbells'),
    'Same difficulty as Bench press. Uses dumbbells, which your full gym access covers.')
  assert.equal(reason(gio, 'Bench press', 'intermediate', 'Dumbbell press', 'beginner', 'dumbbells'),
    'One level easier than Bench press. Uses dumbbells, which your full gym access covers.')
  assert.equal(reason(gio, 'Bench press', 'intermediate', 'Incline push-up', 'beginner', 'bodyweight'),
    'One level easier than Bench press. Needs no equipment.')
  assert.equal(reason(gio, 'Bench press', 'intermediate', 'Push-up', 'beginner', 'bodyweight'),
    'One level easier than Bench press. Needs no equipment.')
  assert.equal(reason(gio, 'Pull-up', 'intermediate', 'Lat pulldown', 'beginner', 'cable_machine'),
    'One level easier than Pull-up. Uses a cable machine, which your full gym access covers.')

  assert.equal(reason(alex, 'Push-up', 'beginner', 'Incline dumbbell press', 'intermediate', 'dumbbells'),
    'One level harder than Push-up, within your level. Uses dumbbells, which you have.')
})

test('without the exercise level from #81 the reason is only the equipment part', () => {
  assert.equal(
    reasonText({ source: 'Bench press', sourceLevel: null, alternative: { name: 'Dumbbell press', level: 'beginner', equipment: 'dumbbells' }, you: alex }),
    'Uses dumbbells, which you have.',
  )
})

test('count and intro', () => {
  assert.equal(countText(1), '1 alternative')
  assert.equal(countText(4), '4 alternatives')
  assert.equal(introText('horizontal_push'),
    'These work the same pressing movement with equipment you have, at your level or easier. Closest in difficulty first.')
})

test('no-match and not-covered text for Alex', () => {
  assert.equal(noMatchText({ exercise: 'Pull-up', movement: 'vertical_pull', you: alex }),
    'None of the other pulling-down exercises we list fit your equipment (Dumbbells) and experience (Intermediate). Keep doing Pull-up, or add equipment you have in your training preferences.')
  assert.equal(notCoveredTitle('Romanian deadlift'), 'No alternatives listed for Romanian deadlift yet')
  assert.equal(notCoveredText('Romanian deadlift'),
    'Alternatives cover pressing, squatting, rowing and pulling-down exercises so far. Keep doing Romanian deadlift as planned.')
})

test('the state for each kind of answer', () => {
  const items = [{ name: 'Dumbbell press', level: 'beginner', equipment: 'dumbbells' }]
  assert.equal(alternativesState(200, { exercise: 'Bench press', movement: 'horizontal_push', alternatives: items }), 'alternatives')
  assert.equal(alternativesState(200, { exercise: 'Pull-up', movement: 'vertical_pull', alternatives: [] }), 'noMatch')
  assert.equal(alternativesState(404, { error: 'No alternatives for this exercise.' }), 'notCovered')
  assert.equal(alternativesState(401, { error: 'Please log in.' }), 'loggedOut')
  assert.equal(alternativesState(500, { error: 'Database error' }), 'failed')
  assert.equal(alternativesState(0, null), 'failed')
  assert.equal(alternativesState(200, null), 'failed')
  assert.equal(alternativesState(200, { exercise: 'Bench press' }), 'failed')
})

// A stand-in for fetch that answers by endpoint and records every URL asked for.
function fakeFetch(routes) {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    const route = Object.keys(routes).find((path) => url.includes(path))
    const answer = routes[route]
    if (answer === 'offline') throw new TypeError('Failed to fetch')
    return {
      status: answer.status,
      json: async () => {
        if (typeof answer.body === 'string') throw new SyntaxError('Unexpected token <')
        return answer.body
      },
    }
  }
  return { fetchImpl, calls }
}

test('network errors and non-JSON answers fail without being kept', async () => {
  const offline = fakeFetch({ exercise_alternatives: 'offline' })
  assert.deepEqual(await fetchAlternatives('Offline press', offline), { state: 'failed' })
  const html = fakeFetch({ exercise_alternatives: { status: 200, body: '<html>Not JSON</html>' } })
  assert.deepEqual(await fetchAlternatives('Offline press', html), { state: 'failed' })
  assert.equal(cachedAlternatives('Offline press'), null)
  assert.equal(offline.calls.length + html.calls.length, 2)
})

test('a list is fetched once with the setup, sent as GET with the session cookie, and kept', async () => {
  const { fetchImpl, calls } = fakeFetch({
    exercise_alternatives: {
      status: 200,
      body: { exercise: 'Bench press', movement: 'horizontal_push', alternatives: [{ name: 'Dumbbell press', level: 'beginner', equipment: 'dumbbells' }] },
    },
    'setup.php': { status: 200, body: alex },
  })
  const answer = await fetchAlternatives('Bench press', { fetchImpl })
  assert.equal(answer.state, 'alternatives')
  assert.deepEqual(answer.you, alex)
  assert.equal(answer.level, null)
  assert.match(calls[0].url, /api\/exercise_alternatives\.php\?exercise=Bench%20press$/)
  assert.match(calls[1].url, /api\/setup\.php$/)
  assert.ok(calls.every((call) => call.options.credentials === 'same-origin' && call.options.method === undefined))

  assert.equal(await fetchAlternatives('Bench press', { fetchImpl }), answer)
  assert.equal(cachedAlternatives('Bench press'), answer)
  assert.equal(calls.length, 2)
})

test('setup.php is skipped once #81 sends "you", and a 401 from it means logged out', async () => {
  const withYou = fakeFetch({
    exercise_alternatives: {
      status: 200,
      body: { exercise: 'Pull-up', movement: 'vertical_pull', level: 'intermediate', equipment: 'pullup_bar', you: alex, alternatives: [] },
    },
  })
  const answer = await fetchAlternatives('Pull-up', withYou)
  assert.equal(answer.state, 'noMatch')
  assert.equal(answer.level, 'intermediate')
  assert.equal(withYou.calls.length, 1)

  const expired = fakeFetch({
    exercise_alternatives: { status: 200, body: { exercise: 'Push-up', movement: 'horizontal_push', alternatives: [] } },
    'setup.php': { status: 401, body: { error: 'Not logged in' } },
  })
  assert.deepEqual(await fetchAlternatives('Push-up', expired), { state: 'loggedOut' })
  assert.equal(cachedAlternatives('Push-up'), null)
})
