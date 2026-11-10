// Text for the immutable snapshot shown on a completed workout summary.
export function workoutWeeklyMessage(snapshot) {
  if (snapshot.goal_reached) return 'Weekly goal complete'
  const remaining = snapshot.target_days - snapshot.progress_days
  return `${remaining} ${remaining === 1 ? 'day' : 'days'} to go`
}
