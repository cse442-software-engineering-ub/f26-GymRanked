import assert from 'node:assert/strict'
import test from 'node:test'
import { GENDERS, validatePersonalDetails } from '../src/onboarding/personalDetails.js'

test('required details show the card 117 guidance', () => {
  assert.deepEqual(validatePersonalDetails('', ''), {
    bodyweight_lb: 'Enter your body weight.', gender: 'Choose a gender.',
  })
  for (const weight of ['0', '-5']) {
    assert.equal(validatePersonalDetails(weight, 'man').bodyweight_lb, 'Enter a body weight greater than 0 lb.')
  }
})

test('all four gender answers and weight boundaries are valid', () => {
  for (const { value } of GENDERS) {
    for (const weight of ['50', '160', '175', '180.5', '700']) {
      assert.deepEqual(validatePersonalDetails(weight, value), {})
    }
  }
})

test('invalid numbers and unknown genders cannot be saved', () => {
  for (const weight of ['49.9', '700.1', '180.55', 'NaN', 'Infinity', '1e2', '0xA0']) {
    assert.ok(validatePersonalDetails(weight, 'woman').bodyweight_lb, weight)
  }
  assert.equal(validatePersonalDetails('160', 'unknown').gender, 'Choose a gender.')
})
