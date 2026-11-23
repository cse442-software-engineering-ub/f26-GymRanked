import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorkoutLogApi } from '../src/workoutLog/workoutLogApi.js'
import { newSetRequestId } from '../src/workoutLog/setLog.js'

test('new set attempts use valid distinct request IDs and send them to the API', async () => {
  const ids = [newSetRequestId(), newSetRequestId()]
  assert.notEqual(ids[0], ids[1])
  ids.forEach((id) => assert.match(id, /^[A-Za-z0-9_-]{8,64}$/))
  const sent = []
  const api = createWorkoutLogApi({ baseUrl: '/', fetchImpl: async (_url, options) => {
    sent.push(JSON.parse(options.body))
    return { ok: true, json: async () => ({ set: { id: 1 } }) }
  } })
  const attempt = { sessionId: 7, exercise: 'Bench press', setNumber: 1, weightLb: 100, reps: 5, requestId: ids[0] }
  await api.saveSet(attempt)
  await api.saveSet(attempt)
  assert.equal(sent.length, 2)
  assert.deepEqual(sent[0], sent[1])
  assert.equal(sent[0].request_id, ids[0])
})
