import { useCallback, useEffect, useRef, useState } from 'react'
import { getSentEncouragements } from './buddiesApi.js'
import { MESSAGES, formatSentAt, initialsOf } from './buddiesFormat.js'

// "Sent by you": the encouragements the signed-in person sent, newest first (the 50 newest api/buddy_sent.php
// returns), each with who it went to, when, and the message. The server only ever returns the caller's own messages,
// so this list is private to them. It loads again whenever reloadKey (the group view, so a message sent from another
// tab shows too) or version (bumped by BuddiesPage after a send) changes. Messages are plain text, never
// HTML. With hideWhenEmpty (someone in no group) the section only shows once there is something in it.
function SentEncouragements({ reloadKey, version = 0, hideWhenEmpty = false, onUnauthorized }) {
  const [state, setState] = useState({ status: 'loading', sent: [] })
  const latest = useRef(0)

  const load = useCallback(async () => {
    const id = ++latest.current
    const response = await getSentEncouragements()
    // Only the newest request may change the list, and none after the page has closed.
    if (id !== latest.current) return
    if (response.status === 401) {
      onUnauthorized?.()
      return
    }
    if (response.ok) setState({ status: 'ready', sent: response.data.sent })
    // A failed reload keeps the list already on screen; only a first load that fails shows the error.
    else setState((current) => (current.status === 'ready' ? current : { status: 'error', sent: [] }))
  }, [onUnauthorized])

  useEffect(() => {
    load()
  }, [load, reloadKey, version])
  useEffect(() => () => { latest.current += 1 }, [])

  const { status, sent } = state
  if (hideWhenEmpty && (status !== 'ready' || sent.length === 0)) return null

  return (
    <section className="buddies-section buddies-sent" aria-labelledby="buddies-sent-title" aria-busy={status === 'loading'}>
      <header className="buddies-section-heading">
        <h2 id="buddies-sent-title">Sent by you</h2>
      </header>
      <p className="buddies-hint buddies-sent__hint">Only you can see this list.</p>
      {status === 'loading' && <p className="buddies-status" role="status">Loading the encouragements you sent…</p>}
      {status === 'error' && (
        <div className="buddies-notice buddies-notice--error" role="alert">
          <p><span className="buddies-notice__icon" aria-hidden="true">!</span>{MESSAGES.sent}</p>
          <button type="button" className="buddies-button buddies-button--secondary" onClick={load}>Try again</button>
        </div>
      )}
      {status === 'ready' && sent.length === 0 && (
        <p className="buddies-empty-inbox">You haven&apos;t sent any encouragements yet. When you send one, it appears here.</p>
      )}
      {status === 'ready' && sent.length > 0 && (
        <ul className="buddies-inbox buddies-sent__list">
          {sent.map((item) => (
            <li key={item.id} className="buddies-message">
              <div className="buddies-message__head">
                <span className="buddies-message__avatar" aria-hidden="true">{initialsOf(item.to)}</span>
                <span className="buddies-message-from"><span className="buddies-sent__to">To</span> {item.to}</span>
                <time dateTime={item.sent_at}>{formatSentAt(item.sent_at)}</time>
              </div>
              <p className="buddies-message-text">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default SentEncouragements
