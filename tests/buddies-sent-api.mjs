// Backend checks for sent encouragements (api/buddy_sent.php): each person sees only the encouragements they sent,
// with the recipient, message and time, newest first.
// Run against a LOCAL PHP server and a database that has migrations 001-021:
//   php -S localhost:8000 -t api
//   node tests/buddies-sent-api.mjs
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

const sentList = async (jar) => {
  const response = await get(jar, 'buddy_sent.php')
  assert.equal(response.status, 200, response.text)
  return response.body.sent
}
const pairs = (list) => list.map((m) => [m.to, m.message])

loadSeed()
sql('DELETE FROM auth_attempts')
const olivia = await login('olivia'), ben = await login('ben'), nina = await login('nina'), omar = await login('omar')
assert.equal((await post(nina, 'buddy_join.php', { code: '7KQ2MXP9' })).status, 200)
const BEN = memberId('ben'), NINA = memberId('nina'), OLIVIA = memberId('olivia')

// ---------------------------------------------------------------- 1: what the seed has sent
const seeded = await sentList(olivia)
assert.deepEqual(pairs(seeded), [['Ben C.', 'Nice work on leg day!']])
assert.deepEqual(Object.keys(seeded[0]), ['id', 'to', 'message', 'sent_at'])
assert.match(seeded[0].sent_at, ISO)
assert.deepEqual(await sentList(ben), [], "Ben received a message but sent none, so his list is empty")
assert.deepEqual(await sentList(omar), [], 'someone in no group gets an empty list, not an error')
console.log('1 ok: seed message in the sender list only')

// ---------------------------------------------------------------- 2: new messages, newest first, only your own
assert.equal((await encourage(olivia, NINA, 'Welcome to the group!')).status, 201)
assert.equal((await encourage(ben, OLIVIA, 'Thanks for the plan')).status, 201)
assert.equal((await encourage(olivia, BEN, '<b>bold</b> & co')).status, 201)
const mine = await sentList(olivia)
assert.deepEqual(pairs(mine), [['Ben C.', '<b>bold</b> & co'], ['Nina P.', 'Welcome to the group!'], ['Ben C.', 'Nice work on leg day!']])
assert.ok(mine.every((m, i) => i === 0 || mine[i - 1].id > m.id), 'newest first')
assert.ok(Math.abs(Date.now() - Date.parse(mine[0].sent_at)) < 60000)
assert.deepEqual(pairs(await sentList(ben)), [['Olivia G.', 'Thanks for the plan']])
assert.deepEqual(await sentList(nina), [])
assert.ok(!JSON.stringify(await get(olivia, 'buddy_sent.php')).includes('@example.com'), 'no email addresses')
console.log('2 ok: newest first, recipient and message as plain text, nobody else\'s')

// ---------------------------------------------------------------- 3: a refused message is not in the list
expectError(await encourage(olivia, NINA, 'Again'), 409, 'You already encouraged Nina P. today. You can send them another one tomorrow.')
assert.equal((await sentList(olivia)).length, 3)
console.log('3 ok: refused message not listed')

// ---------------------------------------------------------------- 4: methods and login
const posted = await post(olivia, 'buddy_sent.php', {})
assert.equal(posted.status, 405)
assert.equal(posted.allow, 'GET')
expectError(await get(null, 'buddy_sent.php'), 401, 'Please log in.')
console.log('4 ok: 405 for POST, 401 when logged out')

// ---------------------------------------------------------------- 5: at most the 50 newest
sql(`INSERT INTO buddy_encouragements (group_id, sender_id, recipient_id, message, created_at)
  SELECT g.id, g.owner_id, (SELECT id FROM users WHERE email = 'buddy-ben@example.com'), CONCAT('bulk ', n.n), UTC_TIMESTAMP()
  FROM buddy_groups g JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8) n
  JOIN (SELECT 1 m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) m
  WHERE g.invite_code = '7KQ2MXP9'`)
const many = await sentList(olivia)
assert.equal(many.length, 50)
assert.equal(many.at(-1).id > mine.at(-1).id, true, 'the oldest ones are dropped')
assert.deepEqual(pairs(await sentList(ben)), [['Olivia G.', 'Thanks for the plan']])
console.log('5 ok: the 50 newest')

loadSeed() // leave the seed's own state behind
console.log('All sent encouragement checks passed.')
