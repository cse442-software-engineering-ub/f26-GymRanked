import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './SidePanel.css'

const FOCUSABLE = 'button:not(:disabled), a[href], [tabindex="0"]'

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

// A pop-up dialog with a title, Close, a scrolling body and an optional footer note, rendered on <body> and centred
// over a backdrop that dims the whole page, on every screen size. While it is open the page behind is inert and Tab
// stays inside. Escape, Close and a click on the backdrop call onClose. Focus goes to the title on open (pass titleRef
// to move it there again) and back to returnFocusRef on close. The page behind is never unmounted, so a set in
// progress keeps its timer and typed values.
function SidePanel({ open, onClose, title, titleRef: givenTitleRef, returnFocusRef, footer, busy = false, className = '', children }) {
  const id = useId()
  const panelRef = useRef(null)
  const ownTitleRef = useRef(null)
  const titleRef = givenTitleRef ?? ownTitleRef
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const page = document.getElementById('root')
    if (page) page.inert = true
    const onKeyDown = (event) => {
      const panel = panelRef.current
      if (!panel) return
      if (event.key === 'Escape') {
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
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
  }, [open])

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
    <div className="modal-backdrop side-panel-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className={`side-panel ${className}`.trim()}
        role="dialog"
        aria-modal="true"
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
