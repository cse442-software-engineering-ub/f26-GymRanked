import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { authRequest } from './auth/api.js'
import { apiRequest } from './onboarding/api.js'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
import { buildWeek, weekRangeLabel } from './weeklySchedule.js'

function MetricCard({ label, value, hint, accent = false }) {
  return (
    <article className="dashboard-metric">
      <span className="dashboard-metric__icon" aria-hidden="true" />
      <div className="dashboard-metric__body">
        <span className="dashboard-metric__label">{label}</span>
        <strong className={accent ? 'dashboard-metric__value dashboard-metric__value--accent' : 'dashboard-metric__value'}>
          {value}
        </strong>
        <span className="dashboard-metric__hint">{hint}</span>
      </div>
    </article>
  )
}

function metricsFor(plan) {
  return [
    {
      label: 'RANK',
      value: 'Getting started',
      hint: plan ? 'Complete 3 workouts to earn a rank' : 'Select a plan, then complete 3 workouts to earn a rank',
      accent: true,
    },
    {
      label: 'WORKOUTS THIS WEEK',
      value: plan ? `0 of ${plan.days_per_week}` : 'No plan yet',
      hint: plan ? 'Hit every session to build your streak' : 'Select a workout plan to set a weekly goal',
    },
    {
      label: 'WEEKLY CONSISTENCY',
      value: '0 weeks',
      hint: 'Your streak begins after your first full week',
    },
  ]
}

// plan is null when the user hasn't selected one; today is that day's workout or null on a rest day.
function TodayWorkoutCard({ plan, today, weekLabel, onBrowse, onView }) {
  if (!plan) {
    return (
      <article className="dashboard-card dashboard-today" aria-label="Today's workout">
        <header className="dashboard-card__heading">
          <div className="dashboard-today__heading-label"><h2>Today's workout</h2><span aria-hidden="true">·</span><span>{weekLabel}</span></div>
        </header>
        <h3 className="dashboard-card__title">No workout plan selected</h3>
        <p className="dashboard-card__text">
          Start by selecting a workout plan. Once you pick one, today's session will show up here.
        </p>
        <button type="button" className="dashboard-primary-action dashboard-primary-action--spaced" onClick={onBrowse}>
          Browse workout plans ›
        </button>
      </article>
    )
  }
  return (
    <article className="dashboard-card dashboard-today" aria-label="Today's workout">
      <header className="dashboard-card__heading">
        <div className="dashboard-today__heading-label"><h2>Today's workout</h2><span aria-hidden="true">·</span><span>{weekLabel}</span></div>
        {today && <span className="dashboard-card__meta">About {today.duration_minutes} min</span>}
      </header>
      <p className="dashboard-today__plan">
        Current plan: <Link to={`/plans/${plan.id}`}>{plan.name}</Link>
      </p>
      <h3 className="dashboard-card__title">{today ? today.name : 'Rest day'}</h3>
      <p className="dashboard-card__text">
        {today
          ? `${today.focus} — part of your ${plan.name} plan.`
          : `No session scheduled today in your ${plan.name} plan. Rest up and come back tomorrow.`}
      </p>
      {today?.exercises?.length > 0 && (
        <ol className="dashboard-exercises" aria-label="Today's exercises">
          {today.exercises.map((exercise, index) => (
            <li className="dashboard-exercise" key={exercise}>
              <span className="dashboard-exercise__number">{index + 1}</span>
              <div><strong>{exercise}</strong></div>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="dashboard-primary-action dashboard-primary-action--spaced" onClick={onView}>
        {today ? `View ${plan.name} ›` : 'View your weekly plan ›'}
      </button>
    </article>
  )
}

function ChecklistCard({ items }) {
  const doneCount = items.filter((item) => item.done).length
  return (
    <article className="dashboard-card dashboard-checklist" aria-label="First-week checklist">
      <header className="dashboard-card__heading">
        <h2>Getting started</h2>
        <span className="dashboard-card__meta dashboard-card__meta--accent">{doneCount} of {items.length}</span>
      </header>
      <h3 className="dashboard-card__title">Your first-week checklist</h3>
      <div
        className="dashboard-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={doneCount}
      >
        <span style={{ width: `${(doneCount / items.length) * 100}%` }} />
      </div>
      <ul className="dashboard-steps">
        {items.map((item, index) => (
          <li className="dashboard-step" key={item.title}>
            <span className={item.done ? 'dashboard-step__marker dashboard-step__marker--done' : 'dashboard-step__marker'}>
              {item.done ? '✓' : index + 1}
            </span>
            <div className="dashboard-step__text">
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
            {item.action && !item.done && (
              <button type="button" className="dashboard-step__action" onClick={item.onAction}>{item.action}</button>
            )}
          </li>
        ))}
      </ul>
      <p className="dashboard-tip">
        <strong>Beginner tip:</strong> Start lighter than you think. Good form matters more than heavy weight.
      </p>
    </article>
  )
}

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(location.state?.fullName?.trim() || '')
  // One-time message from choosing a plan (src/usePlanSelection.jsx).
  const [planNotice, setPlanNotice] = useState(location.state?.planNotice || '')

  // Drop the message from the history entry so reloading the page doesn't show it again.
  useEffect(() => {
    if (location.state?.planNotice) {
      navigate(location.pathname, { replace: true, state: { fullName: location.state.fullName } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // null while loading; {plan, goal} afterwards, where plan/goal are null if the user hasn't chosen one.
  const [setup, setSetup] = useState(null)

  useEffect(() => {
    let active = true
    authRequest('session')
      .then(data => {
        if (active) setFullName(data.user.full_name.trim())
      })
      .catch(() => {
        if (active) navigate('/login', { replace: true })
      })
    return () => { active = false }
  }, [navigate])

  useEffect(() => {
    let active = true
    Promise.all([
      fetchCurrentPlan().then(async ({ plan }) => (plan ? fetchPlan(plan.id) : null)).catch(() => null),
      apiRequest('preferences.php').then((result) => (result.ok ? result.data.training_goal : null)),
    ]).then(([plan, goal]) => {
      if (active) setSetup({ plan, goal })
    })
    return () => { active = false }
  }, [])

  const plan = setup?.plan ?? null
  const goal = setup?.goal ?? null
  const currentDate = new Date()
  const today = plan ? buildWeek(plan, currentDate).find((day) => day.when === 'today').workout : null
  const checklist = [
    {
      title: 'Choose your training goal',
      detail: goal ? 'Goal saved — you can change it any time' : 'Tell us whether you want strength, fat loss or endurance',
      done: Boolean(goal),
      action: 'Choose goal',
      onAction: () => navigate('/goal'),
    },
    {
      title: 'Select a workout plan',
      detail: plan ? `You're following ${plan.name}` : 'Browse the library and pick the plan that fits you',
      done: Boolean(plan),
      action: 'Browse plans',
      onAction: () => navigate('/plans'),
    },
    { title: 'Log your first lift', detail: 'Record weight and reps to track progress' },
  ]

  const displayName = fullName || 'Athlete'
  const firstName = displayName.split(/\s+/)[0]

  return (
    <div className="dashboard-page">
      <NavBar current="Dashboard" userName={fullName} />
      <main className="dashboard-content">
        {planNotice && (
          <div className="dashboard-notice" role="status">
            <p>{planNotice}</p>
            <button type="button" aria-label="Dismiss message" onClick={() => setPlanNotice('')}>
              ×
            </button>
          </div>
        )}
        <header className="dashboard-header">
          <div>
            <span className="dashboard-header__eyebrow">{plan ? `YOUR ${plan.level.toUpperCase()} PLAN` : 'WELCOME TO GYMRANK'}</span>
            <h1>{plan || setup === null ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}</h1>
            <p>
              {setup === null
                ? 'Loading your dashboard...'
                : plan
                  ? 'You are one workout away from starting your first week.'
                  : 'Start by selecting a workout plan — it takes a minute and sets up your week.'}
            </p>
          </div>
        </header>

        <section className="dashboard-metrics" aria-label="Weekly summary">
          {metricsFor(plan).map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="dashboard-overview" aria-label="Workout overview">
          {setup === null ? (
            <article className="dashboard-card dashboard-today" aria-busy="true">
              <p className="dashboard-card__text">Loading today's workout...</p>
            </article>
          ) : (
            <TodayWorkoutCard
              plan={plan}
              today={today}
              weekLabel={weekRangeLabel(currentDate)}
              onBrowse={() => navigate('/plans')}
              onView={() => navigate(today ? `/plans/${plan.id}` : '/weekly-plan')}
            />
          )}
          <ChecklistCard items={checklist} />
        </section>
      </main>
    </div>
  )
}

export default Dashboard
