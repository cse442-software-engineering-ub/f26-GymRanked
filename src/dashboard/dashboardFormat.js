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

// The next scheduled workout after today, up to a week ahead: {name, date, planId, position} or null (no plan, or
// nothing scheduled). position is that workout's place in the plan's days (1 = first), so "Next up" can open Plan
// details at it (/plans/<planId>?day=<position>). Uses the same weekday split as the weekly plan (src/weeklySchedule.js).
export function nextUp(plan, now = new Date()) {
  if (!plan?.days?.length) return null
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const workout = buildWeek(plan, day)[(day.getDay() + 6) % 7].workout
    if (workout) {
      const date = [day.getFullYear(), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-')
      const position = plan.days.indexOf(workout) + 1
      return { name: workout.name, date, planId: plan.id ?? null, position: position > 0 ? position : null }
    }
  }
  return null
}

// Where "Next up" leads: Plan details opened at that day, or null when the plan or the day isn't known.
export function nextUpPath(next) {
  if (!next?.planId || !next.position) return null
  return `/plans/${next.planId}?day=${next.position}`
}

// The most recent finished workout from workout_history.php (newest first): {id, name, date} or null. id is that
// saved workout's session id, so "Last logged" opens exactly its summary (null if the server sent none).
export function lastLogged(sessions) {
  for (const session of sessions || []) {
    const date = easternDate(session.completed_at)
    if (date && session.completed_at) {
      const id = Number.isInteger(session.id) && session.id > 0 ? session.id : null
      return { id, name: session.name || 'Workout', date }
    }
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

// A Buddies response for someone in no group (api/ranking_scope.php): group is null and me.reason is no_group. The
// Everyone scope has no group key at all, so only an explicit null counts. Rows are never read, so a Buddies list that
// leaves the caller out is fine.
const NO_GROUP = { rank: '—', detail: 'Join a buddies group' }
const inNoGroup = (data) => data?.group === null || data?.me?.reason === 'no_group'

// The "Overall strength" row: {rank: '#32', detail: '131.97 DOTS'} when ranked, else a dash and the reason.
export function strengthRow(data) {
  const me = data?.me
  if (inNoGroup(data)) return NO_GROUP
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
  if (inNoGroup(data)) return NO_GROUP
  if (!me) return { rank: '—', detail: 'Unavailable' }
  const circle = `The ${data.target_days}-day circle`
  if (me.rank != null) return { rank: `#${me.rank}`, detail: circle }
  return { rank: '—', detail: `${WEEKLY_REASONS[me.reason] ?? 'Unranked'} · ${circle}` }
}
