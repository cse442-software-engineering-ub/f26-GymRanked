import assert from 'node:assert/strict'
const base = process.env.AUTH_TEST_BASE || 'http://localhost:8000'
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a local test server')
const email = `auth-test-${Date.now()}@example.com`
const account = { full_name: 'Auth Test', email, password: 'LocalTestPass12!', confirm_password: 'LocalTestPass12!' }
async function request(endpoint, data, cookie) {
  const response = await fetch(`${base}/${endpoint}.php`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') }
}
assert.equal((await request('session')).status, 401)
assert.equal((await request('register', {})).status, 400)
assert.equal((await request('register', { ...account, confirm_password: 'mismatch' })).status, 400)
assert.equal((await request('register', account)).status, 201, 'Registration requires configured MySQL and applied migration')
assert.equal((await request('register', account)).status, 409)
assert.equal((await request('login', { email, password: 'WrongPassword12!' })).status, 401)
const login = await request('login', { email, password: account.password, remember: true })
assert.equal(login.status, 200)
assert.equal(login.body.user.email, email)
assert.equal(login.body.user.password_hash, undefined)
assert.match(login.cookie, /HttpOnly/i)
assert.match(login.cookie, /SameSite=Lax/i)
assert.match(login.cookie, /expires=/i)
const cookie = login.cookie.split(';')[0]
assert.equal((await request('session', undefined, cookie)).body.user.email, email)
assert.equal((await request('logout', {}, cookie)).status, 200)
assert.equal((await request('session', undefined, cookie)).status, 401)
console.log('PASS: validation, registration, duplicate, invalid login, remembered session, logout/revocation')
