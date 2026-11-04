import test from 'node:test'
import assert from 'node:assert/strict'
import { weeklyDayState } from '../src/weeklyTimeline.js'

const workout = { name: 'Push' }
const today = '2026-10-30'

test('rest days check off when reached but future rest days stay open', () => {
  for (const date of ['2026-10-29', today]) {
    const day = weeklyDayState(date, today, null, true, false)
    assert.deepEqual([day.complete, day.mark, day.name, day.status], [true, '✓', 'Rest day', 'Complete'])
  }
  const future = weeklyDayState('2026-10-31', today, null, true, false)
  assert.deepEqual([future.complete, future.mark, future.name, future.status], [false, '○', 'Rest day', null])
})

test('a workout logged on a rest day is labeled Logged', () => {
  const day = weeklyDayState(today, today, null, true, true)
  assert.deepEqual([day.complete, day.mark, day.name, day.status], [true, '✓', 'Rest day', 'Logged'])
})

test('scheduled workouts show their name and only check off when logged', () => {
  const pending = weeklyDayState(today, today, workout, true, false)
  assert.deepEqual([pending.complete, pending.today, pending.name, pending.status], [false, true, 'Push', 'Today'])
  const logged = weeklyDayState(today, today, workout, true, true)
  assert.deepEqual([logged.complete, logged.today, logged.name, logged.status], [true, false, 'Push', 'Logged'])
})

test('having no plan does not create completed rest days', () => {
  const day = weeklyDayState('2026-10-29', today, null, false, false)
  assert.deepEqual([day.complete, day.name, day.status], [false, 'Choose a plan', null])
})
