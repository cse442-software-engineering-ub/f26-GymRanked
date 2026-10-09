import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
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

// Figma "Weekly workout-plan": the logged-in user's current plan laid out over this week.
function WeeklyPlan() {
  // {plan, week} with the plan's days filled in; plan is null when the user hasn't picked one.
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState(null)
  const [loggedOut, setLoggedOut] = useState(false)

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

  const today = new Date()
  const plan = current?.plan
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
              <Link to={`/plans/${plan.id}`} className="button-primary today-workout__action">
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
