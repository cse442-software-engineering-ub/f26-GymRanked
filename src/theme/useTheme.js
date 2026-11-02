import { useEffect, useState } from 'react'
import { THEME_EVENT, currentTheme } from './theme.js'

// The theme now showing, kept up to date when anything changes it (a toggle, the account's saved theme
// arriving after sign-in, or a failed save switching back). For theme controls such as ThemeToggle.
export default function useTheme() {
  const [theme, setTheme] = useState(() => currentTheme())
  useEffect(() => {
    const update = (event) => setTheme(event.detail?.theme ?? currentTheme())
    window.addEventListener(THEME_EVENT, update)
    setTheme(currentTheme())
    return () => window.removeEventListener(THEME_EVENT, update)
  }, [])
  return theme
}
