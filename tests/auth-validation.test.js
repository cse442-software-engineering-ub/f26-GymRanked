import test from 'node:test'
import assert from 'node:assert/strict'
import { validate } from '../src/auth/api.js'

test('login identifies missing fields', () => {
  assert.deepEqual(Object.keys(validate({ email: '', password: '' })), ['email', 'password'])
})
test('registration validates confirmation and password rules', () => {
  const errors = validate({ full_name: ' ', email: 'invalid', password: 'short', confirm_password: 'different' }, true)
  assert.deepEqual(Object.keys(errors).sort(), ['confirm_password', 'email', 'full_name', 'password'])
})

test('registration shows a confirmation error when both password fields are empty', () => {
  const errors = validate({ full_name: '', email: '', password: '', confirm_password: '' }, true)
  assert.equal(errors.confirm_password, 'Passwords must match.')
})

test('registration shows a confirmation error when only confirmation is empty', () => {
  const errors = validate({ full_name: "Alex O'Neil", email: 'alex@example.com', password: 'ALongPassword12!', confirm_password: '' }, true)
  assert.equal(errors.confirm_password, 'Passwords must match.')
})

test('valid registration allows punctuation and preserves password whitespace', () => {
  assert.deepEqual(validate({ full_name: "Alex O'Neil", email: 'alex@example.com', password: ' ALongPassword12! ', confirm_password: ' ALongPassword12! ' }, true), {})
})
