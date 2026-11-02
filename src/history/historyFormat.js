// Display text for the workout history page (story #9), kept apart from the components so it can be unit tested.

export const PAGE_SIZE = 4

// The backend saves finish times in UTC. Dates are shown in New York time, the time zone the backend's weekly
// schedule uses, so a workout finished at 9:30 PM on a Friday reads Friday rather than the UTC Saturday.
const dateFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York',
})
const pounds = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

// "2026-10-10T01:30:00Z" -> "Friday, October 9, 2026"
export function formatWorkoutDate(isoTime) {
  return dateFormat.format(new Date(isoTime))
}

// 0 lb is how the backend stores a bodyweight set.
export function formatWeight(weightLb) {
  return Number(weightLb) === 0 ? 'Bodyweight' : `${pounds.format(Number(weightLb))} lb`
}

// "3 exercises · 9 sets"
export function sizeLabel(exerciseCount, setCount) {
  return `${plural(exerciseCount, 'exercise')} · ${plural(setCount, 'set')}`
}

// "6 completed workouts"
export function countLabel(count) {
  return plural(count, 'completed workout')
}

export function pageCount(total) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}

// "Showing 1–4 of 6 workouts" for page 1.
export function rangeLabel(page, total) {
  const first = (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, total)
  return `Showing ${first}–${last} of ${total} workouts`
}

// The page buttons to draw: every page when there are 7 or fewer, otherwise the first, the last and the
// neighbours of the current page, with '…' for the gaps. [1, '…', 4, 5, 6, '…', 25]
export function pageList(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)
  const pages = new Set([1, count, page - 1, page, page + 1].filter((value) => value >= 1 && value <= count))
  const sorted = [...pages].sort((a, b) => a - b)
  const list = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) list.push('…')
    list.push(value)
  })
  return list
}
