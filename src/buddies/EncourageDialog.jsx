import { useEffect, useRef } from 'react'
import EncourageForm from './EncourageForm.jsx'

// The message form for one member, in a modal. It is a real <dialog> opened with showModal(), so while it is open
// the page behind can't be clicked or reached with Tab. It closes with the form's Cancel, Escape or a click outside
// it (not while a message is being sent); GroupPanel then puts the focus back on that member's "Encourage" button.
function EncourageDialog({ member, onSent, onAlreadySent, onCancel, onMemberGone, onUnauthorized }) {
  const dialog = useRef(null)

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    return () => { if (element?.open) element.close() }
  }, [])

  const busy = () => Boolean(dialog.current?.querySelector('form[aria-busy="true"]'))

  return (
    <dialog ref={dialog} className="buddies-dialog" aria-labelledby="buddies-dialog-title"
      // Escape is handled by the form (it waits while a message is being sent), so the browser's own close is held.
      onCancel={(event) => event.preventDefault()}
      onClick={(event) => { if (event.target === dialog.current && !busy()) onCancel() }}>
      {/* The padding is on this box, so a click on the dialog element itself is always a click outside the box. */}
      <div className="buddies-dialog__body">
        <h2 className="buddies-dialog__title" id="buddies-dialog-title">Encourage {member.name}</h2>
        <EncourageForm member={member} onSent={onSent} onAlreadySent={onAlreadySent} onCancel={onCancel} onMemberGone={onMemberGone}
          onUnauthorized={onUnauthorized} />
      </div>
    </dialog>
  )
}

export default EncourageDialog
