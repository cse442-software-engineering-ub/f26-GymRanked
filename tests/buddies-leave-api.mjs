// Backend checks for leaving a workout buddies group (api/buddy_leave.php): members and owners can leave, the owner's
// role passes to the member who joined longest ago, a group whose last member leaves is deleted, and every group that
// is left keeps an owner who is one of its members.
// Run against a LOCAL PHP server and a database that has migrations 001-021:
//   PHP_CLI_SERVER_WORKERS=4 php -S localhost:8000 -t api     (4 workers so the simultaneous leaves overlap)
//   node tests/buddies-leave-api.mjs
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
const NO_GROUP = { group: null, me: null, encouragements: [] }
const leave = (jar) => post(jar, 'buddy_leave.php', { leave: true })
const view = async (jar) => (await get(jar, 'buddy_group.php')).body
const names = async (jar) => (await view(jar)).group.members.map((m) => m.name + (m.is_owner ? ' (owner)' : ''))
const groupsWithCode = (code) => Number(sql(`SELECT COUNT(*) FROM buddy_groups WHERE invite_code = '${code}'`))
// Every group still has an owner who is one of its members, and no membership points at a missing group.
function membershipValid() {
  assert.equal(sql(`SELECT COUNT(*) FROM buddy_groups g WHERE NOT EXISTS
    (SELECT 1 FROM buddy_members m WHERE m.group_id = g.id AND m.user_id = g.owner_id)`), '0', 'a group lost its owner')
  assert.equal(sql('SELECT COUNT(*) FROM buddy_members m LEFT JOIN buddy_groups g ON g.id = m.group_id WHERE g.id IS NULL'), '0')
}

loadSeed()
sql('DELETE FROM auth_attempts')
const olivia = await login('olivia'), ben = await login('ben'), nina = await login('nina')
const cal = await login('cal'), omar = await login('omar'), pete = await login('pete')
assert.equal((await post(nina, 'buddy_join.php', { code: CODE })).status, 200)

// ---------------------------------------------------------------- 1: bad requests change nothing
expectError(await post(nina, 'buddy_leave.php', {}), 400, 'Invalid request.', { leave: 'Use true.' })
expectError(await post(nina, 'buddy_leave.php', { leave: 'yes' }), 400, 'Invalid request.', { leave: 'Use true.' })
const got = await get(nina, 'buddy_leave.php')
assert.equal(got.status, 405)
assert.equal(got.allow, 'POST')
expectError(await post(null, 'buddy_leave.php', { leave: true }), 401, 'Please log in.')
expectError(await leave(omar), 404, 'Group not found.')
assert.deepEqual(await names(olivia), ['Olivia G. (owner)', 'Ben C.', 'Nina P.'])
console.log('1 ok: 400, 405, 401 and 404 change nothing')

// ---------------------------------------------------------------- 2: a member leaves
assert.equal((await encourage(olivia, memberId('nina'), 'Welcome Nina!')).status, 201)
const NINA_BEFORE = memberId('nina')
const left = await leave(nina)
assert.equal(left.status, 200, left.text)
assert.deepEqual(left.body, { ...NO_GROUP, left: { name: 'Morning Lifters', new_owner: null, group_deleted: false } })
assert.deepEqual(await view(nina), NO_GROUP)
assert.deepEqual(await names(olivia), ['Olivia G. (owner)', 'Ben C.'])
assert.equal((await view(olivia)).group.member_count, 2)
assert.deepEqual(await names(ben), ['Olivia G. (owner)', 'Ben C.'])
expectError(await leave(nina), 404, 'Group not found.', undefined)
expectError(await encourage(olivia, NINA_BEFORE, 'Still there?'), 404, 'Member not found.')
assert.equal(sql("SELECT COUNT(*) FROM buddy_encouragements WHERE message = 'Welcome Nina!'"), '1', 'messages are kept when a member leaves')
membershipValid()
console.log('2 ok: member leaves, the others see the smaller group, leaving twice is 404')

// ---------------------------------------------------------------- 3: someone who left can join again or create a group
assert.equal((await post(nina, 'buddy_join.php', { code: CODE })).status, 200)
assert.deepEqual(await names(nina), ['Olivia G. (owner)', 'Ben C.', 'Nina P.'])
console.log('3 ok: can join again after leaving')

// ---------------------------------------------------------------- 4: the owner leaves while others remain
const ownerLeft = await leave(olivia)
assert.equal(ownerLeft.status, 200, ownerLeft.text)
assert.deepEqual(ownerLeft.body.left, { name: 'Morning Lifters', new_owner: 'Ben C.', group_deleted: false }, 'Ben joined before Nina')
const benView = await view(ben)
assert.deepEqual(benView.group.members.map((m) => [m.name, m.is_owner, m.is_me]), [['Ben C.', true, true], ['Nina P.', false, false]])
assert.equal(benView.me.is_owner, true)
assert.equal(benView.group.invite_code, CODE, 'the new owner sees the invite code')
assert.equal((await view(nina)).group.invite_code, null)
assert.equal((await view(nina)).group.name, 'Morning Lifters')
assert.equal((await post(cal, 'buddy_join.php', { code: CODE })).status, 200, 'the code keeps working')
assert.deepEqual(await names(cal), ['Ben C. (owner)', 'Nina P.', 'Cal M.'])
assert.equal((await post(olivia, 'buddy_group.php', { create: true, name: 'Olivia Again' })).status, 201, 'the old owner can start a new group')
membershipValid()
console.log('4 ok: owner leaves, the longest-standing member becomes owner and sees the code')

// ---------------------------------------------------------------- 5: the only member (the owner) leaves
assert.equal((await view(pete)).group.member_count, 1)
const lastOut = await leave(pete)
assert.equal(lastOut.status, 200, lastOut.text)
assert.deepEqual(lastOut.body, { ...NO_GROUP, left: { name: 'Late Starters', new_owner: null, group_deleted: true } })
assert.equal(groupsWithCode('4MXT8H2R'), 0, 'the empty group and its code are gone')
membershipValid()
console.log('5 ok: last member leaves, the group is deleted')

// ---------------------------------------------------------------- 6: leaves at the same moment
loadSeed()
sql('DELETE FROM auth_attempts')
// The owner and the only other member leave together: whichever goes second is alone, so the group is deleted.
let results = await Promise.all([leave(await login('olivia')), leave(await login('ben'))])
assert.deepEqual(results.map((r) => r.status), [200, 200])
assert.equal(groupsWithCode(CODE), 0)
membershipValid()
// The same person leaving from six tabs at once: one leave, five 404s.
loadSeed()
sql('DELETE FROM auth_attempts')
const tabs = await Promise.all(Array.from({ length: 6 }, () => login('ben')))
results = await Promise.all(tabs.map((jar) => leave(jar)))
assert.deepEqual(results.map((r) => r.status).sort(), [200, 404, 404, 404, 404, 404])
assert.deepEqual(await names(await login('olivia')), ['Olivia G. (owner)'])
membershipValid()
console.log('6 ok: simultaneous leaves keep every group valid')

loadSeed() // leave the seed's own state behind
console.log('All leave group checks passed.')
