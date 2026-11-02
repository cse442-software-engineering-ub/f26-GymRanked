// Display text and rules for the weekly training-day goal (task #88, story #87). The data comes from
// api/weekly_goal.php (Surya's #89); see the comment at the top of that file for every field. Dates are
// YYYY-MM-DD strings in America/New_York, the same as the API, and are never turned into local times.
// Plain JavaScript with no React, so tests/weeklyGoal.test.js can check it with node --test.

export const GOAL_TIME_ZONE = 'America/New_York'
export const MIN_DAYS = 1
export const MAX_DAYS = 7
export const DAY_CHOICES = Array.from({ length: MAX_DAYS }, (_, index) => index + MIN_DAYS)

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// "3 training days", "1 training day"
export function daysText(count) {
  return `${count} training ${count === 1 ? 'day' : 'days'}`
}

// "2026-10-26" + 2 -> "2026-10-28". Works in UTC so no time zone or daylight saving change can move the date.
export function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function parts(date) {
  const value = new Date(`${date}T00:00:00Z`)
  return { weekday: (value.getUTCDay() + 6) % 7, month: value.getUTCMonth(), day: value.getUTCDate() }
}

// "Mon, Oct 26"
export function shortDate(date) {
  const { weekday, month, day } = parts(date)
  return `${WEEKDAYS[weekday]}, ${MONTHS[month]} ${day}`
}

// "Monday, October 26", for screen readers and the confirmation text.
export function longDate(date) {
  const { weekday, month, day } = parts(date)
  return `${WEEKDAYS_LONG[weekday]}, ${MONTHS_LONG[month]} ${day}`
}

// "Oct 26 – Nov 1"
export function weekRange(start, end) {
  const a = parts(start)
  const b = parts(end)
  return `${MONTHS[a.month]} ${a.day} – ${a.month === b.month ? '' : `${MONTHS[b.month]} `}${b.day}`
}

// Today's date in New York (YYYY-MM-DD), the time zone the API counts weeks in.
export function todayInGoalZone(now = new Date()) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: GOAL_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

// The seven days of the goal's week, Monday first, each with a state and a text label, so a completed day never
// relies on its green colour alone. Only completed_dates from the API are "completed"; nothing is guessed from the
// plan. state: completed | today | open (past, nothing logged) | upcoming.
export function weekDays(goal, today) {
  const completed = new Set(goal.completed_dates ?? [])
  return WEEKDAYS.map((weekday, index) => {
    const date = addDays(goal.week_start, index)
    const state = completed.has(date) ? 'completed' : date === today ? 'today' : date < today ? 'open' : 'upcoming'
    const label = { completed: 'Completed', today: 'Today', open: 'No workout', upcoming: 'Upcoming' }[state]
    return {
      date,
      weekday,
      dayOfMonth: parts(date).day,
      state,
      label,
      // What a screen reader says for the day: "Monday, October 26: Completed"
      description: `${longDate(date)}: ${label}${state === 'completed' && date === today ? ' (today)' : ''}`,
    }
  })
}

// The big progress line: "2 of 3 training days", plus how a goal that is beaten reads.
export function progressText(goal) {
  return `${goal.progress_days} of ${daysText(goal.target_days)}`
}

export function progressNote(goal) {
  const extra = goal.completed_count - goal.target_days
  if (goal.goal_reached) {
    return extra > 0
      ? `Goal reached. You trained on ${goal.completed_count} days, ${extra} more than your goal.`
      : 'Goal reached. Every extra day this week is a bonus.'
  }
  const left = goal.target_days - goal.progress_days
  return `${left} more ${left === 1 ? 'day' : 'days'} to reach this week's goal.`
}

// The week the form saves to. Before this week's goal is locked the user may pick either week; after it is
// locked only next week can change.
export function weekChoices(goal) {
  return goal.target_locked ? ['next'] : ['current', 'next']
}

export function defaultWeek(goal) {
  return goal.target_locked ? 'next' : 'current'
}

// The number the form starts at for a week: what is saved for it, or this week's target.
export function startingTarget(goal, week) {
  return week === 'next' ? goal.next_week.target_days ?? goal.target_days : goal.target_days
}

// True when saving would change nothing, so the Review button stays disabled.
export function isUnchanged(goal, week, target) {
  return week === 'next' ? goal.next_week.saved && goal.next_week.target_days === target : false
}

export function currentTargetText(goal) {
  if (goal.target_locked) return `${daysText(goal.target_days)}.`
  return `${daysText(goal.target_days)}. Not saved yet: you can change it until you save it or log a workout day.`
}

// Next week's line. The API keeps next week empty until a target is chosen; the week then starts with the most
// recent saved target, which is this week's.
export function nextWeekText(goal) {
  const starts = shortDate(goal.next_week.week_start)
  if (goal.next_week.saved) {
    return `${daysText(goal.next_week.target_days)}, starting ${starts}. You can change it until then.`
  }
  return `No change saved. Next week starts ${starts} with this week's goal of ${daysText(goal.target_days)}.`
}

// What the confirmation step asks.
export function confirmText(goal, week, target) {
  if (week === 'current') {
    return {
      title: `Set this week's goal to ${daysText(target)}?`,
      body: `This week runs ${weekRange(goal.week_start, goal.week_end)}. Once saved, this week's goal is locked until Monday, so your progress stays fair.`,
    }
  }
  return {
    title: `Save ${daysText(target)} as next week's goal?`,
    body: `It starts ${longDate(goal.next_week.week_start)}. This week's goal stays ${daysText(goal.target_days)}. You can change next week's goal until it starts.`,
  }
}

export function savedText(week, target) {
  return week === 'current'
    ? `Saved. This week's goal is ${daysText(target)}.`
    : `Saved. Next week's goal is ${daysText(target)}.`
}

// A failed save as text the user can act on. result is { ok, status, data } from apiRequest.
export function saveErrorText(result) {
  if (result.status === 0) return "Can't reach the server. Check your connection and try again. Your goal was not saved."
  if (result.status === 401) return 'Your session has ended. Log in again to save your goal.'
  if (result.status === 409) return "This week's goal was locked before your change was saved. It may have been saved in another window, or a workout day was logged. You can still choose next week's goal."
  if (result.status === 400) {
    const errors = result.data?.errors ?? {}
    return errors.target_days ?? errors.week ?? 'Choose a number of days from 1 to 7.'
  }
  return "Couldn't save your goal. Try again."
}

export function loadErrorText(result) {
  if (result.status === 0) return "Can't reach the server. Check your connection and try again."
  return "Couldn't load your weekly goal. Try again."
}
