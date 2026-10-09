import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import { apiRequest } from './api.js'
import { requiredOnboardingRoute } from './onboardingRoute.js'

export default function OnboardingGate() {
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [check, setCheck] = useState({ path: '', status: 'loading' })

  useEffect(() => {
    let active = true
    const path = location.pathname
    setCheck({ path, status: 'loading' })

    async function checkAccount() {
      try {
        await authRequest('session')
        const [goalResult, setupResult] = await Promise.all([
          apiRequest('preferences.php'),
          apiRequest('setup.php'),
        ])
        if (!active) return
        if (goalResult.status === 401 || setupResult.status === 401) {
          setCheck({ path, status: 'signed-out' })
        } else if (!goalResult.ok || !setupResult.ok) {
          setCheck({ path, status: 'error' })
        } else {
          setCheck({
            path,
            status: 'ready',
            required: requiredOnboardingRoute(goalResult.data.training_goal, setupResult.data),
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
  if (check.status === 'signed-out') return <Navigate to="/login" replace />
  if (check.status === 'error') {
    return <main className="status" role="alert">
      <p>We couldn’t check your account setup. Try again.</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
    </main>
  }

  if (check.required === '/goal' && location.pathname !== '/goal') return <Navigate to="/goal" replace />
  if (check.required === '/setup' && !['/goal', '/setup'].includes(location.pathname)) {
    return <Navigate to="/setup" replace />
  }
  return <Outlet />
}
