import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import AppMenu, { MenuBrand } from './AppMenu.jsx'
import PhoneMenu from './PhoneMenu.jsx'
import './navigation.css'

// The frame around every signed-in page (story 131, card 133): the menu and, beside or under it, the page.
// On a computer or tablet (701px or wider) the menu is a sidebar on the left; on a phone it is behind "Menu".
// OnboardingGate renders this once and swaps only its children when the page changes, so the sidebar stays in
// place: it is not rebuilt, does not flash and keeps its scroll position.
function AppShell({ userName, children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const page = useRef(null)
  const focusPage = useRef(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  // After a page is chosen in the phone menu the menu is gone, so the focus moves to the new page. A choice in the
  // sidebar keeps the focus on its row, which stays on screen.
  useEffect(() => {
    if (!focusPage.current) return
    focusPage.current = false
    page.current?.focus({ preventScroll: true })
  }, [pathname])

  // Choosing the page that is already open changes no address, so move the focus straight away.
  function onPhoneChoice() {
    focusPage.current = true
    requestAnimationFrame(() => {
      if (!focusPage.current) return
      focusPage.current = false
      page.current?.focus({ preventScroll: true })
    })
  }

  async function onLogout() {
    if (logoutBusy) return
    setLogoutBusy(true)
    setLogoutError('')
    try {
      await authRequest('logout', {})
      navigate('/login', { replace: true, state: { message: 'You are logged out.' } })
    } catch (error) {
      setLogoutError(error.message)
      setLogoutBusy(false)
    }
  }

  const menu = { userName, onLogout, logoutBusy, logoutError }

  return (
    <div className="app-shell">
      <button type="button" className="app-skip" onClick={() => page.current?.focus()}>Skip to the page</button>
      <aside className="app-sidebar">
        <MenuBrand />
        <AppMenu label="Primary" {...menu} />
      </aside>
      <PhoneMenu {...menu} onChoose={onPhoneChoice} />
      <div className="app-shell__page" id="app-page" tabIndex={-1} ref={page}>
        {children}
      </div>
    </div>
  )
}

export default AppShell
