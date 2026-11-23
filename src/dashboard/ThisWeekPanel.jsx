import { Link } from 'react-router-dom'
import { DASHBOARD, addReturn } from '../returnTarget.js'
import { summaryPath } from '../workoutLog/setLog.js'
import { nextUpPath, shortDay, weekStrip } from './dashboardFormat.js'

// "This week": training days logged against the weekly goal (api/weekly_goal.php), a Monday–Sunday strip, and what is
// next and last. state is {status: 'loading'|'ready'|'error', data}; next is {name, date, planId, position} or null;
// last is {id, name, date} or null. "Next up" opens Plan details at that day and "Last logged" opens that exact saved
// workout's summary (#136); the way back from both is the Dashboard.
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
      {/* Two tiles side by side; a tile with a workout is one big link (the whole tile is clickable). */}
      {/* Last logged, then Next up, which is emphasised (--next) as the one to look at. */}
      <dl className="home-week__facts">
        <div className={historyStatus === 'ready' && last?.id ? 'home-week__fact home-week__fact--link' : 'home-week__fact'}>
          <dt>Last logged</dt>
          <dd>{historyStatus === 'loading' ? <span className="home-week__empty">Loading…</span>
            : historyStatus === 'error' ? <span className="home-week__empty">Unavailable</span>
              : last ? <LastLogged last={last} /> : <span className="home-week__empty">No workouts yet</span>}</dd>
        </div>
        <div className={`home-week__fact home-week__fact--next${next && nextUpPath(next) ? ' home-week__fact--link' : ''}`}>
          <dt>Next up</dt>
          <dd>{next ? <NextUp next={next} /> : hasPlan ? <span className="home-week__empty">Nothing scheduled this week</span> : <Link to="/plans">Choose a plan</Link>}</dd>
        </div>
      </dl>
    </section>
  )
}

function WorkoutTile({ name, date, action }) {
  return <>
    <strong className="home-week__name">{name}</strong>
    <span className="home-week__date">{shortDay(date)}</span>
    {action && <span className="home-week__action" aria-hidden="true">{action} <span className="home-week__arrow">→</span></span>}
  </>
}

function NextUp({ next }) {
  const path = nextUpPath(next)
  if (!path) return <WorkoutTile name={next.name} date={next.date} />
  return (
    <Link className="home-week__link" to={path} state={{ from: '/dashboard' }}
      aria-label={`${next.name}, ${shortDay(next.date)}: view this workout in your plan`}>
      <WorkoutTile name={next.name} date={next.date} action="View in plan" />
    </Link>
  )
}

function LastLogged({ last }) {
  if (!last.id) return <WorkoutTile name={last.name} date={last.date} />
  return (
    <Link className="home-week__link" to={addReturn(summaryPath(last.id), DASHBOARD)}
      aria-label={`${last.name}, ${shortDay(last.date)}: view this saved workout`}>
      <WorkoutTile name={last.name} date={last.date} action="View summary" />
    </Link>
  )
}
