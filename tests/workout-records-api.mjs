// Backend checks for story #12: comparisons and personal records (card #137 task tests 1 to 10).
// Run against a LOCAL PHP server and a database that has migrations 001-018:
//   php -S localhost:8000 -t api
//   node tests/workout-records-api.mjs
// It loads database/seeds/workout_records.sql itself (twice, which also checks that the seed can be run again), logs in as
// the summary-pr-*@example.com accounts, completes their unfinished workouts, and reloads the seed at the end so the
// accounts are ready again. It needs the `mysql` command; set WORKOUT_TEST_DB / WORKOUT_TEST_MYSQL_USER (and MYSQL_PWD)
// if your local database isn't `cse442_2026_fall_team_y_db` with a passwordless root. The base must be local.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = process.env.WORKOUT_TEST_BASE || 'http://localhost:8000'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a local test server')
const database = process.env.WORKOUT_TEST_DB || 'cse442_2026_fall_team_y_db'
const mysqlUser = process.env.WORKOUT_TEST_MYSQL_USER || 'root'
const sql = (query) => execFileSync('mysql', ['-u', mysqlUser, '-N', '-B', database, '-e', query], { encoding: 'utf8' }).trim()
const loadSeed = () => execFileSync('mysql', ['--default-character-set=utf8mb4', '-u', mysqlUser, database],
  { input: readFileSync(new URL('../database/seeds/workout_records.sql', import.meta.url)), stdio: ['pipe', 'ignore', 'inherit'] })
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

async function call(jar, method, path, body) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: { ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}), ...(jar?.cookie ? { Cookie: jar.cookie } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave null so the assertions show the raw page */ }
  return { status: response.status, body: json, text, type: response.headers.get('content-type'), allow: response.headers.get('allow'), cookie: response.headers.get('set-cookie') }
}
const get = (jar, path) => call(jar, 'GET', path)
const post = (jar, path, body) => call(jar, 'POST', path, body)

async function login(n) {
  const response = await post(null, 'login.php', { email: `summary-pr-${n}@example.com`, password: 'Summary-PR-Test-12!' })
  assert.equal(response.status, 200, `login ${n}: ${response.text} (the seed must have loaded)`)
  return { cookie: response.cookie.split(';')[0] }
}
function expectError(response, status, error, errors) {
  assert.equal(response.status, status, response.text)
  assert.match(response.type, /application\/json/)
  assert.equal(response.body.error, error)
  if (errors !== undefined) assert.deepEqual(response.body.errors, errors)
}

// session ids: the seed's workouts of account n, completed ones oldest first, and the unfinished one
const completed = (n) => sql(`SELECT s.id FROM workout_sessions s JOIN users u ON u.id = s.user_id WHERE u.email = 'summary-pr-${n}@example.com' AND s.completed_at IS NOT NULL ORDER BY s.completed_at, s.id`).split('\n').map(Number)
const unfinished = (n) => Number(sql(`SELECT s.id FROM workout_sessions s JOIN users u ON u.id = s.user_id WHERE u.email = 'summary-pr-${n}@example.com' AND s.completed_at IS NULL`))
const records = (jar, id) => get(jar, `workout_records.php?session_id=${id}`)

// Logs one set in the account's unfinished workout, completes it and returns its records.
async function finish(jar, id, exercise, weight_lb, reps) {
  const set = await post(jar, 'workout_sets.php', { session_id: id, exercise, set_number: 1, weight_lb, reps })
  assert.equal(set.status, 201, set.text)
  const done = await post(jar, 'complete_workout.php', { session_id: id })
  assert.equal(done.status, 200, done.text)
  const response = await records(jar, id)
  assert.equal(response.status, 200, response.text)
  assert.match(response.type, /application\/json/)
  return response.body
}
const only = (body) => { assert.equal(body.exercises.length, 1); return body.exercises[0] }

// ---------------------------------------------------------------- Test 1: seed
loadSeed()
loadSeed()
sql('DELETE FROM auth_attempts')
assert.equal(sql("SELECT COUNT(*) FROM workout_sessions s JOIN users u ON u.id = s.user_id WHERE u.email LIKE 'summary-pr-%@example.com'"), '25')
assert.equal(sql("SELECT COUNT(*) FROM users WHERE email LIKE 'summary-pr-%@example.com' AND is_test = 1"), '11')
assert.equal(sql("SELECT COUNT(*) FROM workout_sets ws JOIN workout_sessions s ON s.id = ws.session_id JOIN users u ON u.id = s.user_id WHERE u.email = 'summary-pr-1@example.com' AND s.completed_at IS NULL"), '0')
const jars = {}
for (const n of [1, 2, 3, 4, 5, 6, 7, 9, 10, 11]) jars[n] = await login(n)
console.log('1 ok: seed (twice), 25 workouts, 11 test accounts')

// ---------------------------------------------------------------- Test 2: access
const c7 = completed(7)
expectError(await get(null, `workout_records.php?session_id=${c7[1]}`), 401, 'Please log in.')
const post405 = await post(jars[1], 'workout_records.php', {})
expectError(post405, 405, 'Method not allowed.')
assert.equal(post405.allow, 'GET')
for (const q of ['', '?session_id=abc', '?session_id=0', '?session_id=-3', '?session_id=1.5', '?session_id=1e3', '?session_id[]=7']) {
  expectError(await get(jars[1], `workout_records.php${q}`), 400, 'Invalid request.', { session_id: 'Use a whole number.' })
}
const foreign = await records(jars[1], c7[1])
const missing = await records(jars[1], 999999999)
expectError(foreign, 404, 'Session not found')
assert.deepEqual(foreign.body, missing.body, 'another person\'s workout looks like one that does not exist')
expectError(await records(jars[1], unfinished(1)), 409, 'Workout not completed')
const ignored = await get(jars[7], `workout_records.php?session_id=${c7[1]}&user_id=1&email=summary-pr-1@example.com`)
assert.equal(ignored.status, 200, ignored.text)
console.log('2 ok: 401, 405, 400, 404, 409 and ignored user_id')

// ---------------------------------------------------------------- Test 3: heavier set is a record
const heavier = await finish(jars[1], unfinished(1), 'Bench press', 105, 5)
assert.equal(heavier.session_id, completed(1).at(-1))
assert.equal(heavier.new_pr_count, 1)
const e3 = only(heavier)
assert.match(e3.previous.completed_at, ISO)
assert.deepEqual({ ...e3, previous: { ...e3.previous, completed_at: undefined } }, {
  exercise: 'Bench press', metric: 'weight', top_set: { weight_lb: 105, reps: 5 },
  previous: { weight_lb: 100, reps: 5, completed_at: undefined }, change: 5,
  best_before: { weight_lb: 100, reps: 5 }, is_baseline: false, is_pr: true,
})
assert.deepEqual((await records(jars[1], heavier.session_id)).body, heavier, 'same body on a second read')
console.log('3 ok: 105 x 5 after 100 x 5 is a record')

// ---------------------------------------------------------------- Test 4: lower result
const lower = await finish(jars[2], unfinished(2), 'Bench press', 95, 5)
assert.equal(lower.new_pr_count, 0)
assert.deepEqual([only(lower).change, only(lower).best_before, only(lower).is_pr, only(lower).is_baseline], [-5, { weight_lb: 100, reps: 5 }, false, false])
console.log('4 ok: 95 x 5 is -5 lb and not a record')

// ---------------------------------------------------------------- Test 5: baseline
const baseline = await finish(jars[3], unfinished(3), 'Bench press', 100, 5)
assert.equal(baseline.new_pr_count, 0)
assert.deepEqual(only(baseline), { exercise: 'Bench press', metric: 'weight', top_set: { weight_lb: 100, reps: 5 }, previous: null, change: null, best_before: null, is_baseline: true, is_pr: false })
console.log('5 ok: a first result is a baseline')

// ---------------------------------------------------------------- Test 6: previous vs all-time best
const older = await finish(jars[4], unfinished(4), 'Bench press', 105, 5)
assert.equal(older.new_pr_count, 0)
assert.deepEqual([only(older).previous.weight_lb, only(older).change, only(older).best_before, only(older).is_pr], [100, 5, { weight_lb: 110, reps: 5 }, false])
console.log('6 ok: +5 lb on the previous workout, but the older 110 lb best stands')

// ---------------------------------------------------------------- Test 7: tie and different reps
const tie = await finish(jars[5], unfinished(5), 'Bench press', 100, 5)
assert.equal(tie.new_pr_count, 0)
assert.deepEqual([only(tie).change, only(tie).is_pr], [0, false])
const reps = await finish(jars[6], unfinished(6), 'Bench press', 105, 5)
assert.equal(reps.new_pr_count, 1)
assert.deepEqual([only(reps).previous.weight_lb, only(reps).previous.reps, only(reps).change, only(reps).is_pr], [100, 8, 5, true])
console.log('7 ok: a tie is not a record; 105 x 5 after 100 x 8 is')

// ---------------------------------------------------------------- Test 8: only earlier workouts count
const before = (await records(jars[7], c7[1])).body
assert.deepEqual([before.new_pr_count, only(before).previous.weight_lb, only(before).change, only(before).is_pr], [1, 100, 5, true])
const latest = await finish(jars[7], unfinished(7), 'Bench press', 110, 5)
assert.deepEqual([latest.new_pr_count, only(latest).previous.weight_lb, only(latest).change], [1, 105, 5])
assert.deepEqual((await records(jars[7], c7[1])).body, before, 'a later workout must not change an earlier summary')
const first = only((await records(jars[7], c7[0])).body)
assert.deepEqual([first.is_baseline, first.is_pr], [true, false])
console.log('8 ok: later workouts never change an earlier summary')

// ---------------------------------------------------------------- Test 9: same day, unfinished sets
const [c10a, c10b] = completed(10)
assert.equal(sql(`SELECT COUNT(DISTINCT DATE(completed_at)) FROM workout_sessions WHERE id IN (${c10a}, ${c10b})`), '1')
const morning = only((await records(jars[10], c10a)).body)
const evening = only((await records(jars[10], c10b)).body)
assert.deepEqual([morning.is_baseline, morning.is_pr], [true, false])
assert.deepEqual([evening.previous.weight_lb, evening.change, evening.is_pr], [100, 5, true])
const c11 = only((await records(jars[11], completed(11)[1])).body)
assert.deepEqual([c11.previous.weight_lb, c11.best_before, c11.is_pr], [100, { weight_lb: 100, reps: 5 }, true])
console.log('9 ok: same-day workouts are separate; an unfinished 300 lb set is ignored')

// ---------------------------------------------------------------- Test 10: bodyweight
const pushup = await finish(jars[9], unfinished(9), 'Push-up', 0, 12)
assert.equal(pushup.new_pr_count, 1)
assert.deepEqual(only(pushup), {
  exercise: 'Push-up', metric: 'reps', top_set: { weight_lb: 0, reps: 12 },
  previous: { weight_lb: 0, reps: 8, completed_at: only(pushup).previous.completed_at }, change: 4,
  best_before: { weight_lb: 0, reps: 10 }, is_baseline: false, is_pr: true,
})
console.log('10 ok: bodyweight is measured by reps')

// ---------------------------------------------------------------- Progress page agrees (card Test 11, step 1)
const progress = await get(jars[7], 'exercise_progress.php')
assert.equal(progress.body.summary.new_prs, 2)
let total = 0
for (const id of completed(7)) total += (await records(jars[7], id)).body.new_pr_count
assert.equal(total, progress.body.summary.new_prs, 'workout_records counts what exercise_progress counts')

loadSeed()
sql('DELETE FROM auth_attempts')
console.log('all workout records checks passed (seed reloaded)')
