import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Brand from './Brand.jsx'
import FormField from './FormField.jsx'
import { authRequest, validate } from './api.js'

export default function RegistrationPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const strength = [values.password.length >= 12, /[a-zA-Z]/.test(values.password), /[0-9]/.test(values.password), /[^a-zA-Z0-9]/.test(values.password)].filter(Boolean).length
  function change(event) {
    const { name, value } = event.target
    setValues(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: undefined })); setFailure('')
  }
  async function submit(event) {
    event.preventDefault()
    const nextErrors = validate(values, true)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true); setFailure('')
    try {
      await authRequest('register', values)
    } catch (error) {
      setFailure(error.message); setErrors(error.fields || {}); setBusy(false)
      return
    }
    try {
      // New accounts start onboarding. Log in first so the goal page has a session.
      await authRequest('login', { email: values.email, password: values.password })
      navigate('/goal', { replace: true })
    } catch {
      // Account exists but auto-login failed (e.g. rate limit): send them to log in manually.
      navigate('/login', { replace: true, state: { email: values.email.trim(), message: 'Account created. Log in to continue.' } })
    } finally { setBusy(false) }
  }
  return <main className="registration">
    <header className="registration-header"><Brand /><Link className="close" to="/login" aria-label="Close registration">×</Link></header>
    <form className="register-card auth-stack" noValidate onSubmit={submit}>
      <h1>Create your account</h1><p className="subtitle">Let's set up your training profile.</p>
      {failure && <p className="form-error" role="alert">{failure}</p>}
      <FormField name="full_name" label="Full name" autoComplete="name" placeholder="Marcus Malone" maxLength={100} value={values.full_name} onChange={change} error={errors.full_name} required />
      <FormField name="email" label="Email" type="email" autoComplete="email" placeholder="you@email.com" maxLength={254} value={values.email} onChange={change} error={errors.email} required />
      <FormField name="password" label="Password" type="password" autoComplete="new-password" placeholder="••••••••••••" maxLength={72} reveal value={values.password} onChange={change} error={errors.password} required />
      <div className="password-strength"><span className="accent">Password strength: {values.password ? (strength === 4 ? 'Strong' : strength >= 2 ? 'Moderate' : 'Weak') : 'Not entered'}</span><meter min="0" max="4" value={strength} aria-label="Password strength" /><p>Use 12+ characters with letters, numbers &amp; symbols.</p></div>
      <FormField name="confirm_password" label="Confirm password" type="password" autoComplete="new-password" placeholder="••••••••••••" maxLength={72} reveal value={values.confirm_password} onChange={change} error={errors.confirm_password} required />
      <button className="primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      <p className="account-link">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  </main>
}
