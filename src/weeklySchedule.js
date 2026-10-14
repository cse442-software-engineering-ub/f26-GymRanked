const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

// Which weekdays (0 = Monday) are training days for a plan with N days per week; the rest are rest days.
const TRAINING_WEEKDAYS = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
}

function startOfWeek(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

// "Week of Sept 1 – 7", or "Week of Sept 29 – Oct 5" when the week crosses a month.
export function weekRangeLabel(today) {
  const monday = startOfWeek(today)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const end =
    sunday.getMonth() === monday.getMonth()
      ? sunday.getDate()
      : `${MONTHS[sunday.getMonth()]} ${sunday.getDate()}`
  return `Week of ${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${end}`
}

// Seven day cards for the current week. Training days rotate through the plan's weekly split
// (e.g. Push, Pull, Legs, Push, Pull); `when` is 'past', 'today', or 'upcoming'.
export function buildWeek(plan, today) {
  const trainingDays = TRAINING_WEEKDAYS[plan.days_per_week] ?? TRAINING_WEEKDAYS[3]
  const todayIndex = (today.getDay() + 6) % 7
  return WEEKDAYS.map((label, index) => {
    const slot = trainingDays.indexOf(index)
    const workout = slot === -1 || plan.days.length === 0 ? null : plan.days[slot % plan.days.length]
    const when = index < todayIndex ? 'past' : index === todayIndex ? 'today' : 'upcoming'
    return { label, workout, when }
  })
}
