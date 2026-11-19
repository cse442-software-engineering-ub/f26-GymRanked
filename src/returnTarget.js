// Where "Save and return later" and the summary's "Go back" button lead: the page the person came from.
// The place travels in the address, after the page's path, so a refresh or a new tab keeps it:
//   ?from=dashboard
//   ?from=workouts&day=thu                  (a three-letter weekday, mon to sun)
//   ?from=history&page=2&open=17            (page number and the id of the workout that is open)
// This file is the only code that decides where to go back to. Only these three places are ever followed: a
// missing, unknown or malformed value is the Dashboard, and nothing from the address is used as a link target.
// Kept free of React so it can be unit tested (tests/returnTarget.test.js).

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const WHOLE_NUMBER = /^[1-9]\d{0,5}$/ // 1 to 999999: no sign, no zero, no letters
const MAX_VALUE_LENGTH = 20

export const DASHBOARD = { place: 'dashboard' }

// A query value that is present, short and plain, or null. Only the first value of a repeated key is read.
function value(params, key) {
  const text = params.get(key)
  return text !== null && text.length > 0 && text.length <= MAX_VALUE_LENGTH ? text : null
}

// params: a URLSearchParams, or a query string such as "?from=history&page=2". Returns
// {place: 'dashboard'} | {place: 'workouts', day} | {place: 'history', page, open}.
export function readReturnTarget(params) {
  const query = typeof params === 'string' ? new URLSearchParams(params) : params
  const from = query?.get ? value(query, 'from') : null
  if (from === 'workouts') {
    const day = query.get('day')
    if (day === null) return { place: 'workouts', day: null }
    return DAYS.includes(day) ? { place: 'workouts', day } : DASHBOARD
  }
  if (from === 'history') {
    const page = query.get('page')
    const open = query.get('open')
    if (page !== null && !WHOLE_NUMBER.test(page)) return DASHBOARD
    if (open !== null && !WHOLE_NUMBER.test(open)) return DASHBOARD
    return { place: 'history', page: page === null ? 1 : Number(page), open: open === null ? null : Number(open) }
  }
  return DASHBOARD
}

// The query string (without "?") that carries a target, e.g. "from=history&page=2&open=17".
export function returnQuery(target) {
  if (target?.place === 'workouts') return target.day ? `from=workouts&day=${target.day}` : 'from=workouts'
  if (target?.place === 'history') return `from=history&page=${target.page ?? 1}${target.open ? `&open=${target.open}` : ''}`
  return 'from=dashboard'
}

// A page's path with the way back added, e.g. addReturn('/workout/active', {place: 'workouts', day: 'thu'}).
export function addReturn(path, target) {
  return `${path}?${returnQuery(target)}`
}

// The page a target leads back to, with its own view in the address (the day, or the page and open workout).
export function returnPath(target) {
  if (target?.place === 'workouts') return target.day ? `/weekly-plan?day=${target.day}` : '/weekly-plan'
  if (target?.place === 'history') return `/progress/history?page=${target.page ?? 1}${target.open ? `&open=${target.open}` : ''}`
  return '/dashboard'
}

// The three-letter weekday, lower case, of a date: Thursday is 'thu'.
export function dayCode(date) {
  return DAYS[(date.getDay() + 6) % 7]
}

// What the Workout history page restores from its own address: {page, open}. A bad value is just ignored.
export function readHistoryView(params) {
  const page = params.get('page')
  const open = params.get('open')
  return {
    page: page !== null && WHOLE_NUMBER.test(page) ? Number(page) : 1,
    open: open !== null && WHOLE_NUMBER.test(open) ? Number(open) : null,
  }
}

// What the Workout history page writes to its address: page 1 with nothing open leaves it clean.
export function historyParams({ page, open }) {
  const params = {}
  if (page > 1) params.page = String(page)
  if (open) params.open = String(open)
  return params
}

// The weekday a Workouts address asks to highlight, or null.
export function readWorkoutsDay(params) {
  const day = params.get('day')
  return DAYS.includes(day) ? day : null
}
