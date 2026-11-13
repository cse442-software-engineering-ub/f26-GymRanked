import test from 'node:test'
import assert from 'node:assert/strict'
import { MENU_GROUPS, currentFor, hasMenu, initialsOf, sectionFor } from '../src/navigation/menuMap.js'

test('the menu groups, their rows and where each row goes', () => {
  assert.deepEqual(MENU_GROUPS.map((group) => group.name), ['Training', 'Community'])
  assert.deepEqual(MENU_GROUPS[0].links.map((link) => link.label), ['Dashboard', 'Workouts', 'Plans', 'Progress'])
  assert.deepEqual(MENU_GROUPS[1].links.map((link) => link.label), ['Rankings', 'Buddies'])
  assert.deepEqual(
    MENU_GROUPS.flatMap((group) => group.links.map((link) => link.to)),
    ['/dashboard', '/weekly-plan', '/plans', '/progress', '/leaderboard/weekly', '/buddies'],
  )
  // No separate "Today" entry: starting or resuming belongs beside the workout.
  assert.equal(MENU_GROUPS.some((group) => group.links.some((link) => /today/i.test(link.label))), false)
})

test('every row opens a page of its own section', () => {
  for (const link of MENU_GROUPS.flatMap((group) => group.links)) {
    assert.equal(sectionFor(link.to), link.section, link.label)
  }
})

test('a page inside a section keeps that section', () => {
  assert.equal(sectionFor('/plans/7'), 'plans') // plan details keeps Plans
  assert.equal(sectionFor('/progress/history'), 'progress') // workout history keeps Progress
  assert.equal(sectionFor('/workout/active'), 'workouts') // starting a workout highlights Workouts
  assert.equal(sectionFor('/workout/active/2'), 'workouts')
  assert.equal(sectionFor('/workouts/today'), 'workouts') // the old Today address still has a section
  assert.equal(sectionFor('/workouts/41'), 'workouts')
  assert.equal(sectionFor('/workouts/41/summary'), 'workouts')
  assert.equal(sectionFor('/leaderboard'), 'rankings') // Strength rankings
  assert.equal(sectionFor('/leaderboard/weekly'), 'rankings')
  assert.equal(sectionFor('/weekly-goal'), 'dashboard')
  assert.equal(sectionFor('/profile/personal-details'), 'profile')
  assert.equal(sectionFor('/profile/training-preferences'), 'profile')
})

test('login, create account and onboarding have no menu', () => {
  for (const path of ['/login', '/register', '/personal-details', '/goal', '/experience', '/equipment', '/recommended', '/setup']) {
    assert.equal(hasMenu(path), false, path)
    assert.equal(sectionFor(path), null, path)
  }
  // A path that only starts like a section is not part of it.
  assert.equal(sectionFor('/plansomething'), null)
  assert.equal(hasMenu('/dashboard'), true)
})

test('aria-current is "page" on the row\'s own page and "location" inside its section', () => {
  assert.equal(currentFor('/plans', 'plans', '/plans'), 'page')
  assert.equal(currentFor('/plans/7', 'plans', '/plans'), 'location')
  assert.equal(currentFor('/plans/7', 'progress', '/progress'), undefined)
  assert.equal(currentFor('/leaderboard/weekly', 'rankings', '/leaderboard/weekly'), 'page')
  assert.equal(currentFor('/leaderboard', 'rankings', '/leaderboard/weekly'), 'location')
  assert.equal(currentFor('/profile', 'profile', '/profile'), 'page')
  assert.equal(currentFor('/login', 'dashboard', '/dashboard'), undefined)
})

test('initials for the profile row', () => {
  assert.equal(initialsOf('Casey Lin'), 'CL')
  assert.equal(initialsOf('  Mary Ann  Smith '), 'MS')
  assert.equal(initialsOf('Casey'), 'C')
  assert.equal(initialsOf(''), '?')
  assert.equal(initialsOf(undefined), '?')
})
