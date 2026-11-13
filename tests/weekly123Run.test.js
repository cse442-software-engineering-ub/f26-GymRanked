import test from 'node:test'
import assert from 'node:assert/strict'
import { finishWeekly123Run, getWeekly123Run, startWeekly123Run, weekly123LoginPayload } from '../src/auth/weekly123Run.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
}

test('an explicit new test gets a new run while refresh and relogin keep it', () => {
  const storage = memoryStorage()
  let id = 0
  const uuid = () => `id-${++id}`
  const first = startWeekly123Run(1, storage, uuid)
  assert.deepEqual(getWeekly123Run(storage), first)
  assert.deepEqual(weekly123LoginPayload({ email: 'weekly123-progress@example.com' }, getWeekly123Run(storage)).weekly123_run, first)
  const second = startWeekly123Run(13, storage, uuid)
  assert.equal(second.client_id, first.client_id)
  assert.notEqual(second.run_id, first.run_id)
  assert.equal(weekly123LoginPayload({ email: 'ordinary@example.com' }, second).weekly123_run, undefined)
  finishWeekly123Run(storage)
  assert.equal(getWeekly123Run(storage), null)
})
