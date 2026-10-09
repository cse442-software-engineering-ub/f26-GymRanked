import assert from 'node:assert/strict'
import test from 'node:test'
import { allowedOnboardingPaths, requiredOnboardingRoute } from '../src/onboarding/onboardingRoute.js'

test('new accounts resume at training goal', () => {
  assert.equal(requiredOnboardingRoute(null, { experience: null, equipment: [] }), '/goal')
})

test('accounts with a saved goal resume at experience, then equipment', () => {
  assert.equal(requiredOnboardingRoute('strength', { experience: null, equipment: [] }), '/experience')
  assert.equal(requiredOnboardingRoute('strength', { experience: null, equipment: ['dumbbells'] }), '/experience')
  assert.equal(requiredOnboardingRoute('strength', { experience: 'beginner', equipment: [] }), '/equipment')
})

test('unfinished accounts can reach the steps up to the required one', () => {
  assert.deepEqual(allowedOnboardingPaths('/goal'), ['/goal'])
  assert.deepEqual(allowedOnboardingPaths('/experience'), ['/goal', '/experience'])
  assert.deepEqual(allowedOnboardingPaths('/equipment'), ['/goal', '/experience', '/equipment'])
})

test('completed onboarding permits the signed-in pages', () => {
  assert.equal(requiredOnboardingRoute('strength', { experience: 'beginner', equipment: ['bodyweight'] }), null)
})
