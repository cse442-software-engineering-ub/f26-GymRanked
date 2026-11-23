// Backend checks for the daily encouragement limit (story #78): a member can send each other member of their group
// one encouragement a day, a day being the America/New_York calendar day, and the server refuses a second one.
// Run against a LOCAL PHP server and a database that has migrations 001-021:
//   PHP_CLI_SERVER_WORKERS=4 php -S localhost:8000 -t api     (4 workers so the simultaneous sends overlap)
//   node tests/buddies-daily-api.mjs
// It loads database/seeds/workout_buddies.sql itself and leaves the seed's state behind. It needs the `mysql`
// command; set WORKOUT_TEST_DB / WORKOUT_TEST_MYSQL_USER (and MYSQL_PWD) if your local database isn't
// `cse442_2026_fall_team_y_db` with a passwordless root. The shared aptitude and cattle databases are never touched.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = process.env.WORKOUT_TEST_BASE || 'http://localhost:8000'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a local test server')
const database = process.env.WORKOUT_TEST_DB || 'cse442_2026_fall_team_y_db'
const mysqlUser = process.env.WORKOUT_TEST_MYSQL_USER || 'root'
const sql = (query) => execFileSync('mysql', ['-u', mysqlUser, '-N', '-B', database, '-e', query], { encoding: 'utf8' }).replace(/\r/g, '').trim()
const loadSeed = () => execFileSync('mysql', ['--default-character-set=utf8mb4', '-u', mysqlUser, database],
  { input: readFileSync(new URL('../database/seeds/workout_buddies.sql', import.meta.url)), stdio: ['pipe', 'ignore', 'inherit'] })
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
  return { status: response.status, body: json, text, allow: response.headers.get('allow'), cookie: response.headers.get('set-cookie') }
}
const get = (jar, path) => call(jar, 'GET', path)
const post = (jar, path, body) => call(jar, 'POST', path, body)

async function login(name) {
  const response = await post(null, 'login.php', { email: `buddy-${name}@example.com`, password: 'Buddy-Test-78!' })
  assert.equal(response.status, 200, `login ${name}: ${response.text} (the seed must have loaded)`)
  return { cookie: response.cookie.split(';')[0] }
}
function expectError(response, status, error, errors) {
  assert.equal(response.status, status, response.text)
  assert.equal(response.body?.error, error, response.text)
  if (errors !== undefined) assert.deepEqual(response.body.errors, errors)
}
const memberId = (name) => Number(sql(`SELECT m.id FROM buddy_members m JOIN users u ON u.id = m.user_id WHERE u.email = 'buddy-${name}@example.com'`))
const encourage = (jar, member, message) => post(jar, 'buddy_encourage.php', { member_id: member, message })

const CODE = '7KQ2MXP9'
const newYorkToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
const sentOn = (from, to) => sql(`SELECT IFNULL(GROUP_CONCAT(sent_on), '') FROM buddy_encouragements WHERE
  sender_id = (SELECT id FROM users WHERE email = 'buddy-${from}@example.com') AND
  recipient_id = (SELECT id FROM users WHERE email = 'buddy-${to}@example.com') AND sent_on IS NOT NULL`)
const messages = () => Number(sql('SELECT COUNT(*) FROM buddy_encouragements'))
const flags = async (jar) => Object.fromEntries((await get(jar, 'buddy_group.php')).body.group.members.map((m) => [m.name, m.encouraged_today]))
const refused = (name) => `You already encouraged ${name} today. You can send them another one tomorrow.`

loadSeed()
sql('DELETE FROM auth_attempts')
const olivia = await login('olivia'), ben = await login('ben'), nina = await login('nina')
assert.equal((await post(nina, 'buddy_join.php', { code: CODE })).status, 200)
const BEN = memberId('ben'), NINA = memberId('nina'), OLIVIA = memberId('olivia')

// ---------------------------------------------------------------- 1: nobody has been encouraged today yet
// The seed's "Nice work on leg day!" was written before migration 021's sent_on, so it doesn't count.
assert.deepEqual(await flags(olivia), { 'Olivia G.': false, 'Ben C.': false, 'Nina P.': false })
console.log('1 ok: older messages do not count toward today')

// ---------------------------------------------------------------- 2: the first message today is stored with today's New York date
const first = await encourage(olivia, BEN, 'Great session today, keep it up!')
assert.equal(first.status, 201, first.text)
assert.equal(sentOn('olivia', 'ben'), newYorkToday())
assert.deepEqual(await flags(olivia), { 'Olivia G.': false, 'Ben C.': true, 'Nina P.': false }, 'only Ben is marked, never your own row')
console.log('2 ok: first message today, sent_on is the New York date, encouraged_today set')

// ---------------------------------------------------------------- 3: a second one to the same person is refused and not stored
let before = messages()
expectError(await encourage(olivia, BEN, 'One more!'), 409, refused('Ben C.'))
expectError(await encourage(olivia, BEN, 'And another'), 409, refused('Ben C.'))
assert.equal(messages(), before, 'nothing is stored for a refused message')
assert.equal((await get(ben, 'buddy_group.php')).body.encouragements[0].message, 'Great session today, keep it up!')
console.log('3 ok: second message the same day refused with 409, nothing stored')

// ---------------------------------------------------------------- 4: other members, and the other direction, are still allowed
assert.equal((await encourage(olivia, NINA, 'Welcome to the group!')).status, 201)
assert.equal((await encourage(ben, OLIVIA, 'Thanks Olivia!')).status, 201)
assert.equal((await encourage(nina, BEN, 'Hi Ben!')).status, 201)
assert.deepEqual(await flags(olivia), { 'Olivia G.': false, 'Ben C.': true, 'Nina P.': true })
assert.deepEqual(await flags(ben), { 'Olivia G.': true, 'Ben C.': false, 'Nina P.': false }, "each person's flags are their own")
assert.deepEqual(await flags(nina), { 'Olivia G.': false, 'Ben C.': true, 'Nina P.': false })
console.log('4 ok: each other member once, both directions, flags per sender')

// ---------------------------------------------------------------- 5: after New York midnight the allowance is back
// Move Olivia's message to Ben to yesterday's New York date, as if midnight had passed since she sent it.
sql(`UPDATE buddy_encouragements SET sent_on = '${newYorkToday()}' - INTERVAL 1 DAY WHERE sent_on IS NOT NULL AND
  sender_id = (SELECT id FROM users WHERE email = 'buddy-olivia@example.com') AND
  recipient_id = (SELECT id FROM users WHERE email = 'buddy-ben@example.com')`)
assert.equal((await flags(olivia))['Ben C.'], false, 'yesterday no longer counts')
assert.equal((await encourage(olivia, BEN, 'A new day, a new message')).status, 201)
assert.equal((await flags(olivia))['Ben C.'], true)
expectError(await encourage(olivia, BEN, 'Too many'), 409, refused('Ben C.'))
console.log('5 ok: allowed again on the next New York day, then refused again')

// ---------------------------------------------------------------- 6: six sends at the same moment store exactly one
loadSeed()
sql('DELETE FROM auth_attempts')
const racers = await Promise.all(Array.from({ length: 6 }, () => login('olivia')))
before = messages()
const results = await Promise.all(racers.map((jar, i) => encourage(jar, memberId('ben'), `At once ${i}`)))
assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409, 409, 409])
assert.equal(messages(), before + 1)
console.log('6 ok: simultaneous sends store exactly one')

loadSeed() // leave the seed's own state behind
console.log('All daily encouragement checks passed.')
