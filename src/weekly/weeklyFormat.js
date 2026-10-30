// Display text for the Weekly consistency view, kept apart from the components so it can be unit tested. Every number
// comes from api/weekly_standings.php (Mansur's backend, built on Surya's weekly goal calculation), which already caps
// the days at the goal and rounds the percentage; this file only formats them.

// "The 3-day circle"
export const circleLabel = (targetDays) => `The ${targetDays}-day circle`

// "2 of 3 days"
export const daysLine = (days, targetDays) => `${days} of ${targetDays} days`

// "2/3 days · 67%" (your own card, as in the brief; the rows say "2 of 3 days")
export const progressLine = (days, targetDays, percent) => `${days}/${targetDays} days · ${percent}%`

export const RESET_TEXT = 'Resets Monday, 12:00 AM New York time'

// Milliseconds -> "3d 7h 28m left", "7h 5m left", "42m left". Whole minutes, rounded down, so the page never promises
// more time than is left.
export function timeLeft(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes === 0) return 'Less than a minute left'
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const parts = []
  if (days) parts.push(`${days}d`)
  if (days || hours) parts.push(`${hours}h`)
  parts.push(`${minutes % 60}m`)
  return `${parts.join(' ')} left`
}

// The time left at clientNow, from the server's resets_at and now (both ISO). fetchedAt is the client clock when the
// answer arrived, so a phone whose clock is wrong still counts down from the server's time.
export function msUntilReset(data, fetchedAt, clientNow) {
  return Date.parse(data.resets_at) - (Date.parse(data.now) + (clientNow - fetchedAt))
}

// Which top card to show. Your first ranked week is the Monday after you join; until then it's a practice week.
export function heroKind(me) {
  if (me.reason === 'test_account') return 'test'
  if (!me.joined) return 'join'
  if (me.rank == null) return 'practice'
  return 'ranked'
}

// "2026-11-02" -> "Your ranked weeks start Monday, November 2."
export function rankedFromLine(date) {
  const [year, month, day] = date.split('-').map(Number)
  const text = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return `Your ranked weeks start ${text}.`
}

// No one in the group yet (you haven't joined, or you're in your practice week).
export const emptyGroupLine = (targetDays) => `Nobody is ranked with a ${targetDays}-day goal this week yet.`

// "Shared progress = shared rank. Everyone here has the same 3-day goal."
export const sharedRankNote = (targetDays) =>
  `Shared progress = shared rank. Everyone here has the same ${targetDays}-day goal.`
