import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardHistory } from '../src/dashboardHistory.js'

const date = (year, month, day) => new Date(year, month - 1, day, 12).toISOString()
const session = (id, day, plan = 'Beginner Fundamentals') => ({
  id,
  plan,
  completed_at: date(2026, 10, day),
  set_count: 2,
})
const plan = { name: 'Beginner Fundamentals', days_per_week: 3, started_at_epoch: new Date(2026, 9, 1).getTime() / 1000 }

test('dashboard counts this week and recognizes a completed workout today', () => {
  const now = new Date(2026, 9, 13, 18)
  const result = dashboardHistory([session(3, 13), session(2, 12), session(1, 9)], plan, now)
  assert.equal(result.totalCompleted, 3)
  assert.equal(result.thisWeek, 2)
  assert.equal(result.hasLift, true)
  assert.equal(result.todaySession.id, 3)
  assert.equal(result.streakWeeks, 0)
})

test('switching plans resets this week even when the same plan was selected before', () => {
  const now = new Date(2026, 9, 13, 18)
  const switched = { ...plan, started_at_epoch: new Date(2026, 9, 13, 9).getTime() / 1000 }
  const result = dashboardHistory([session(3, 13), session(2, 12), session(1, 9, 'Other plan')], switched, now)
  assert.equal(result.totalCompleted, 3)
  assert.equal(result.thisWeek, 1)
  assert.equal(result.todaySession.id, 3)
})

test('weekly consistency counts consecutive completed Monday–Sunday weeks', () => {
  const now = new Date(2026, 9, 26, 12)
  const sessions = [12, 14, 16, 19, 21, 23].map((day, index) => session(index + 1, day))
  assert.equal(dashboardHistory(sessions, plan, now).streakWeeks, 2)
  assert.equal(dashboardHistory(sessions.filter((entry) => entry.id !== 2), plan, now).streakWeeks, 1)
})

test('an empty or missing plan does not invent workout progress', () => {
  const now = new Date(2026, 9, 13, 18)
  assert.deepEqual(dashboardHistory([], plan, now), {
    totalCompleted: 0, hasLift: false, thisWeek: 0, streakWeeks: 0, todaySession: null,
  })
  assert.equal(dashboardHistory([session(1, 13)], null, now).thisWeek, 0)
})
