// Backend checks for story #7: workout sessions, sets, completion and history (task-tests/7-workout-session-backend.md).
// Run against a LOCAL PHP server and a database that has migrations 001-009 and database/seeds/test_users.sql:
//   php -S localhost:8000 -t api            (use PHP_CLI_SERVER_WORKERS=4 so the simultaneous-Complete check overlaps)
//   node tests/workout-session-api.mjs
// It logs in as the seeded example.com test users and only clears those users' workout sessions. It needs the
// `mysql` command for the checks that read or backdate rows; set WORKOUT_TEST_DB / WORKOUT_TEST_MYSQL_USER
// (and MYSQL_PWD) if your local database isn't `cse442_2026_fall_team_y_db` with a passwordless root.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const base = process.env.WORKOUT_TEST_BASE || 'http://localhost:8000'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a local test server')
const database = process.env.WORKOUT_TEST_DB || 'cse442_2026_fall_team_y_db'
const mysqlUser = process.env.WORKOUT_TEST_MYSQL_USER || 'root'
const sql = (query) => execFileSync('mysql', ['-u', mysqlUser, '-N', '-B', database, '-e', query], { encoding: 'utf8' }).trim()
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const toSql = (iso) => iso.replace('T', ' ').replace('Z', '')
const secondsBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / 1000

async function call(jar, method, path, body, { raw, contentType = 'application/json' } = {}) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: { ...(method === 'POST' ? { 'Content-Type': contentType } : {}), ...(jar?.cookie ? { Cookie: jar.cookie } : {}) },
    body: method === 'POST' ? (raw ?? JSON.stringify(body ?? {})) : undefined,
  })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave null so the assertions show the raw page */ }
  return { status: response.status, body: json, text, type: response.headers.get('content-type'), cookie: response.headers.get('set-cookie') }
}
const get = (jar, path) => call(jar, 'GET', path)
const post = (jar, path, body, options) => call(jar, 'POST', path, body, options)

async function login(email, password) {
  const response = await post(null, 'login.php', { email, password })
  assert.equal(response.status, 200, `login ${email}: ${response.text} (run database/seeds/test_users.sql first)`)
  return { cookie: response.cookie.split(';')[0] }
}

function expectError(response, status, message) {
  assert.equal(response.status, status, response.text)
  assert.match(response.type, /application\/json/)
  if (message !== undefined) assert.equal(response.body.error, message)
}

const saveSet = (jar, sessionId, exercise, setNumber, weight, reps, extra = {}) =>
  post(jar, 'workout_sets.php', { session_id: sessionId, exercise, set_number: setNumber, weight_lb: weight, reps, ...extra })
const sessionRows = (email) => Number(sql(`SELECT COUNT(*) FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email = '${email}')`))
const MARCUS = 'marcus.malone@example.com', DANA = 'dana.lee@example.com', PRIYA = 'priya.shah@example.com'
const SEAN = 'sean.obrien@example.com', JORDAN = 'jordan.kim@example.com'

// ---------------------------------------------------------------- setup
sql("DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com')")
sql('DELETE FROM auth_attempts')
const pplId = (await get(null, 'plans.php')).body.find((plan) => plan.name === 'Push Pull Legs').id
let marcus = await login(MARCUS, 'Marcus-Bench225!')
const dana = await login(DANA, 'Dana-Squat315!')
const priya = await login(PRIYA, 'Priya-Deadlift405!')
const sean = await login(SEAN, 'Sean-Press135!')
const jordan = await login(JORDAN, 'Jordan-Row185!')
for (const jar of [marcus, dana, sean, jordan]) assert.equal((await post(jar, 'current_plan.php', { plan_id: pplId })).status, 200)
sql(`DELETE FROM user_plans WHERE user_id = (SELECT id FROM users WHERE email = '${PRIYA}')`)

// ---------------------------------------------------------------- Test 1: tables
const columns = sql("SELECT CONCAT(table_name, '.', column_name) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name IN ('workout_sessions', 'workout_sets')").split('\n')
for (const column of ['workout_sets.weight_lb', 'workout_sets.reps', 'workout_sets.logged_at', 'workout_sets.updated_at', 'workout_sessions.started_at', 'workout_sessions.completed_at', 'workout_sessions.exercises']) {
  assert.ok(columns.includes(column), `missing column ${column}`)
}
console.log('ok  Test 1: tables and columns exist')

// ---------------------------------------------------------------- Test 2: login required
for (const [method, path, body] of [
  ['POST', 'workout_session.php', {}], ['GET', 'workout_session.php?id=1'],
  ['POST', 'workout_sets.php', { session_id: 1, exercise: 'Bench press', set_number: 1, weight_lb: 135, reps: 8 }],
  ['POST', 'complete_workout.php', { session_id: 1 }], ['GET', 'workout_history.php'],
]) {
  expectError(await call(null, method, path, body), 401, 'Please log in.')
}
expectError(await post({ cookie: 'gymrank_session=abc' }, 'workout_session.php', {}), 401, 'Please log in.')
await post(marcus, 'logout.php', {})
expectError(await get(marcus, 'workout_history.php'), 401, 'Please log in.')
marcus = await login(MARCUS, 'Marcus-Bench225!')
assert.equal(Number(sql('SELECT COUNT(*) FROM workout_sets')), 0)
console.log('ok  Test 2: every endpoint needs a logged-in user')

// ---------------------------------------------------------------- Test 3: start a session
const started = Date.now()
const first = await post(marcus, 'workout_session.php', { day_position: 1 })
assert.equal(first.status, 201, first.text)
const S1 = first.body.session
assert.equal(S1.plan, 'Push Pull Legs')
assert.equal(S1.name, 'Push')
assert.equal(S1.focus, 'Chest, shoulders, triceps')
assert.equal(S1.completed_at, null)
assert.equal(S1.summary, null)
assert.match(S1.started_at, ISO)
assert.ok(Math.abs(Date.parse(S1.started_at) - started) < 10_000, 'started_at should be the server time, now')
assert.deepEqual(S1.exercises.map((e) => e.name), ['Bench press', 'Overhead press', 'Triceps pushdown'])
assert.ok(S1.exercises.every((e) => e.sets.length === 0))
const danaStart = await post(dana, 'workout_session.php', { day_position: 2 })
assert.equal(danaStart.status, 201)
const D1 = danaStart.body.session
assert.equal(D1.name, 'Pull')
assert.deepEqual(D1.exercises.map((e) => e.name), ['Barbell row', 'Lat pulldown', 'Dumbbell curl'])
assert.notEqual(D1.id, S1.id)
expectError(await post(marcus, 'workout_session.php', { day_position: 9 }), 404, 'Plan day not found')
expectError(await post(marcus, 'workout_session.php', { day_position: 'one' }), 400, 'day_position must be a whole number.')
expectError(await post(marcus, 'workout_session.php', { day_position: 1.5 }), 400)
expectError(await post(priya, 'workout_session.php', {}), 409, 'No workout plan selected')
assert.equal(sessionRows(MARCUS), 1)
assert.equal(sessionRows(DANA), 1)
assert.equal(sessionRows(PRIYA), 0)
console.log('ok  Test 3: starting a session copies the plan day, exercises in order')

// ---------------------------------------------------------------- Test 4: reopen
let again = await post(marcus, 'workout_session.php', { day_position: 1 })
assert.equal(again.status, 200)
assert.equal(again.body.session.id, S1.id)
await post(marcus, 'logout.php', {})
marcus = await login(MARCUS, 'Marcus-Bench225!')
again = await post(marcus, 'workout_session.php', {})
assert.equal(again.status, 200)
assert.equal(again.body.session.id, S1.id)
assert.equal(sessionRows(MARCUS), 1)
console.log('ok  Test 4: an unfinished session is reopened, not duplicated')

// ---------------------------------------------------------------- Test 5: save sets
const bench1 = await saveSet(marcus, S1.id, 'Bench press', 1, 135, 8)
assert.equal(bench1.status, 201, bench1.text)
assert.deepEqual(Object.keys(bench1.body.set), ['id', 'exercise', 'set_number', 'weight_lb', 'reps', 'logged_at', 'updated_at'])
assert.equal(typeof bench1.body.set.weight_lb, 'number')
assert.equal(bench1.body.set.weight_lb, 135)
assert.equal(bench1.body.set.reps, 8)
assert.match(bench1.body.set.logged_at, ISO)
assert.equal(bench1.body.set.updated_at, bench1.body.set.logged_at)
const bench2 = await saveSet(marcus, S1.id, 'Bench press', 2, 135, 6)
const overhead = await saveSet(marcus, S1.id, 'Overhead press', 1, 65, 10)
const triceps = await saveSet(marcus, S1.id, 'Triceps pushdown', 1, 0, 12)
for (const r of [bench2, overhead, triceps]) assert.equal(r.status, 201, r.text)
assert.ok(bench1.body.set.id < bench2.body.set.id && bench2.body.set.id < overhead.body.set.id)
let read = (await get(marcus, `workout_session.php?id=${S1.id}`)).body.session
const compact = (session) => session.exercises.map((e) => [e.name, e.sets.map((s) => `${s.set_number}:${s.weight_lb}x${s.reps}`)])
assert.deepEqual(compact(read), [['Bench press', ['1:135x8', '2:135x6']], ['Overhead press', ['1:65x10']], ['Triceps pushdown', ['1:0x12']]])
assert.equal(sql('SELECT GROUP_CONCAT(weight_lb ORDER BY id) FROM workout_sets'), '135.00,135.00,65.00,0.00')
console.log('ok  Test 5: sets saved with numbers, pounds and order')

// ---------------------------------------------------------------- Test 6: validation
const W = { empty: 'Enter a weight (0 for bodyweight).', nan: 'Enter a weight as a number.', range: 'Weight must be between 0 and 1500 lb.', decimals: 'Use at most 2 decimal places, like 137.25.' }
const R = { empty: 'Enter your reps.', range: 'Reps must be between 1 and 100.', whole: 'Reps must be a whole number.' }
const cases = [
  [undefined, 8, { weight_lb: W.empty }], [135, undefined, { reps: R.empty }], ['abc', 8, { weight_lb: W.nan }],
  [-1, 8, { weight_lb: W.range }], [1501, 8, { weight_lb: W.range }], [135.555, 8, { weight_lb: W.decimals }],
  [135, 0, { reps: R.range }], [135, 101, { reps: R.range }], [135, 8.5, { reps: R.whole }], ['1e3', 8, { weight_lb: W.nan }],
  [135, '', { reps: R.empty }], ['', '', { weight_lb: W.empty, reps: R.empty }], [135, 'x', { reps: 'Enter reps as a number.' }],
  [true, 8, { weight_lb: W.nan }], [[135], 8, { weight_lb: W.nan }],
]
for (const [weight, reps, errors] of cases) {
  const r = await saveSet(marcus, S1.id, 'Bench press', 3, weight, reps)
  expectError(r, 400)
  assert.deepEqual(r.body.errors, errors, `${JSON.stringify([weight, reps])}`)
}
const edge = await saveSet(marcus, S1.id, 'Bench press', 3, 1500, 100)
assert.equal(edge.status, 201, 'the limits themselves are allowed')
sql('DELETE FROM workout_sets WHERE reps = 100')
const stringy = await saveSet(marcus, S1.id, 'Bench press', 3, '137.25', '5')
assert.equal(stringy.status, 201, 'numbers sent as text are accepted')
assert.equal(stringy.body.set.weight_lb, 137.25)
sql(`DELETE FROM workout_sets WHERE id = ${stringy.body.set.id}`)
for (const [label, bad] of [
  ['set_number 0', { set_number: 0 }], ['set_number -1', { set_number: -1 }], ['set_number 1.5', { set_number: 1.5 }], ['set_number "x"', { set_number: 'x' }],
  ['set_number 51', { set_number: 51 }], ['exercise not in session', { exercise: 'Deadlift' }], ['exercise missing', { exercise: undefined }],
  ['exercise empty', { exercise: '' }], ['exercise too long', { exercise: 'x'.repeat(101) }],
  ['exercise injection', { exercise: "Bench press'; DROP TABLE workout_sets;--" }], ['session_id text', { session_id: 'abc' }],
]) {
  const r = await post(marcus, 'workout_sets.php', { session_id: S1.id, exercise: 'Bench press', set_number: 3, weight_lb: 135, reps: 8, ...bad })
  assert.equal(r.status, 400, `${label}: ${r.text}`)
  assert.ok(r.body?.error, label)
}
assert.equal(Number(sql('SELECT COUNT(*) FROM workout_sets')), 4)
console.log('ok  Test 6: wrong values refused with per-field messages, nothing saved')

// ---------------------------------------------------------------- Test 7: duplicate and correction
expectError(await saveSet(marcus, S1.id, 'Bench press', 1, 140, 8), 409, 'Set already logged')
const fixed = await post(marcus, 'workout_sets.php', { id: bench2.body.set.id, weight_lb: 137.25, reps: 6 })
assert.equal(fixed.status, 200, fixed.text)
assert.equal(fixed.body.set.weight_lb, 137.25)
assert.equal(fixed.body.set.logged_at, bench2.body.set.logged_at)
expectError(await post(marcus, 'workout_sets.php', { id: bench2.body.set.id, weight_lb: 137.25, reps: 0 }), 400)
expectError(await post(marcus, 'workout_sets.php', { id: 999999, weight_lb: 100, reps: 5 }), 404, 'Set not found')
read = (await get(marcus, `workout_session.php?id=${S1.id}`)).body.session
assert.deepEqual(compact(read)[0], ['Bench press', ['1:135x8', '2:137.25x6']])
assert.equal(Number(sql('SELECT COUNT(*) FROM workout_sets')), 4)
console.log('ok  Test 7: duplicate set number refused, correction updates the same set')

// ---------------------------------------------------------------- Test 8: accounts stay separate
expectError(await get(dana, `workout_session.php?id=${S1.id}`), 404, 'Session not found')
expectError(await saveSet(dana, S1.id, 'Bench press', 3, 100, 5), 404, 'Session not found')
expectError(await post(dana, 'workout_sets.php', { id: bench2.body.set.id, weight_lb: 1, reps: 1 }), 404, 'Set not found')
expectError(await post(dana, 'complete_workout.php', { session_id: S1.id }), 404, 'Session not found')
assert.equal((await saveSet(dana, D1.id, 'Barbell row', 1, 95, 10)).status, 201)
expectError(await get(marcus, `workout_session.php?id=${D1.id}`), 404)
assert.equal(sql(`SELECT completed_at IS NULL FROM workout_sessions WHERE id = ${S1.id}`), '1')
assert.equal(sql(`SELECT weight_lb FROM workout_sets WHERE id = ${bench2.body.set.id}`), '137.25')
console.log('ok  Test 8: another user can neither see nor change a session')

// ---------------------------------------------------------------- Test 9: Complete needs a set
sql(`DELETE FROM workout_sets WHERE session_id = ${D1.id}`)
expectError(await post(dana, 'complete_workout.php', { session_id: D1.id }), 400, 'Log at least one set')
expectError(await post(dana, 'complete_workout.php', { session_id: 999999 }), 404)
expectError(await post(dana, 'complete_workout.php', { session_id: 'abc' }), 400)
assert.equal(sql(`SELECT completed_at IS NULL FROM workout_sessions WHERE id = ${D1.id}`), '1')
assert.equal((await get(dana, 'workout_history.php')).body.sessions.length, 0, 'an unfinished workout is not in history')
const danaAgain = await post(dana, 'workout_session.php', { day_position: 2 })
assert.equal(danaAgain.status, 200)
assert.equal(danaAgain.body.session.id, D1.id)
console.log('ok  Test 9: Complete needs at least one set')

// ---------------------------------------------------------------- Test 10: complete once, lock
const done = await post(marcus, 'complete_workout.php', { session_id: S1.id })
assert.equal(done.status, 200, done.text)
assert.deepEqual(Object.keys(done.body), ['session_id', 'completed_at'])
assert.equal(done.body.session_id, S1.id)
assert.match(done.body.completed_at, ISO)
assert.ok(Math.abs(Date.parse(done.body.completed_at) - Date.now()) < 60_000)
expectError(await post(marcus, 'complete_workout.php', { session_id: S1.id }), 409, 'Workout already completed')
assert.equal(sql(`SELECT completed_at FROM workout_sessions WHERE id = ${S1.id}`), toSql(done.body.completed_at))
expectError(await saveSet(marcus, S1.id, 'Bench press', 3, 135, 5), 409, 'Workout already completed')
expectError(await post(marcus, 'workout_sets.php', { id: bench2.body.set.id, weight_lb: 100, reps: 5 }), 409, 'Workout already completed')
read = (await get(marcus, `workout_session.php?id=${S1.id}`)).body.session
assert.equal(read.completed_at, done.body.completed_at)
assert.deepEqual({ ...read.summary, duration_seconds: undefined }, { exercise_count: 3, set_count: 4, total_reps: 36, total_volume_lb: 2553.5, duration_seconds: undefined })
assert.equal(read.summary.duration_seconds, secondsBetween(read.started_at, read.completed_at))
assert.deepEqual(compact(read)[0], ['Bench press', ['1:135x8', '2:137.25x6']])
const reopened = await post(marcus, 'workout_session.php', {})
assert.equal(reopened.status, 200)
assert.equal(reopened.body.session.id, S1.id)
assert.equal(sessionRows(MARCUS), 1)
console.log('ok  Test 10: completing works once, locks the sets, and gives a summary')

// ---------------------------------------------------------------- Test 11: simultaneous Complete
assert.equal((await saveSet(dana, D1.id, 'Barbell row', 1, 95, 10)).status, 201)
const race = await Promise.all([1, 2].map(() => post(dana, 'complete_workout.php', { session_id: D1.id })))
assert.deepEqual(race.map((r) => r.status).sort(), [200, 409], race.map((r) => r.text).join(' | '))
const winner = race.find((r) => r.status === 200)
assert.equal(sql(`SELECT completed_at FROM workout_sessions WHERE id = ${D1.id}`), toSql(winner.body.completed_at))
console.log('ok  Test 11: two Complete requests at once complete it exactly once')

// ---------------------------------------------------------------- Test 12: history
const marcusHistory = (await get(marcus, 'workout_history.php')).body.sessions
assert.deepEqual(marcusHistory, [{
  id: S1.id, name: 'Push', plan: 'Push Pull Legs', started_at: read.started_at, completed_at: done.body.completed_at,
  duration_seconds: read.summary.duration_seconds, exercise_count: 3, set_count: 4, total_volume_lb: 2553.5,
}])
const danaHistory = (await get(dana, 'workout_history.php')).body.sessions
assert.equal(danaHistory.length, 1)
assert.deepEqual([danaHistory[0].name, danaHistory[0].set_count, danaHistory[0].total_volume_lb], ['Pull', 1, 950])
assert.deepEqual((await get(priya, 'workout_history.php')).body, { sessions: [] })
console.log('ok  Test 12: history lists only the user\'s completed workouts')

// ---------------------------------------------------------------- Test 13: bad requests
expectError(await get(marcus, 'workout_sets.php'), 405, 'Method not allowed.')
expectError(await get(marcus, 'complete_workout.php'), 405)
expectError(await post(marcus, 'workout_history.php', {}), 405)
expectError(await post(marcus, 'workout_sets.php', null, { raw: 'not json' }), 400)
expectError(await post(marcus, 'complete_workout.php', null, { raw: 'session_id=1', contentType: 'application/x-www-form-urlencoded' }), 415)
expectError(await get(marcus, 'workout_session.php'), 400)
expectError(await get(marcus, 'workout_session.php?id=abc'), 400)
expectError(await get(marcus, 'workout_session.php?id=999999'), 404)
for (const r of [await get(marcus, 'workout_session.php?id=abc'), await saveSet(marcus, S1.id, 'Bench press', 1, 'x', 'y')]) {
  assert.ok(!/<br|Warning:|\/Users\//.test(r.text), r.text)
}
console.log('ok  Test 13: bad requests get JSON errors')

// ---------------------------------------------------------------- Test 15: times
const t0 = Date.now()
const jFirst = await post(jordan, 'workout_session.php', { day_position: 1, started_at: '2020-01-01T00:00:00Z' })
assert.equal(jFirst.status, 201, jFirst.text)
const J1 = jFirst.body.session
assert.ok(Date.parse(J1.started_at) >= t0 - 1000 && Date.parse(J1.started_at) <= t0 + 10_000, J1.started_at)
await sleep(5000)
const jSet1 = (await saveSet(jordan, J1.id, 'Bench press', 1, 135, 8, { logged_at: '2020-01-01T00:00:00Z' })).body.set
assert.ok(secondsBetween(J1.started_at, jSet1.logged_at) >= 5, 'logged_at is when it was saved, not what the client sent')
assert.equal(jSet1.updated_at, jSet1.logged_at)
await sleep(3000)
const jFixed = (await post(jordan, 'workout_sets.php', { id: jSet1.id, weight_lb: 140, reps: 8, updated_at: '2020-01-01T00:00:00Z' })).body.set
assert.equal(jFixed.logged_at, jSet1.logged_at)
assert.ok(secondsBetween(jSet1.logged_at, jFixed.updated_at) >= 3)
const jSet2 = (await saveSet(jordan, J1.id, 'Bench press', 2, 140, 6)).body.set
assert.ok(Date.parse(jSet2.logged_at) > Date.parse(jSet1.logged_at))
await sleep(5000)
const jDone = (await post(jordan, 'complete_workout.php', { session_id: J1.id })).body
assert.ok(secondsBetween(jSet2.logged_at, jDone.completed_at) >= 5)
assert.ok(Date.parse(jDone.completed_at) <= Date.now() + 1000)
const jRead = (await get(jordan, `workout_session.php?id=${J1.id}`)).body.session
assert.equal(jRead.summary.duration_seconds, secondsBetween(jRead.started_at, jDone.completed_at))
assert.ok(jRead.summary.duration_seconds >= 13 && jRead.summary.duration_seconds <= 25, jRead.summary.duration_seconds)
const jHist = (await get(jordan, 'workout_history.php')).body.sessions[0]
assert.deepEqual([jHist.started_at, jHist.completed_at, jHist.duration_seconds], [jRead.started_at, jDone.completed_at, jRead.summary.duration_seconds])
expectError(await post(jordan, 'complete_workout.php', { session_id: J1.id }), 409)
assert.equal((await get(jordan, `workout_session.php?id=${J1.id}`)).body.session.completed_at, jDone.completed_at)
const [dbNow, dbStart, dbDone, dbDiff] = sql(`SELECT UTC_TIMESTAMP(), started_at, completed_at, TIMESTAMPDIFF(SECOND, started_at, completed_at) FROM workout_sessions WHERE id = ${J1.id}`).split('\t')
assert.equal(dbStart, toSql(J1.started_at))
assert.equal(dbDone, toSql(jDone.completed_at))
assert.equal(Number(dbDiff), jRead.summary.duration_seconds)
assert.ok(Math.abs(Date.parse(dbNow.replace(' ', 'T') + 'Z') - Date.now()) < 60_000, 'times are stored in UTC')
for (const text of [J1.started_at, jSet1.logged_at, jFixed.updated_at, jDone.completed_at]) assert.match(text, ISO)
console.log('ok  Test 15: times are set by the server, in UTC, and agree')

// ---------------------------------------------------------------- Test 16: 24-hour rule, history order
sql(`DELETE FROM workout_sessions WHERE user_id = (SELECT id FROM users WHERE email = '${JORDAN}')`)
const setStarted = (id, hours) => sql(`UPDATE workout_sessions SET started_at = UTC_TIMESTAMP() - INTERVAL ${hours} HOUR WHERE id = ${id}`)
const K1 = (await post(jordan, 'workout_session.php', { day_position: 2 })).body.session
setStarted(K1.id, 23)
const stillK1 = await post(jordan, 'workout_session.php', { day_position: 2 })
assert.deepEqual([stillK1.status, stillK1.body.session.id], [200, K1.id])
setStarted(K1.id, 25)
const k2 = await post(jordan, 'workout_session.php', { day_position: 2 })
assert.equal(k2.status, 201)
const K2 = k2.body.session
assert.notEqual(K2.id, K1.id)
assert.equal(sql(`SELECT completed_at IS NULL FROM workout_sessions WHERE id = ${K1.id}`), '1')
assert.equal((await saveSet(jordan, K2.id, 'Barbell row', 1, 95, 10)).status, 201)
assert.equal((await post(jordan, 'complete_workout.php', { session_id: K2.id })).status, 200)
sql(`UPDATE workout_sessions SET started_at = UTC_TIMESTAMP() - INTERVAL 30 HOUR, completed_at = UTC_TIMESTAMP() - INTERVAL 29 HOUR WHERE id = ${K2.id}`)
const k3 = await post(jordan, 'workout_session.php', { day_position: 2 })
assert.equal(k3.status, 201, 'a workout completed 29 hours ago does not block a new one')
const K3 = k3.body.session
assert.equal((await saveSet(jordan, K3.id, 'Barbell row', 1, 135, 5)).status, 201)
assert.equal((await post(jordan, 'complete_workout.php', { session_id: K3.id })).status, 200)
const order = (await get(jordan, 'workout_history.php')).body.sessions
assert.deepEqual(order.map((s) => s.id), [K3.id, K2.id])
assert.equal(order[1].duration_seconds, 3600)
assert.equal(sessionRows(JORDAN), 3)
console.log('ok  Test 16: only the last 24 hours count as today; history ordered by completion')

// ---------------------------------------------------------------- today's scheduled day (Sean)
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' }).format(new Date())
const slot = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(weekday)
const scheduled = await post(sean, 'workout_session.php', {})
if (slot === -1) {
  expectError(scheduled, 409, 'Rest day')
} else {
  assert.equal(scheduled.status, 201, scheduled.text)
  assert.equal(scheduled.body.session.name, ['Push', 'Pull', 'Legs'][slot % 3])
}
console.log(`ok  today's scheduled day (${weekday}): ${slot === -1 ? 'rest day' : scheduled.body.session.name}`)

// ---------------------------------------------------------------- Test 17: other features, cascade
assert.equal((await get(marcus, 'current_plan.php')).body.plan.name, 'Push Pull Legs')
assert.equal((await get(marcus, 'session.php')).body.user.email, MARCUS)
const email = `workout-test-${Date.now()}@example.com`
const password = 'LocalTestPass12!'
assert.equal((await post(null, 'register.php', { full_name: 'Workout Test', email, password, confirm_password: password })).status, 201)
const temp = await login(email, password)
assert.equal((await post(temp, 'current_plan.php', { plan_id: pplId })).status, 200)
const tempSession = (await post(temp, 'workout_session.php', { day_position: 1 })).body.session
assert.equal((await saveSet(temp, tempSession.id, 'Bench press', 1, 135, 8)).status, 201)
sql(`DELETE FROM users WHERE email = '${email}'`)
assert.equal(Number(sql(`SELECT COUNT(*) FROM workout_sessions WHERE id = ${tempSession.id}`)) + Number(sql(`SELECT COUNT(*) FROM workout_sets WHERE session_id = ${tempSession.id}`)), 0)
console.log('ok  Test 17: other endpoints unchanged; deleting a user deletes their workouts')

sql("DELETE FROM workout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com')")
console.log('PASS: workout sessions, sets, validation, accounts, completion, history, times')
