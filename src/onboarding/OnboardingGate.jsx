import { useEffect, useLayoutEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import { setAlwaysDark, syncAccountTheme } from '../theme/theme.js'
import { apiRequest } from './api.js'
import { isAlwaysDarkPath, isAuthPath, requiredOnboardingRoute, signedInRedirect } from './onboardingRoute.js'

export default function OnboardingGate() {
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [check, setCheck] = useState({ path: '', status: 'loading' })

  // Before paint, so moving between an always-dark page and a themed one never flashes the wrong theme.
  useLayoutEffect(() => {
    setAlwaysDark(isAlwaysDarkPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    let active = true
    const path = location.pathname
    // Keep this handoff for the current visit: RecommendedPlansPage clears the history state after mounting.
    const equipmentJustSaved = path === '/recommended' && location.state?.setupSaved === true
    setCheck({ path, status: 'loading' })

    async function checkAccount() {
      try {
        const { user } = await authRequest('session')
        // The account's saved theme beats the one this browser remembered (once per signed-in user).
        syncAccountTheme(user?.id)
        const [goalResult, setupResult, detailsResult] = await Promise.all([
          apiRequest('preferences.php'),
          apiRequest('setup.php'),
          apiRequest('personal_details.php'),
        ])
        if (!active) return
        if ([goalResult, setupResult, detailsResult].some((result) => result.status === 401)) {
          setCheck({ path, status: 'signed-out' })
        } else if (!goalResult.ok || !setupResult.ok || !detailsResult.ok) {
          setCheck({ path, status: 'error' })
        } else {
          setCheck({
            path,
            status: 'ready',
            required: requiredOnboardingRoute(goalResult.data.training_goal, setupResult.data, detailsResult.data),
            personalDetails: detailsResult.data,
            trainingComplete: requiredOnboardingRoute(goalResult.data.training_goal, setupResult.data, { complete: true }) === null,
            equipmentJustSaved,
          })
        }
      } catch (error) {
        if (active) setCheck({ path, status: error.status === 401 ? 'signed-out' : 'error' })
      }
    }

    checkAccount()
    return () => { active = false }
  }, [location.pathname, attempt])

  if (check.path !== location.pathname || check.status === 'loading') {
    return <main className="status" role="status">Checking your account setup…</main>
  }
  if (check.status === 'signed-out') {
    return isAuthPath(location.pathname) ? <Outlet /> : <Navigate to="/login" replace />
  }
  if (check.status === 'error') {
    return <main className="status" role="alert">
      <p>We couldn’t check your account setup. Try again.</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
    </main>
  }

  const redirect = signedInRedirect(location.pathname, check.required, check.equipmentJustSaved)
  if (redirect) return <Navigate to={redirect} replace />
  return <Outlet context={{ personalDetails: check.personalDetails, trainingComplete: check.trainingComplete }} />
}
