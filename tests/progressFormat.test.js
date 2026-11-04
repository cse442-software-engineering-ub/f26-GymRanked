import test from 'node:test'
import assert from 'node:assert/strict'
import {
  chartLabel,
  emptyRangeText,
  formatChange,
  formatDate,
  formatPercent,
  formatPounds,
  formatReps,
  heaviestSet,
  latestE1rm,
  rangeDates,
  recordLabel,
} from '../src/progress/progressFormat.js'

test('30 and 90 days end today in New York and include 30 and 90 days', () => {
  // 02:00 UTC on October 20 is still October 19 in New York.
  const now = new Date('2026-10-20T02:00:00Z')
  assert.deepEqual(rangeDates('30', now), { from: '2026-09-20', to: '2026-10-19' })
  assert.deepEqual(rangeDates('90', now), { from: '2026-07-22', to: '2026-10-19' })
  assert.deepEqual(rangeDates('all', now), {})
  // Across the end of daylight saving time (November 1, 2026) and a month end.
  assert.deepEqual(rangeDates('30', new Date('2026-11-05T15:00:00Z')), { from: '2026-10-07', to: '2026-11-05' })
  assert.equal(emptyRangeText('90'), 'No workouts in the last 90 days.')
})

test('API dates are shown as the same calendar day', () => {
  assert.equal(formatDate('2026-10-09'), 'October 9, 2026')
  assert.equal(formatDate('2026-08-31'), 'August 31, 2026')
})

test('pounds, percentages and changes keep the API rounding and show signs', () => {
  assert.equal(formatPounds(21420), '21,420 lb')
  assert.equal(formatPounds(309.2), '309.2 lb')
  assert.equal(formatPounds(null), '—')
  assert.equal(formatPercent(16.7), '+16.7%')
  assert.equal(formatPercent(-2.2), '-2.2%')
  assert.equal(formatPercent(0), '0%')
  assert.equal(formatPercent(null), '—')
  assert.equal(formatChange(44, 20.4), '+44 lb (+20.4%)')
  assert.equal(formatChange(-8, -2.2), '-8 lb (-2.2%)')
  assert.equal(formatChange(19.5, 15.8), '+19.5 lb (+15.8%)')
  assert.equal(formatChange(null, null), '—')
  assert.equal(formatReps(10), '10 reps')
  assert.equal(formatReps(1), '1 rep')
})

test('sets and records read as weight × reps, or Bodyweight × reps', () => {
  assert.equal(heaviestSet({ best_weight_lb: 200, reps: 9, best_reps: null }), '200 lb × 9')
  assert.equal(heaviestSet({ best_weight_lb: 22.5, reps: 6, best_reps: null }), '22.5 lb × 6')
  assert.equal(heaviestSet({ best_weight_lb: null, reps: null, best_reps: 9 }), 'Bodyweight × 9')
  assert.equal(recordLabel({ weight_lb: 220, reps: 3 }), '220 lb × 3')
  assert.equal(recordLabel({ weight_lb: 0, reps: 10 }), 'Bodyweight × 10')
})

const benchPress = {
  best_weight_lb: 220,
  points: [
    { date: '2026-08-31', best_weight_lb: 180, reps: 6, e1rm_lb: 216, best_reps: null },
    { date: '2026-09-21', best_weight_lb: 0, reps: null, e1rm_lb: null, best_reps: 12 },
    { date: '2026-10-14', best_weight_lb: 200, reps: 9, e1rm_lb: 260, best_reps: null },
  ],
}
const pullUp = {
  best_weight_lb: null,
  points: [
    { date: '2026-09-02', best_weight_lb: null, reps: null, e1rm_lb: null, best_reps: 8 },
    { date: '2026-09-30', best_weight_lb: null, reps: null, e1rm_lb: null, best_reps: 9 },
  ],
}

test('the chart follows estimated 1RM, or most reps for a bodyweight exercise', () => {
  assert.equal(latestE1rm(benchPress), 260)
  assert.equal(latestE1rm(pullUp), null)
  assert.equal(chartLabel(benchPress), 'Estimated 1RM by workout: 216 lb on August 31, 2026 to 260 lb on October 14, 2026')
  assert.equal(chartLabel(pullUp), 'Most reps by workout: 8 reps on September 2, 2026 to 9 reps on September 30, 2026')
  assert.equal(chartLabel({ ...pullUp, points: pullUp.points.slice(1) }), 'Most reps by workout: 9 reps on September 30, 2026')
})
