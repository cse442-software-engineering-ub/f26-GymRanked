// Dates use YYYY-MM-DD in America/New_York, matching the weekly goal API.
// savedName is the workout actually saved that day, if any; it replaces the scheduled name.
export function weeklyDayState(date, todayDate, workout, hasPlan, logged, savedName = null) {
  const rest = hasPlan && !workout
  const restComplete = rest && date <= todayDate
  const complete = logged || restComplete
  return {
    complete,
    today: date === todayDate && !complete,
    mark: complete ? '✓' : rest ? '○' : date === todayDate ? '●' : '·',
    name: (logged && savedName) || workout?.name || (rest ? 'Rest day' : 'Choose a plan'),
    status: logged ? 'Logged' : restComplete ? 'Complete' : workout ? date === todayDate ? 'Today' : 'Open' : null,
  }
}

const easternParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
})

// YYYY-MM-DD in America/New_York for a Date or an ISO time, or null if it isn't a time.
export function easternDate(value) {
  const time = new Date(value)
  if (!Number.isFinite(time.getTime())) return null
  const part = (type) => easternParts.formatToParts(time).find((p) => p.type === type).value
  return `${part('year')}-${part('month')}-${part('day')}`
}

// The name of the workout actually saved on each date, from the completed sessions of workout_history.php
// (newest first). The weekly strip shows these instead of the weekday's scheduled name, so a day the lifter did
// Full body A on never reads Full body B.
export function savedNamesByDate(sessions) {
  const names = {}
  for (const session of sessions || []) {
    const date = easternDate(session.completed_at)
    if (date && !(date in names) && session.name) names[date] = session.name
  }
  return names
}

// A session counts for today's hero only when its day matches today's scheduled plan day. The unfinished
// session takes priority over a completed one for the same scheduled day.
export function todaySessionState(sessions, unfinished, plan, todayDate, scheduledName) {
  if (!plan || scheduledName === null) return null
  const matchesDay = (session) => scheduledName === undefined || session.name === scheduledName
  if (unfinished && unfinished.plan === plan.name && matchesDay(unfinished) && easternDate(unfinished.started_at) === todayDate) return { state: 'in_progress', session: unfinished }
  const done = (sessions || []).find((session) => session.plan === plan.name && matchesDay(session) && easternDate(session.started_at) === todayDate && easternDate(session.completed_at) === todayDate)
  return done ? { state: 'completed', session: done } : null
}
