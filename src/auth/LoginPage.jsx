import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FormField from './FormField.jsx'
import { authRequest, validate } from './api.js'
import { getWeekly123Run, startWeekly123Run, weekly123LoginPayload } from './weekly123Run.js'

// The log in form (story #18) on the right of the entry screen (EntryScreen.jsx). onEnter(path, state) plays the
// slide into the app and then opens the page. outgoing: this form is sliding away, so its ids get a prefix.
export default function LoginForm({ onEnter, outgoing = false, headingRef }) {
  const location = useLocation()
  const idPrefix = outgoing ? 'out-' : ''
  const [values, setValues] = useState({ email: location.state?.email || '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(location.state?.message || '')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const requestedTest = Number(new URLSearchParams(location.search).get('card123'))
  const testHost = ['aptitude.cse.buffalo.edu', 'localhost', '127.0.0.1'].includes(window.location.hostname)
  const testNumber = testHost && Number.isInteger(requestedTest) && requestedTest >= 1 && requestedTest <= 16 ? requestedTest : null
  const [testRun, setTestRun] = useState(() => getWeekly123Run())
  const loggedOut = message === 'You are logged out.'
  const accountCreated = message === 'Account created. Log in to continue.'
  const invalidCredentials = failure === 'Invalid email or password.'
  const change = event => {
    const { name, value, checked, type } = event.target
    setValues(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors(previous => ({ ...previous, [name]: undefined }))
  }
  async function submit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors); setFailure(''); setMessage('')
    if (Object.keys(nextErrors).length) return
    if (testNumber && testRun?.test !== testNumber) {
      setFailure(`Select Start Test ${testNumber} before logging in.`)
      return
    }
    setBusy(true)
    try {
      const data = await authRequest('login', weekly123LoginPayload(values, testRun))
      // The button stays on "Logging in…" while the screen slides into the app.
      onEnter('/dashboard', { fullName: data.user.full_name })
    } catch (error) {
      setErrors(error.fields || {})
      setFailure(error.message === 'Please check the highlighted fields.' ? '' : error.message)
      setBusy(false)
    }
  }
  return <section className="login-panel" aria-labelledby={`${idPrefix}login-title`}>
      <form className="auth-stack" onSubmit={submit} noValidate>
        <h1 id={`${idPrefix}login-title`} ref={headingRef} tabIndex={-1}>Log in to GymRank</h1><p className="subtitle">Welcome back. Your division is waiting.</p>
        {message && !loggedOut && <p className={accountCreated ? 'login-feedback login-feedback-success' : 'notice'} role="status">{message}</p>}
        {(failure || loggedOut) && (
          <p className="login-feedback" role={failure ? 'alert' : 'status'}>{failure || message}</p>
        )}
        {testNumber && <div className="notice" role="group" aria-label={`Card 123 Test ${testNumber} setup`}>
          <p>Card #123 Test {testNumber}: start a new independent test before signing in. Your account resets once after a successful login.</p>
          <button type="button" className="text-button" onClick={() => setTestRun(startWeekly123Run(testNumber))}>Start Test {testNumber}</button>
          {testRun?.test === testNumber && <p role="status">Test {testNumber} is ready. Sign in with the account named on the card.</p>}
        </div>}
        <FormField idPrefix={idPrefix} name="email" label="Email" type="email" autoComplete="username" placeholder="you@email.com" maxLength={254} value={values.email} onChange={change} error={errors.email} invalid={invalidCredentials} required />
        <FormField idPrefix={idPrefix} name="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" maxLength={72} value={values.password} onChange={change} error={errors.password} invalid={invalidCredentials} required />
        <div className="login-options"><label><input name="remember" type="checkbox" checked={values.remember} onChange={change} />Keep me logged in</label><button type="button" className="text-button" onClick={() => setMessage('Password recovery is not available yet. Please contact the GymRank team.')}>Forgot password?</button></div>
        <button className="primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="account-link"><span>New to GymRank? </span><Link to="/register">Create an account</Link></p>
      </form>
    </section>
}
