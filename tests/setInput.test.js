import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedSetInput, validateSet } from '../src/workoutLog/setValidation.js'

test('set inputs accept decimal pounds and whole reps while rejecting typed or pasted nonnumeric values', () => {
  for (const value of ['', '0', '25', '25.', '.5', '137.25']) assert.equal(isAllowedSetInput('weight', value), true, value)
  for (const value of ['-5', '2e3', '25lb', '1.2.3', '137.256']) assert.equal(isAllowedSetInput('weight', value), false, value)
  for (const value of ['', '0', '10']) assert.equal(isAllowedSetInput('reps', value), true, value)
  for (const value of ['-1', '10.5', '8 reps', '1e2']) assert.equal(isAllowedSetInput('reps', value), false, value)
  assert.deepEqual(validateSet({ weight: '137.25', reps: '8' }), { ok: true, values: { weight_lb: 137.25, reps: 8 } })
  assert.equal(validateSet({ weight: '25', reps: '0' }).ok, false)
})
