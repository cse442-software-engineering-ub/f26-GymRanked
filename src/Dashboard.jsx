import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import { authRequest } from './auth/api.js'

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
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const firstName = location.state?.fullName?.trim().split(/\s+/)[0] || 'Marcus'

  async function logout() {
    setLogoutBusy(true)
    setLogoutError('')
    try {
      await authRequest('logout', {})
      navigate('/login', {
        replace: true,
        state: { message: 'You are logged out.' },
      })
    } catch (error) {
      setLogoutError(error.message)
    } finally {
      setLogoutBusy(false)
    }
  }

  return (
    <div className="dashboard-page">
      <NavBar current="Dashboard" onLogout={logout} logoutBusy={logoutBusy} />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Let's move weight, {firstName}.</h1>
            <p>Week of Sep 7 – 13 · 0 sessions logged</p>
          </div>
          <button type="button" className="dashboard-secondary-action">Log a lift</button>
        </header>

        {logoutError && <p className="dashboard-alert" role="alert">{logoutError}</p>}

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
            <header className="dashboard-card__heading dashboard-card__heading--stacked">
              <h2>Volume by day</h2>
              <p>Mon–Sun · lb moved</p>
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
