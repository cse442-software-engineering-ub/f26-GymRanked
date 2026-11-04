import test from 'node:test'
import assert from 'node:assert/strict'
import {
  boardByKey,
  choosesTable,
  emptyBoardText,
  formatPounds,
  formatScore,
  initials,
  notOnBoardText,
  rankLine,
  rankSteps,
  rankedCountLine,
  standingKind,
  tableLine,
  workoutsText,
} from '../src/leaderboard/leaderboardFormat.js'

const casey = {
  ranked: true, rank: 15, score: 243.6, joined: true, bodyweight_lb: 180, gender: 'man', scoring_table: 'men',
  lifts: { bench: 202, squat: 284, deadlift: 205 }, workouts_done: 7, workouts_needed: 3,
}
const newAccount = {
  ranked: false, rank: null, score: null, joined: false, bodyweight_lb: 180, gender: 'man', scoring_table: 'men',
  lifts: { bench: null, squat: null, deadlift: null }, workouts_done: 0, workouts_needed: 3, reason: 'not_joined',
}

test('unknown boards open Overall', () => {
  assert.equal(boardByKey('bench').label, 'Bench press')
  assert.equal(boardByKey('squat').label, 'Back squat')
  assert.equal(boardByKey('tiers').key, 'overall')
  assert.equal(boardByKey(null).key, 'overall')
})

test('scores always show two decimals and weights keep the API rounding', () => {
  assert.equal(formatScore(243.63), '243.63')
  assert.equal(formatScore(61.3), '61.30')
  assert.equal(formatScore(400), '400.00')
  assert.equal(formatPounds(202), '202 lb')
  assert.equal(formatPounds(180.5), '180.5 lb')
  assert.equal(formatPounds(1250), '1,250 lb')
  assert.equal(formatPounds(null), '—')
})

test('rank, count and empty lines name the board', () => {
  assert.equal(rankLine(15, 38, 'overall'), '#15 of 38 on Overall')
  assert.equal(rankLine(4, 12, 'squat'), '#4 of 12 on Back squat')
  assert.equal(rankedCountLine(38, 'overall'), '38 people ranked on Overall')
  assert.equal(rankedCountLine(1, 'bench'), '1 person ranked on Bench press')
  assert.equal(emptyBoardText('bench'), 'Nobody is ranked on Bench press yet.')
})

test('initials, workouts and scoring table lines', () => {
  assert.equal(initials('Ana C.'), 'AC')
  assert.equal(initials('Casey Morgan'), 'CM')
  assert.equal(initials('  mary jane watson '), 'MW')
  assert.equal(initials('Cher'), 'C')
  assert.equal(initials(''), '?')
  assert.equal(workoutsText(1, 3), '1 of 3 workouts finished')
  assert.equal(workoutsText(7, 3), '3 of 3 workouts finished')
  assert.equal(tableLine('women'), "Scored with the women's table")
  assert.equal(tableLine('men'), "Scored with the men's table")
  assert.equal(choosesTable('nonbinary'), true)
  assert.equal(choosesTable('prefer_not_to_say'), true)
  assert.equal(choosesTable('woman'), false)
  assert.equal(choosesTable(null), false)
})

test('the four steps tick from the API fields', () => {
  assert.deepEqual(rankSteps(newAccount).map((step) => step.done), [false, true, false, false])
  assert.deepEqual(rankSteps({ ...newAccount, bodyweight_lb: null, gender: null }).map((step) => step.done), [false, false, false, false])
  assert.deepEqual(rankSteps(casey).map((step) => step.done), [true, true, true, true])
  // Joined, but a Nonbinary account with no saved table hasn't finished step 1.
  const noTable = { ...casey, ranked: false, gender: 'nonbinary', scoring_table: null, reason: 'needs_scoring_table' }
  assert.equal(rankSteps(noTable)[0].done, false)
  assert.equal(rankSteps({ ...noTable, scoring_table: 'women' })[0].done, true)
})

test('the standing card matches the reason', () => {
  assert.equal(standingKind(casey), 'ranked')
  assert.equal(standingKind(newAccount), 'steps')
  assert.equal(standingKind({ ...newAccount, joined: true, reason: 'too_few_workouts', workouts_done: 2 }), 'steps')
  assert.equal(standingKind({ ...casey, ranked: false, reason: 'test_account' }), 'test')
  assert.equal(standingKind({ ...casey, ranked: false, reason: 'missing_lifts' }), 'not-on-board')
})

test('what is missing for this board', () => {
  const noor = { ...casey, ranked: false, lifts: { bench: 150, squat: null, deadlift: null } }
  assert.equal(notOnBoardText(noor, 'overall'), 'Overall needs all three lifts. Log a back squat and a deadlift to get on it.')
  assert.equal(notOnBoardText({ ...noor, lifts: { bench: 150, squat: 200, deadlift: null } }, 'overall'),
    'Overall needs all three lifts. Log a deadlift to get on it.')
  assert.equal(notOnBoardText(noor, 'squat'), 'Log a back squat to get on the Back squat board.')
  assert.equal(notOnBoardText(noor, 'deadlift'), 'Log a deadlift to get on the Deadlift board.')
})
