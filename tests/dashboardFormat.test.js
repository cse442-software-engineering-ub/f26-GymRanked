import test from 'node:test'
import assert from 'node:assert/strict'
import { strengthRow, weeklyRow } from '../src/dashboard/dashboardFormat.js'
import { leaderboardPath } from '../src/leaderboard/leaderboardFormat.js'

const joinGroup = { rank: '—', detail: 'Join a buddies group' }

// api/leaderboard.php?scope=buddies for a caller in no group (card 138).
const strengthNoGroup = {
  board: 'overall', ranked_count: 0, workouts_needed: 3, rows: [], group: null, unranked: [],
  me: { ranked: false, rank: null, score: null, reason: 'no_group', workouts_done: 5 },
}

// api/weekly_standings.php?scope=buddies for a caller in no group.
const weeklyNoGroup = {
  target_days: 3, member_count: 0, rows: [], group: null, unranked: [], goals: [],
  me: { joined: true, ranked: false, reason: 'no_group', rank: null, progress_days: 2 },
}

test('strengthRow asks a caller in no group to join one', () => {
  assert.deepEqual(strengthRow(strengthNoGroup), joinGroup)
  assert.deepEqual(strengthRow({ ...strengthNoGroup, group: undefined }), joinGroup)
  assert.deepEqual(strengthRow({ ...strengthNoGroup, me: { ...strengthNoGroup.me, reason: null } }), joinGroup)
})

test('weeklyRow asks a caller in no group to join one', () => {
  assert.deepEqual(weeklyRow(weeklyNoGroup), joinGroup)
  assert.deepEqual(weeklyRow({ ...weeklyNoGroup, group: undefined }), joinGroup)
  assert.deepEqual(weeklyRow({ ...weeklyNoGroup, me: { ...weeklyNoGroup.me, reason: null } }), joinGroup)
})

test('a Buddies response that does not list the caller still shows their own rank', () => {
  const group = { name: 'Northside Crew', member_count: 4 }
  const strength = {
    board: 'overall', workouts_needed: 3, group, unranked: [],
    rows: [{ rank: 1, name: 'Cy P.', score: 300, is_me: false }],
    me: { ranked: true, rank: 2, score: 243.6, reason: null },
  }
  assert.deepEqual(strengthRow(strength), { rank: '#2', detail: '243.60 DOTS' })
  const weekly = { target_days: 3, group, unranked: [], goals: [], rows: [], me: { rank: null, reason: 'practice_week' } }
  assert.deepEqual(weeklyRow(weekly), { rank: '—', detail: 'Practice week · The 3-day circle' })
})

test('Everyone responses, which have no group key, are unchanged', () => {
  assert.deepEqual(strengthRow({ workouts_needed: 3, me: { ranked: true, rank: 32, score: 131.97 } }), { rank: '#32', detail: '131.97 DOTS' })
  assert.deepEqual(weeklyRow({ target_days: 4, me: { rank: 6 } }), { rank: '#6', detail: 'The 4-day circle' })
  assert.deepEqual(strengthRow(null), { rank: '—', detail: 'Unavailable' })
})

test('leaderboardPath requests exactly ?scope=buddies for the Buddies Overall board', () => {
  assert.equal(leaderboardPath('overall', 'buddies'), 'leaderboard.php?scope=buddies')
})

test('leaderboardPath leaves every Everyone URL as it was', () => {
  assert.equal(leaderboardPath('bench', 'everyone'), 'leaderboard.php?board=bench')
  assert.equal(leaderboardPath('overall'), 'leaderboard.php?board=overall')
  assert.equal(leaderboardPath('overall', 'everyone'), 'leaderboard.php?board=overall')
  assert.equal(leaderboardPath('deadlift', 'buddies'), 'leaderboard.php?board=deadlift&scope=buddies')
})
