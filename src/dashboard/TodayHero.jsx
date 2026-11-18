import { Link } from 'react-router-dom'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import { summaryPath } from '../workoutLog/setLog.js'
import { formatVolume } from '../workoutLog/workoutSummary.js'
import { exercisePreview, shortDay } from './dashboardFormat.js'

// The Dashboard's first card: today's workout and the one button that starts it.
// state: 'loading' | 'error' | 'no-plan' | 'workout' | 'in-progress' | 'done' | 'rest'.
// workout is today's plan day ({name, focus, duration_minutes, exercises}); next is {name, date} for a rest day.
// workoutStatus ('loading' | 'ready' | 'error') is whether the history and the unfinished workout have both loaded: until
// they have, the card can't know whether to start, resume or show the summary, so it shows no button (#134).
export default function TodayHero({ state, plan, workout, completedSession, next, errorText, workoutStatus, onStart, onRetry }) {
  const badge = { 'in-progress': 'In progress', done: 'Done', rest: 'Rest day' }[state]
  return (
    <section className={`home-hero home-hero--${state}`} aria-label="Today's workout" aria-busy={state === 'loading'}>
      <div className="home-hero__body">
        <div className="home-hero__eyebrow">
          <span>Today's workout</span>
          {badge && <span className="home-hero__badge">{badge}</span>}
        </div>
        <HeroContent state={state} plan={plan} workout={workout} completedSession={completedSession} next={next} errorText={errorText} workoutStatus={workoutStatus} onStart={onStart} onRetry={onRetry} />
      </div>
    </section>
  )
}

// Stands in for the card's button while the workout state isn't known yet.
function WorkoutStatusAction({ workoutStatus, onRetry }) {
  if (workoutStatus === 'error') {
    return <>
      <p className="home-hero__text" role="alert">Couldn't load your workouts. Check your connection and try again.</p>
      <button type="button" className="home-hero__action" onClick={onRetry}>Try again</button>
    </>
  }
  return <p className="home-hero__text" role="status">Checking your workout…</p>
}

function HeroContent({ state, plan, workout, completedSession, next, errorText, workoutStatus, onStart, onRetry }) {
  if (state === 'loading') return <p className="home-hero__text" role="status">Loading today's workout…</p>
  if (state === 'error') {
    return <>
      <p className="home-hero__text" role="alert">{errorText}</p>
      <button type="button" className="home-hero__action" onClick={onRetry}>Try again</button>
    </>
  }
  if (state === 'no-plan') {
    return <>
      <h2 className="home-hero__title">No workout plan selected</h2>
      <p className="home-hero__text">Pick a plan and today's session will show up here.</p>
      <Link className="home-hero__action" to="/plans">Browse workout plans <span aria-hidden="true">→</span></Link>
    </>
  }
  if (state === 'rest') {
    return <>
      <h2 className="home-hero__title">Rest day</h2>
      <p className="home-hero__text">
        Nothing is scheduled today in {plan.name}.{next ? ` Next up: ${next.name} on ${shortDay(next.date)}.` : ''}
      </p>
      {workoutStatus === 'ready'
        ? <Link className="home-hero__action home-hero__action--quiet" to="/weekly-plan">View your weekly plan <span aria-hidden="true">→</span></Link>
        : <WorkoutStatusAction workoutStatus={workoutStatus} onRetry={onRetry} />}
    </>
  }
  const { names, more } = exercisePreview(workout?.exercises)
  return <>
    <h2 className="home-hero__title">{workout.name}</h2>
    <p className="home-hero__meta">
      {workout.duration_minutes && <span><MobileDashboardIcon name="clock" /> About {workout.duration_minutes} min</span>}
      {workout.focus && <span>{workout.focus}</span>}
    </p>
    {state === 'done' && completedSession && (
      <p className="home-hero__text">Finished today · {completedSession.set_count} sets · {formatVolume(completedSession.total_volume_lb)}</p>
    )}
    {state !== 'done' && names.length > 0 && (
      <ul className="home-hero__exercises" aria-label="Today's exercises">
        {names.map((name) => <li key={name}>{name}</li>)}
        {more > 0 && <li className="home-hero__more">+{more} more</li>}
      </ul>
    )}
    {workoutStatus !== 'ready'
      ? <WorkoutStatusAction workoutStatus={workoutStatus} onRetry={onRetry} />
      : state === 'done'
      ? <Link className="home-hero__action home-hero__action--quiet" to={summaryPath(completedSession.id)} state={{ from: '/dashboard' }}>View workout summary <span aria-hidden="true">→</span></Link>
      : <button type="button" className="home-hero__action" onClick={onStart}>{state === 'in-progress' ? 'Resume workout' : 'Start workout'} <span aria-hidden="true">→</span></button>}
  </>
}
