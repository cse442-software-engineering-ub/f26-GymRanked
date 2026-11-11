// Backend checks for story #78: workout buddies groups, invites and encouragements (card #71 task tests).
// Run against a LOCAL PHP server and a database that has migrations 001-017:
//   PHP_CLI_SERVER_WORKERS=4 php -S localhost:8000 -t api     (4 workers so the simultaneous-request checks overlap)
//   node tests/buddies-api.mjs
// It loads database/seeds/workout_buddies.sql itself (twice, which also checks that the seed can be run again), logs
// in as the six buddy-*@example.com accounts, and leaves the seed's state behind. It needs the `mysql` command; set
// WORKOUT_TEST_DB / WORKOUT_TEST_MYSQL_USER (and MYSQL_PWD) if your local database isn't `cse442_2026_fall_team_y_db`
// with a passwordless root. The shared aptitude and cattle databases are never touched: the base must be local.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = process.env.WORKOUT_TEST_BASE || 'http://localhost:8000'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a local test server')
const database = process.env.WORKOUT_TEST_DB || 'cse442_2026_fall_team_y_db'
const mysqlUser = process.env.WORKOUT_TEST_MYSQL_USER || 'root'
const sql = (query) => execFileSync('mysql', ['-u', mysqlUser, '-N', '-B', database, '-e', query], { encoding: 'utf8' }).trim()
const loadSeed = () => execFileSync('mysql', ['--default-character-set=utf8mb4', '-u', mysqlUser, database],
  { input: readFileSync(new URL('../database/seeds/workout_buddies.sql', import.meta.url)), stdio: ['pipe', 'ignore', 'inherit'] })
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const PASSWORD = 'Buddy-Test-78!'
const CODE = '7KQ2MXP9', EXPIRED = '4MXT8H2R'

async function call(jar, method, path, body, { raw } = {}) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: { ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}), ...(jar?.cookie ? { Cookie: jar.cookie } : {}) },
    body: method === 'POST' ? (raw ?? JSON.stringify(body ?? {})) : undefined,
  })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave null so the assertions show the raw page */ }
  return { status: response.status, body: json, text, type: response.headers.get('content-type'), allow: response.headers.get('allow'), cookie: response.headers.get('set-cookie') }
}
const get = (jar, path) => call(jar, 'GET', path)
const post = (jar, path, body, options) => call(jar, 'POST', path, body, options)
const join = (jar, code) => post(jar, 'buddy_join.php', { code })
const encourage = (jar, memberId, message) => post(jar, 'buddy_encourage.php', { member_id: memberId, message })
const create = (jar, name) => post(jar, 'buddy_group.php', { create: true, name })

async function login(name) {
  const response = await post(null, 'login.php', { email: `buddy-${name}@example.com`, password: PASSWORD })
  assert.equal(response.status, 200, `login ${name}: ${response.text} (the seed must have loaded)`)
  return { cookie: response.cookie.split(';')[0] }
}

function expectError(response, status, error, errors) {
  assert.equal(response.status, status, response.text)
  assert.match(response.type, /application\/json/)
  assert.equal(response.body.error, error)
  if (errors !== undefined) assert.deepEqual(response.body.errors, errors)
}
const NO_GROUP = { group: null, me: null, encouragements: [] }
const ALREADY = 'You are already in a workout buddies group.'
const BAD_CODE = { code: 'Enter the 8-character invite code.' }
const memberId = (email) => Number(sql(`SELECT m.id FROM buddy_members m JOIN users u ON u.id = m.user_id WHERE u.email = '${email}'`))
const count = (table) => Number(sql(`SELECT COUNT(*) FROM ${table}`))

// ---------------------------------------------------------------- Test 1: migration and seed
loadSeed()
loadSeed()
sql('DELETE FROM auth_attempts')
assert.equal(sql("SELECT COUNT(*) FROM users WHERE email LIKE 'buddy-%@example.com' AND is_test = 1"), '6')
assert.equal(sql("SELECT CONCAT(g.name, ':', COUNT(*)) FROM buddy_groups g JOIN buddy_members m ON m.group_id = g.id GROUP BY g.id ORDER BY g.id"), 'Morning Lifters:2\nLate Starters:1')
assert.equal(sql("SELECT COUNT(*) FROM buddy_encouragements WHERE recipient_id = (SELECT id FROM users WHERE email = 'buddy-ben@example.com')"), '1')
assert.throws(() => execFileSync('mysql', ['-u', mysqlUser, database, '-e',
  "INSERT INTO buddy_members (group_id, user_id, joined_at) SELECT group_id, user_id, UTC_TIMESTAMP() FROM buddy_members WHERE user_id = (SELECT id FROM users WHERE email = 'buddy-ben@example.com')"],
  { stdio: 'pipe' }), /Duplicate entry|ERROR 1062/, 'one group per person is enforced by the database')
const [olivia, ben, nina, cal, omar, pete] = await Promise.all(['olivia', 'ben', 'nina', 'cal', 'omar', 'pete'].map(login))
const OLIVIA = memberId('buddy-olivia@example.com'), BEN = memberId('buddy-ben@example.com'), PETE = memberId('buddy-pete@example.com')
console.log('1 ok: migration, seed (twice) and the one-group-per-person key')

// ---------------------------------------------------------------- Test 2: login, methods, bad bodies
for (const [path, send] of [['buddy_group.php', () => get(null, 'buddy_group.php')], ['buddy_join.php', () => post(null, 'buddy_join.php', {})], ['buddy_encourage.php', () => post(null, 'buddy_encourage.php', {})]]) {
  expectError(await send(), 401, 'Please log in.')
}
expectError(await call(olivia, 'DELETE', 'buddy_group.php'), 405, 'Method not allowed.')
assert.equal((await call(olivia, 'DELETE', 'buddy_group.php')).allow, 'GET, POST')
assert.equal((await call(olivia, 'DELETE', 'buddy_join.php')).allow, 'POST')
const wrongMethod = await get(olivia, 'buddy_encourage.php')
expectError(wrongMethod, 405, 'Method not allowed.')
assert.equal(wrongMethod.allow, 'POST')
expectError(await post(olivia, 'buddy_join.php', null, { raw: 'nope' }), 400, 'Send a valid JSON object.')
expectError(await post(olivia, 'buddy_encourage.php', null, { raw: '[1]' }), 400, 'Send a valid JSON object.')
console.log('2 ok: login, methods, bad bodies')

// ---------------------------------------------------------------- Test 3: a valid invite (example 1)
assert.deepEqual((await get(nina, 'buddy_group.php')).body, NO_GROUP)
const joined = await join(nina, CODE)
assert.equal(joined.status, 200, joined.text)
const NINA = joined.body.me.member_id
assert.deepEqual(joined.body, {
  group: {
    name: 'Morning Lifters', member_count: 3, invite_code: null, invite_expires_at: null,
    members: [
      { member_id: OLIVIA, name: 'Olivia G.', is_me: false, is_owner: true },
      { member_id: BEN, name: 'Ben C.', is_me: false, is_owner: false },
      { member_id: NINA, name: 'Nina P.', is_me: true, is_owner: false },
    ],
  },
  me: { member_id: NINA, is_owner: false },
  encouragements: [],
})
const owner = (await get(olivia, 'buddy_group.php')).body
assert.equal(owner.group.invite_code, CODE)
assert.match(owner.group.invite_expires_at, ISO)
const days = (Date.parse(owner.group.invite_expires_at) - Date.now()) / 86400000
assert.ok(days > 6.9 && days <= 7.01, `expires in ${days} days`)
assert.equal(owner.group.member_count, 3)
const member = (await get(ben, 'buddy_group.php')).body
assert.equal(member.group.invite_code, null)
assert.equal(member.group.invite_expires_at, null)
assert.equal(member.encouragements.length, 1)
assert.equal(member.encouragements[0].from, 'Olivia G.')
assert.equal(member.encouragements[0].message, 'Nice work on leg day!')
assert.match(member.encouragements[0].sent_at, ISO)
for (const text of [JSON.stringify(owner), JSON.stringify(member), JSON.stringify(joined.body)]) {
  assert.doesNotMatch(text, /@example\.com|user_id|password/)
}
assert.deepEqual((await get(nina, 'buddy_group.php')).body, joined.body)
console.log('3 ok: valid invite')

// ---------------------------------------------------------------- Test 4: invalid invites (example 2)
const members = count('buddy_members')
for (const code of ['7KQ2', '7kq2mxp9', '7KQ2MXI9', '7KQ2MXP9\n', 'ABCDEFGH1', 12345678, null, undefined]) {
  expectError(await join(omar, code), 400, 'Invalid request.', BAD_CODE)
}
expectError(await post(omar, 'buddy_join.php', {}), 400, 'Invalid request.', BAD_CODE)
for (const code of ['ZZZZZZZZ', EXPIRED]) expectError(await join(omar, code), 404, "That invite code isn't valid or has expired.")
assert.deepEqual((await get(omar, 'buddy_group.php')).body, NO_GROUP)
assert.equal(count('buddy_members'), members)
console.log('4 ok: invalid and expired invites')

// ---------------------------------------------------------------- Test 5: accepting twice (example 3)
expectError(await join(nina, CODE), 409, ALREADY)
expectError(await join(pete, CODE), 409, ALREADY)
expectError(await join(pete, 'ZZZZZZZZ'), 409, ALREADY)
assert.equal(sql("SELECT COUNT(*) FROM buddy_members WHERE user_id = (SELECT id FROM users WHERE email = 'buddy-nina@example.com')"), '1')
assert.equal((await get(olivia, 'buddy_group.php')).body.group.member_count, 3)
console.log('5 ok: accepting twice')

// ---------------------------------------------------------------- Test 6: an outside account (example 4)
expectError(await encourage(omar, BEN, 'Hi'), 404, 'Group not found.')
expectError(await encourage(omar, 999999, 'Hi'), 404, 'Group not found.')
const petes = (await get(pete, 'buddy_group.php')).body
assert.equal(petes.group.name, 'Late Starters')
assert.deepEqual(petes.group.members.map((m) => m.name), ['Pete L.'])
assert.equal(petes.group.invite_code, EXPIRED)
expectError(await encourage(ben, PETE, 'Hi'), 404, 'Member not found.')
expectError(await encourage(ben, 999999, 'Hi'), 404, 'Member not found.')
const messages = count('buddy_encouragements')
console.log('6 ok: outside account')

// ---------------------------------------------------------------- Test 7: encouragement
const sent = await encourage(olivia, BEN, 'Great session today, keep it up!')
assert.equal(sent.status, 201, sent.text)
assert.deepEqual(Object.keys(sent.body.encouragement), ['id', 'to', 'message', 'sent_at'])
assert.equal(sent.body.encouragement.to, 'Ben C.')
assert.equal(sent.body.encouragement.message, 'Great session today, keep it up!')
assert.match(sent.body.encouragement.sent_at, ISO)
assert.ok(Math.abs(Date.now() - Date.parse(sent.body.encouragement.sent_at)) < 60000)
const inbox = (await get(ben, 'buddy_group.php')).body.encouragements
assert.deepEqual(inbox.map((m) => [m.from, m.message]), [['Olivia G.', 'Great session today, keep it up!'], ['Olivia G.', 'Nice work on leg day!']])
assert.deepEqual((await get(nina, 'buddy_group.php')).body.encouragements, [])
assert.deepEqual((await get(olivia, 'buddy_group.php')).body.encouragements, [])
expectError(await encourage(olivia, OLIVIA, 'Hi me'), 400, 'Invalid request.', { member_id: "You can't encourage yourself." })
for (const message of ['', '   ', 'x'.repeat(141), 5, null]) {
  expectError(await encourage(olivia, BEN, message), 400, 'Invalid request.', { message: 'Write a message of 1 to 140 characters.' })
}
for (const id of ['x', 1.5, 0, -1, null]) {
  expectError(await encourage(olivia, id, 'Hi'), 400, 'Invalid request.', { member_id: 'Choose a member of your group.' })
}
expectError(await post(olivia, 'buddy_encourage.php', {}), 400, 'Invalid request.', { member_id: 'Choose a member of your group.', message: 'Write a message of 1 to 140 characters.' })
assert.equal((await encourage(olivia, BEN, 'x'.repeat(140))).status, 201)
assert.equal((await encourage(olivia, BEN, '<b>hi</b> & thanks')).status, 201)
assert.equal((await get(ben, 'buddy_group.php')).body.encouragements[0].message, '<b>hi</b> & thanks')
assert.equal((await encourage(olivia, BEN, '  spaces trimmed  ')).body.encouragement.message, 'spaces trimmed')
assert.equal((await encourage(olivia, BEN, 'é'.repeat(140))).status, 201, '140 characters, not 140 bytes')
assert.equal(count('buddy_encouragements'), messages + 5)
for (let i = 0; i < 20; i++) await encourage(olivia, BEN, `bulk ${i}`)
assert.equal((await get(ben, 'buddy_group.php')).body.encouragements.length, 20, 'the inbox shows the last 20')
console.log('7 ok: encouragement')

// ---------------------------------------------------------------- Test 8: create a group
for (const name of ['', '   ', 'x'.repeat(41), 7, undefined]) {
  expectError(await create(cal, name), 400, 'Invalid request.', { name: 'Name your group in 1 to 40 characters.' })
}
expectError(await post(cal, 'buddy_group.php', { name: 'No create flag' }), 400, 'Invalid request.', { create: 'Use true.' })
expectError(await post(cal, 'buddy_group.php', { create: 'yes', name: '' }), 400, 'Invalid request.', { create: 'Use true.', name: 'Name your group in 1 to 40 characters.' })
assert.deepEqual((await get(cal, 'buddy_group.php')).body, NO_GROUP)
const made = await create(cal, "  Cal's Crew  ")
assert.equal(made.status, 201, made.text)
assert.equal(made.body.group.name, "Cal's Crew")
assert.equal(made.body.group.member_count, 1)
assert.match(made.body.group.invite_code, /^[A-HJ-NP-Z2-9]{8}$/)
assert.match(made.body.group.invite_expires_at, ISO)
assert.deepEqual(made.body.group.members, [{ member_id: made.body.me.member_id, name: 'Cal M.', is_me: true, is_owner: true }])
assert.equal(made.body.me.is_owner, true)
assert.deepEqual(made.body.encouragements, [])
expectError(await create(cal, 'Another'), 409, ALREADY)
assert.deepEqual((await get(cal, 'buddy_group.php')).body, made.body)
assert.equal((await create(omar, 'x'.repeat(40))).status, 201, 'a 40 character name is allowed')
console.log('8 ok: create a group')

// ---------------------------------------------------------------- Test 9: requests at the same time
loadSeed()
sql('DELETE FROM auth_attempts')
const racers = await Promise.all(Array.from({ length: 6 }, () => login('omar')))
let results = await Promise.all(racers.map((jar) => join(jar, CODE)))
assert.deepEqual(results.map((r) => r.status).sort(), [200, 409, 409, 409, 409, 409])
assert.equal(sql("SELECT COUNT(*) FROM buddy_members WHERE user_id = (SELECT id FROM users WHERE email = 'buddy-omar@example.com')"), '1')
loadSeed()
results = await Promise.all(racers.map((jar, i) => create(jar, `Race ${i}`)))
assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409, 409, 409])
assert.equal(sql("SELECT COUNT(*) FROM buddy_groups WHERE owner_id = (SELECT id FROM users WHERE email = 'buddy-omar@example.com')"), '1', 'the groups of the refused creates are rolled back')
console.log('9 ok: requests at the same time')

loadSeed() // leave the seed's own state behind
console.log('All workout buddies checks passed.')
