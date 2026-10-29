import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
import { fetchUnfinishedSession } from './workoutSessionApi.js'
import { buildWeek, weekRangeLabel } from './weeklySchedule.js'

const STATUS_LABELS = { past: 'Earlier this week', today: 'Today', upcoming: 'Upcoming' }

function DayCard({ day }) {
  const classes = ['day-card']
  if (day.when === 'today') classes.push('day-card--today')
  if (!day.workout) classes.push('day-card--rest')
  return (
    <li className={classes.join(' ')} aria-current={day.when === 'today' ? 'date' : undefined}>
      <span className="day-card__weekday">{day.label}</span>
      <span className="day-card__name">{day.workout ? day.workout.name : 'Rest day'}</span>
      <span className="day-card__status">
        {/* Today always says "Today", so it isn't marked by colour alone, even on a rest day. */}
        {day.when === 'today' ? 'Today' : day.workout ? STATUS_LABELS[day.when] : 'Recovery'}
      </span>
    </li>
  )
}

// "3 sets logged · 1 of 3 exercises started", for the Resume workout button.
function unfinishedSummary(session) {
  const setCount = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  const started = session.exercises.filter((exercise) => exercise.sets.length > 0).length
  return `${setCount} ${setCount === 1 ? 'set' : 'sets'} logged · ${started} of ${session.exercises.length} exercises started`
}

// Figma "Weekly workout-plan": the logged-in user's current plan laid out over this week.
function WeeklyPlan() {
  const navigate = useNavigate()
  // {plan, week} with the plan's days filled in; plan is null when the user hasn't picked one.
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)
  // The workout started but not completed, if there is one: the start button then offers to resume it.
  const [unfinished, setUnfinished] = useState(null)

  useEffect(() => {
    fetchCurrentPlan()
      .then(async ({ plan, week }) => {
        setCurrent({ plan: plan && (await fetchPlan(plan.id)), week })
      })
      .catch((err) => {
        if (err.status === 401) setLoggedOut(true)
        else setError(err.message)
      })
  }, [])

  useEffect(() => {
    fetchUnfinishedSession().then(setUnfinished)
  }, [])

  const today = new Date()
  const plan = current?.plan
  // A workout left over from a previously selected plan isn't resumed: the API starts the new plan's workout instead.
  const resumable = unfinished && plan && unfinished.plan === plan.name ? unfinished : null
  const days = plan ? buildWeek(plan, today) : []
  const todayWorkout = days.find((day) => day.when === 'today')?.workout

  return (
    <div className="plan-library">
      <NavBar current="Workouts" />
      <main className="weekly-plan" aria-busy={!loggedOut && !error && current === null}>
        {loggedOut && (
          <p className="status">
            <Link to="/login">Log in</Link> to see your weekly plan.
          </p>
        )}
        {error && (
          <p className="status status--error" role="alert">
            Error loading your plan: {error}. Refresh the page to try again.
          </p>
        )}
        {!loggedOut && !error && current === null && <p className="status">Loading your plan...</p>}
        {current && !plan && (
          <section className="today-workout" aria-labelledby="no-plan-title">
            <p className="today-workout__label">Get started</p>
            <h2 id="no-plan-title" className="today-workout__name">No workout plan selected yet</h2>
            <p className="today-workout__meta">
              Start by selecting a plan from the library. Your week, with a workout for each training day, will appear here.
            </p>
            <Link to="/plans" className="button-primary today-workout__action">
              Browse workout plans ›
            </Link>
          </section>
        )}
        {plan && (
          <>
            <div className="weekly-plan__heading">
              <h1>
                {plan.name} — Week {current.week}
              </h1>
              <p>{weekRangeLabel(today)}</p>
            </div>
            <ol className="weekly-plan__days">
              {days.map((day) => (
                <DayCard key={day.label} day={day} />
              ))}
            </ol>
            <section className="today-workout" aria-labelledby="today-workout-name">
              <p className="today-workout__label">Today&apos;s workout</p>
              <h2 id="today-workout-name" className="today-workout__name">
                {todayWorkout ? todayWorkout.name : 'Rest day'}
              </h2>
              <p className="today-workout__meta">
                {todayWorkout
                  ? `${todayWorkout.focus} · ~${todayWorkout.duration_minutes} min`
                  : 'Recovery'}
              </p>
              {todayWorkout && (
                <button type="button" className="button-primary today-workout__action today-workout__start" onClick={() => navigate('/workout/active')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                  </svg>
                  {resumable ? 'Resume workout' : "Start today's workout"}
                </button>
              )}
              {todayWorkout && resumable && (
                <p className="today-workout__resume" role="status">
                  {unfinishedSummary(resumable)}
                </p>
              )}
              <Link to={`/plans/${plan.id}`} className="today-workout__action today-workout__details">
                View plan details ›
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default WeeklyPlan
