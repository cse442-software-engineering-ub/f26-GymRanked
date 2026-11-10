import { progressText, todayInGoalZone, weekDays, weekRange } from '../weeklyGoal/weeklyGoalFormat.js'
import { workoutWeeklyMessage } from './workoutWeeklyFeedback.js'

export default function WorkoutWeeklyFeedback({ state, completedAt, onRetry }) {
  if (state.status === 'loading') return <section className="workout-summary__weekly" aria-busy="true"><h2>Weekly goal</h2><p role="status">Loading the saved weekly progress…</p></section>
  if (state.status === 'error') return <section className="workout-summary__weekly" aria-label="Weekly goal" role="alert"><h2>Weekly goal</h2><p>Couldn't load your weekly progress. Your workout is saved.</p><button type="button" onClick={onRetry}>Try again</button></section>
  if (state.status === 'not_saved') return <section className="workout-summary__weekly" aria-label="Weekly goal"><h2>Weekly goal</h2><p>Weekly progress was not saved when this workout was completed. Your workout totals are still available.</p></section>
  if (state.status !== 'ready') return null

  const snapshot = state.snapshot
  const completionDay = todayInGoalZone(new Date(completedAt))
  const days = weekDays(snapshot, completionDay)
  return <section className="workout-summary__weekly" aria-label="Weekly goal at workout completion">
    <header>
      <div><p className="workout-summary__weekly-eyebrow">Saved at completion · {weekRange(snapshot.week_start, snapshot.week_end)}</p><h2>Weekly goal</h2></div>
      <p className="workout-summary__weekly-count">{progressText(snapshot)}</p>
    </header>
    <div className="workout-summary__weekly-bar" role="progressbar" aria-label="Weekly goal progress at completion" aria-valuemin={0} aria-valuemax={snapshot.target_days} aria-valuenow={snapshot.progress_days} aria-valuetext={progressText(snapshot)}><span style={{ width: `${snapshot.progress_percent}%` }} /></div>
    <p className={snapshot.goal_reached ? 'workout-summary__weekly-note workout-summary__weekly-note--complete' : 'workout-summary__weekly-note'}>{workoutWeeklyMessage(snapshot)}</p>
    <p className="workout-summary__weekly-detail">{snapshot.credited_day ? 'This workout added one training day toward your weekly goal.' : 'This workout was on a day already counted toward your goal.'}</p>
    <ol className="workout-summary__weekly-days" aria-label="Training days at workout completion">
      {days.map((day) => <li key={day.date} className={day.state === 'completed' ? 'workout-summary__weekly-day workout-summary__weekly-day--completed' : 'workout-summary__weekly-day'}>
        <span>{day.weekday} {day.dayOfMonth}</span><strong>{day.state === 'completed' ? '✓ Completed' : day.label}</strong>
      </li>)}
    </ol>
  </section>
}
