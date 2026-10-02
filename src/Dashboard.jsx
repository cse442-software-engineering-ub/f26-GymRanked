import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { authRequest } from './auth/api.js'
import { weekRangeLabel } from './weeklySchedule.js'

const METRICS = [
  { label: 'RANK', value: 'Unranked', accent: true },
  { label: 'VOLUME THIS WEEK', value: '0 lb' },
  { label: 'NEW PRS', value: '0' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function MetricCard({ label, value, accent = false }) {
  return (
    <article className="dashboard-metric">
      <span className="dashboard-metric__label">{label}</span>
      <strong className={accent ? 'dashboard-metric__value dashboard-metric__value--accent' : 'dashboard-metric__value'}>
        {value}
      </strong>
    </article>
  )
}

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(location.state?.fullName?.trim() || '')

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

  const displayName = fullName || 'Athlete'
  const firstName = displayName.split(/\s+/)[0]

  return (
    <div className="dashboard-page">
      <NavBar current="Dashboard" userName={fullName} />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Let's move weight, {firstName}.</h1>
            <p>{weekRangeLabel(new Date())} · 0 sessions logged</p>
          </div>
          <button type="button" className="dashboard-secondary-action">Log a lift</button>
        </header>

        <section className="dashboard-metrics" aria-label="Weekly summary">
          {METRICS.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="dashboard-overview" aria-label="Workout overview">
          <article className="dashboard-card dashboard-lifts">
            <header className="dashboard-card__heading">
              <h2>Today's lifts</h2>
              <button type="button">+ Add lift</button>
            </header>
            <div className="dashboard-lifts__empty">
              No lifts logged today — add your first to get placed.
            </div>
          </article>

          <article className="dashboard-card dashboard-volume">
            <header className="dashboard-card__heading">
              <h2>Volume by day</h2>
            </header>
            <div className="dashboard-chart" aria-label="No lifting volume logged Monday through Sunday">
              {DAYS.map((day) => (
                <div className="dashboard-chart__day" key={day}>
                  <span className="dashboard-chart__bar" />
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
