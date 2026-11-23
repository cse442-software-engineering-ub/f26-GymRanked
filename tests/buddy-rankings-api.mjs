// Backend checks for story #78: Buddies rankings (card #138 task tests).
// Run against a LOCAL PHP server and a database that has migrations 001-018:
//   php -S localhost:8000 -t api
//   node tests/buddy-rankings-api.mjs
// It loads database/seeds/buddy_rankings.sql itself (twice, which also checks that the seed can be run again), logs in as
// the crew-*@example.com accounts and leaves the seed's state behind. It needs the `mysql` command; set WORKOUT_TEST_DB /
// WORKOUT_TEST_MYSQL_USER (and MYSQL_PWD) if your local database isn't `cse442_2026_fall_team_y_db` with a passwordless
// root. The shared aptitude and cattle databases are never touched: the base must be local.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = process.env.WORKOUT_TEST_BASE || 'http://localhost:8000'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a local test server')
const database = process.env.WORKOUT_TEST_DB || 'cse442_2026_fall_team_y_db'
const mysqlUser = process.env.WORKOUT_TEST_MYSQL_USER || 'root'
const sql = (query) => execFileSync('mysql', ['-u', mysqlUser, '-N', '-B', database, '-e', query], { encoding: 'utf8' }).trim()
const loadSeed = () => execFileSync('mysql', ['--default-character-set=utf8mb4', '-u', mysqlUser, database],
  { input: readFileSync(new URL('../database/seeds/buddy_rankings.sql', import.meta.url)), stdio: ['pipe', 'ignore', 'inherit'] })

async function call(jar, method, path) {
  const response = await fetch(`${base}/${path}`, { method, headers: jar?.cookie ? { Cookie: jar.cookie } : {} })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave null so the assertions show the raw page */ }
  return { status: response.status, body: json, text, type: response.headers.get('content-type'), allow: response.headers.get('allow') }
}
const get = (jar, path) => call(jar, 'GET', path)
async function login(name) {
  const response = await fetch(`${base}/login.php`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `crew-${name}@example.com`, password: 'Crew-Test-78!' }),
  })
  assert.equal(response.status, 200, `login ${name}: ${await response.text()} (the seed must have loaded)`)
  return { cookie: response.headers.get('set-cookie').split(';')[0] }
}
const names = (rows) => rows.map((r) => r.name)
const ranks = (rows) => rows.map((r) => r.rank)
const noNow = (body) => ({ ...body, now: undefined })

// ---------------------------------------------------------------- Test 1: seed
loadSeed()
loadSeed()
sql('DELETE FROM auth_attempts')
assert.equal(sql("SELECT CONCAT(g.name, ':', COUNT(*)) FROM buddy_groups g JOIN buddy_members m ON m.group_id = g.id WHERE g.name IN ('Northside Crew','Eastside Lifters') GROUP BY g.id ORDER BY g.id"), 'Northside Crew:13\nEastside Lifters:4')
assert.equal(sql("SELECT COUNT(*) FROM users u LEFT JOIN buddy_members m ON m.user_id = u.id WHERE u.email LIKE 'crew-%@example.com' AND m.id IS NULL"), '1')
assert.equal(sql("SELECT COUNT(*) FROM users WHERE email LIKE 'crew-%@example.com' AND is_test = 1"), '18')
const nora = await login('nora'), gus = await login('gus'), ola = await login('ola'), zed = await login('zed')
console.log('1 ok: seed (twice), two groups of 13 and 4, one account in no group')

// ---------------------------------------------------------------- Test 2: login, methods, bad scope
for (const path of ['leaderboard.php?scope=buddies', 'weekly_standings.php?scope=buddies']) {
  const r = await get(null, path)
  assert.deepEqual([r.status, r.body], [401, { error: 'Please log in.' }])
}
for (const path of ['leaderboard.php?scope=team', 'leaderboard.php?scope=Buddies', 'weekly_standings.php?scope=', 'weekly_standings.php?scope[]=buddies']) {
  const r = await get(nora, path)
  assert.equal(r.status, 400, r.text)
  assert.deepEqual(r.body, { error: 'Invalid request.', errors: { scope: 'Use everyone or buddies.' } })
}
assert.equal((await call(nora, 'PUT', 'leaderboard.php?scope=buddies')).status, 405)
console.log('2 ok: 401, 400 for a bad scope, 405')

// ---------------------------------------------------------------- Test 3: Everyone is unchanged
for (const path of ['leaderboard.php?board=overall', 'weekly_standings.php']) {
  const plain = await get(nora, path), explicit = await get(nora, `${path}${path.includes('?') ? '&' : '?'}scope=everyone`)
  assert.equal(plain.status, 200, plain.text)
  assert.deepEqual(noNow(plain.body), noNow(explicit.body))
  for (const key of ['group', 'unranked', 'goals']) assert.ok(!(key in plain.body), `${path} has no ${key} on Everyone`)
}
assert.equal((await get(nora, 'leaderboard.php')).body.me.reason, 'test_account', 'crew accounts stay off the public boards')
console.log('3 ok: Everyone has no Buddies keys, and the crew accounts are still test accounts there')

// ---------------------------------------------------------------- Test 4 to 6: Strength Buddies
const north = (await get(nora, 'leaderboard.php?board=overall&scope=buddies')).body
assert.deepEqual(north.group, { name: 'Northside Crew', member_count: 13 })
assert.equal(north.ranked_count, 11)
assert.deepEqual(names(north.rows), ['Nora V.', 'Eli M.', 'Ana R.', 'Ben R.', 'Fay S.', 'Gus H.', 'Hal D.', 'Ira C.', 'Jon P.', 'Kai L.', 'Lea M.'])
assert.deepEqual(ranks(north.rows), [1, 2, 3, 3, 5, 6, 7, 8, 9, 10, 11], 'a tie shares a rank and the next rank is skipped; no top-10 cut')
assert.equal(north.rows[2].score, north.rows[3].score)
assert.ok(north.rows.every((r) => r.gap_before === false && r.lift === null))
assert.deepEqual(north.rows.map((r) => r.is_me), north.rows.map((r) => r.name === 'Nora V.'))
assert.deepEqual([north.me.ranked, north.me.rank, north.me.reason], [true, 1, null])
assert.deepEqual(north.unranked, [{ name: 'Cal D.' }, { name: 'Dev S.' }], 'names only, A to Z')
for (const board of ['bench', 'squat', 'deadlift']) {
  const b = (await get(nora, `leaderboard.php?board=${board}&scope=buddies`)).body
  assert.deepEqual(names(b.rows), names(north.rows), `${board} follows the same order`)
  assert.ok(b.rows.every((r) => r.lift === board))
}
const east = (await get(ola, 'leaderboard.php?board=overall&scope=buddies')).body
assert.deepEqual(east.group, { name: 'Eastside Lifters', member_count: 4 })
assert.deepEqual(names(east.rows), ['Raf S.', 'Ola F.', 'Pia Q.'])
assert.deepEqual(ranks(east.rows), [1, 2, 3])
assert.deepEqual(east.unranked, [{ name: 'Tim W.' }])
const eastBench = (await get(ola, 'leaderboard.php?board=bench&scope=buddies')).body
assert.deepEqual([eastBench.ranked_count, eastBench.unranked], [4, []], 'Tim has a bench lift, so he is ranked on that board')
const alone = (await get(zed, 'leaderboard.php?board=overall&scope=buddies')).body
assert.deepEqual([alone.group, alone.rows, alone.unranked, alone.ranked_count, alone.me.ranked, alone.me.reason], [null, [], [], 0, false, 'no_group'])
console.log('4-6 ok: every ranked member, tie, unranked by name only, no group')

// ---------------------------------------------------------------- Test 7: Weekly Consistency
const week = (await get(nora, 'weekly_standings.php?scope=buddies')).body
assert.deepEqual(week.group, { name: 'Northside Crew', member_count: 13 })
assert.deepEqual(week.goals.map((g) => g.target_days), [3, 4, 5])
const table = (g) => g.rows.map((r) => [r.name, r.rank, r.progress_days])
assert.deepEqual(table(week.goals[0]), [['Eli M.', 1, 3], ['Lea M.', 1, 3], ['Nora V.', 1, 3], ['Ana R.', 4, 2], ['Ben R.', 4, 2], ['Fay S.', 6, 1], ['Kai L.', 7, 0]])
assert.deepEqual(table(week.goals[1]), [['Gus H.', 1, 4], ['Hal D.', 2, 2], ['Ira C.', 2, 2]])
assert.deepEqual(table(week.goals[2]), [['Jon P.', 1, 1]])
assert.deepEqual(week.rows, week.goals[0].rows, 'rows is the caller\'s own goal table')
assert.deepEqual([week.target_days, week.member_count, week.me.rank, week.me.reason], [3, 7, 1, null])
assert.deepEqual(week.unranked, [{ name: 'Cal D.' }, { name: 'Dev S.' }])
const gusWeek = (await get(gus, 'weekly_standings.php?scope=buddies')).body
assert.deepEqual(gusWeek.rows, gusWeek.goals[1].rows)
assert.deepEqual([gusWeek.target_days, gusWeek.me.rank], [4, 1])
assert.deepEqual(gusWeek.goals.map((g) => g.rows.map(({ is_me, ...rest }) => rest)), week.goals.map((g) => g.rows.map(({ is_me, ...rest }) => rest)), 'every member sees the same goal tables (only is_me differs)')
assert.deepEqual(gusWeek.goals[1].rows.map((r) => r.is_me), [true, false, false])
const eastWeek = (await get(ola, 'weekly_standings.php?scope=buddies')).body
assert.deepEqual(eastWeek.goals.map(table), [[['Ola F.', 1, 3], ['Pia Q.', 1, 3], ['Raf S.', 3, 1]]])
assert.deepEqual(eastWeek.unranked, [{ name: 'Tim W.' }])
const aloneWeek = (await get(zed, 'weekly_standings.php?scope=buddies')).body
assert.deepEqual([aloneWeek.group, aloneWeek.rows, aloneWeek.goals, aloneWeek.unranked, aloneWeek.me.reason], [null, [], [], [], 'no_group'])
console.log('7 ok: one table per goal, ties, unranked, no group')

// ---------------------------------------------------------------- Test 8: only your own group
for (const path of ['leaderboard.php?scope=buddies&group_id=1&user_id=1&email=crew-nora@example.com', 'weekly_standings.php?scope=buddies&group_id=1&user_id=1']) {
  const r = await get(ola, path)
  assert.equal(r.status, 200, r.text)
  assert.equal(r.body.group.name, 'Eastside Lifters')
  for (const leak of ['Nora', 'Eli M.', 'Cal D.', '@example.com', 'user_id', 'email']) assert.ok(!r.text.includes(leak), `${path} must not contain ${leak}`)
}
console.log('8 ok: extra parameters ignored, nothing of another group leaks')

// ---------------------------------------------------------------- Test 9: Dashboard and Rankings read the same data
for (const path of ['leaderboard.php?board=overall&scope=buddies', 'weekly_standings.php?scope=buddies']) {
  assert.deepEqual(noNow((await get(nora, path)).body), noNow((await get(nora, path)).body))
}
console.log('all buddy rankings checks passed')
