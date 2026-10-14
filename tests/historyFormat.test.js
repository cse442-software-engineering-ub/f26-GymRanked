import test from 'node:test'
import assert from 'node:assert/strict'
import { countLabel, formatWeight, formatWorkoutDate, pageCount, pageList, rangeLabel, sizeLabel } from '../src/history/historyFormat.js'

test('history dates use New York time, not UTC', () => {
  // 01:30 UTC on October 10 is 9:30 PM on Friday, October 9 in New York.
  assert.equal(formatWorkoutDate('2026-10-10T01:30:00Z'), 'Friday, October 9, 2026')
  assert.equal(formatWorkoutDate('2026-09-28T22:00:00Z'), 'Monday, September 28, 2026')
})

test('weights show pounds, decimals, and bodyweight for 0', () => {
  assert.equal(formatWeight(25), '25 lb')
  assert.equal(formatWeight(22.5), '22.5 lb')
  assert.equal(formatWeight(137.25), '137.25 lb')
  assert.equal(formatWeight(1500), '1,500 lb')
  assert.equal(formatWeight(0), 'Bodyweight')
})

test('counts use singular and plural words', () => {
  assert.equal(sizeLabel(3, 9), '3 exercises · 9 sets')
  assert.equal(sizeLabel(1, 1), '1 exercise · 1 set')
  assert.equal(countLabel(6), '6 completed workouts')
  assert.equal(countLabel(1), '1 completed workout')
  assert.equal(countLabel(0), '0 completed workouts')
})

test('pages hold four workouts', () => {
  assert.equal(pageCount(0), 1)
  assert.equal(pageCount(4), 1)
  assert.equal(pageCount(6), 2)
  assert.equal(rangeLabel(1, 6), 'Showing 1–4 of 6 workouts')
  assert.equal(rangeLabel(2, 6), 'Showing 5–6 of 6 workouts')
})

test('long page lists keep the first, last, and nearby pages', () => {
  assert.deepEqual(pageList(1, 2), [1, 2])
  assert.deepEqual(pageList(4, 7), [1, 2, 3, 4, 5, 6, 7])
  assert.deepEqual(pageList(1, 25), [1, 2, '…', 25])
  assert.deepEqual(pageList(5, 25), [1, '…', 4, 5, 6, '…', 25])
  assert.deepEqual(pageList(25, 25), [1, '…', 24, 25])
  assert.deepEqual(pageList(3, 25), [1, 2, 3, 4, '…', 25])
})
