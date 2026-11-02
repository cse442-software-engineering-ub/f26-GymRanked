// Completed sessions from workout_history.php drive the dashboard's progress cards.
// Calendar weeks use the viewer's local Monday–Sunday range, matching the Dashboard's Week of label.
function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

function nextWeek(monday) {
  const next = new Date(monday)
  next.setDate(next.getDate() + 7)
  return next
}

export function dashboardHistory(sessions, plan, now = new Date()) {
  const completed = (sessions || []).filter((session) => Number.isFinite(Date.parse(session.completed_at)))
  const planStart = Number(plan?.started_at_epoch) > 0 ? Number(plan.started_at_epoch) * 1000 : 0
  const relevant = plan
    ? completed.filter((session) => session.plan === plan.name && Date.parse(session.completed_at) >= planStart)
    : []
  const monday = mondayOf(now)
  const nextMonday = nextWeek(monday)
  const inWeek = (session, start, end) => {
    const finished = Date.parse(session.completed_at)
    return finished >= start.getTime() && finished < end.getTime()
  }
  const thisWeek = relevant.filter((session) => inWeek(session, monday, nextMonday)).length
  const todaySession = relevant.find((session) => {
    const finished = new Date(session.completed_at)
    return finished.getFullYear() === now.getFullYear() && finished.getMonth() === now.getMonth() && finished.getDate() === now.getDate()
  }) || null

  let streakWeeks = 0
  const target = Number(plan?.days_per_week)
  if (target > 0) {
    let end = monday
    for (let i = 0; i < 52; i += 1) {
      const start = new Date(end)
      start.setDate(start.getDate() - 7)
      if (planStart && end.getTime() <= planStart) break
      if (relevant.filter((session) => inWeek(session, start, end)).length < target) break
      streakWeeks += 1
      end = start
    }
  }

  return {
    totalCompleted: completed.length,
    hasLift: completed.some((session) => Number(session.set_count) > 0),
    thisWeek,
    streakWeeks,
    todaySession,
  }
}
