// Local HTTP check for card #123's two summary demonstrations. No Playwright or shared server.
// Run with GYMRANK_TEST_PASSWORD set and PHP serving api/ on 127.0.0.1:8001.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const base = new URL(process.env.GYMRANK_LOCAL_API || 'http://127.0.0.1:8001/')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:') {
  throw new Error('This check only runs against a local HTTP server')
}
const password = process.env.GYMRANK_TEST_PASSWORD
if (!password) throw new Error('Set GYMRANK_TEST_PASSWORD for the dedicated test accounts')

async function request(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json()
  assert.equal(response.status, 200, `${path}: ${response.status} ${data.error || ''}`)
  return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

const demos = [
  { alias: 'one', test: 3, target: 3, reached: false },
  { alias: 'finish', test: 4, target: 1, reached: true },
]
const cookies = new Map()
const nyDate = (value) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
const weekDay = (monday, offset) => {
  const date = new Date(`${monday}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

for (const demo of demos) {
  const email = `weekly123-${demo.alias}@example.com`
  const client_id = randomUUID()
  let run = { test: demo.test, client_id, run_id: randomUUID() }
  const login = () => request('login.php', { method: 'POST', body: { email, password, weekly123_run: run } })
  let { cookie } = await login()
  assert.ok(cookie?.startsWith('gymrank_session='), `${demo.alias}: login cookie missing`)

  const setup = (await request('setup.php', { cookie })).data
  assert.equal(setup.experience, 'beginner', `${demo.alias}: onboarding experience`)
  assert.ok(setup.equipment.includes('full_gym'), `${demo.alias}: onboarding equipment`)
  const preferences = (await request('preferences.php', { cookie })).data
  assert.equal(preferences.training_goal, 'strength', `${demo.alias}: onboarding goal`)
  const details = (await request('personal_details.php', { cookie })).data
  assert.equal(details.complete, true, `${demo.alias}: onboarding personal details`)
  const plan = (await request('current_plan.php', { cookie })).data
  assert.equal(plan.plan?.name, 'Beginner Fundamentals', `${demo.alias}: selected plan`)
  let goal = (await request('weekly_goal.php', { cookie })).data
  assert.equal(goal.target_days, demo.target, `${demo.alias}: starting target`)
  assert.equal(goal.completed_count, 0, `${demo.alias}: starting completed days`)
  const current = (await request('workout_session.php?current=1', { cookie })).data.session
  assert.ok(current?.id && !current.completed_at, `${demo.alias}: unfinished workout missing`)
  assert.ok(current.exercises.flatMap(exercise => exercise.sets).some(set =>
    Number(set.weight_lb) === 135 && Number(set.reps) === 8), `${demo.alias}: saved set missing`)
  const reopened = (await request('workout_session.php', { method: 'POST', body: {}, cookie })).data.session
  assert.equal(reopened.id, current.id, `${demo.alias}: active route did not resume today's workout`)

  await request('complete_workout.php', { method: 'POST', body: { session_id: current.id }, cookie })
  const snapshotPath = `workout_weekly_goal.php?session_id=${current.id}`
  const saved = (await request(snapshotPath, { cookie })).data.snapshot
  assert.equal(saved.target_days, demo.target, `${demo.alias}: saved target`)
  assert.equal(saved.completed_count, 1, `${demo.alias}: saved day count`)
  assert.deepEqual(saved.completed_dates, [nyDate(new Date())], `${demo.alias}: completed date`)
  assert.equal(saved.progress_days, 1, `${demo.alias}: saved progress`)
  assert.equal(saved.progress_percent, demo.reached ? 100 : 33, `${demo.alias}: progress indicator`)
  assert.equal(saved.goal_reached, demo.reached, `${demo.alias}: completion feedback`)
  assert.equal(saved.credited_day, true, `${demo.alias}: credited day`)
  const completedSession = (await request('workout_session.php?id=' + current.id, { cookie })).data.session
  assert.equal(completedSession.summary.set_count, 1, `${demo.alias}: saved set count`)
  assert.equal(Number(completedSession.summary.total_volume_lb), 1080, `${demo.alias}: saved total volume`)
  goal = (await request('weekly_goal.php', { cookie })).data
  assert.equal(goal.target_days, demo.target)
  assert.equal(goal.completed_count, 1, `${demo.alias}: Home/Weekly goal API count`)
  assert.equal(goal.progress_days, saved.progress_days, `${demo.alias}: current progress differs from summary`)
  assert.equal(goal.goal_reached, demo.reached, `${demo.alias}: current completion feedback`)
  assert.deepEqual(goal.completed_dates, saved.completed_dates, `${demo.alias}: live and saved dates differ`)

  await request('weekly_goal.php', { method: 'POST', body: { week: 'next', target_days: demo.target + 1 }, cookie })
  assert.deepEqual((await request(snapshotPath, { cookie })).data.snapshot, saved,
    `${demo.alias}: goal change altered saved result`)
  await request('logout.php', { method: 'POST', body: {}, cookie })
  ;({ cookie } = await login()) // Same run ID: logout/re-login must not reset the fixture.
  assert.deepEqual((await request(snapshotPath, { cookie })).data.snapshot, saved,
    `${demo.alias}: re-login altered saved result`)
  cookies.set(demo.alias, { cookie, currentId: current.id, saved })

  // A new Start Test selection changes the run ID and restores the initial fixture.
  run = { ...run, run_id: randomUUID() }
  ;({ cookie } = await login())
  goal = (await request('weekly_goal.php', { cookie })).data
  assert.equal(goal.completed_count, 0, `${demo.alias}: explicit new start did not reset`)
  assert.equal(goal.target_days, demo.target)
  assert.equal(goal.next_week.target_days, null, `${demo.alias}: next-week choice survived reset`)
  const fresh = (await request('workout_session.php?current=1', { cookie })).data.session
  assert.ok(fresh?.id && fresh.id !== current.id, `${demo.alias}: fresh unfinished workout missing`)
  await request('weekly123_test_end.php', { method: 'POST', body: { client_id, run_id: run.run_id }, cookie })
  cookies.set(demo.alias, { cookie, currentId: fresh.id })
}

// Preparing one dedicated account never resets the other account's new fixture.
const first = cookies.get('one')
const firstGoal = (await request('weekly_goal.php', { cookie: first.cookie })).data
assert.equal(firstGoal.target_days, 3)
assert.equal(firstGoal.completed_count, 0)
assert.equal((await request('workout_session.php?current=1', { cookie: first.cookie })).data.session.id, first.currentId)

// The previous-week fixture exercises reopening after a New York Monday rollover.
const historyEmail = 'weekly123-history@example.com'
const historyRun = { test: 14, client_id: randomUUID(), run_id: randomUUID() }
const historyCookie = (await request('login.php', {
  method: 'POST', body: { email: historyEmail, password, weekly123_run: historyRun },
})).cookie
const historyGoal = (await request('weekly_goal.php', { cookie: historyCookie })).data
assert.equal(historyGoal.target_days, 4)
assert.equal(historyGoal.completed_count, 0)
const sessions = (await request('workout_history.php', { cookie: historyCookie })).data.sessions
const previousMonday = weekDay(historyGoal.week_start, -7)
const wednesday = sessions.find(session => session.completed_at && nyDate(session.completed_at) === weekDay(previousMonday, 2))
const friday = sessions.find(session => session.completed_at && nyDate(session.completed_at) === weekDay(previousMonday, 4))
assert.ok(wednesday && friday, 'history: Wednesday or Friday workout missing')
const historicalPath = `workout_weekly_goal.php?session_id=${wednesday.id}`
const historical = (await request(historicalPath, { cookie: historyCookie })).data.snapshot
assert.equal(historical.target_days, 3)
assert.equal(historical.completed_count, 2)
assert.deepEqual(historical.completed_dates, [previousMonday, weekDay(previousMonday, 2)],
  'history: Wednesday should have only Monday and Wednesday')
const fridaySaved = (await request(`workout_weekly_goal.php?session_id=${friday.id}`, { cookie: historyCookie })).data.snapshot
assert.equal(fridaySaved.completed_count, 3, 'history: Friday should reach the goal')
assert.equal(fridaySaved.goal_reached, true, 'history: Friday goal-complete feedback missing')
assert.deepEqual((await request(historicalPath, { cookie: historyCookie })).data.snapshot, historical,
  'history: Wednesday changed after Friday completion')
assert.notEqual(historical.week_start, historyGoal.week_start, 'historical snapshot uses current week')
await request('weekly_goal.php', { method: 'POST', body: { week: 'next', target_days: 5 }, cookie: historyCookie })
assert.deepEqual((await request(historicalPath, { cookie: historyCookie })).data.snapshot, historical,
  'historical summary changed after a later goal change')
await request('weekly123_test_end.php', { method: 'POST', body: {
  client_id: historyRun.client_id, run_id: historyRun.run_id,
}, cookie: historyCookie })

async function fixture(alias, test) {
  const run = { test, client_id: randomUUID(), run_id: randomUUID() }
  const cookie = (await request('login.php', { method: 'POST', body: {
    email: `weekly123-${alias}@example.com`, password, weekly123_run: run,
  } })).cookie
  return { cookie, run, finish: () => request('weekly123_test_end.php', {
    method: 'POST', body: { client_id: run.client_id, run_id: run.run_id }, cookie,
  }) }
}

const duplicate = await fixture('duplicate', 5)
const duplicateGoal = (await request('weekly_goal.php', { cookie: duplicate.cookie })).data
assert.equal(duplicateGoal.completed_count, 0, 'duplicate: previous workouts leaked into Home')
const duplicateSessions = (await request('workout_history.php', { cookie: duplicate.cookie })).data.sessions
assert.equal(duplicateSessions.length, 3, 'duplicate: expected three historical workouts')
const duplicateSnapshots = []
for (const session of duplicateSessions.slice().reverse()) {
  duplicateSnapshots.push((await request(`workout_weekly_goal.php?session_id=${session.id}`, { cookie: duplicate.cookie })).data.snapshot)
}
assert.deepEqual(duplicateSnapshots.map(snapshot => snapshot.completed_count), [1, 1, 2],
  'duplicate: same-day sessions must count one date')
assert.deepEqual(duplicateSnapshots.map(snapshot => snapshot.credited_day), [true, false, true],
  'duplicate: only first session on each date gets credit')
await duplicate.finish()

const legacy = await fixture('legacy', 15)
const legacySession = (await request('workout_history.php', { cookie: legacy.cookie })).data.sessions[0]
const legacyResult = (await request(`workout_weekly_goal.php?session_id=${legacySession.id}`, { cookie: legacy.cookie })).data
assert.deepEqual(legacyResult, { snapshot: null, reason: 'not_saved' },
  'legacy: invented a historical weekly result')
assert.equal((await request(`workout_session.php?id=${legacySession.id}`, { cookie: legacy.cookie })).data.session.summary.set_count,
  1, 'legacy: workout totals disappeared')
await legacy.finish()

console.log('ok card #123 demos, history, duplicate days, legacy fallback, relogin, reset and isolation')
