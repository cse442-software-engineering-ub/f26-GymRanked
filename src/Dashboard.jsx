import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { DASHBOARD, addReturn } from './returnTarget.js'
import { authRequest } from './auth/api.js'
import { holdArrival } from './auth/entryHandoff.js'
import { apiRequest } from './onboarding/api.js'
import { fetchCurrentPlan, fetchPlan } from './plansApi.js'
import { buildWeek } from './weeklySchedule.js'
import workoutLogApi from './workoutLog/workoutLogApi.js'
import { dashboardHistory } from './dashboardHistory.js'
import { fetchUnfinishedSession } from './workoutSessionApi.js'
import { useBuddyGroupPoll } from './buddies/useBuddyGroupPoll.js'
import { easternDate, todaySessionState } from './weeklyTimeline.js'
import TodayHero from './dashboard/TodayHero.jsx'
import ThisWeekPanel from './dashboard/ThisWeekPanel.jsx'
import BuddiesFeed from './dashboard/BuddiesFeed.jsx'
import RankingsPanel from './dashboard/RankingsPanel.jsx'
import { lastLogged, nextUp, todayHeading } from './dashboard/dashboardFormat.js'
import './dashboard/dashboard.css'

// Shown under the welcome until the three first-week steps are done, then hidden for good.
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
  const [unfinished, setUnfinished] = useState(null)
  const [unfinishedStatus, setUnfinishedStatus] = useState('loading')
  // "From your buddies" stays up to date while the Dashboard is open (src/buddies/useBuddyGroupPoll.js).
  const buddies = useBuddyGroupPoll({ onUnauthorized: () => navigate('/login', { replace: true }) })
  const buddyState = buddies.state

  useEffect(() => {
    let active = true
    setWeeklyState({ status: 'loading', data: null })
    apiRequest('weekly_goal.php').then((result) => { if (active) setWeeklyState({ status: result.ok ? 'ready' : 'error', data: result.ok ? result.data : null }) })
    setUnfinishedStatus('loading')
    fetchUnfinishedSession()
      .then((session) => { if (active) { setUnfinished(session); setUnfinishedStatus('ready') } })
      .catch(() => { if (active) { setUnfinished(null); setUnfinishedStatus('error') } })
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
      setPlanError(planResult.status === 'rejected' ? "Couldn't load your workout plan. Check your connection and try again." : '')
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

  // Right after logging in, the slide into the app waits until the Dashboard's first data is in (at most 1.5s), so the
  // page slides in complete instead of jumping when its plan, week and history arrive (src/auth/entryHandoff.js).
  const releaseArrival = useRef(null)
  useLayoutEffect(() => {
    releaseArrival.current = holdArrival()
    return () => releaseArrival.current?.()
  }, [])
  const firstLoadDone = setup !== null && weeklyState.status !== 'loading' && historyState.status !== 'loading' && unfinishedStatus !== 'loading'
  useEffect(() => {
    if (firstLoadDone) releaseArrival.current?.()
  }, [firstLoadDone])

  function retry() {
    buddies.reload()
    setSetup(null)
    setPlanError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  const plan = setup?.plan ?? null
  const goal = setup?.goal ?? null
  const currentDate = new Date()
  const todayDate = easternDate(currentDate)
  const scheduleDate = new Date(`${todayDate}T12:00:00`)
  const schedule = plan ? buildWeek(plan, scheduleDate) : []
  const scheduledToday = schedule.find((day) => day.when === 'today')?.workout ?? null
  // Start, Resume and View summary are offered only once both the unfinished workout and the history have loaded,
  // so a failed load can't let the lifter start a second workout.
  const workoutStatus = historyState.status === 'error' || unfinishedStatus === 'error' ? 'error' : historyState.status === 'ready' && unfinishedStatus === 'ready' ? 'ready' : 'loading'
  // A session for today's scheduled day wins, so the hero names the workout Today opens.
  const saved = todaySessionState(historyState.sessions, unfinished, plan, todayDate, scheduledToday?.name ?? null)
  const savedDay = saved ? plan?.days?.find((day) => day.name === saved.session.name) ?? { name: saved.session.name } : null
  const today = savedDay ?? scheduledToday
  const progress = historyState.status === 'ready' ? dashboardHistory(historyState.sessions, plan, currentDate) : null
  const next = nextUp(plan, scheduleDate)
  const heroState = setup === null ? 'loading'
    : planError ? 'error'
      : !plan ? 'no-plan'
        : saved?.state === 'in_progress' ? 'in-progress'
          : saved?.state === 'completed' ? 'done'
            : today ? 'workout' : 'rest'

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
      onAction: planError ? retry : () => navigate('/plans'),
    },
    {
      title: 'Log your first lift',
      detail: historyState.status === 'error' ? "Couldn't check your saved lifts" : historyState.status === 'loading' ? 'Checking your saved lifts…' : progress?.hasLift ? 'First lift logged — keep the momentum going' : 'Record weight and reps to track progress',
      done: Boolean(progress?.hasLift),
    },
  ]
  // Only once everything has loaded, so the checklist doesn't flash for someone who has finished it.
  const showChecklist = setup !== null && historyState.status !== 'loading' && !checklist.every((item) => item.done)
  const hasGroup = buddyState.status === 'ready' ? Boolean(buddyState.data.group) : buddyState.status === 'error' ? false : null

  const displayName = fullName || 'Athlete'
  const firstName = displayName.split(/\s+/)[0]

  return (
    <div className="dashboard-page">
      <main className="dashboard-content home">
        {!personalDetails.complete && <section className="dashboard-card dashboard-personal-details" aria-label="Personal details for ranking">
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
        <header className="home-header">
          <p className="home-header__date">{todayHeading(currentDate)}</p>
          <h1>{plan || planError || setup === null ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}</h1>
        </header>

        {showChecklist && <ChecklistCard items={checklist} />}

        <div className="home-top">
          <TodayHero
            state={heroState}
            plan={plan}
            workout={today}
            completedSession={saved?.state === 'completed' ? saved.session : null}
            next={next}
            errorText={planError}
            workoutStatus={workoutStatus}
            onStart={() => navigate(addReturn('/workout/active', DASHBOARD))}
            onRetry={retry}
          />
          <ThisWeekPanel
            state={weeklyState}
            todayDate={todayDate}
            next={next}
            last={lastLogged(historyState.sessions)}
            hasPlan={Boolean(plan)}
            historyStatus={historyState.status}
            onRetry={retry}
          />
        </div>

        <div className="home-bottom">
          <BuddiesFeed state={buddyState} fresh={buddies.fresh} announcement={buddies.announcement} onRetry={retry} />
          <RankingsPanel hasGroup={hasGroup} attempt={loadAttempt} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
