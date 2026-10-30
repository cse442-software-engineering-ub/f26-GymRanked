import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from './onboarding/api.js'

export default function WeeklyMilestoneCard({ goal, status, planDays, onSaved, onRetry }) {
  const editWeek = goal?.target_locked ? 'next' : 'current'
  const savedTarget = editWeek === 'next' ? goal?.next_week?.target_days : goal?.target_days
  const initialTarget = savedTarget ?? goal?.target_days ?? 3
  const [target, setTarget] = useState(initialTarget)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setTarget(initialTarget)
  }, [initialTarget, editWeek])

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    const result = await apiRequest('weekly_goal.php', {
      method: 'POST',
      body: JSON.stringify({ week: editWeek, target_days: target }),
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.status === 401 ? 'Your session ended. Sign in again to save your milestone.' : result.status === 409 ? "This week's milestone is locked. Reload the page to choose next week's goal." : "Couldn't save your milestone. Try again.")
      return
    }
    onSaved(result.data)
    setMessage(`${editWeek === 'current' ? "This week's" : "Next week's"} milestone is ${target} training ${target === 1 ? 'day' : 'days'}.`)
  }

  return <article className="dashboard-card dashboard-milestone" aria-label="Weekly milestone settings">
    <header className="dashboard-card__heading"><h2>Weekly milestone</h2></header>
    <h3 className="dashboard-card__title">{editWeek === 'current' ? 'Set your goal for this week' : 'Set your next goal'}</h3>
    {goal ? <>
      <p className="dashboard-card__text">This week: <strong>{goal.target_days} training {goal.target_days === 1 ? 'day' : 'days'}</strong>. {goal.target_locked ? "This goal is locked. Choose next week's goal, starting Monday." : 'You can set this week’s goal until you log a workout day.'}</p>
      <form onSubmit={save}>
        <label htmlFor="dashboard-milestone-days">{editWeek === 'current' ? "This week's" : "Next week's"} training days</label>
        <div className="dashboard-milestone__controls">
          <select id="dashboard-milestone-days" value={target} onChange={(event) => { setTarget(Number(event.target.value)); setMessage(''); setError('') }} disabled={saving}>
            {Array.from({ length: 7 }, (_, index) => index + 1).map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}
          </select>
          <button type="submit" className="dashboard-primary-action" disabled={saving || editWeek === 'next' && goal.next_week.saved && target === goal.next_week.target_days}>{saving ? 'Saving…' : 'Save milestone'}</button>
        </div>
      </form>
      {planDays && target > planDays && <p className="dashboard-milestone__hint">Your current plan schedules {planDays} training {planDays === 1 ? 'day' : 'days'} per week. Choose a plan with more training days to reach this milestone.</p>}
      <p className="dashboard-milestone__hint">Choose a pace that works for you. Whether your goal is one day or five, every workout you finish is progress.</p>
      {message && <p className="dashboard-milestone__success" role="status">{message}</p>}
      {error && <p className="dashboard-milestone__error" role="alert">{error}</p>}
    </> : status === 'error' ? <p className="dashboard-milestone__error" role="alert">Couldn't load your milestone. <button type="button" onClick={onRetry}>Try again</button></p> : <p className="dashboard-card__text">Loading your milestone…</p>}
    {/* The full Weekly goal page (#/weekly-goal, task #88): both weeks' goals and this week's completed days. */}
    <Link className="dashboard-today__view dashboard-milestone__goal-button" to="/weekly-goal">Set weekly goal ›</Link>
  </article>
}
