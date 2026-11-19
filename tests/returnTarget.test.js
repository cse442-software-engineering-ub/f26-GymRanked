import test from 'node:test'
import assert from 'node:assert/strict'
import { DASHBOARD, addReturn, dayCode, historyParams, readHistoryView, readReturnTarget, readWorkoutsDay, returnPath } from '../src/returnTarget.js'

test('the three places are followed', () => {
  assert.deepEqual(readReturnTarget('?from=dashboard'), { place: 'dashboard' })
  assert.deepEqual(readReturnTarget('?from=workouts&day=thu'), { place: 'workouts', day: 'thu' })
  assert.deepEqual(readReturnTarget('?from=history&page=2&open=17'), { place: 'history', page: 2, open: 17 })
  assert.deepEqual(readReturnTarget(new URLSearchParams('from=history&page=3')), { place: 'history', page: 3, open: null })
})

test('everything else is the Dashboard', () => {
  const bad = [
    '', '?from=', '?from=other', '?from=//example.org', '?from=https://example.org', '?from=javascript:alert(1)',
    '?from=history&page=0', '?from=history&page=abc', '?from=history&page=-1', '?from=history&page=2&open=x',
    '?from=history&page=2&open=0', '?from=workouts&day=xyz', '?from=workouts&day=THU', `?from=${'a'.repeat(300)}`,
    `?from=history&page=${'9'.repeat(300)}`, '?FROM=history&page=2',
  ]
  for (const query of bad) assert.deepEqual(readReturnTarget(query), DASHBOARD, query)
  assert.deepEqual(readReturnTarget(null), DASHBOARD)
  assert.deepEqual(readReturnTarget(undefined), DASHBOARD)
})

test('a target is written into an address and read back the same', () => {
  for (const target of [DASHBOARD, { place: 'workouts', day: 'mon' }, { place: 'history', page: 2, open: 17 }, { place: 'history', page: 1, open: null }]) {
    const query = addReturn('/workout/active', target).split('?')[1]
    assert.deepEqual(readReturnTarget(query), target)
  }
  assert.equal(addReturn('/workouts/42/summary', { place: 'history', page: 2, open: 17 }), '/workouts/42/summary?from=history&page=2&open=17')
})

test('each place leads to its own page with its own view', () => {
  assert.equal(returnPath(DASHBOARD), '/dashboard')
  assert.equal(returnPath({ place: 'workouts', day: 'thu' }), '/weekly-plan?day=thu')
  assert.equal(returnPath({ place: 'history', page: 2, open: 17 }), '/progress/history?page=2&open=17')
  assert.equal(returnPath({ place: 'history', page: 1, open: null }), '/progress/history?page=1')
})

test('the weekday code follows Monday to Sunday', () => {
  assert.equal(dayCode(new Date(2026, 10, 16)), 'mon') // Monday, November 16, 2026
  assert.equal(dayCode(new Date(2026, 10, 19)), 'thu')
  assert.equal(dayCode(new Date(2026, 10, 22)), 'sun')
})

test('Workout history reads and writes its own page and open workout', () => {
  assert.deepEqual(readHistoryView(new URLSearchParams('page=2&open=17')), { page: 2, open: 17 })
  assert.deepEqual(readHistoryView(new URLSearchParams('page=abc&open=x')), { page: 1, open: null })
  assert.deepEqual(readHistoryView(new URLSearchParams('')), { page: 1, open: null })
  assert.deepEqual(historyParams({ page: 2, open: 17 }), { page: '2', open: '17' })
  assert.deepEqual(historyParams({ page: 1, open: null }), {})
})

test('Workouts only highlights a real weekday', () => {
  assert.equal(readWorkoutsDay(new URLSearchParams('day=thu')), 'thu')
  assert.equal(readWorkoutsDay(new URLSearchParams('day=xyz')), null)
  assert.equal(readWorkoutsDay(new URLSearchParams('')), null)
})
