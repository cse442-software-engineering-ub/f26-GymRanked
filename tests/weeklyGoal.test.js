import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays, confirmText, currentTargetText, defaultWeek, isUnchanged, nextWeekText, progressNote, progressText,
  saveErrorText, savedText, shortDate, startingTarget, todayInGoalZone, weekChoices, weekDays, weekRange,
} from '../src/weeklyGoal/weeklyGoalFormat.js'

// The shape api/weekly_goal.php returns (see the comment at the top of that file).
const goal = (overrides = {}) => ({
  time_zone: 'America/New_York',
  week_start: '2026-10-26',
  week_end: '2026-11-01',
  target_days: 3,
  target_locked: false,
  completed_dates: [],
  completed_count: 0,
  progress_days: 0,
  progress_percent: 0,
  goal_reached: false,
  next_week: { week_start: '2026-11-02', target_days: null, saved: false },
  ...overrides,
})

test('dates cross the month and the end of daylight saving time without shifting', () => {
  assert.equal(addDays('2026-10-26', 6), '2026-11-01')
  assert.equal(addDays('2026-10-31', 1), '2026-11-01')
  assert.equal(addDays('2026-11-01', 1), '2026-11-02')
  assert.equal(shortDate('2026-11-02'), 'Mon, Nov 2')
  assert.equal(weekRange('2026-10-26', '2026-11-01'), 'Oct 26 – Nov 1')
  assert.equal(weekRange('2026-11-02', '2026-11-08'), 'Nov 2 – 8')
})

test('today is the New York date, not the UTC date', () => {
  // 02:30 UTC on Oct 31 is 10:30 PM on Oct 30 in New York.
  assert.equal(todayInGoalZone(new Date('2026-10-31T02:30:00Z')), '2026-10-30')
  // 04:30 UTC on Nov 2 is 11:30 PM on Sunday Nov 1 (standard time, UTC-5).
  assert.equal(todayInGoalZone(new Date('2026-11-02T04:30:00Z')), '2026-11-01')
})

test('only the API completed dates are completed, and every day has a text label', () => {
  const days = weekDays(goal({ completed_dates: ['2026-10-26', '2026-10-28', '2026-10-30'] }), '2026-10-30')
  assert.deepEqual(days.map((day) => day.weekday), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  assert.deepEqual(days.map((day) => day.label), ['Completed', 'No workout', 'Completed', 'No workout', 'Completed', 'Upcoming', 'Upcoming'])
  assert.equal(days[0].description, 'Monday, October 26: Completed')
  assert.equal(days[4].description, 'Friday, October 30: Completed (today)')
  assert.equal(days[6].date, '2026-11-01')
})

test('today without a workout reads Today', () => {
  const days = weekDays(goal(), '2026-10-28')
  assert.equal(days[2].state, 'today')
  assert.equal(days[2].label, 'Today')
  assert.equal(days[3].label, 'Upcoming')
})

test('progress text uses the capped numbers and says when the goal is beaten', () => {
  const reached = goal({ target_days: 3, completed_count: 4, progress_days: 3, progress_percent: 100, goal_reached: true })
  assert.equal(progressText(reached), '3 of 3 training days')
  assert.equal(progressNote(reached), 'Goal reached. You trained on 4 days, 1 more than your goal.')
  assert.equal(progressNote(goal({ target_days: 1, completed_count: 1, progress_days: 1, goal_reached: true })), 'Goal reached. Every extra day this week is a bonus.')
  assert.equal(progressNote(goal({ target_days: 3, progress_days: 2, completed_count: 2 })), "1 more day to reach this week's goal.")
  assert.equal(progressText(goal({ target_days: 1 })), '0 of 1 training day')
})

test('an unlocked week can save either week; a locked week only next week', () => {
  assert.deepEqual(weekChoices(goal()), ['current', 'next'])
  assert.equal(defaultWeek(goal()), 'current')
  const locked = goal({ target_locked: true })
  assert.deepEqual(weekChoices(locked), ['next'])
  assert.equal(defaultWeek(locked), 'next')
})

test('the form starts at the saved number for the chosen week', () => {
  const saved = goal({ target_days: 2, target_locked: true, next_week: { week_start: '2026-11-02', target_days: 5, saved: true } })
  assert.equal(startingTarget(saved, 'current'), 2)
  assert.equal(startingTarget(saved, 'next'), 5)
  assert.equal(startingTarget(goal({ target_days: 4 }), 'next'), 4)
  assert.equal(isUnchanged(saved, 'next', 5), true)
  assert.equal(isUnchanged(saved, 'next', 4), false)
  assert.equal(isUnchanged(goal(), 'current', 3), false, 'an unsaved default can still be saved as it is')
})

test('the current target and the next-week change are described separately', () => {
  assert.equal(currentTargetText(goal({ target_locked: true })), '3 training days.')
  assert.match(currentTargetText(goal()), /^3 training days\. Not saved yet/)
  assert.equal(nextWeekText(goal()), "No change saved. Next week starts Mon, Nov 2 with this week's goal of 3 training days.")
  assert.equal(
    nextWeekText(goal({ next_week: { week_start: '2026-11-02', target_days: 1, saved: true } })),
    '1 training day, starting Mon, Nov 2. You can change it until then.',
  )
})

test('the confirmation says which week is saved and what happens next', () => {
  const current = confirmText(goal(), 'current', 4)
  assert.equal(current.title, "Set this week's goal to 4 training days?")
  assert.match(current.body, /Oct 26 – Nov 1.*locked until Monday/)
  const next = confirmText(goal({ target_locked: true }), 'next', 5)
  assert.equal(next.title, "Save 5 training days as next week's goal?")
  assert.match(next.body, /Monday, November 2.*stays 3 training days/)
  assert.equal(savedText('current', 1), "Saved. This week's goal is 1 training day.")
  assert.equal(savedText('next', 6), "Saved. Next week's goal is 6 training days.")
})

test('save errors explain what to do', () => {
  assert.match(saveErrorText({ ok: false, status: 0, data: null }), /Can't reach the server.*not saved/)
  assert.match(saveErrorText({ ok: false, status: 401, data: null }), /Log in again/)
  assert.match(saveErrorText({ ok: false, status: 409, data: { error: "This week's goal is locked." } }), /locked.*next week/)
  assert.equal(
    saveErrorText({ ok: false, status: 400, data: { errors: { target_days: 'Choose a whole number of days from 1 to 7.' } } }),
    'Choose a whole number of days from 1 to 7.',
  )
  assert.equal(saveErrorText({ ok: false, status: 500, data: { error: 'Database error' } }), "Couldn't save your goal. Try again.")
})
