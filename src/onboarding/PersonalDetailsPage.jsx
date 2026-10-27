import { useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import { apiRequest } from './api.js'
import { BackLink, Message, OnboardingShell, StepHeader, Tick } from './parts.jsx'
import { GENDERS, validatePersonalDetails } from './personalDetails.js'
import './personalDetails.css'

export default function PersonalDetailsPage() {
  const { personalDetails, trainingComplete } = useOutletContext()
  const form = <PersonalDetailsForm details={personalDetails} returning={trainingComplete} />
  if (trainingComplete) return <div className="ob-page">
    <NavBar current="Profile" />
    <main className="onboarding">{form}</main>
  </div>
  return <OnboardingShell step={0} backdrop="backdrops/rack.webp">{() => form}</OnboardingShell>
}

function PersonalDetailsForm({ details, returning }) {
  const navigate = useNavigate()
  const [weight, setWeight] = useState(details.bodyweight_lb == null ? '' : String(details.bodyweight_lb))
  const [gender, setGender] = useState(details.gender ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [serverErrors, setServerErrors] = useState({})
  const pending = useRef(false)
  const errors = { ...validatePersonalDetails(weight, gender), ...serverErrors }
  const invalid = Object.keys(errors).length > 0

  async function save(event) {
    event.preventDefault()
    if (pending.current || invalid) return
    pending.current = true
    setSaving(true)
    setError('')
    const result = await apiRequest('personal_details.php', {
      method: 'POST', body: JSON.stringify({ bodyweight_lb: Number(weight), gender }),
    })
    if (result.ok && result.data.complete === true) {
      navigate(returning ? '/dashboard' : '/goal', { replace: true })
      return
    }
    setError("Couldn't save your personal details. Try again.")
    setServerErrors(result.status === 400 ? result.data?.errors ?? {} : {})
    setSaving(false)
    pending.current = false
  }

  return <section className="pd-step">
    {returning && <BackLink to="/dashboard">Back to Dashboard</BackLink>}
    <StepHeader title="Personal details" subtitle={returning
      ? 'Add your details for ranking. Your workout plan stays the same.'
      : 'Start with your body weight and gender, then build your training plan.'} />
    <form className="pd-form" onSubmit={save} noValidate aria-busy={saving}>
      <Message tone="error">{error}</Message>
      <div className="pd-field">
        <label htmlFor="bodyweight">Body weight (lb)</label>
        <p id="weight-hint" className="pd-hint">Required. Enter 50–700 lb, with at most one decimal place.</p>
        <input id="bodyweight" name="bodyweight_lb" type="text" inputMode="decimal" required
          value={weight} disabled={saving} aria-invalid={Boolean(errors.bodyweight_lb)}
          aria-describedby={`weight-hint${errors.bodyweight_lb ? ' weight-error' : ''}`}
          onChange={(event) => { setWeight(event.target.value); setServerErrors({}) }} />
        {errors.bodyweight_lb && <p id="weight-error" className="pd-error" aria-live="polite">{errors.bodyweight_lb}</p>}
      </div>
      <fieldset className="pd-gender" aria-describedby={errors.gender ? 'gender-hint gender-error' : 'gender-hint'}>
        <legend>Gender</legend>
        <p id="gender-hint" className="pd-hint">Choose one. Prefer not to say is also an answer.</p>
        <div className="pd-choices">
          {GENDERS.map((option) => <button key={option.value} type="button" className="ob-option"
            aria-pressed={gender === option.value} disabled={saving}
            onClick={() => { setGender(option.value); setServerErrors({}) }}>
            <span>{option.label}</span><Tick />
          </button>)}
        </div>
        {errors.gender && <p id="gender-error" className="pd-error" aria-live="polite">{errors.gender}</p>}
      </fieldset>
      <div className="pd-actions">
        <button type="submit" className="ob-button ob-button--primary" disabled={saving || invalid}>
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
        {invalid && <p className="pd-hint">Complete both fields to continue.</p>}
      </div>
    </form>
  </section>
}
