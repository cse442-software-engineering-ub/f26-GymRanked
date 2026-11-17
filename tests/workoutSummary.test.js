import test from 'node:test'
import assert from 'node:assert/strict'
import { displaySummary, formatCompletedDate, formatDuration } from '../src/workoutLog/workoutSummary.js'
import { createWorkoutLogApi } from '../src/workoutLog/workoutLogApi.js'
import { workoutWeeklyMessage } from '../src/workoutLog/workoutWeeklyFeedback.js'
import { progressText, weekDays } from '../src/weeklyGoal/weeklyGoalFormat.js'

test('Wednesday summary keeps 2 of 3 after Friday reaches the goal', () => {
  const wednesday = {
    week_start: '2026-11-09', target_days: 3, completed_dates: ['2026-11-09', '2026-11-11'],
    completed_count: 2, progress_days: 2, goal_reached: false,
  }
  const friday = {
    ...wednesday, completed_dates: [...wednesday.completed_dates, '2026-11-13'],
    completed_count: 3, progress_days: 3, goal_reached: true,
  }
  assert.equal(progressText(wednesday), '2 of 3 training days')
  assert.equal(workoutWeeklyMessage(wednesday), '1 day to go')
  assert.deepEqual(weekDays(wednesday, '2026-11-11').filter(day => day.state === 'completed').map(day => day.date),
    ['2026-11-09', '2026-11-11'])
  assert.equal(progressText(friday), '3 of 3 training days')
  assert.equal(workoutWeeklyMessage(friday), 'Weekly goal complete')
  assert.equal(progressText(wednesday), '2 of 3 training days', 'a later result must not replace the earlier snapshot')
})

test('completed session data becomes accurate summary values and top sets', () => {
  const session = {
    name: 'Push',
    completed_at: '2026-10-13T20:12:59Z',
    summary: { duration_seconds: 2710, total_volume_lb: 1425, set_count: 3, exercise_count: 2, total_reps: 18 },
    exercises: [
      { name: 'Bench press', sets: [{ weight_lb: 100, reps: 5 }, { weight_lb: 105, reps: 5 }] },
      { name: 'Overhead press', sets: [{ weight_lb: 50, reps: 8 }] },
      { name: 'Cable fly', sets: [] },
    ],
  }
  assert.deepEqual(displaySummary(session), {
    workoutName: 'Push',
    completedDate: 'Tuesday, October 13, 2026',
    duration: '45 min 10 sec',
    totalVolume: '1,425 lb',
    setsCompleted: 3,
    exerciseCount: 2,
    totalReps: 18,
    highlights: [
      { exercise: 'Bench press', topSet: '105 lb × 5', versusLast: '', isPr: false },
      { exercise: 'Overhead press', topSet: '50 lb × 8', versusLast: '', isPr: false },
    ],
  })
})

test('an unfinished session has no summary, and bodyweight sets retain their label', () => {
  assert.equal(displaySummary({ completed_at: null, summary: null }), null)
  const completed = displaySummary({
    name: 'Bodyweight', completed_at: '2026-10-13T20:12:59Z',
    summary: { duration_seconds: 0, total_volume_lb: 0, set_count: 1, exercise_count: 1, total_reps: 10 },
    exercises: [{ name: 'Pull-up', sets: [{ weight_lb: 0, reps: 10 }] }],
  })
  assert.equal(completed.highlights[0].topSet, 'Bodyweight × 10')
  assert.equal(formatDuration(3660), '1 hr 1 min 0 sec')
  assert.equal(formatCompletedDate('2026-11-18T02:00:00Z'), 'Tuesday, November 17, 2026')
})

test('comparison shows the last top set and awards PRs strictly by weight', () => {
  const session = {
    name: 'Push', completed_at: '2026-11-17T20:00:00Z',
    summary: { duration_seconds: 90, total_volume_lb: 0, set_count: 4, exercise_count: 4, total_reps: 40 },
    exercises: [
      { name: 'Bench press', sets: [{ weight_lb: 165, reps: 10 }] },
      { name: 'Overhead press', sets: [{ weight_lb: 100, reps: 12 }] },
      { name: 'Cable fly', sets: [{ weight_lb: 50, reps: 8 }] },
      { name: 'Pull-up', sets: [{ weight_lb: 0, reps: 10 }] },
    ],
  }
  const comparisons = {
    'Bench press': { last_set: { weight_lb: 185, reps: 9 }, best_weight_lb: 185 },
    'Overhead press': { last_set: { weight_lb: 100, reps: 6 }, best_weight_lb: 100 },
    'Cable fly': { last_set: { weight_lb: 45, reps: 12 }, best_weight_lb: 48 },
    'Pull-up': { last_set: null, best_weight_lb: null },
  }
  assert.deepEqual(displaySummary(session, comparisons).highlights, [
    { exercise: 'Bench press', topSet: '165 lb × 10', versusLast: '185 lb × 9', isPr: false },
    { exercise: 'Overhead press', topSet: '100 lb × 12', versusLast: '100 lb × 6', isPr: false },
    { exercise: 'Cable fly', topSet: '50 lb × 8', versusLast: '45 lb × 12', isPr: true },
    { exercise: 'Pull-up', topSet: 'Bodyweight × 10', versusLast: '', isPr: true },
  ])
  const olderBest = { ...comparisons, 'Cable fly': { last_set: { weight_lb: 45, reps: 12 }, best_weight_lb: 60 } }
  assert.equal(displaySummary(session, olderBest).highlights[2].isPr, false)
})

test('session, completion and history calls use their backend endpoints', async () => {
  const calls = []
  const replies = [
    { session: { id: 7 } }, { session: { id: 7, completed_at: 'done' } },
    { session_id: 7, completed_at: 'done' }, { sessions: [{ id: 7 }] },
  ]
  const api = createWorkoutLogApi({
    baseUrl: '/base/',
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return { ok: true, status: 200, json: async () => replies.shift() }
    },
  })
  assert.deepEqual(await api.startSession(), { id: 7 })
  assert.deepEqual(await api.getSession(7), { id: 7, completed_at: 'done' })
  assert.deepEqual(await api.completeWorkout(7), { session_id: 7, completed_at: 'done' })
  assert.deepEqual(await api.getHistory(), [{ id: 7 }])
  assert.deepEqual(calls.map(({ url, options }) => [url, options.method, options.credentials]), [
    ['/base/api/workout_session.php', 'POST', 'same-origin'],
    ['/base/api/workout_session.php?id=7', 'GET', 'same-origin'],
    ['/base/api/complete_workout.php', 'POST', 'same-origin'],
    ['/base/api/workout_history.php', 'GET', 'same-origin'],
  ])
  assert.equal(calls[0].options.body, '{}')
  assert.equal(calls[2].options.body, '{"session_id":7}')
})

test('summary comparison reads the saved session history endpoint', async () => {
  const api = createWorkoutLogApi({
    baseUrl: '/base/',
    fetchImpl: async (url, options) => {
      assert.equal(url, '/base/api/workout_summary_comparison.php?session_id=7')
      assert.equal(options.method, 'GET')
      return { ok: true, status: 200, json: async () => ({ comparisons: { Squat: { last_set: null, best_weight_lb: null } } }) }
    },
  })
  assert.deepEqual(await api.getSummaryComparison(7), { comparisons: { Squat: { last_set: null, best_weight_lb: null } } })
})

test('reading another user\'s session reports the backend 404', async () => {
  const api = createWorkoutLogApi({
    baseUrl: '/',
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ error: 'Session not found' }) }),
  })
  await assert.rejects(api.getSession(9), { status: 404, message: 'Session not found' })
})

test('weekly feedback retry only reads the saved snapshot', async () => {
  const calls = []
  let fail = true
  const snapshot = { week_start: '2026-11-02', target_days: 3, progress_days: 2 }
  const api = createWorkoutLogApi({
    baseUrl: '/base/',
    fetchImpl: async (url, options) => {
      calls.push([url, options.method])
      return fail
        ? { ok: false, status: 503, json: async () => ({ error: 'Database error' }) }
        : { ok: true, status: 200, json: async () => ({ snapshot }) }
    },
  })
  await assert.rejects(api.getWorkoutWeeklyGoal(7), { status: 503 })
  fail = false
  assert.deepEqual(await api.getWorkoutWeeklyGoal(7), { snapshot })
  assert.deepEqual(calls, [
    ['/base/api/workout_weekly_goal.php?session_id=7', 'GET'],
    ['/base/api/workout_weekly_goal.php?session_id=7', 'GET'],
  ])
})
