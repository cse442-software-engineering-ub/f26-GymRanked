// Display text for the redesigned Dashboard (#136), kept apart from the components so it can be unit tested.
// Dates are New York dates (YYYY-MM-DD), like api/weekly_goal.php and the rest of the app.
import { buildWeek } from '../weeklySchedule.js'
import { easternDate } from '../weeklyTimeline.js'

const NEW_YORK = 'America/New_York'
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// "Wednesday, November 18"
export function todayHeading(now = new Date()) {
  return now.toLocaleDateString('en-US', { timeZone: NEW_YORK, weekday: 'long', month: 'long', day: 'numeric' })
}

// "2026-11-18" -> "Wed, Nov 18" (the date is a calendar day, so it is read at noon UTC to stay on that day).
export function shortDay(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric',
  })
}

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

// The seven days of the week that starts on weekStart (a Monday), for the "This week" strip:
// [{date, weekday: 'Mon', day: 16, done, today}]. done is a date with a logged workout.
export function weekStrip(weekStart, completedDates, todayDate) {
  const done = new Set(completedDates || [])
  return WEEKDAYS.map((weekday, index) => {
    const date = addDays(weekStart, index)
    return { date, weekday, day: Number(date.slice(8)), done: done.has(date), today: date === todayDate }
  })
}

// The next scheduled workout after today, up to a week ahead: {name, date} or null (no plan, or nothing scheduled).
// Uses the same weekday split as the weekly plan (src/weeklySchedule.js).
export function nextUp(plan, now = new Date()) {
  if (!plan?.days?.length) return null
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const workout = buildWeek(plan, day)[(day.getDay() + 6) % 7].workout
    if (workout) {
      const date = [day.getFullYear(), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-')
      return { name: workout.name, date }
    }
  }
  return null
}

// The most recent finished workout from workout_history.php (newest first): {name, date} or null.
export function lastLogged(sessions) {
  for (const session of sessions || []) {
    const date = easternDate(session.completed_at)
    if (date && session.completed_at) return { name: session.name || 'Workout', date }
  }
  return null
}

// The first few exercises for the hero card, and how many more there are.
export function exercisePreview(exercises, shown = 3) {
  const list = exercises || []
  return { names: list.slice(0, shown), more: Math.max(0, list.length - shown) }
}

// Why there is no strength rank yet, in a few words (the Leaderboard page explains each one).
const STRENGTH_REASONS = {
  test_account: 'Test account',
  not_joined: 'Not joined',
  no_bodyweight: 'Add your body weight',
  needs_scoring_table: 'Choose a scoring table',
  no_lift: 'Log bench, squat and deadlift',
  missing_lifts: 'Log all three lifts',
}

// The "Overall strength" row: {rank: '#32', detail: '131.97 DOTS'} when ranked, else a dash and the reason.
export function strengthRow(data) {
  const me = data?.me
  if (!me) return { rank: '—', detail: 'Unavailable' }
  if (me.ranked) return { rank: `#${me.rank}`, detail: `${Number(me.score).toFixed(2)} DOTS` }
  if (me.reason === 'too_few_workouts') {
    return { rank: '—', detail: `${Math.min(me.workouts_done, data.workouts_needed)} of ${data.workouts_needed} workouts finished` }
  }
  return { rank: '—', detail: STRENGTH_REASONS[me.reason] ?? 'Unranked' }
}

// The "Weekly consistency" row's rank: '#6', or a dash when there is none (the detail then says why).
const WEEKLY_REASONS = { practice_week: 'Practice week', not_joined: 'Not joined', test_account: 'Test account' }
export function weeklyRow(data) {
  const me = data?.me
  if (!me) return { rank: '—', detail: 'Unavailable' }
  const circle = `The ${data.target_days}-day circle`
  if (me.rank != null) return { rank: `#${me.rank}`, detail: circle }
  return { rank: '—', detail: `${WEEKLY_REASONS[me.reason] ?? 'Unranked'} · ${circle}` }
}
