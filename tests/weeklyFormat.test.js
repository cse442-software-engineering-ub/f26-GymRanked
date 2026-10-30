import test from 'node:test'
import assert from 'node:assert/strict'
import {
  circleLabel,
  daysLine,
  emptyGroupLine,
  heroKind,
  msUntilReset,
  progressLine,
  rankedFromLine,
  sharedRankNote,
  timeLeft,
} from '../src/weekly/weeklyFormat.js'

const MINUTE = 60000

test('group and progress text', () => {
  assert.equal(circleLabel(3), 'The 3-day circle')
  assert.equal(daysLine(2, 3), '2 of 3 days')
  assert.equal(progressLine(2, 3, 67), '2/3 days · 67%')
  assert.equal(progressLine(3, 3, 100), '3/3 days · 100%')
  assert.equal(sharedRankNote(4), 'Shared progress = shared rank. Everyone here has the same 4-day goal.')
  assert.equal(emptyGroupLine(5), 'Nobody is ranked with a 5-day goal this week yet.')
  assert.equal(rankedFromLine('2026-11-02'), 'Your ranked weeks start Monday, November 2.')
})

test('time left is whole minutes, rounded down, with days and hours only when needed', () => {
  assert.equal(timeLeft((3 * 1440 + 7 * 60 + 28) * MINUTE + 59000), '3d 7h 28m left')
  assert.equal(timeLeft((1440 + 5) * MINUTE), '1d 0h 5m left')
  assert.equal(timeLeft((7 * 60 + 5) * MINUTE), '7h 5m left')
  assert.equal(timeLeft(42 * MINUTE), '42m left')
  assert.equal(timeLeft(59000), 'Less than a minute left')
  assert.equal(timeLeft(-5000), 'Less than a minute left')
})

test('the countdown follows the server clock, not the device clock', () => {
  const data = { resets_at: '2026-11-02T05:00:00Z', now: '2026-10-29T16:31:00Z' }
  const fetchedAt = Date.parse('2026-10-29T20:00:00Z') // a device clock 3.5 hours ahead
  assert.equal(timeLeft(msUntilReset(data, fetchedAt, fetchedAt)), '3d 12h 29m left')
  assert.equal(timeLeft(msUntilReset(data, fetchedAt, fetchedAt + 30 * MINUTE)), '3d 11h 59m left')
})

test('which top card to show', () => {
  assert.equal(heroKind({ joined: true, rank: 2, reason: null }), 'ranked')
  assert.equal(heroKind({ joined: false, rank: null, reason: 'not_joined' }), 'join')
  assert.equal(heroKind({ joined: true, rank: null, reason: 'practice_week', ranked_from: '2026-11-02' }), 'practice')
  assert.equal(heroKind({ joined: true, rank: null, reason: 'test_account' }), 'test')
})
