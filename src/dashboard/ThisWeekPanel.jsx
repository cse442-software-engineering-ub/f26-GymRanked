import { Link } from 'react-router-dom'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import { DASHBOARD, addReturn } from '../returnTarget.js'
import { summaryPath } from '../workoutLog/setLog.js'
import { nextUpPath, relativeDay, shortDay, weekStrip } from './dashboardFormat.js'

// "This week": training days logged against the weekly goal (api/weekly_goal.php), a Monday–Sunday strip, and what is
// last and next. state is {status: 'loading'|'ready'|'error', data}; next is {name, date, planId, position} or null;
// last is {id, name, date} or null. "Last workout" opens that exact saved workout's summary and "Next up" opens Plan
// details at that day (#136); the way back from both is the Dashboard.
export default function ThisWeekPanel({ state, todayDate, next, last, hasPlan, historyStatus, onRetry }) {
  const { status, data } = state
  return (
    <section className="home-week" aria-labelledby="home-week-title">
      <header className="home-section-heading">
        <h2 id="home-week-title">This week</h2>
        <Link to="/weekly-goal">Weekly goal <span aria-hidden="true">↗</span></Link>
      </header>
      {status === 'loading' && <p className="home-muted" role="status">Loading your weekly progress…</p>}
      {status === 'error' && (
        <p className="home-error" role="alert">
          Couldn't load your weekly progress. <button type="button" onClick={onRetry}>Try again</button>
        </p>
      )}
      {status === 'ready' && <>
        <p
          className="home-week__count"
          role="progressbar"
          aria-label="Weekly goal progress"
          aria-valuemin={0}
          aria-valuemax={data.target_days}
          aria-valuenow={data.progress_days}
          aria-valuetext={`${data.progress_days} of ${data.target_days} training days`}
        >
          <strong>{data.progress_days}</strong><span className="home-week__target">/{data.target_days}</span>
          <span className="home-week__label">training days logged</span>
        </p>
        <ol className="home-week__days" aria-label="This week's training days">
          {weekStrip(data.week_start, data.completed_dates, todayDate).map((day) => (
            <li key={day.date} className={`home-week__day${day.done ? ' home-week__day--done' : ''}${day.today ? ' home-week__day--today' : ''}`}>
              <span className="home-week__weekday" aria-hidden="true">{day.weekday}</span>
              <span className="home-week__mark" aria-hidden="true">{day.done ? '✓' : day.day}</span>
              <span className="home-sr-only">{shortDay(day.date)}{day.done ? ', logged' : day.today ? ', today' : ''}</span>
            </li>
          ))}
        </ol>
      </>}
      {/* One card with two rows: the last workout, then the next one (in action-text). A row with a workout is one
          link; what it opens is said on the right. */}
      <ul className="home-week__facts" aria-label="Last and next workout">
        <li><LastWorkout last={last} historyStatus={historyStatus} todayDate={todayDate} /></li>
        <li><NextUp next={next} hasPlan={hasPlan} todayDate={todayDate} /></li>
      </ul>
    </section>
  )
}

// One row: an icon tile, a small label with the day, the workout's name, and on the right where it leads.
function WorkoutRow({ kind, icon, label, day, name, empty, to, state, ariaLabel, action, external }) {
  const body = <>
    <span className="home-week__icon" aria-hidden="true"><MobileDashboardIcon name={icon} /></span>
    <span className="home-week__text">
      <span className="home-week__kicker">{label}{day && <> · <span className="home-week__date">{day}</span></>}</span>
      {name ? <strong className="home-week__name">{name}</strong> : <span className="home-week__empty">{empty}</span>}
    </span>
    {to && <span className="home-week__action" aria-hidden="true"><span className="home-week__action-text">{action} </span><span className="home-week__arrow">{external ? '↗' : '→'}</span></span>}
  </>
  const className = `home-week__row home-week__row--${kind}`
  if (!to) return <div className={className}>{body}</div>
  return <Link className={`${className} home-week__row--link`} to={to} state={state} aria-label={ariaLabel}>{body}</Link>
}

function LastWorkout({ last, historyStatus, todayDate }) {
  const common = { kind: 'last', icon: 'check', label: 'Last workout' }
  if (historyStatus === 'loading') return <WorkoutRow {...common} empty="Loading…" />
  if (historyStatus === 'error') return <WorkoutRow {...common} empty="Unavailable" />
  if (!last) return <WorkoutRow {...common} empty="No workouts yet" />
  return (
    <WorkoutRow {...common} day={relativeDay(last.date, todayDate)} name={last.name}
      to={last.id ? addReturn(summaryPath(last.id), DASHBOARD) : null} action="View summary" external
      ariaLabel={`Last workout: ${last.name}, ${shortDay(last.date)}. View this saved workout`} />
  )
}

function NextUp({ next, hasPlan, todayDate }) {
  const common = { kind: 'next', icon: 'calendar', label: 'Next up' }
  if (!next) {
    if (hasPlan) return <WorkoutRow {...common} empty="Nothing scheduled this week" />
    return <WorkoutRow {...common} empty="No plan yet" to="/plans" action="Choose a plan" ariaLabel="Next up: no plan yet. Choose a plan" />
  }
  return (
    <WorkoutRow {...common} day={relativeDay(next.date, todayDate, { weekday: true })} name={next.name}
      to={nextUpPath(next)} state={{ from: '/dashboard' }} action="View in plan"
      ariaLabel={`Next up: ${next.name}, ${shortDay(next.date)}. View this workout in your plan`} />
  )
}
