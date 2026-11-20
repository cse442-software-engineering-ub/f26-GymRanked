import { useEffect, useState } from 'react'
import { THEME_EVENT, chooseThemeSignedOut, currentTheme } from '../theme/theme.js'

// The light/dark switch in the top-right corner of the log in and create account screens. A sun shows in dark mode
// (switch to light), a moon in light mode (switch to dark). Nobody is signed in here, so the choice is remembered in
// this browser only; after logging in, the account's own saved theme (Account Settings → Appearance) applies.
export default function ThemeSwitch() {
  const [theme, setTheme] = useState(() => currentTheme())

  useEffect(() => {
    const onChange = (event) => setTheme(event.detail.theme)
    window.addEventListener(THEME_EVENT, onChange)
    return () => window.removeEventListener(THEME_EVENT, onChange)
  }, [])

  const next = theme === 'light' ? 'dark' : 'light'
  const label = next === 'light' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button type="button" className="entry-theme" aria-label={label} title={label} onClick={() => chooseThemeSignedOut(next)}>
      {next === 'light' ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  )
}
