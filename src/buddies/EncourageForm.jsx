import { useEffect, useRef, useState } from 'react'
import { sendEncouragement } from './buddiesApi.js'
import { MESSAGES, MESSAGE_MAX, countChars, fitsLimit } from './buddiesFormat.js'

// The message form under a member's row. The box takes whatever is typed or pasted and the counter shows how much
// of the 140 characters is used (an emoji counts as one, like #71's count); past the limit the counter turns to the
// error colour. Sending an empty, blank or too long message is refused next to the box and the text stays, as story
// #78 expects. A failed send keeps the text too; Escape or Cancel closes the form.
function EncourageForm({ member, onSent, onCancel, onMemberGone, onUnauthorized }) {
  const [message, setMessage] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [sendError, setSendError] = useState('')
  const [busy, setBusy] = useState(false)
  const box = useRef(null)
  const id = `buddies-message-${member.member_id}`
  // Counted the way it will be sent: without the spaces at either end, like the backend's trim.
  const used = countChars(message.trim())
  const counterClass = used > MESSAGE_MAX ? 'buddies-counter buddies-counter--over'
    : used === MESSAGE_MAX ? 'buddies-counter buddies-counter--full' : 'buddies-counter'

  // The refusal goes away as soon as the text fits again, so it never sits beside a message that can be sent.
  function onChange(event) {
    setMessage(event.target.value)
    if (fieldError && fitsLimit(event.target.value, MESSAGE_MAX)) setFieldError('')
  }

  useEffect(() => { box.current?.focus() }, [])

  async function onSubmit(event) {
    event.preventDefault()
    if (busy) return
    setFieldError('')
    setSendError('')
    if (!fitsLimit(message, MESSAGE_MAX)) {
      setFieldError(MESSAGES.message)
      box.current?.focus()
      return
    }
    setBusy(true)
    const response = await sendEncouragement(member.member_id, message.trim())
    if (response.status === 401) {
      onUnauthorized()
      return
    }
    setBusy(false)
    if (response.ok) onSent(response.data.encouragement.to)
    else if (response.status === 400 && response.data?.errors) {
      setFieldError(response.data.errors.message || response.data.errors.member_id || MESSAGES.message)
      box.current?.focus()
    } else if (response.status === 404 && response.data?.error === 'Member not found.') onMemberGone()
    else setSendError(MESSAGES.send)
  }

  return (
    <form className="buddies-compose" onSubmit={onSubmit} noValidate
      onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onCancel() }}>
      <p className="buddies-compose__to">To <strong>{member.name}</strong></p>
      <div className="buddies-field">
        <div className="buddies-label-row">
          <label htmlFor={id}>Your message <span className="buddies-required" aria-hidden="true">*</span></label>
          <span className={counterClass} aria-hidden="true">
            {used}/{MESSAGE_MAX}
          </span>
        </div>
        <textarea ref={box} id={id} name="message" className="buddies-input buddies-input--message" value={message}
          onChange={onChange} required readOnly={busy}
          aria-invalid={fieldError ? 'true' : undefined}
          aria-describedby={fieldError ? `${id}-hint ${id}-error` : `${id}-hint`} />
        <p className="buddies-hint" id={`${id}-hint`}>Only {member.name} will see this. Up to 140 characters.</p>
        {fieldError && <p className="buddies-field-error" id={`${id}-error`} role="alert">{fieldError}</p>}
      </div>
      <div className="buddies-actions">
        <button type="submit" className="buddies-button buddies-button--primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
        <button type="button" className="buddies-button buddies-button--subtle" disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
      {sendError && <p className="buddies-field-error" role="alert">{sendError}</p>}
    </form>
  )
}

export default EncourageForm
