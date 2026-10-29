import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import MobileDashboardIcon from './MobileDashboardIcon.jsx'
import { authRequest } from './auth/api.js'
import { apiRequest } from './onboarding/api.js'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
import { buildWeek, weekRangeLabel } from './weeklySchedule.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'
import { summaryPath } from './workoutLog/setLog.js'
import { formatVolume } from './workoutLog/workoutSummary.js'
import { dashboardHistory } from './dashboardHistory.js'
import { fetchUnfinishedSession } from './workoutSessionApi.js'
import { getLeaderboard } from './leaderboard/leaderboardApi.js'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function WeeklyGoalCard({ state, standings, plan, planReady, today, nextWorkout, unfinished, completedSession, onRetry, onStart }) {
  const { status, data } = state
  const dates = data?.completed_dates ?? []
  const easternToday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const datePart = (type) => easternToday.find((part) => part.type === type).value
  const todayDate = `${datePart('year')}-${datePart('month')}-${datePart('day')}`
  const weekDays = data ? Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${data.week_start}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    return date.toISOString().slice(0, 10)
  }) : []
  const action = unfinished && plan && unfinished.plan === plan.name ? 'Resume workout' : 'Start workout'
  return <section className="dashboard-card dashboard-weekly" aria-label="Weekly training goal">
    <div className="dashboard-weekly__heading">
      <div><p className="dashboard-weekly__eyebrow">THIS WEEK</p><h2>Your weekly goal</h2></div>
      <Link to="/leaderboard" className="dashboard-weekly__standings">View leaderboard ›</Link>
    </div>
    {status === 'loading' && <p role="status">Loading your weekly progress...</p>}
    {status === 'error' && <div className="dashboard-weekly__error" role="alert">Couldn't load your weekly progress. Try again. <button type="button" onClick={onRetry}>Try again</button></div>}
    {status === 'ready' && <>
      <p className="dashboard-weekly__count">{data.progress_days} of {data.target_days} <span>training days</span></p>
      <div className="dashboard-progress" role="progressbar" aria-label="Weekly goal progress" aria-valuemin={0} aria-valuemax={data.target_days} aria-valuenow={data.progress_days}><span style={{ width: `${data.progress_percent}%` }} /></div>
      <ol className="dashboard-weekly__days" aria-label="This week's training days">{weekDays.map((date, index) => {
        const done = dates.includes(date)
        return <li key={date} className={done ? 'dashboard-weekly__day dashboard-weekly__day--done' : 'dashboard-weekly__day'}><strong>{DAY_NAMES[(index + 1) % 7]}</strong><span>{done ? '✓ Completed' : date === todayDate && plan && !today ? 'Rest' : '—'}</span></li>
      })}</ol>
    </>}
    {nextWorkout && <p className="dashboard-weekly__next">Next workout: <strong>{nextWorkout.name}</strong> · {plan.name}</p>}
    <p className="dashboard-weekly__standing">{standings.status === 'error' ? <>Couldn't load leaderboard. Try again. <button type="button" onClick={onRetry}>Try again</button></> : standings.status === 'ready' ? standings.data?.me?.ranked ? `All-time rank #${standings.data.me.rank}` : standings.data?.me ? 'Unranked' : 'Standing unavailable' : 'Loading standing...'}</p>
    <p className="dashboard-weekly__note">Weekly standings are not available yet. View the all-time leaderboard.</p>
    <div className="dashboard-weekly__actions">{!planReady ? null : plan && today && !completedSession ? <button type="button" className="dashboard-primary-action" onClick={onStart}>{action}</button> : plan && completedSession ? <Link className="dashboard-weekly__secondary" to={summaryPath(completedSession.id)}>View workout summary ›</Link> : plan ? <Link className="dashboard-weekly__secondary" to="/weekly-plan">View your weekly plan ›</Link> : <Link className="dashboard-primary-action" to="/plans">Browse workout plans ›</Link>}</div>
  </section>
}

function MetricCard({ label, value, hint, accent = false, icon }) {
  return (
    <article className="dashboard-metric">
      <span className="dashboard-metric__icon" aria-hidden="true"><MobileDashboardIcon name={icon} /></span>
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

function metricsFor(plan, planError, historyStatus, progress) {
  const historyUnavailable = historyStatus === 'error'
  const historyLoading = historyStatus === 'loading'
  const completed = progress?.totalCompleted ?? 0
  return [
    {
      label: 'RANK',
      icon: 'trophy',
      value: historyUnavailable ? 'Unavailable' : historyLoading ? 'Loading…' : completed >= 3 ? 'Rank pending' : 'Getting started',
      hint: historyUnavailable ? 'Try loading your completed workouts again' : completed >= 3 ? 'Ranking is not available yet' : plan ? `${completed} of 3 workouts completed toward a rank` : 'Select a plan, then complete 3 workouts to earn a rank',
      accent: true,
    },
    {
      label: 'WORKOUTS THIS WEEK',
      icon: 'dumbbell',
      value: planError || historyUnavailable ? 'Unavailable' : plan ? historyLoading ? 'Loading…' : `${progress.thisWeek} of ${plan.days_per_week}` : 'No plan yet',
      hint: planError || historyUnavailable ? 'Try loading your workout summary again' : plan ? `${plan.days_per_week} workouts scheduled in ${plan.name}` : 'Select a workout plan to set a weekly goal',
    },
    {
      label: 'WEEKLY CONSISTENCY',
      icon: 'calendar',
      value: planError || historyUnavailable ? 'Unavailable' : historyLoading ? 'Loading…' : `${progress?.streakWeeks ?? 0} ${progress?.streakWeeks === 1 ? 'week' : 'weeks'}`,
      hint: 'Consecutive completed weeks with your current plan',
    },
  ]
}

// plan is null when the user hasn't selected one; today is that day's workout or null on a rest day.
function TodayWorkoutCard({ plan, today, completedSession, weekLabel, onBrowse, onView }) {
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
        <button type="button" className="dashboard-weekly__secondary dashboard-primary-action--spaced" onClick={onBrowse}>
          Browse workout plans ›
        </button>
      </article>
    )
  }
  return (
    <article className="dashboard-card dashboard-today dashboard-today--planned" aria-label="Today's workout">
      <header className="dashboard-card__heading">
        <div className="dashboard-today__heading-label"><h2>Today's workout</h2><span aria-hidden="true">·</span><span>{weekLabel}</span></div>
        {today && <span className="dashboard-card__meta">About {today.duration_minutes} min</span>}
      </header>
      <p className="dashboard-today__plan">
        Current plan: <Link to={`/plans/${plan.id}`}>{plan.name}</Link>
      </p>
      {completedSession && <p className="dashboard-today__completed">Completed today · {completedSession.set_count} sets · {formatVolume(completedSession.total_volume_lb)}</p>}
      <h3 className="dashboard-card__title">{today ? today.name : 'Rest day'}</h3>
      <p className="dashboard-card__text">
        {today
          ? `${today.focus} — part of your ${plan.name} plan.`
          : `No session scheduled today in your ${plan.name} plan. Rest up and come back tomorrow.`}
      </p>
      <div className="dashboard-today__mobile-summary">
        <span className="dashboard-today__mobile-icon"><MobileDashboardIcon name="dumbbell" /></span>
        <div>
          <strong>{today ? today.name : 'Rest day'}</strong>
          <span>{today ? today.focus : `No session scheduled today in your ${plan.name} plan.`}</span>
          {today && <span className="dashboard-today__mobile-duration"><MobileDashboardIcon name="clock" /> About {today.duration_minutes} min</span>}
        </div>
      </div>
      {today?.exercises?.length > 0 && (
        <ol className="dashboard-exercises" aria-label="Today's exercises">
          {today.exercises.map((exercise, index) => (
            <li className="dashboard-exercise" key={exercise}>
              <span className="dashboard-exercise__number">{index + 1}</span>
              <span className="dashboard-exercise__mobile-icon"><MobileDashboardIcon name="dumbbell" /></span>
              <div><strong>{exercise}</strong></div>
              <MobileDashboardIcon name="chevron" className="dashboard-exercise__chevron" />
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="dashboard-weekly__secondary dashboard-primary-action--spaced" onClick={onView}>
        <span className="dashboard-desktop-only">{completedSession ? 'View workout summary ›' : today ? `View ${plan.name} ›` : 'View your weekly plan ›'}</span>
        <span className="dashboard-mobile-only">{completedSession ? 'View summary ›' : today ? 'View plan ›' : 'View your weekly plan ›'}</span>
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
      <h3 className="dashboard-card__title dashboard-checklist__desktop-title">Your first-week checklist</h3>
      <h3 className="dashboard-card__title dashboard-checklist__mobile-title">Getting started</h3>
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
  const { personalDetails } = useOutletContext()
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
  const [planError, setPlanError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [historyState, setHistoryState] = useState({ status: 'loading', sessions: [] })
  const [weeklyState, setWeeklyState] = useState({ status: 'loading', data: null })
  const [standingState, setStandingState] = useState({ status: 'loading', data: null })
  const [unfinished, setUnfinished] = useState(null)

  useEffect(() => {
    let active = true
    setWeeklyState({ status: 'loading', data: null })
    setStandingState({ status: 'loading', data: null })
    apiRequest('weekly_goal.php').then((result) => { if (active) setWeeklyState({ status: result.ok ? 'ready' : 'error', data: result.ok ? result.data : null }) })
    getLeaderboard('overall').then((result) => { if (active) setStandingState({ status: result.ok ? 'ready' : 'error', data: result.ok ? result.data : null }) })
    fetchUnfinishedSession().then((session) => { if (active) setUnfinished(session) })
    return () => { active = false }
  }, [loadAttempt])

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
    Promise.allSettled([
      fetchCurrentPlan().then(async ({ plan }) => (plan ? { ...(await fetchPlan(plan.id)), started_at_epoch: plan.started_at_epoch } : null)),
      apiRequest('preferences.php').then((result) => (result.ok ? result.data.training_goal : null)),
    ]).then(([planResult, goalResult]) => {
      if (!active) return
      setPlanError(planResult.status === 'rejected' ? "Couldn't load your workout summary. Check your connection and try again." : '')
      setSetup({
        plan: planResult.status === 'fulfilled' ? planResult.value : null,
        goal: goalResult.status === 'fulfilled' ? goalResult.value : null,
      })
    })
    return () => { active = false }
  }, [loadAttempt])

  useEffect(() => {
    let active = true
    setHistoryState({ status: 'loading', sessions: [] })
    workoutLogApi.getHistory().then((sessions) => {
      if (active) setHistoryState({ status: 'ready', sessions: Array.isArray(sessions) ? sessions : [] })
    }).catch((error) => {
      if (!active) return
      if (error.status === 401) navigate('/login', { replace: true })
      else setHistoryState({ status: 'error', sessions: [] })
    })
    return () => { active = false }
  }, [loadAttempt, navigate])

  function retryPlan() {
    setSetup(null)
    setPlanError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  const plan = setup?.plan ?? null
  const goal = setup?.goal ?? null
  const currentDate = new Date()
  const schedule = plan ? buildWeek(plan, currentDate) : []
  const today = schedule.find((day) => day.when === 'today')?.workout ?? null
  const progress = historyState.status === 'ready' ? dashboardHistory(historyState.sessions, plan, currentDate) : null
  const nextWorkout = schedule.find((day) => (day.when === 'today' && !progress?.todaySession || day.when === 'upcoming') && day.workout)?.workout ?? plan?.days?.[0] ?? null
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
      detail: planError ? "Couldn't check your saved plan" : plan ? `You're following ${plan.name}` : 'Browse the library and pick the plan that fits you',
      done: Boolean(plan),
      action: planError ? 'Try again' : 'Browse plans',
      onAction: planError ? retryPlan : () => navigate('/plans'),
    },
    {
      title: 'Log your first lift',
      detail: historyState.status === 'error' ? "Couldn't check your saved lifts" : historyState.status === 'loading' ? 'Checking your saved lifts…' : progress?.hasLift ? 'First lift logged — keep the momentum going' : 'Record weight and reps to track progress',
      done: Boolean(progress?.hasLift),
    },
  ]

  const displayName = fullName || 'Athlete'
  const firstName = displayName.split(/\s+/)[0]

  return (
    <div className="dashboard-page">
      <NavBar current="Dashboard" userName={fullName} />
      <main className="dashboard-content">
        {!personalDetails.complete && <section className="dashboard-card" aria-label="Personal details for ranking">
          <p className="dashboard-card__text">You can't qualify for ranking without entering weight and gender</p>
          <Link className="dashboard-primary-action" to="/personal-details">Add personal details</Link>
        </section>}
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
            <span className="dashboard-header__eyebrow">{planError ? 'WORKOUT SUMMARY UNAVAILABLE' : plan ? `YOUR ${plan.level.toUpperCase()} PLAN` : 'WELCOME TO GYMRANK'}</span>
            <h1>{plan || planError || setup === null ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}</h1>
            <p className="dashboard-header__desktop-copy">
              {setup === null
                ? 'Loading your dashboard...'
                : planError
                  ? 'Your workout summary could not be loaded. Try again below.'
                : plan
                  ? progress?.totalCompleted > 0 ? 'Your completed workouts are adding up. Keep the momentum going.' : 'You are one workout away from starting your first week.'
                  : 'Start by selecting a workout plan — it takes a minute and sets up your week.'}
            </p>
            {setup !== null && plan && <p className="dashboard-header__mobile-copy">Consistency builds strength. Let’s keep the momentum going.</p>}
          </div>
        </header>

        <WeeklyGoalCard state={weeklyState} standings={standingState} plan={plan} planReady={setup !== null && !planError} today={today} nextWorkout={nextWorkout} unfinished={unfinished} completedSession={progress?.todaySession} onRetry={retryPlan} onStart={() => navigate('/workouts/today')} />
        <section className="dashboard-metrics" aria-label="Weekly summary">
          {metricsFor(plan, planError, historyState.status, progress).map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>
        {historyState.status === 'error' && (
          <div className="dashboard-history-error" role="alert">
            <span>Couldn't load your completed workouts. Check your connection and try again.</span>
            <button type="button" onClick={retryPlan}>Try again</button>
          </div>
        )}

        <section className="dashboard-overview" aria-label="Workout overview">
          {setup === null ? (
            <article className="dashboard-card dashboard-today" aria-busy="true">
              <p className="dashboard-card__text">Loading today's workout...</p>
            </article>
          ) : planError ? (
            <article className="dashboard-card dashboard-today" aria-label="Today's workout" role="alert">
              <header className="dashboard-card__heading">
                <div className="dashboard-today__heading-label"><h2>Today's workout</h2><span aria-hidden="true">·</span><span>{weekRangeLabel(currentDate)}</span></div>
              </header>
              <p className="dashboard-card__text">{planError}</p>
              <button type="button" className="dashboard-primary-action dashboard-primary-action--spaced" onClick={retryPlan}>Try again</button>
            </article>
          ) : (
            <TodayWorkoutCard
              plan={plan}
              today={today}
              completedSession={progress?.todaySession}
              weekLabel={weekRangeLabel(currentDate)}
              onBrowse={() => navigate('/plans')}
              onView={() => navigate(progress?.todaySession ? summaryPath(progress.todaySession.id) : today ? `/plans/${plan.id}` : '/weekly-plan')}
            />
          )}
          <ChecklistCard items={checklist} />
        </section>
      </main>
    </div>
  )
}

export default Dashboard
