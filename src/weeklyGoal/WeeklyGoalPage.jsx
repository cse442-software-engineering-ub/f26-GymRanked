import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import WeeklyGoalDisplay from './WeeklyGoalDisplay.jsx'
import { getWeeklyGoal, saveWeeklyGoal } from './weeklyGoalApi.js'
import {
  DAY_CHOICES, confirmText, daysText, defaultWeek, isUnchanged, loadErrorText, saveErrorText, savedText, shortDate,
  startingTarget, weekChoices,
} from './weeklyGoalFormat.js'
import './weeklyGoal.css'

// #/weekly-goal (task #88, story #87): choose a weekly training-day target, confirm it, and save it through
// api/weekly_goal.php. Everything shown comes from the server, so a refresh shows the saved goal and real days.
export default function WeeklyGoalPage() {
  const [load, setLoad] = useState({ status: 'loading', goal: null, error: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoad((previous) => ({ ...previous, status: 'loading' }))
    getWeeklyGoal().then((result) => {
      if (!active) return
      setLoad(result.ok
        ? { status: 'ready', goal: result.data, error: '' }
        : { status: result.status === 401 ? 'signed-out' : 'error', goal: null, error: loadErrorText(result) })
    })
    return () => { active = false }
  }, [attempt])

  return (
    <div className="weekly-goal-page">
      <NavBar />
      <main className="weekly-goal-page__content">
        <header className="weekly-goal-page__heading">
          <Link className="weekly-goal-page__back" to="/dashboard">← Back to Dashboard</Link>
          <h1>Weekly goal</h1>
          <p>Choose how many days you want to train each week. Every day you finish a workout counts.</p>
        </header>
        {load.status === 'signed-out'
          ? <p className="weekly-goal-message weekly-goal-message--error" role="alert">Your session has ended. <Link to="/login">Log in again</Link> to see your weekly goal.</p>
          : <WeeklyGoalDisplay goal={load.goal} status={load.goal ? 'ready' : load.status} errorText={load.error} onRetry={() => setAttempt((value) => value + 1)} />}
        {load.goal && <GoalForm goal={load.goal} onGoal={(goal) => setLoad({ status: 'ready', goal, error: '' })} />}
      </main>
    </div>
  )
}

function GoalForm({ goal, onGoal }) {
  const choices = weekChoices(goal)
  const [week, setWeek] = useState(defaultWeek(goal))
  const [target, setTarget] = useState(startingTarget(goal, defaultWeek(goal)))
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const confirmRef = useRef(null)
  const reviewRef = useRef(null)

  // A week that can no longer be saved (this week became locked) falls back to next week.
  useEffect(() => {
    if (!choices.includes(week)) {
      setWeek('next')
      setTarget(startingTarget(goal, 'next'))
    }
  }, [goal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Move focus with the step: to the question when it opens, back to "Review goal" when it closes without saving.
  const returnFocus = useRef(false)
  useEffect(() => {
    if (confirming) confirmRef.current?.focus()
    else if (returnFocus.current) reviewRef.current?.focus()
    returnFocus.current = false
  }, [confirming])

  function chooseWeek(value) {
    setWeek(value)
    setTarget(startingTarget(goal, value))
    setConfirming(false)
    setMessage(null)
  }

  function chooseTarget(value) {
    setTarget(value)
    setConfirming(false)
    setMessage(null)
  }

  function cancel() {
    returnFocus.current = true
    setConfirming(false)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    const result = await saveWeeklyGoal(week, target)
    setSaving(false)
    setConfirming(false)
    if (result.ok) {
      onGoal(result.data)
      const nextWeek = defaultWeek(result.data)
      setWeek(nextWeek)
      setTarget(startingTarget(result.data, nextWeek))
      setMessage({ kind: 'success', text: savedText(week, target) })
      return
    }
    setMessage({ kind: 'error', text: saveErrorText(result), login: result.status === 401 })
    if (result.status === 409) {
      // Someone (another window, or a workout just finished) locked this week: show the real state.
      const fresh = await getWeeklyGoal()
      if (fresh.ok) onGoal(fresh.data)
    }
  }

  const unchanged = isUnchanged(goal, week, target)
  const confirm = confirmText(goal, week, target)
  const formTitle = goal.target_locked ? "Choose next week's goal" : 'Set your weekly goal'

  return (
    <section className="weekly-goal-form" aria-labelledby="weekly-goal-form-title">
      <h2 id="weekly-goal-form-title">{formTitle}</h2>
      <p className="weekly-goal-form__intro">
        {goal.target_locked
          ? `This week's goal of ${daysText(goal.target_days)} is locked. A new goal starts ${shortDate(goal.next_week.week_start)}.`
          : "You can set this week's goal until you save it or log your first workout day of the week."}
      </p>

      <form onSubmit={(event) => { event.preventDefault(); if (!unchanged) setConfirming(true) }}>
        {choices.length > 1 && (
          <fieldset>
            <legend>Which week?</legend>
            <div className="weekly-goal-form__options">
              {choices.map((value) => (
                <label key={value} className="weekly-goal-option">
                  <input type="radio" name="weekly-goal-week" value={value} checked={week === value} disabled={saving} onChange={() => chooseWeek(value)} />
                  <span>{value === 'current' ? 'This week' : `Next week (from ${shortDate(goal.next_week.week_start)})`}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend>{week === 'current' ? "This week's" : "Next week's"} training days</legend>
          <div className="weekly-goal-form__days">
            {DAY_CHOICES.map((days) => (
              <label key={days} className="weekly-goal-option">
                <input type="radio" name="weekly-goal-days" value={days} checked={target === days} disabled={saving} onChange={() => chooseTarget(days)} aria-label={daysText(days)} />
                <span aria-hidden="true">{days}</span>
              </label>
            ))}
          </div>
          <p className="weekly-goal-form__hint">{daysText(target)} per week. Pick a pace you can keep.</p>
        </fieldset>

        {!confirming && (
          <div className="weekly-goal-form__actions">
            <button ref={reviewRef} type="submit" className="weekly-goal-button weekly-goal-button--primary" disabled={saving || unchanged}>Review goal ›</button>
          </div>
        )}
        {!confirming && unchanged && <p className="weekly-goal-form__hint">{daysText(target)} is already saved for next week. Choose a different number to change it.</p>}
      </form>

      {confirming && (
        <div className="weekly-goal-confirm" role="group" aria-labelledby="weekly-goal-confirm-title">
          <h3 id="weekly-goal-confirm-title" ref={confirmRef} tabIndex={-1}>{confirm.title}</h3>
          <p>{confirm.body}</p>
          <div className="weekly-goal-form__actions">
            <button type="button" className="weekly-goal-button weekly-goal-button--primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Confirm and save'}</button>
            <button type="button" className="weekly-goal-button weekly-goal-button--subtle" disabled={saving} onClick={cancel}>Go back</button>
          </div>
        </div>
      )}

      {message && (
        <p className={`weekly-goal-message weekly-goal-message--${message.kind}`} role={message.kind === 'success' ? 'status' : 'alert'}>
          {message.kind === 'success' && <span aria-hidden="true">✓ </span>}
          {message.text}
          {message.login && <> <Link to="/login">Log in</Link></>}
        </p>
      )}
    </section>
  )
}
