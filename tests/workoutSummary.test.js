import test from 'node:test'
import assert from 'node:assert/strict'
import { displaySummary, formatDuration } from '../src/workoutLog/workoutSummary.js'
import { createWorkoutLogApi } from '../src/workoutLog/workoutLogApi.js'

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
    duration: '45 min 10 sec',
    totalVolume: '1,425 lb',
    setsCompleted: 3,
    exerciseCount: 2,
    totalReps: 18,
    highlights: [
      { exercise: 'Bench press', topSet: '105 lb × 5', setCount: 2 },
      { exercise: 'Overhead press', topSet: '50 lb × 8', setCount: 1 },
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

test('reading another user\'s session reports the backend 404', async () => {
  const api = createWorkoutLogApi({
    baseUrl: '/',
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ error: 'Session not found' }) }),
  })
  await assert.rejects(api.getSession(9), { status: 404, message: 'Session not found' })
})
