import { useEffect, useRef, useState } from 'react'
import EncourageDialog from './EncourageDialog.jsx'
import { initialsOf, memberCountLabel } from './buddiesFormat.js'

const FACES_SHOWN = 5

// The group's hero card, like the Dashboard's "Today's workout": its name, a row of member faces and its size. After
// joining or creating, focus lands on the name (titleRef). Its "Leave group" button opens LeaveGroupDialog.jsx.
export function GroupHero({ group, me, titleRef, onLeave, leaveRef }) {
  const alone = group.member_count === 1 && me.is_owner
  const faces = group.members.slice(0, FACES_SHOWN)
  const more = group.members.length - faces.length
  return (
    <section className="buddies-hero" aria-labelledby="buddies-group-name">
      <div className="buddies-hero__body">
        <p className="buddies-hero__eyebrow">
          <span>Your group</span>
          {me.is_owner && <span className="buddies-hero__badge">Owner</span>}
        </p>
        <h2 className="buddies-hero__title" id="buddies-group-name" tabIndex={-1} ref={titleRef}>{group.name}</h2>
        <div className="buddies-hero__meta">
          <span className="buddies-faces" aria-hidden="true">
            {faces.map((member) => (
              <span key={member.member_id} className={member.is_me ? 'buddies-face is-me' : 'buddies-face'}>{initialsOf(member.name)}</span>
            ))}
            {more > 0 && <span className="buddies-face buddies-face--more">+{more}</span>}
          </span>
          <span className="buddies-count">{memberCountLabel(group.member_count)}</span>
        </div>
        <p className="buddies-hero__text">
          {alone
            ? <>You&apos;re the only member. Share your invite code so friends can join.</>
            : <>Pick a member below and send them an encouragement, one a day to each member. Only they will see it.</>}
        </p>
        {onLeave && (
          <p className="buddies-hero__actions">
            <button type="button" ref={leaveRef} className="buddies-button buddies-button--secondary buddies-button--small buddies-leave"
              onClick={onLeave}>Leave group</button>
          </p>
        )}
      </div>
    </section>
  )
}

// The members (owner first, then by join time, exactly as #71 returns them). Every member but you has an "Encourage"
// button, which opens the message form for that member in a modal (EncourageDialog.jsx). You can encourage each
// member once a day (card #147): after that their row shows a disabled "Encouragement sent" until midnight New York
// time. The rule is spelled out under the "Members" title.
function GroupPanel({ group, onNotice, onUnauthorized, onMembersChanged }) {
  const [composeFor, setComposeFor] = useState(null)
  const [goneError, setGoneError] = useState('')
  // Members sent one from this page, shown as "Encouragement sent" at once, before the next group view says so.
  const [sentNow, setSentNow] = useState([])
  const encourageButtons = useRef(new Map())
  const returnFocusTo = useRef(null)

  // A new group view from the server is the truth again (it also clears the marks at midnight).
  useEffect(() => { setSentNow([]) }, [group])

  // When a form closes, focus goes back to the "Encourage" button that opened it.
  useEffect(() => {
    if (composeFor === null && returnFocusTo.current !== null) {
      encourageButtons.current.get(returnFocusTo.current)?.focus()
      returnFocusTo.current = null
    }
  }, [composeFor])

  function closeCompose() {
    returnFocusTo.current = composeFor
    setComposeFor(null)
  }

  function toggleCompose(memberId) {
    onNotice('')
    setGoneError('')
    if (composeFor === memberId) closeCompose()
    else setComposeFor(memberId)
  }

  function markSent(memberId) {
    setSentNow((current) => (current.includes(memberId) ? current : [...current, memberId]))
    onMembersChanged()
  }

  // The "Encourage" button, or "Encouragement sent" in its place, is where the focus goes back to when the modal closes.
  const keepFocusTarget = (memberId) => (element) => {
    if (element) encourageButtons.current.set(memberId, element)
  }

  const composing = group.members.find((member) => member.member_id === composeFor) ?? null

  return (
    <section className="buddies-section" aria-labelledby="buddies-members-title">
      <header className="buddies-section-heading">
        <h2 id="buddies-members-title">Members</h2>
      </header>
      <p className="buddies-hint buddies-daily-rule" id="buddies-daily-rule">
        You can encourage each member once a day. It starts again at midnight, New York time.
      </p>

      {goneError && <p className="buddies-field-error" role="alert">{goneError}</p>}

      <ul className="buddies-members" aria-label="Members" aria-describedby="buddies-daily-rule">
        {group.members.map((member) => {
          const open = composeFor === member.member_id
          const sentToday = member.encouraged_today || sentNow.includes(member.member_id)
          const rowClass = ['buddies-member', member.is_owner && 'is-owner', member.is_me && 'is-me'].filter(Boolean).join(' ')
          return (
            <li key={member.member_id} className={rowClass}>
              <div className="buddies-member__line">
                <span className="buddies-initials" aria-hidden="true">{initialsOf(member.name)}</span>
                <span className="buddies-member__labels">
                  <span className="buddies-member-name">{member.name}</span>
                  {member.is_owner && <span className="buddies-pill">Owner</span>}
                  {member.is_me && <span className="buddies-pill buddies-pill--me">You</span>}
                </span>
                {!member.is_me && sentToday && (
                  // Still a button, so it keeps the row's place in the Tab order and takes the focus back when the
                  // modal closes, but aria-disabled and inert: a second message to this member waits until tomorrow.
                  <button type="button" className="buddies-button buddies-button--small buddies-sent-today" aria-disabled="true"
                    ref={keepFocusTarget(member.member_id)} title="You can encourage them again tomorrow."
                    aria-label={`Encouragement sent to ${member.name} today. You can send another tomorrow.`}
                    onClick={(event) => event.preventDefault()}>
                    <span aria-hidden="true">✓</span> Encouragement sent
                  </button>
                )}
                {!member.is_me && !sentToday && (
                  <button type="button" className="buddies-button buddies-button--primary buddies-button--small buddies-encourage" aria-expanded={open}
                    aria-label={`Encourage ${member.name}`}
                    ref={keepFocusTarget(member.member_id)}
                    onClick={() => toggleCompose(member.member_id)}>Encourage</button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {composing && (
        <EncourageDialog key={composing.member_id} member={composing} onCancel={closeCompose} onUnauthorized={onUnauthorized}
          onSent={(to) => { onNotice(`Encouragement sent to ${to}`); markSent(composing.member_id); closeCompose() }}
          onAlreadySent={() => markSent(composing.member_id)}
          onMemberGone={() => {
            setGoneError(`${composing.name} isn't in your group any more.`)
            setComposeFor(null)
            onMembersChanged()
          }} />
      )}
    </section>
  )
}

export default GroupPanel

// The owner's invite code, beside the group's hero on a wide screen and under it on a phone. Only the owner gets a code
// from #71 (invite_code is null for everyone else), so only the owner sees this. A code has no expiry: it works for as
// long as the group exists (card #152).
export function InviteCard({ group }) {
  return (
    <section className="buddies-section buddies-invite" aria-label="Invite code">
      <header className="buddies-section-heading">
        <h2>Invite friends</h2>
      </header>
      <div className="buddies-invite__box">
        <span className="buddies-invite__label">Invite code</span>
        <span className="buddies-invite-code">{group.invite_code}</span>
      </div>
      <span className="buddies-hint">Share it in person or by text. Anyone with the code can join your group.</span>
    </section>
  )
}
