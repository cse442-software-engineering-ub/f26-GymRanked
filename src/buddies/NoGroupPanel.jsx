import { useEffect, useRef, useState } from 'react'
import { createBuddyGroup, joinBuddyGroup } from './buddiesApi.js'
import { CODE_LENGTH, MESSAGES, NAME_MAX, cleanInviteCode, fitsLimit, isInviteCode } from './buddiesFormat.js'

// What someone in no group sees: join with an invite code, or create a group. A bad code is reported under the box,
// "already in a group" in its own box with "Show my group", and a failed request under the button, so the three are
// easy to tell apart. Whatever was typed stays in the box after every refusal or failure.
function NoGroupPanel({ onJoined, onShowGroup, onUnauthorized, onStart }) {
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [createError, setCreateError] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const codeInput = useRef(null)
  const nameInput = useRef(null)
  const openCreateButton = useRef(null)
  const returnFocusToCreate = useRef(false)

  useEffect(() => {
    if (createOpen) nameInput.current?.focus()
    else if (returnFocusToCreate.current) {
      returnFocusToCreate.current = false
      openCreateButton.current?.focus()
    }
  }, [createOpen])

  function refuseCode(message) {
    setCodeError(message)
    codeInput.current?.focus()
  }

  async function onJoin(event) {
    event.preventDefault()
    if (joinBusy) return
    setCodeError('')
    setJoinError('')
    setConflict(false)
    onStart()
    if (!isInviteCode(code)) {
      refuseCode(MESSAGES.code)
      return
    }
    setJoinBusy(true)
    const response = await joinBuddyGroup(code)
    if (response.status === 401) {
      onUnauthorized()
      return
    }
    setJoinBusy(false)
    if (response.ok) onJoined(response.data, `You joined ${response.data.group.name}.`)
    else if (response.status === 409) setConflict(true)
    else if (response.status === 404 && response.data?.error) refuseCode(response.data.error)
    else if (response.status === 400 && response.data?.errors?.code) refuseCode(response.data.errors.code)
    else setJoinError(MESSAGES.join)
  }

  async function onCreate(event) {
    event.preventDefault()
    if (createBusy) return
    setNameError('')
    setCreateError('')
    setConflict(false)
    onStart()
    if (!fitsLimit(name, NAME_MAX)) {
      setNameError(MESSAGES.name)
      nameInput.current?.focus()
      return
    }
    setCreateBusy(true)
    const response = await createBuddyGroup(name.trim())
    if (response.status === 401) {
      onUnauthorized()
      return
    }
    setCreateBusy(false)
    if (response.ok) {
      onJoined(response.data, `You created ${response.data.group.name}. Share the invite code below so friends can join.`)
    } else if (response.status === 409) {
      setConflict(true)
      setCreateOpen(false)
    } else if (response.status === 400 && response.data?.errors?.name) {
      setNameError(response.data.errors.name)
      nameInput.current?.focus()
    } else setCreateError(MESSAGES.create)
  }

  function closeCreate() {
    if (createBusy) return
    returnFocusToCreate.current = true
    setCreateOpen(false)
    setName('')
    setNameError('')
    setCreateError('')
  }

  return (
    <section className="buddies-card" aria-labelledby="buddies-empty-title">
      <h2 className="buddies-empty-title" id="buddies-empty-title">You&apos;re not in a group yet.</h2>
      <p className="buddies-card__lead">Join a friend&apos;s group with their invite code, or start your own.</p>

      {conflict && (
        <div className="buddies-notice buddies-notice--error" role="alert">
          <p><span className="buddies-notice__icon" aria-hidden="true">!</span>{MESSAGES.already}</p>
          <button type="button" className="buddies-button buddies-button--secondary" onClick={onShowGroup}>Show my group</button>
        </div>
      )}

      <form className="buddies-field" onSubmit={onJoin} noValidate>
        <label htmlFor="buddies-invite-code">Invite code <span className="buddies-required" aria-hidden="true">*</span></label>
        <div className="buddies-join-row">
          <div className="buddies-join-row__code">
            <input ref={codeInput} id="buddies-invite-code" name="code" className="buddies-input buddies-input--code"
              value={code} onChange={(event) => setCode(cleanInviteCode(event.target.value))}
              maxLength={CODE_LENGTH} required readOnly={joinBusy} autoComplete="off" autoCapitalize="characters"
              autoCorrect="off" spellCheck="false" aria-invalid={codeError ? 'true' : undefined}
              aria-describedby={codeError ? 'buddies-code-hint buddies-code-error' : 'buddies-code-hint'} />
            <p className="buddies-hint" id="buddies-code-hint">8 letters and numbers, for example 7KQ2MXP9. Ask the group&apos;s owner for it.</p>
            {codeError && <p className="buddies-field-error" id="buddies-code-error" role="alert">{codeError}</p>}
          </div>
          <button type="submit" className="buddies-button buddies-button--primary" disabled={joinBusy}>
            {joinBusy ? 'Joining…' : 'Join group'}
          </button>
        </div>
        {joinError && <p className="buddies-field-error" role="alert">{joinError}</p>}
      </form>

      <p className="buddies-or">or</p>

      {createOpen ? (
        <form className="buddies-field" onSubmit={onCreate} noValidate
          onKeyDown={(event) => { if (event.key === 'Escape') closeCreate() }}>
          <label htmlFor="buddies-group-name">Group name <span className="buddies-required" aria-hidden="true">*</span></label>
          <input ref={nameInput} id="buddies-group-name" name="name" className="buddies-input" value={name}
            onChange={(event) => setName(event.target.value)} maxLength={NAME_MAX} required readOnly={createBusy}
            autoComplete="off" aria-invalid={nameError ? 'true' : undefined}
            aria-describedby={nameError ? 'buddies-name-hint buddies-name-error' : 'buddies-name-hint'} />
          <p className="buddies-hint" id="buddies-name-hint">Up to 40 characters. Members see this name.</p>
          {nameError && <p className="buddies-field-error" id="buddies-name-error" role="alert">{nameError}</p>}
          <div className="buddies-actions">
            <button type="submit" className="buddies-button buddies-button--primary" disabled={createBusy}>
              {createBusy ? 'Creating…' : 'Create'}
            </button>
            <button type="button" className="buddies-button buddies-button--subtle" disabled={createBusy} onClick={closeCreate}>Cancel</button>
          </div>
          {createError && <p className="buddies-field-error" role="alert">{createError}</p>}
        </form>
      ) : (
        <button ref={openCreateButton} type="button" className="buddies-button buddies-button--secondary buddies-open-create"
          onClick={() => setCreateOpen(true)}>Create a group</button>
      )}
    </section>
  )
}

export default NoGroupPanel
