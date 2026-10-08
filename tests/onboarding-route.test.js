import assert from 'node:assert/strict'
import test from 'node:test'
import { requiredOnboardingRoute } from '../src/onboarding/onboardingRoute.js'

test('new accounts resume at training goal', () => {
  assert.equal(requiredOnboardingRoute(null, { experience: null, equipment: [] }), '/goal')
})

test('accounts with a saved goal resume at setup', () => {
  assert.equal(requiredOnboardingRoute('strength', { experience: null, equipment: [] }), '/setup')
  assert.equal(requiredOnboardingRoute('strength', { experience: 'beginner', equipment: [] }), '/setup')
})

test('completed onboarding permits the signed-in pages', () => {
  assert.equal(requiredOnboardingRoute('strength', { experience: 'beginner', equipment: ['bodyweight'] }), null)
})
