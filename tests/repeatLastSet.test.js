import test from 'node:test'
import assert from 'node:assert/strict'
import { lastSavedSet, repeatValues } from '../src/workoutLog/setLog.js'

const set = (set_number, weight_lb, reps, exercise) => ({ id: set_number, set_number, weight_lb, reps, exercise })

test('the saved set with the highest set number is the source, even out of order or with gaps', () => {
  const sets = [set(4, 140, 6), set(1, 135, 8), set(2, 135, 6)]
  assert.equal(lastSavedSet(sets, 'Bench press').set_number, 4)
})

test('sets of other exercises are ignored', () => {
  const sets = [set(1, 135, 8, 'Bench press'), set(2, 65, 10, 'Overhead press')]
  assert.equal(lastSavedSet(sets, 'Bench press').set_number, 1)
})

test('an exercise with no saved sets has no source', () => {
  assert.equal(lastSavedSet([], 'Bench press'), null)
  assert.equal(lastSavedSet([set(1, 65, 10, 'Overhead press')], 'Bench press'), null)
})

test('a bodyweight set fills 0 and the numbers come back as the text typed into the boxes', () => {
  assert.deepEqual(repeatValues(set(1, 0, 12)), { weight: '0', reps: '12' })
  assert.deepEqual(repeatValues(set(1, 137.25, 8)), { weight: '137.25', reps: '8' })
})
