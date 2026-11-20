import test from 'node:test'
import assert from 'node:assert/strict'
import { comparisonExplanation, displaySummary, formatCompletedDate, formatDuration } from '../src/workoutLog/workoutSummary.js'
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
    newPrs: null,
    highlights: [
      { exercise: 'Bench press', topSet: '105 lb × 5', versusLast: '', comparisonNote: '', isBaseline: false, prLabel: '' },
      { exercise: 'Overhead press', topSet: '50 lb × 8', versusLast: '', comparisonNote: '', isBaseline: false, prLabel: '' },
    ],
  })
})

test('summary counts reps across every saved set', () => {
  const session = {
    name: 'Full body', completed_at: '2026-11-17T20:00:00Z',
    summary: { duration_seconds: 1200, total_volume_lb: 900, set_count: 3, exercise_count: 2, total_reps: 28 },
    exercises: [
      { name: 'Bench press', sets: [{ weight_lb: 25, reps: 10 }, { weight_lb: 25, reps: 10 }] },
      { name: 'Squat', sets: [{ weight_lb: 50, reps: 8 }] },
    ],
  }
  assert.equal(displaySummary(session).totalReps, 28)
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

test('records show previous results, baselines, weight PRs and bodyweight rep PRs', () => {
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
  const records = {
    session_id: 7,
    new_pr_count: 2,
    exercises: [
      { exercise: 'Bench press', metric: 'weight', top_set: { weight_lb: 165, reps: 10 }, previous: { weight_lb: 185, reps: 9 }, best_before: { weight_lb: 185, reps: 9 }, is_baseline: false, is_pr: false },
      { exercise: 'Overhead press', metric: 'weight', top_set: { weight_lb: 100, reps: 12 }, previous: { weight_lb: 100, reps: 6 }, best_before: { weight_lb: 100, reps: 6 }, is_baseline: false, is_pr: false },
      { exercise: 'Cable fly', metric: 'weight', top_set: { weight_lb: 50, reps: 8 }, previous: { weight_lb: 45, reps: 12 }, best_before: { weight_lb: 48, reps: 8 }, is_baseline: false, is_pr: true },
      { exercise: 'Pull-up', metric: 'reps', top_set: { weight_lb: 0, reps: 10 }, previous: { weight_lb: 0, reps: 9 }, best_before: { weight_lb: 0, reps: 9 }, is_baseline: false, is_pr: true },
    ],
  }
  const summary = displaySummary(session, records)
  assert.equal(summary.newPrs, 2)
  assert.deepEqual(summary.highlights, [
    { exercise: 'Bench press', topSet: '165 lb × 10', versusLast: '185 lb × 9', comparisonNote: "Last time: 185 lb × 9. Today: 165 lb × 10. That's 20 lb less and 1 more rep.", isBaseline: false, prLabel: '' },
    { exercise: 'Overhead press', topSet: '100 lb × 12', versusLast: '100 lb × 6', comparisonNote: "Last time: 100 lb × 6. Today: 100 lb × 12. That's 6 more reps.", isBaseline: false, prLabel: '' },
    { exercise: 'Cable fly', topSet: '50 lb × 8', versusLast: '45 lb × 12', comparisonNote: "Last time: 45 lb × 12. Today: 50 lb × 8. That's 5 lb more and 4 fewer reps.", isBaseline: false, prLabel: 'Weight PR' },
    { exercise: 'Pull-up', topSet: 'Bodyweight × 10', versusLast: 'Bodyweight × 9', comparisonNote: "Last time: Bodyweight × 9. Today: Bodyweight × 10. That's 1 more rep.", isBaseline: false, prLabel: 'Rep PR' },
  ])
  const baseline = displaySummary(session, {
    session_id: 7, new_pr_count: 0,
    exercises: [{ exercise: 'Pull-up', metric: 'reps', top_set: { weight_lb: 0, reps: 10 }, previous: null, change: null, best_before: null, is_baseline: true, is_pr: false }],
  })
  assert.equal(baseline.newPrs, 0)
  assert.deepEqual(baseline.highlights[3], { exercise: 'Pull-up', topSet: 'Bodyweight × 10', versusLast: '', comparisonNote: 'Today: Bodyweight × 10. This is your first recorded result.', isBaseline: true, prLabel: '' })
})

test('comparison explanation keeps weight and reps visible across changes', () => {
  assert.equal(comparisonExplanation({ weight_lb: 105, reps: 5 }, { weight_lb: 100, reps: 5 }), "Last time: 100 lb × 5. Today: 105 lb × 5. That's 5 lb more.")
  assert.equal(comparisonExplanation({ weight_lb: 90, reps: 8 }, { weight_lb: 100, reps: 10 }), "Last time: 100 lb × 10. Today: 90 lb × 8. That's 10 lb less and 2 fewer reps.")
  assert.equal(comparisonExplanation({ weight_lb: 100, reps: 5 }, { weight_lb: 100, reps: 5 }), "Last time: 100 lb × 5. Today: 100 lb × 5. That's the same weight and reps.")
  assert.equal(comparisonExplanation({ weight_lb: 50, reps: 10 }, null, true), 'Today: 50 lb × 10. This is your first recorded result.')
  assert.equal(comparisonExplanation({ weight_lb: 50, reps: 10 }, null), '')
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

test('summary records use a separate request after loading the saved session', async () => {
  const calls = []
  const api = createWorkoutLogApi({
    baseUrl: '/base/',
    fetchImpl: async (url, options) => {
      calls.push([url, options.method])
      return { ok: true, status: 200, json: async () => url.includes('workout_records') ? { session_id: 7, new_pr_count: 0, exercises: [] } : { session: { id: 7 } } }
    },
  })
  assert.deepEqual(await api.getSession(7), { id: 7 })
  assert.deepEqual(await api.getWorkoutRecords(7), { session_id: 7, new_pr_count: 0, exercises: [] })
  assert.deepEqual(calls, [
    ['/base/api/workout_session.php?id=7', 'GET'],
    ['/base/api/workout_records.php?session_id=7', 'GET'],
  ])
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
