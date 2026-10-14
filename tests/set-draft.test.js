import test from 'node:test'
import assert from 'node:assert/strict'

// A minimal stand-in for the browser's localStorage.
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
}

const { EMPTY_DRAFT, loadDraft, saveDraft } = await import('../src/setDraft.js')

test('a set in progress comes back with its timer and typed values', () => {
  const draft = { ...EMPTY_DRAFT, timer: 'running', accumulatedMs: 4000, runningSince: 1700000000000, weight: '135', reps: '8' }
  saveDraft(7, 'Barbell row', draft)
  assert.deepEqual(loadDraft(7, 'Barbell row'), draft)
})

test('drafts are kept apart by session and exercise', () => {
  saveDraft(7, 'Barbell row', { ...EMPTY_DRAFT, timer: 'ended', weight: '100', reps: '10' })
  assert.equal(loadDraft(7, 'Lat pulldown').timer, 'idle')
  assert.equal(loadDraft(8, 'Barbell row').timer, 'idle')
})

test('an untouched draft is not stored, and a finished rest is dropped', () => {
  store.clear()
  saveDraft(7, 'Barbell row', { ...EMPTY_DRAFT })
  assert.equal(store.size, 0)
  saveDraft(7, 'Barbell row', { ...EMPTY_DRAFT, timer: 'ended', restEndsAt: Date.now() - 1000, restTotal: 90 })
  assert.equal(loadDraft(7, 'Barbell row').restEndsAt, null)
  saveDraft(7, 'Barbell row', { ...EMPTY_DRAFT, restEndsAt: Date.now() + 60000, restTotal: 90 })
  assert.ok(loadDraft(7, 'Barbell row').restEndsAt > Date.now())
})

test('broken or missing storage gives a fresh set', () => {
  store.set('gymrank.setDraft.7.Barbell row', 'not json')
  assert.deepEqual(loadDraft(7, 'Barbell row'), EMPTY_DRAFT)
  store.set('gymrank.setDraft.7.Barbell row', JSON.stringify({ timer: 'bogus' }))
  assert.deepEqual(loadDraft(7, 'Barbell row'), EMPTY_DRAFT)
})
