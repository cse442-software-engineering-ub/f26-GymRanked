import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import EntryHandoff from '../auth/EntryHandoff.jsx'
import { endHandoff, handoffTarget, peekHandoff } from '../auth/entryHandoff.js'
import AppShell from '../navigation/AppShell.jsx'
import { hasMenu } from '../navigation/menuMap.js'
import { setAlwaysDark, syncAccountTheme } from '../theme/theme.js'
import { apiRequest } from './api.js'
import { isAlwaysDarkPath, isAuthPath, requiredOnboardingRoute, signedInRedirect } from './onboardingRoute.js'

export default function OnboardingGate() {
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [check, setCheck] = useState({ path: '', status: 'loading' })
  // The account of the last finished check, when it may see the menu (signed in, onboarding done). While the next
  // page is being checked the menu stays up from this, so it never disappears between two signed-in pages.
  const menuAccount = useRef(null)
  // The last finished check. Moving between log in and create account while signed out keeps the entry screen up
  // during the next check, so its form can slide instead of the screen blinking to "Checking…".
  const settled = useRef(null)
  // The slide into or out of the app (src/auth/entryHandoff.js) that this visit is finishing, if any.
  const [, setHandoffDone] = useState(0)

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
            userName: user?.full_name?.trim() ?? '',
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

  // Signed-in pages are shown inside the menu frame (src/navigation/AppShell.jsx). Returning the same <AppShell>
  // for the "checking" message and for the page keeps the menu mounted while only what is beside it changes.
  // Login, create account and the onboarding steps have no menu; someone with finished training setup who opens
  // the personal details step keeps it, as that page always had the navigation for them.
  const path = location.pathname
  const menuPage = (account) => Boolean(account) && (hasMenu(path) || (path === '/personal-details' && account.trainingComplete))
  const framed = (account, content) => (menuPage(account) ? <AppShell userName={account.userName}>{content}</AppShell> : content)

  // Every answer has the same shape (the page, then the handoff panel or nothing), so adding or removing the panel
  // never rebuilds the page.
  const handoff = peekHandoff()
  const finish = () => { endHandoff(); setHandoffDone((value) => value + 1) }
  // While the next page is checked the panel waits where the slide left it: the brand panel's width after Log out,
  // the sidebar's after log in, nothing after a sign-up.
  const hold = handoff === 'leave' ? 'hold' : handoff === 'arrive' && handoffTarget() === 'sidebar' ? 'hold-sidebar' : null
  const withHandoff = (content, phase) => <>{content}{phase ? <EntryHandoff key={phase} phase={phase} onDone={finish} /> : null}</>

  if (check.path !== path || check.status === 'loading') {
    if (settled.current?.status === 'signed-out' && isAuthPath(settled.current.path) && isAuthPath(path)) {
      return withHandoff(<Outlet />, null)
    }
    return withHandoff(framed(menuAccount.current, <main className="status" role="status">Checking your account setup…</main>), hold)
  }
  settled.current = check
  if (check.status === 'signed-out') {
    menuAccount.current = null
    if (!isAuthPath(path)) return withHandoff(<Navigate to="/login" replace />, hold)
    return withHandoff(<Outlet />, handoff === 'leave' && 'settle')
  }
  if (check.status === 'error') {
    if (handoff) endHandoff()
    return withHandoff(framed(menuAccount.current, <main className="status" role="alert">
      <p>We couldn’t check your account setup. Try again.</p>
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
    </main>), null)
  }

  menuAccount.current = check.required === null ? { userName: check.userName, trainingComplete: check.trainingComplete } : null
  const redirect = signedInRedirect(path, check.required, check.equipmentJustSaved)
  if (redirect) return withHandoff(<Navigate to={redirect} replace />, hold)
  const arrive = handoff === 'arrive' && (menuPage(menuAccount.current) ? 'arrive-sidebar' : 'arrive-none')
  return withHandoff(framed(menuAccount.current, <Outlet context={{ personalDetails: check.personalDetails, trainingComplete: check.trainingComplete }} />), arrive)
}
