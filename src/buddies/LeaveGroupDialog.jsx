import { useEffect, useRef, useState } from 'react'
import { leaveBuddyGroup } from './buddiesApi.js'
import { MESSAGES, leaveConsequence } from './buddiesFormat.js'

// "Leave group" confirmation (leave a workout buddies group story), a real <dialog> opened with showModal() like the
// Encourage modal, so the page behind can't be clicked or reached with Tab. It says what leaving does for this person:
// a member just leaves; an owner hands the group to the member who joined longest ago (the next one in the list, the
// same one api/buddy_leave.php picks); an owner who is the only member deletes the group. "Stay in group" is focused
// first, so Enter or a stray click never leaves by accident. Escape, "Stay in group" or a click outside close it
// (not while leaving). onLeft gets the server's answer: the no-group view plus left {name, new_owner, group_deleted}.
// A 404 means this person is already out of the group (left in another tab): onGone reloads the page.
function LeaveGroupDialog({ group, me, onLeft, onGone, onCancel, onUnauthorized }) {
  const dialog = useRef(null)
  const stay = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    stay.current?.focus()
    return () => { if (element?.open) element.close() }
  }, [])

  async function leave() {
    if (busy) return
    setBusy(true)
    setError('')
    const response = await leaveBuddyGroup()
    if (response.status === 401) {
      onUnauthorized()
      return
    }
    setBusy(false)
    if (response.ok) onLeft(response.data)
    else if (response.status === 404) onGone()
    else {
      setError(MESSAGES.leave)
      stay.current?.focus()
    }
  }

  return (
    <dialog ref={dialog} className="buddies-dialog" aria-labelledby="buddies-leave-title" aria-describedby="buddies-leave-text"
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel() }}
      onClick={(event) => { if (event.target === dialog.current && !busy) onCancel() }}>
      <div className="buddies-dialog__body" aria-busy={busy}>
        <h2 className="buddies-dialog__title" id="buddies-leave-title">Leave {group.name}?</h2>
        <p className="buddies-leave__text" id="buddies-leave-text">{leaveConsequence(group, me)}</p>
        <div className="buddies-actions">
          <button type="button" className="buddies-button buddies-button--danger" disabled={busy} onClick={leave}>
            {busy ? 'Leaving…' : 'Leave group'}
          </button>
          <button type="button" ref={stay} className="buddies-button buddies-button--secondary" disabled={busy} onClick={onCancel}>
            Stay in group
          </button>
        </div>
        {error && <p className="buddies-field-error" role="alert">{error}</p>}
      </div>
    </dialog>
  )
}

export default LeaveGroupDialog
