import test from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyGroupBoardText,
  emptyGroupWeekText,
  goalLabel,
  membersText,
  orderGoals,
  rankingHref,
  rankingParams,
  scopeFrom,
  strengthGroupLine,
  weeklyGroupLine,
} from '../src/leaderboard/rankingScope.js'
import { standingKind } from '../src/leaderboard/leaderboardFormat.js'
import { heroKind, homeRank } from '../src/weekly/weeklyFormat.js'

test('only "buddies" is Buddies; anything else is Everyone', () => {
  assert.equal(scopeFrom('buddies'), 'buddies')
  for (const value of [null, undefined, '', 'everyone', 'Buddies', 'friends']) assert.equal(scopeFrom(value), 'everyone')
})

test('Everyone leaves no scope in the address, so the public boards keep their old addresses', () => {
  assert.equal(rankingHref('/leaderboard'), '/leaderboard')
  assert.equal(rankingHref('/leaderboard', { scope: 'everyone' }), '/leaderboard')
  assert.equal(rankingHref('/leaderboard/weekly', { scope: 'everyone' }), '/leaderboard/weekly')
  assert.deepEqual(rankingParams({ board: 'bench', scope: 'everyone' }), { board: 'bench' })
})

test('Buddies adds scope=buddies after the board', () => {
  assert.equal(rankingHref('/leaderboard', { scope: 'buddies' }), '/leaderboard?scope=buddies')
  assert.equal(rankingHref('/leaderboard', { board: 'bench', scope: 'buddies' }), '/leaderboard?board=bench&scope=buddies')
  assert.equal(rankingHref('/leaderboard/weekly', { scope: 'buddies' }), '/leaderboard/weekly?scope=buddies')
  assert.deepEqual(rankingParams({ scope: 'buddies' }), { scope: 'buddies' })
})

test('group lines', () => {
  assert.equal(membersText(1), '1 member')
  assert.equal(strengthGroupLine(13, 'Bench press'), '13 members · Group ranks for Bench press')
  assert.equal(weeklyGroupLine(4), '4 members · Group ranks by weekly goal')
  assert.equal(goalLabel(3), '3-day goal')
  assert.equal(emptyGroupBoardText('Northside Crew', 'Deadlift'), 'Nobody in Northside Crew is ranked on Deadlift yet.')
  assert.equal(emptyGroupWeekText('Northside Crew'), 'Nobody in Northside Crew is ranked this week yet.')
})

test('your own weekly goal comes first, then the others from the smallest up', () => {
  const goals = [3, 4, 5].map((target_days) => ({ target_days, rows: [] }))
  assert.deepEqual(orderGoals(goals, 4).map((goal) => goal.target_days), [4, 3, 5])
  assert.deepEqual(orderGoals(goals, 3).map((goal) => goal.target_days), [3, 4, 5])
  assert.deepEqual(orderGoals(goals, 6).map((goal) => goal.target_days), [3, 4, 5])
  assert.deepEqual(goals.map((goal) => goal.target_days), [3, 4, 5], 'the API answer is not changed')
})

test('someone in no group gets the no-group cards', () => {
  assert.equal(standingKind({ ranked: false, reason: 'no_group' }), 'no-group')
  assert.equal(heroKind({ joined: true, rank: null, reason: 'no_group' }), 'nogroup')
  assert.equal(homeRank({ rank: null, reason: 'no_group' }), 'No group')
})
