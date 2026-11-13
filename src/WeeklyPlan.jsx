import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
import { fetchUnfinishedSession } from './workoutSessionApi.js'
import { buildWeek, weekRangeLabel } from './weeklySchedule.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'
import { summaryPath } from './workoutLog/setLog.js'
import { easternDate, todaySessionState } from './weeklyTimeline.js'

const STATUS_LABELS = { past: 'Earlier this week', today: 'Today', upcoming: 'Upcoming' }
const calendarDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function DayCard({ day, date, savedSession }) {
  const classes = ['day-card']
  if (day.when === 'today') classes.push('day-card--today')
  if (!day.workout) classes.push('day-card--rest')
  return (
    <li className={classes.join(' ')} aria-current={day.when === 'today' ? 'date' : undefined}>
      <span className="day-card__weekday">{day.label}<span className="day-card__date"> {date.getDate()}{day.when === 'today' ? ' · Today' : ''}</span></span>
      <span className="day-card__name">{savedSession?.name || day.workout?.name || 'Rest day'}</span>
      <span className="day-card__status">
        {/* Today always says "Today", so it isn't marked by colour alone, even on a rest day. */}
        {savedSession ? <Link to={summaryPath(savedSession.id)}>View summary</Link> : day.when === 'today' ? 'Today' : day.workout ? STATUS_LABELS[day.when] : 'Recovery'}
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

  // Completed workouts, so a workout already finished today is shown as done rather than offered again.
  const [history, setHistory] = useState([])
  useEffect(() => {
    workoutLogApi.getHistory().then((sessions) => setHistory(Array.isArray(sessions) ? sessions : [])).catch(() => {})
  }, [])

  const today = new Date()
  const plan = current?.plan
  // A workout left over from a previously selected plan isn't resumed: the API starts the new plan's workout instead.
  const resumable = unfinished && plan && unfinished.plan === plan.name ? unfinished : null
  const days = plan ? buildWeek(plan, today) : []
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  const dayDates = days.map((_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index))
  const scheduledWorkout = days.find((day) => day.when === 'today')?.workout
  // What is saved today wins over the weekday schedule: it is the workout the start button opens.
  const saved = todaySessionState(history, unfinished, plan, easternDate(today))
  const todayWorkout = saved ? plan.days.find((day) => day.name === saved.session.name) ?? scheduledWorkout : scheduledWorkout

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
              <h1><span className="weekly-plan__desktop-title">{plan.name} — Week {current.week}</span><span className="weekly-plan__mobile-title">Workouts</span></h1>
              <p>{weekRangeLabel(today)}</p>
            </div>
            <ol className="weekly-plan__days" aria-label="Your week">
              {days.map((day, index) => (
                <DayCard key={day.label} day={day} date={dayDates[index]} savedSession={history.find((session) => easternDate(session.completed_at) === calendarDate(dayDates[index]))} />
              ))}
            </ol>
            <section className="today-workout" aria-labelledby="today-workout-name" style={{ '--workout-hero-image': `url("${import.meta.env.BASE_URL}backdrops/dumbbells.webp")` }}>
              <p className="today-workout__label">
                {saved?.state === 'in_progress' ? "Today's workout · In progress" : saved ? "Today's workout · Completed" : "Today's workout"}
              </p>
              <h2 id="today-workout-name" className="today-workout__name">
                {todayWorkout ? todayWorkout.name : 'Rest day'}
              </h2>
              <p className="today-workout__meta">
                {todayWorkout
                  ? `${plan.name} · ${todayWorkout.focus} · About ${todayWorkout.duration_minutes} min · ${todayWorkout.exercises?.length ?? 0} exercises`
                  : 'Recovery'}
              </p>
              {todayWorkout?.exercises?.length > 0 && (
                <div className="today-workout__mobile-exercises">
                  <h3>Exercises</h3>
                  <ol aria-label={`${todayWorkout.name} exercises`}>
                    {todayWorkout.exercises.map((exercise, index) => (
                      <li key={`${exercise}-${index}`}><span aria-hidden="true">{index + 1}</span><strong>{exercise}</strong></li>
                    ))}
                  </ol>
                </div>
              )}
              {saved && scheduledWorkout?.name !== saved.session.name && (
                <p className="today-workout__meta">
                  {scheduledWorkout ? `Scheduled today: ${scheduledWorkout.name}. You're doing ${saved.session.name} instead.` : `Not a scheduled training day. You're doing ${saved.session.name}.`}
                </p>
              )}
              {saved?.state === 'completed' && (
                <Link to={summaryPath(saved.session.id)} className="button-primary today-workout__action today-workout__start">
                  View workout summary ›
                </Link>
              )}
              {todayWorkout && saved?.state !== 'completed' && (
                <button type="button" className="button-primary today-workout__action today-workout__start" onClick={() => navigate('/workout/active')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                  </svg>
                  <span className="workout-redesign__desktop-label">{resumable ? `Resume ${resumable.name}` : "Start today's workout"}</span>
                  <span className="workout-redesign__mobile-label">{resumable ? 'Resume workout' : 'Start workout'}</span>
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
