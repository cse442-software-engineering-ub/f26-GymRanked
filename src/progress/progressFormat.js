// Display text for the Progress page (story #8), kept apart from the components so it can be unit tested.
// The numbers come from api/exercise_progress.php (card 109), which already rounds them; this file only formats.

export const RANGES = [
  { key: '30', label: '30 days', days: 30, line: 'Last 30 days' },
  { key: '90', label: '90 days', days: 90, line: 'Last 90 days' },
  { key: 'all', label: 'All time', days: null, line: 'All time' },
]

export const rangeByKey = (key) => RANGES.find((range) => range.key === key) ?? RANGES[2]

const numbers = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const percents = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
// The API's dates are already New York calendar days ("2026-10-09"), so they are read and shown in UTC to keep the day.
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export const NO_VALUE = '—'

// The request dates for a range: 30 days is today and the 29 days before it, in New York time. All time sends none.
export function rangeDates(key, now = new Date()) {
  const { days } = rangeByKey(key)
  if (days === null) return {}
  const to = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const start = new Date(`${to}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return { from: start.toISOString().slice(0, 10), to }
}

// "No workouts in the last 30 days."
export function emptyRangeText(key) {
  const { days } = rangeByKey(key)
  return `No workouts in the last ${days} days.`
}

// "2026-10-09" -> "October 9, 2026"
export function formatDate(date) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`))
}

// 21420 -> "21,420 lb"; 309.2 -> "309.2 lb"
export function formatPounds(value) {
  return value === null || value === undefined ? NO_VALUE : `${numbers.format(value)} lb`
}

export function formatCount(value) {
  return value === null || value === undefined ? NO_VALUE : numbers.format(value)
}

const signed = (value, text) => (value > 0 ? `+${text}` : text)

// 16.7 -> "+16.7%", -2.2 -> "-2.2%", null -> "—"
export function formatPercent(value) {
  return value === null || value === undefined ? NO_VALUE : signed(value, `${percents.format(value)}%`)
}

// (44, 20.4) -> "+44 lb (+20.4%)"
export function formatChange(lb, pct) {
  if (lb === null || lb === undefined) return NO_VALUE
  return `${signed(lb, `${numbers.format(lb)} lb`)} (${formatPercent(pct)})`
}

// "10 reps", "1 rep"
export function formatReps(reps) {
  return `${reps} rep${reps === 1 ? '' : 's'}`
}

// An exercise whose sets in the range were all 0 lb is tracked in reps.
export const isBodyweight = (exercise) => exercise.best_weight_lb === null

// One workout's heaviest set: "200 lb × 9", or "Bodyweight × 9".
export function heaviestSet(point) {
  return point.best_weight_lb === null ? `Bodyweight × ${point.best_reps}` : `${numbers.format(point.best_weight_lb)} lb × ${point.reps}`
}

// A new personal record: "220 lb × 3", or "Bodyweight × 10".
export function recordLabel(pr) {
  return pr.weight_lb === 0 ? `Bodyweight × ${pr.reps}` : `${numbers.format(pr.weight_lb)} lb × ${pr.reps}`
}

// The newest estimated 1RM, or null when every workout in the range was bodyweight.
export function latestE1rm(exercise) {
  const weighted = exercise.points.filter((point) => point.e1rm_lb !== null)
  return weighted.length ? weighted[weighted.length - 1].e1rm_lb : null
}

// The chart's values, oldest first: estimated 1RM, or most reps for a bodyweight exercise.
export function chartPoints(exercise) {
  if (isBodyweight(exercise)) {
    return exercise.points.filter((point) => point.best_reps !== null).map((point) => ({ date: point.date, value: point.best_reps }))
  }
  return exercise.points.filter((point) => point.e1rm_lb !== null).map((point) => ({ date: point.date, value: point.e1rm_lb }))
}

// What a screen reader hears for the chart:
// "Estimated 1RM by workout: 216 lb on August 31, 2026 to 260 lb on October 14, 2026"
export function chartLabel(exercise) {
  const points = chartPoints(exercise)
  const bodyweight = isBodyweight(exercise)
  const value = (point) => (bodyweight ? formatReps(point.value) : formatPounds(point.value))
  const at = (point) => `${value(point)} on ${formatDate(point.date)}`
  const title = bodyweight ? 'Most reps by workout' : 'Estimated 1RM by workout'
  if (points.length === 0) return title
  if (points.length === 1) return `${title}: ${at(points[0])}`
  return `${title}: ${at(points[0])} to ${at(points[points.length - 1])}`
}
