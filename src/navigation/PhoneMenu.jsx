import { useEffect, useRef, useState } from 'react'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import AppMenu, { MenuBrand } from './AppMenu.jsx'

// Wider than this the sidebar shows and the phone menu is not needed. Keep in sync with navigation.css.
const SIDEBAR_QUERY = '(min-width: 701px)'

// The strip across the top of a phone page ("Menu" and the GymRank mark) and the menu it opens from the left. The
// menu is a real <dialog>, so while it is open the page behind cannot be clicked or reached with Tab, and Escape
// closes it. Closing with Escape, "Close" or a tap outside puts the focus back on "Menu" (the browser does this for
// a dialog). Choosing a page closes the menu and calls onChoose, which moves the focus to the new page.
function PhoneMenu({ userName, onChoose, onLogout, logoutBusy, logoutError }) {
  const [open, setOpen] = useState(false)
  const dialog = useRef(null)
  const closeButton = useRef(null)

  function openMenu() {
    if (!dialog.current || dialog.current.open) return
    dialog.current.showModal()
    // The first thing in the menu takes the focus, so a keyboard user can leave again at once.
    closeButton.current?.focus()
    setOpen(true)
  }

  function closeMenu() {
    if (dialog.current?.open) dialog.current.close()
  }

  // "close" fires for every way of closing: Escape, the Close button, a tap outside, choosing a page.
  useEffect(() => {
    const element = dialog.current
    if (!element) return undefined
    const onClose = () => setOpen(false)
    element.addEventListener('close', onClose)
    return () => element.removeEventListener('close', onClose)
  }, [])

  // Turning a tablet or widening the window brings the sidebar back, so the open menu closes by itself.
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const query = window.matchMedia(SIDEBAR_QUERY)
    const onChange = () => { if (query.matches) closeMenu() }
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  function choose() {
    closeMenu()
    onChoose()
  }

  return (
    <>
      <div className="app-topstrip">
        <button type="button" className="app-menu-button" aria-label="Open navigation menu" aria-haspopup="dialog"
          aria-expanded={open} aria-controls="app-phone-menu" onClick={openMenu}>
          <MobileDashboardIcon name="menu" />
          <span>Menu</span>
        </button>
        <MenuBrand />
      </div>

      {/* A click on the dialog itself (not its contents) is a tap on the dimmed page beside the menu. */}
      <dialog ref={dialog} id="app-phone-menu" className="app-drawer" aria-label="Navigation menu"
        onClick={(event) => { if (event.target === dialog.current) closeMenu() }}>
        <div className="app-drawer__body">
          <div className="app-drawer__head">
            <MenuBrand onNavigate={choose} />
            <button ref={closeButton} type="button" className="app-drawer__close" aria-label="Close navigation menu" onClick={closeMenu}>
              <MobileDashboardIcon name="close" />
            </button>
          </div>
          <AppMenu label="Mobile navigation" userName={userName} onNavigate={choose} onLogout={onLogout}
            logoutBusy={logoutBusy} logoutError={logoutError} />
        </div>
      </dialog>
    </>
  )
}

export default PhoneMenu
