import test from 'node:test'
import assert from 'node:assert/strict'
import { easternDate, savedNamesByDate, todaySessionState, weeklyDayState } from '../src/weeklyTimeline.js'

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

const plan = { name: 'Full Body Strength' }
const doneA = { id: 7, name: 'Full body A', plan: plan.name, completed_at: '2026-10-30T15:00:00Z' }

test('a logged day shows the workout that was saved, not the scheduled one', () => {
  const day = weeklyDayState(today, today, { name: 'Full body B' }, true, true, 'Full body A')
  assert.deepEqual([day.name, day.status], ['Full body A', 'Logged'])
  assert.equal(weeklyDayState(today, today, { name: 'Full body B' }, true, false, 'Full body A').name, 'Full body B')
})

test('saved names are keyed by New York date, newest session first', () => {
  const sessions = [doneA, { ...doneA, id: 6, name: 'Full body C' }, { name: 'Late', completed_at: '2026-11-01T02:30:00Z' }]
  assert.deepEqual(savedNamesByDate(sessions), { '2026-10-30': 'Full body A', '2026-10-31': 'Late' })
  assert.equal(easternDate('not a time'), null)
})

test("today's saved workout wins over the schedule, unfinished before completed", () => {
  const unfinished = { name: 'Full body A', plan: plan.name }
  assert.deepEqual(todaySessionState([], unfinished, plan, today), { state: 'in_progress', session: unfinished })
  assert.deepEqual(todaySessionState([doneA], null, plan, today), { state: 'completed', session: doneA })
  assert.equal(todaySessionState([doneA], null, plan, '2026-10-31'), null)
  assert.equal(todaySessionState([doneA], { plan: 'Other' }, { name: 'Other plan' }, today), null)
  assert.equal(todaySessionState([doneA], null, null, today), null)
})
