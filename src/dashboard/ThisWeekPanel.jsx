import { Link } from 'react-router-dom'
import { shortDay, weekStrip } from './dashboardFormat.js'

// "This week": training days logged against the weekly goal (api/weekly_goal.php), a Monday–Sunday strip, and what is
// next and last. state is {status: 'loading'|'ready'|'error', data}; next and last are {name, date} or null.
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
      <dl className="home-week__facts">
        <div>
          <dt>Next up</dt>
          <dd>{next ? <><strong>{next.name}</strong> · {shortDay(next.date)}</> : hasPlan ? 'Nothing scheduled this week' : <Link to="/plans">Choose a plan</Link>}</dd>
        </div>
        <div>
          <dt>Last logged</dt>
          <dd>{historyStatus === 'loading' ? 'Loading…' : historyStatus === 'error' ? 'Unavailable' : last ? <><strong>{last.name}</strong> · {shortDay(last.date)}</> : 'No workouts yet'}</dd>
        </div>
      </dl>
    </section>
  )
}
