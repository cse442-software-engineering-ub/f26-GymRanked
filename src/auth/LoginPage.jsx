import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Brand from './Brand.jsx'
import FormField from './FormField.jsx'
import LeaderboardPreview from './LeaderboardPreview.jsx'
import { authRequest, validate } from './api.js'

export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: location.state?.email || '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(location.state?.message || '')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    authRequest('session').then(data => {
      if (active) navigate('/dashboard', { replace: true, state: { fullName: data.user.full_name } })
    }).catch(() => {})
    return () => { active = false }
  }, [navigate])
  const change = event => {
    const { name, value, checked, type } = event.target
    setValues(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: undefined }))
    setFailure('')
  }
  async function submit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors); setFailure(''); setMessage('')
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    try {
      const data = await authRequest('login', values)
      navigate('/dashboard', { replace: true, state: { fullName: data.user.full_name } })
    } catch (error) { setFailure(error.message); setErrors(error.fields || {}) }
    finally { setBusy(false) }
  }
  return <main className="landing">
    <header className="landing-brand"><Brand /></header>
    <section className="hero"><h1>Every rep gets a <span className="accent">rank.</span></h1><p>Log your lifts, climb the tiers, and call out rivals head-to-head.</p></section>
    <div className="preview-slot"><LeaderboardPreview /></div>
    <section className="login-panel" aria-labelledby="login-title">
      <form className="auth-stack" onSubmit={submit} noValidate>
        <h2 id="login-title">Log in to GymRank</h2><p className="subtitle">Welcome back. Your division is waiting.</p>
        {message && <p className="notice" role="status">{message}</p>}{failure && <p className="form-error" role="alert">{failure}</p>}
        <FormField name="email" label="Email" type="email" autoComplete="username" placeholder="you@email.com" maxLength={254} value={values.email} onChange={change} error={errors.email} required />
        <FormField name="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" maxLength={72} value={values.password} onChange={change} error={errors.password} required />
        <div className="login-options"><label><input name="remember" type="checkbox" checked={values.remember} onChange={change} />Keep me logged in</label><button type="button" className="text-button" onClick={() => setMessage('Password recovery is not available yet. Please contact the GymRank team.')}>Forgot password?</button></div>
        <button className="primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <div className="divider"><span />OR<span /></div>
        <div className="social-buttons">{['Google', 'Apple'].map(provider => <button type="button" key={provider} onClick={() => setMessage(`${provider} sign-in is not available yet. Please use your email and password.`)}>{provider}</button>)}</div>
        <p className="account-link"><span>New to GymRank? </span><Link to="/register">Create an account</Link></p>
      </form>
    </section>
  </main>
}
