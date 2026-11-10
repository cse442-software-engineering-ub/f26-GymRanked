import assert from 'node:assert/strict'
import test from 'node:test'
import { workoutWeeklyMessage } from '../src/workoutLog/workoutWeeklyFeedback.js'
import { progressText, weekDays } from '../src/weeklyGoal/weeklyGoalFormat.js'

const base = { week_start: '2026-11-02', target_days: 3, completed_dates: ['2026-11-02', '2026-11-04'] }

test('saved unfinished goal says how many distinct days remain', () => {
  const snapshot = { ...base, completed_count: 2, progress_days: 2, progress_percent: 67, goal_reached: false }
  assert.equal(progressText(snapshot), '2 of 3 training days')
  assert.equal(workoutWeeklyMessage(snapshot), '1 day to go')
  assert.deepEqual(weekDays(snapshot, '2026-11-04').filter((day) => day.state === 'completed').map((day) => day.date), base.completed_dates)
})

test('saved reached goal shows completion even when count exceeds target', () => {
  const snapshot = { ...base, completed_dates: [...base.completed_dates, '2026-11-06'], completed_count: 3, progress_days: 3, progress_percent: 100, goal_reached: true }
  assert.equal(progressText(snapshot), '3 of 3 training days')
  assert.equal(workoutWeeklyMessage(snapshot), 'Weekly goal complete')
})
