import { useId } from 'react'
import {
  currentTargetText, daysText, nextWeekText, progressNote, progressText, todayInGoalZone, weekDays, weekRange,
} from './weeklyGoalFormat.js'
import './weeklyGoal.css'

// The weekly training-day goal and this week's dates (task #88), drawn from one api/weekly_goal.php response.
// Reusable: the Weekly goal page uses it, and Home can place it as it is.
//
//   <WeeklyGoalDisplay goal={data} />                        // data = the JSON from GET or POST api/weekly_goal.php
//   <WeeklyGoalDisplay status="loading" />                    // while the request runs
//   <WeeklyGoalDisplay status="error" onRetry={reload} />     // when it failed
//
// Optional: title (default "This week"), headingLevel (2 to 4, default 2), showNextWeek (default true),
// action (a node shown under the targets, such as a "Change goal ›" link), errorText, today (YYYY-MM-DD, tests only).
// It draws only what the API says: a day is green only when it is in completed_dates, and every day has a text label.
export default function WeeklyGoalDisplay({
  goal, status = 'ready', onRetry, errorText = "Couldn't load your weekly goal. Try again.",
  title = 'This week', headingLevel = 2, showNextWeek = true, action = null, today,
}) {
  const headingId = useId()
  const Heading = `h${Math.min(Math.max(headingLevel, 2), 4)}`
  const range = goal ? weekRange(goal.week_start, goal.week_end) : ''

  return (
    <section className="weekly-goal" aria-labelledby={headingId} aria-busy={status === 'loading'}>
      <p className="weekly-goal__eyebrow">Weekly goal{range && <> · {range}</>}</p>
      <Heading id={headingId} className="weekly-goal__title">{title}</Heading>

      {status === 'loading' && <p className="weekly-goal__status" role="status">Loading your weekly goal…</p>}
      {status === 'error' && (
        <div className="weekly-goal__error" role="alert">
          <p>{errorText}</p>
          {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
        </div>
      )}
      {status === 'ready' && goal && <GoalBody goal={goal} today={today ?? todayInGoalZone()} showNextWeek={showNextWeek} action={action} range={range} />}
    </section>
  )
}

function GoalBody({ goal, today, showNextWeek, action, range }) {
  const days = weekDays(goal, today)
  return (
    <>
      <div className="weekly-goal__progress">
        <p className="weekly-goal__count">
          <strong>{goal.progress_days}</strong>
          <span> of {daysText(goal.target_days)}</span>
        </p>
        <div
          className="weekly-goal__bar"
          role="progressbar"
          aria-label="Weekly goal progress"
          aria-valuemin={0}
          aria-valuemax={goal.target_days}
          aria-valuenow={goal.progress_days}
          aria-valuetext={progressText(goal)}
        >
          <span style={{ width: `${goal.progress_percent}%` }} />
        </div>
        <p className={`weekly-goal__note${goal.goal_reached ? ' weekly-goal__note--reached' : ''}`}>
          {goal.goal_reached && <span aria-hidden="true">✓ </span>}
          {progressNote(goal)}
        </p>
      </div>

      <dl className="weekly-goal__targets">
        <div className="weekly-goal__target">
          <dt>This week's goal</dt>
          <dd>
            {currentTargetText(goal)}
            {goal.target_locked && <span className="weekly-goal__badge">Locked until Monday</span>}
          </dd>
        </div>
        {showNextWeek && (
          <div className={`weekly-goal__target${goal.next_week.saved ? ' weekly-goal__target--changed' : ''}`}>
            <dt>Next week's goal</dt>
            <dd>
              {nextWeekText(goal)}
              {goal.next_week.saved && <span className="weekly-goal__badge weekly-goal__badge--saved">Change saved</span>}
            </dd>
          </div>
        )}
      </dl>
      {action && <div className="weekly-goal__action">{action}</div>}

      <ol className="weekly-goal__days" aria-label={`Training days, ${range}`}>
        {days.map((day) => (
          <li key={day.date} className={`weekly-goal__day weekly-goal__day--${day.state}`}>
            <span className="weekly-goal__sr-only">{day.description}</span>
            <span className="weekly-goal__weekday" aria-hidden="true">{day.weekday}</span>
            <span className="weekly-goal__date" aria-hidden="true">{day.dayOfMonth}</span>
            <span className="weekly-goal__mark" aria-hidden="true">{day.state === 'completed' ? '✓' : day.state === 'today' ? '●' : ''}</span>
            <span className="weekly-goal__label" aria-hidden="true">{day.label}</span>
          </li>
        ))}
      </ol>
      <p className="weekly-goal__footnote">A day is completed when you finish a workout with at least one logged set. Days follow New York time.</p>
    </>
  )
}
