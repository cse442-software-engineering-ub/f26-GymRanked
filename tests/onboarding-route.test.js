import assert from 'node:assert/strict'
import test from 'node:test'
import { allowedOnboardingPaths, isAuthPath, requiredOnboardingRoute, signedInRedirect } from '../src/onboarding/onboardingRoute.js'

test('new accounts start with required personal details', () => {
  assert.equal(requiredOnboardingRoute(null, { experience: null, equipment: [] }), '/personal-details')
})

test('accounts with a saved goal resume at experience, then equipment', () => {
  assert.equal(requiredOnboardingRoute('strength', { experience: null, equipment: [] }, { complete: true }), '/experience')
  assert.equal(requiredOnboardingRoute('strength', { experience: null, equipment: ['dumbbells'] }, { complete: true }), '/experience')
  assert.equal(requiredOnboardingRoute('strength', { experience: 'beginner', equipment: [] }, { complete: true }), '/equipment')
})

test('unfinished accounts can reach the steps up to the required one', () => {
  assert.deepEqual(allowedOnboardingPaths('/goal'), ['/personal-details', '/goal'])
  assert.deepEqual(allowedOnboardingPaths('/experience'), ['/personal-details', '/goal', '/experience'])
  assert.deepEqual(allowedOnboardingPaths('/equipment'), ['/personal-details', '/goal', '/experience', '/equipment'])
})

test('completed onboarding permits the signed-in pages', () => {
  assert.equal(requiredOnboardingRoute('strength', { experience: 'beginner', equipment: ['bodyweight'] }), null)
})

test('signed-out auth pages remain identifiable', () => {
  assert.equal(isAuthPath('/login'), true)
  assert.equal(isAuthPath('/register'), true)
  assert.equal(isAuthPath('/dashboard'), false)
})

test('signed-in accounts cannot revisit login or registration', () => {
  for (const path of ['/login', '/register']) {
    assert.equal(signedInRedirect(path, null), '/dashboard')
    assert.equal(signedInRedirect(path, '/goal'), '/goal')
    assert.equal(signedInRedirect(path, '/experience'), '/experience')
    assert.equal(signedInRedirect(path, '/equipment'), '/equipment')
  }
})

test('completed accounts skip onboarding but keep signed-in pages', () => {
  for (const path of ['/goal', '/experience', '/equipment', '/setup', '/recommended']) {
    assert.equal(signedInRedirect(path, null), '/dashboard')
  }
  for (const path of ['/dashboard', '/profile', '/plans', '/progress']) {
    assert.equal(signedInRedirect(path, null), null)
  }
  assert.equal(signedInRedirect('/recommended', null, true), null)
})

test('unfinished accounts can revisit earlier steps but not skip ahead', () => {
  assert.equal(signedInRedirect('/goal', '/goal'), null)
  assert.equal(signedInRedirect('/experience', '/goal'), '/goal')
  assert.equal(signedInRedirect('/goal', '/experience'), null)
  assert.equal(signedInRedirect('/experience', '/experience'), null)
  assert.equal(signedInRedirect('/equipment', '/experience'), '/experience')
  assert.equal(signedInRedirect('/goal', '/equipment'), null)
  assert.equal(signedInRedirect('/experience', '/equipment'), null)
  assert.equal(signedInRedirect('/equipment', '/equipment'), null)
  for (const required of ['/personal-details', '/goal', '/experience', '/equipment']) {
    for (const path of ['/dashboard', '/recommended', '/profile']) {
      assert.equal(signedInRedirect(path, required), required)
    }
  }
})


test('missing details block every later route for unfinished accounts', () => {
  for (const path of ['/goal', '/experience', '/equipment', '/recommended', '/dashboard', '/profile']) {
    assert.equal(signedInRedirect(path, '/personal-details'), '/personal-details')
  }
  assert.equal(signedInRedirect('/personal-details', '/personal-details'), null)
  assert.equal(signedInRedirect('/personal-details', null), null)
  assert.equal(requiredOnboardingRoute(null, {}, { complete: true }), '/goal')
})
