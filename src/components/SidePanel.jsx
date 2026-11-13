import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './SidePanel.css'

// Wide enough for a 640px page column and one 360px panel beside it. Keep in sync with SidePanel.css.
const DOCKED_QUERY = '(min-width: 1100px)'
// Wide enough for a panel on each side of the column at once (640px + 2 × 400px).
const BOTH_QUERY = '(min-width: 1440px)'
const FOCUSABLE = 'button:not(:disabled), a[href], [tabindex="0"]'
const OPEN_EVENT = 'gymrank:side-panel-open'

// Open panels, oldest first, so Escape closes the newest and a lack of room closes the oldest.
const openPanels = []

function matches(query) {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches)
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

// A dialog with a title, Close, a scrolling body and an optional footer note, rendered on <body>. On screens at least
// 1100px wide it is a panel docked on the left or right (`side`) beside the page, which stays usable: no dimming, no
// inert page, Tab not trapped. The page column makes room for it (see .exercise-session in index.css). A panel on
// each side fits at 1440px and wider; narrower, opening one closes the other. Below 1100px it is a centred modal:
// the page behind is inert and Tab stays inside. Escape and Close call onClose; so does a click on the modal's
// backdrop. Focus goes to the title on open (pass titleRef to move it there again) and back to returnFocusRef on
// close, unless the user has moved into the page beside the panel.
function SidePanel({ open, onClose, side = 'right', title, titleRef: givenTitleRef, returnFocusRef, footer, busy = false, className = '', children }) {
  const id = useId()
  const [docked, setDocked] = useState(() => matches(DOCKED_QUERY))
  const panelRef = useRef(null)
  const backdropRef = useRef(null)
  const ownTitleRef = useRef(null)
  const titleRef = givenTitleRef ?? ownTitleRef
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Follows the window size while open, so turning a tablet or resizing switches between panel and modal.
  useEffect(() => {
    if (!open || !window.matchMedia) return undefined
    const query = window.matchMedia(DOCKED_QUERY)
    const onChange = () => setDocked(query.matches)
    onChange()
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [open])

  // Without room for two panels, the one opened first closes.
  useEffect(() => {
    if (!open) return undefined
    openPanels.push(id)
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }))
    const onOtherOpen = (event) => {
      if (event.detail !== id && !matches(BOTH_QUERY)) closeRef.current()
    }
    const both = window.matchMedia?.(BOTH_QUERY)
    const onResize = () => {
      if (!both.matches && openPanels.length > 1 && openPanels[0] === id) closeRef.current()
    }
    window.addEventListener(OPEN_EVENT, onOtherOpen)
    both?.addEventListener?.('change', onResize)
    return () => {
      openPanels.splice(openPanels.indexOf(id), 1)
      window.removeEventListener(OPEN_EVENT, onOtherOpen)
      both?.removeEventListener?.('change', onResize)
    }
  }, [open, id])

  useEffect(() => {
    if (!open) return undefined
    const page = docked ? null : document.getElementById('root')
    if (page) page.inert = true
    const onKeyDown = (event) => {
      const panel = panelRef.current
      if (!panel) return
      if (event.key === 'Escape') {
        // The panel holding focus closes; with focus in the page, the newest panel does.
        const inPanel = document.activeElement?.closest?.('.side-panel')
        if (inPanel ? inPanel === panel : openPanels[openPanels.length - 1] === id) closeRef.current()
        return
      }
      if (docked || event.key !== 'Tab') return
      const focusable = [...panel.querySelectorAll(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const inside = focusable.includes(document.activeElement)
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (page) page.inert = false
    }
  }, [open, docked, id])

  // The docked panel starts 16px under the nav bar and, as the page scrolls the nav bar away, grows up to 16px from
  // the top of the window, so it never leaves a gap above it or covers the nav bar.
  useEffect(() => {
    if (!open || !docked) return undefined
    const update = () => {
      const nav = document.querySelector('.nav-bar')
      const below = nav ? nav.getBoundingClientRect().bottom + 16 : 16
      backdropRef.current?.style.setProperty('--side-panel-top', `${Math.max(16, Math.round(below))}px`)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [open, docked])

  // Declared after the inert effect, so the page is no longer inert when focus returns to it.
  useEffect(() => {
    if (!open) return undefined
    const button = returnFocusRef?.current
    titleRef.current?.focus()
    return () => {
      const active = document.activeElement
      if (!active || active === document.body) button?.focus()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  return createPortal(
    <div
      ref={backdropRef}
      className={`modal-backdrop side-panel-backdrop side-panel-backdrop--${side}`}
      onClick={docked ? undefined : onClose}
    >
      <div
        ref={panelRef}
        className={`side-panel ${className}`.trim()}
        role="dialog"
        aria-modal={docked ? 'false' : 'true'}
        aria-labelledby={`${id}-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="side-panel__header">
          <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>{title}</h2>
          <button type="button" className="wl-button wl-button--quiet" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="side-panel__body" aria-busy={busy}>
          {children}
        </div>
        {footer && (
          <p className="side-panel__footer">
            <InfoIcon />
            {footer}
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default SidePanel
