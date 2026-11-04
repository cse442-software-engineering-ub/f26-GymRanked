import { useState } from 'react'
import { saveTheme } from './theme.js'
import useTheme from './useTheme.js'
import './themeToggle.css'

const OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

// Dark / Light buttons (Add Dark and Light Mode Toggle to the Account Settings). The page switches the moment a
// button is pressed; saveTheme() saves it to the account and switches back if the save fails, and useTheme()
// keeps the highlighted button and the status line in step with whatever theme is actually showing.
export default function ThemeToggle() {
  const theme = useTheme()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function choose(value) {
    if (saving || value === theme) return
    setSaving(true)
    setError('')
    try {
      await saveTheme(value)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="theme-toggle">
    <div className="theme-toggle__options" role="group" aria-label="Color theme" aria-busy={saving}>
      {OPTIONS.map((option) => <button
        key={option.value}
        type="button"
        className="theme-toggle__option"
        aria-pressed={theme === option.value}
        onClick={() => choose(option.value)}
      >
        <ThemeIcon name={option.value} />{option.label}
      </button>)}
    </div>
    <p className="theme-toggle__status" role="status">{theme === 'light' ? 'Light mode is on.' : 'Dark mode is on.'}</p>
    {error && <p className="theme-toggle__error" role="alert">{error}</p>}
  </div>
}

function ThemeIcon({ name }) {
  return <svg className="theme-toggle__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'dark'
      ? <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
  </svg>
}
