import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import { authRequest } from '../auth/api.js'
import { apiRequest, errorMessage } from '../onboarding/api.js'
import { EQUIPMENT, LEVELS, toggleEquipment } from '../onboarding/setupOptions.js'
import ThemeToggle from '../theme/ThemeToggle.jsx'
import { GENDERS, validatePersonalDetails } from '../onboarding/personalDetails.js'
import './profile.css'

const GOALS = [
  { value: 'strength', label: 'Strength' },
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'aerobic', label: 'Aerobic fitness' },
]

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? 'Not set'
}

function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.[0] || '?').toUpperCase()
}

function useProfileData() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', user: null, settings: null, error: '' })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const session = await authRequest('session')
        const [goal, setup] = await Promise.all([apiRequest('preferences.php'), apiRequest('setup.php')])
        if (!active) return
        if (goal.status === 401 || setup.status === 401) {
          navigate('/login', { replace: true })
        } else if (!goal.ok || !setup.ok) {
          setState({ status: 'error', user: null, settings: null, error: 'Could not load your profile. Refresh the page to try again.' })
        } else {
          setState({ status: 'ready', user: session.user, settings: {
            goal: goal.data.training_goal,
            experience: setup.data.experience,
            equipment: setup.data.equipment,
          }, error: '' })
        }
      } catch (error) {
        if (!active) return
        if (error.status === 401) navigate('/login', { replace: true })
        else setState({ status: 'error', user: null, settings: null, error: 'Could not load your profile. Refresh the page to try again.' })
      }
    }
    load()
    return () => { active = false }
  }, [navigate])

  return state
}

function ProfileFrame({ user, children }) {
  return <div className="profile-page">
    <NavBar current="Profile" userName={user?.full_name || ''} />
    <main className="profile-content">{children}</main>
  </div>
}

export default function ProfilePage() {
  const { personalDetails } = useOutletContext()
  const { status, user, settings, error } = useProfileData()
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [saved] = useState(() => Boolean(location.state?.saved))

  useEffect(() => {
    if (location.state?.saved) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  async function logout() {
    setLogoutBusy(true)
    setLogoutError('')
    try {
      await authRequest('logout', {})
      navigate('/login', { replace: true, state: { message: 'You are logged out.' } })
    } catch (failure) {
      setLogoutError(failure.message)
      setLogoutBusy(false)
    }
  }

  return <ProfileFrame user={user}>
    <header className="profile-header"><p className="profile-eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p>Review your account and training settings.</p></header>
    {status === 'loading' && <p role="status">Loading your profile…</p>}
    {status === 'error' && <p className="profile-message profile-message--error" role="alert">{error}</p>}
    {status === 'ready' && <>
      {saved && <p className="profile-message profile-message--success" role="status">Settings saved.</p>}
      <section className="profile-card profile-identity" aria-label="Profile identity">
        <span className="profile-avatar" aria-label={`Profile picture: ${initials(user.full_name)}`}>{initials(user.full_name)}</span>
        <div><h2>{user.full_name}</h2><p>{user.email}</p></div>
      </section>
      <section className="profile-card" aria-labelledby="training-preferences-title">
        <div className="profile-card-heading"><div><p className="profile-eyebrow">YOUR SETUP</p><h2 id="training-preferences-title">Training Preferences</h2></div><Link className="profile-button profile-button--primary" to="/profile/training-preferences">Edit Training Preferences</Link></div>
        <dl className="profile-details">
          <div><dt>Training goal</dt><dd>{labelFor(GOALS, settings.goal)}</dd></div>
          <div><dt>Experience level</dt><dd>{labelFor(LEVELS, settings.experience)}</dd></div>
          <div><dt>Equipment selection</dt><dd>{settings.equipment.length ? settings.equipment.map((item) => labelFor(EQUIPMENT, item)).join(', ') : 'Not set'}</dd></div>
        </dl>
      </section>
      <section className="profile-card" aria-labelledby="weekly-goal-title">
        <div className="profile-card-heading"><div><p className="profile-eyebrow">CONSISTENCY</p><h2 id="weekly-goal-title">Weekly goal</h2></div><Link className="profile-button profile-button--primary" to="/weekly-goal">Set weekly goal</Link></div>
        <p className="profile-card-intro">Choose how many days you train each week and see the days you've completed.</p>
      </section>
      <section className="profile-card" aria-labelledby="account-settings-title">
        <p className="profile-eyebrow">ACCOUNT</p><h2 id="account-settings-title">Account Settings</h2>
        <dl className="profile-details"><div><dt>Full name</dt><dd>{user.full_name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div></dl>
      </section>
      <section className="profile-card" aria-labelledby="personal-details-title">
        <div className="profile-card-heading"><h2 id="personal-details-title">Personal details</h2><Link className="profile-button profile-button--primary" to={personalDetails.complete ? '/profile/personal-details' : '/personal-details'}>{personalDetails.complete ? 'Edit personal details' : 'Add personal details'}</Link></div>
        <p>Body weight: {personalDetails.bodyweight_lb == null ? 'Not set' : `${personalDetails.bodyweight_lb} lb`}</p>
        <p>Gender: {labelFor(GENDERS, personalDetails.gender)}</p>
      </section>
      <section className="profile-card" aria-labelledby="appearance-title">
        <p className="profile-eyebrow">DISPLAY</p><h2 id="appearance-title">Appearance</h2>
        <p className="profile-card-intro">Choose how GymRank looks. It changes right away and is saved to your account.</p>
        <ThemeToggle />
      </section>
      <button type="button" className="profile-logout" onClick={logout} disabled={logoutBusy}>{logoutBusy ? 'Logging out…' : 'Log out'}</button>
      {logoutError && <p className="profile-message profile-message--error" role="alert">{logoutError}</p>}
    </>}
  </ProfileFrame>
}

export function EditPersonalDetailsPage() {
  const { personalDetails } = useOutletContext()
  const { status, user, error: loadError } = useProfileData()
  const navigate = useNavigate()
  const [weight, setWeight] = useState(personalDetails.bodyweight_lb == null ? '' : String(personalDetails.bodyweight_lb))
  const [gender, setGender] = useState(personalDetails.gender ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [serverErrors, setServerErrors] = useState({})
  const errors = { ...validatePersonalDetails(weight, gender), ...serverErrors }
  const invalid = Object.keys(errors).length > 0

  async function save(event) {
    event.preventDefault()
    if (saving || invalid) return
    setSaving(true)
    setError('')
    const result = await apiRequest('personal_details.php', {
      method: 'POST', body: JSON.stringify({ bodyweight_lb: Number(weight), gender }),
    })
    if (result.ok && result.data?.complete) {
      navigate('/profile', { replace: true, state: { saved: true } })
      return
    }
    setServerErrors(result.status === 400 ? result.data?.errors ?? {} : {})
    setError(errorMessage(result, "Couldn't save your personal details. Try again."))
    setSaving(false)
  }

  return <ProfileFrame user={user}>
    <header className="profile-header"><Link className="profile-back" to="/profile">← Back to Profile</Link><p className="profile-eyebrow">PERSONAL DETAILS</p><h1>Edit personal details</h1><p>Update the details used for ranking.</p></header>
    {status === 'loading' && <p role="status">Loading your personal details…</p>}
    {status === 'error' && <p className="profile-message profile-message--error" role="alert">{loadError}</p>}
    {status === 'ready' && <form className="profile-card profile-form" onSubmit={save} noValidate aria-busy={saving}>
      {error && <p className="profile-message profile-message--error" role="alert">{error}</p>}
      <label className="profile-field">Body weight (lb)
        <input type="text" inputMode="decimal" value={weight} disabled={saving} aria-invalid={Boolean(errors.bodyweight_lb)} aria-describedby={errors.bodyweight_lb ? 'profile-weight-error' : 'profile-weight-hint'} onChange={(event) => { setWeight(event.target.value); setServerErrors({}) }} />
        <span id="profile-weight-hint" className="profile-field-hint">Enter 50–700 lb, with at most one decimal place.</span>
        {errors.bodyweight_lb && <span id="profile-weight-error" className="profile-field-error">{errors.bodyweight_lb}</span>}
      </label>
      <label className="profile-field">Gender
        <select value={gender} disabled={saving} aria-invalid={Boolean(errors.gender)} aria-describedby={errors.gender ? 'profile-gender-error' : undefined} onChange={(event) => { setGender(event.target.value); setServerErrors({}) }}>
          <option value="">Choose a gender</option>{GENDERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {errors.gender && <span id="profile-gender-error" className="profile-field-error">{errors.gender}</span>}
      </label>
      <div className="profile-form-actions"><Link className="profile-button profile-button--subtle" to="/profile">Cancel</Link><button className="profile-button profile-button--primary" type="submit" disabled={saving || invalid}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>}
  </ProfileFrame>
}

export function EditTrainingPreferencesPage() {
  const { status, user, settings, error: loadError } = useProfileData()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'ready') setDraft(settings)
  }, [status, settings])

  async function save(event) {
    event.preventDefault()
    if (!draft?.goal || !draft.experience || draft.equipment.length === 0) {
      setError('Choose a training goal, experience level, and at least one equipment option.')
      return
    }
    setSaving(true)
    setError('')
    const setupChanges = {}
    if (draft.experience !== settings.experience) setupChanges.experience = draft.experience
    if (JSON.stringify([...draft.equipment].sort()) !== JSON.stringify([...settings.equipment].sort())) setupChanges.equipment = draft.equipment
    if (Object.keys(setupChanges).length) {
      const setupResult = await apiRequest('setup.php', { method: 'POST', body: JSON.stringify(setupChanges) })
      if (!setupResult.ok) {
        setError(errorMessage(setupResult, "Couldn't save your training preferences. Try again."))
        setSaving(false)
        return
      }
    }
    if (draft.goal !== settings.goal) {
      const goalResult = await apiRequest('preferences.php', { method: 'POST', body: JSON.stringify({ training_goal: draft.goal }) })
      if (!goalResult.ok) {
        setError(errorMessage(goalResult, "Couldn't save your training goal. Your other changes may have saved; reload before trying again."))
        setSaving(false)
        return
      }
    }
    navigate('/profile', { replace: true, state: { saved: true } })
  }

  return <ProfileFrame user={user}>
    <header className="profile-header"><Link className="profile-back" to="/profile">← Back to Profile</Link><p className="profile-eyebrow">TRAINING SETTINGS</p><h1>Edit Training Preferences</h1><p>Choose what fits your goals and the equipment you can use.</p></header>
    {status === 'loading' && <p role="status">Loading your training preferences…</p>}
    {status === 'error' && <p className="profile-message profile-message--error" role="alert">{loadError}</p>}
    {status === 'ready' && draft && <form className="profile-card profile-form" onSubmit={save}>
      {error && <p className="profile-message profile-message--error" role="alert">{error}</p>}
      <label className="profile-field">Training goal<select value={draft.goal || ''} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} disabled={saving} required><option value="">Choose a goal</option>{GOALS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="profile-field">Experience level<select value={draft.experience || ''} onChange={(event) => setDraft({ ...draft, experience: event.target.value })} disabled={saving} required><option value="">Choose a level</option>{LEVELS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <fieldset className="profile-equipment"><legend>Equipment selection</legend><p>Select everything you can use. Bodyweight only turns the other choices off.</p><div className="profile-equipment-grid">{EQUIPMENT.map((option) => <button key={option.value} type="button" aria-pressed={draft.equipment.includes(option.value)} onClick={() => setDraft({ ...draft, equipment: toggleEquipment(draft.equipment, option.value) })} disabled={saving}>{option.label}</button>)}</div></fieldset>
      <div className="profile-form-actions"><Link className="profile-button profile-button--subtle" to="/profile">Cancel</Link><button className="profile-button profile-button--primary" type="submit" disabled={saving || !draft.goal || !draft.experience || !draft.equipment.length}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>}
  </ProfileFrame>
}
