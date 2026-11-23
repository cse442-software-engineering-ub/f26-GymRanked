import { useEffect, useRef, useState } from 'react'
import EncourageDialog from './EncourageDialog.jsx'
import { formatExpiry, initialsOf, isExpired, memberCountLabel } from './buddiesFormat.js'

const FACES_SHOWN = 5

// The group's hero card, like the Dashboard's "Today's workout": its name, a row of member faces and its size. After
// joining or creating, focus lands on the name (titleRef).
export function GroupHero({ group, me, titleRef }) {
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
            : <>Pick a member below and send them an encouragement. Only they will see it.</>}
        </p>
      </div>
    </section>
  )
}

// The members (owner first, then by join time, exactly as #71 returns them). Every member but you has an "Encourage"
// button, which opens the message form for that member in a modal (EncourageDialog.jsx).
function GroupPanel({ group, onNotice, onUnauthorized, onMembersChanged }) {
  const [composeFor, setComposeFor] = useState(null)
  const [goneError, setGoneError] = useState('')
  const encourageButtons = useRef(new Map())
  const returnFocusTo = useRef(null)

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

  const composing = group.members.find((member) => member.member_id === composeFor) ?? null

  return (
    <section className="buddies-section" aria-labelledby="buddies-members-title">
      <header className="buddies-section-heading">
        <h2 id="buddies-members-title">Members</h2>
      </header>

      {goneError && <p className="buddies-field-error" role="alert">{goneError}</p>}

      <ul className="buddies-members" aria-label="Members">
        {group.members.map((member) => {
          const open = composeFor === member.member_id
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
                {!member.is_me && (
                  <button type="button" className="buddies-button buddies-button--primary buddies-button--small buddies-encourage" aria-expanded={open}
                    aria-label={`Encourage ${member.name}`}
                    ref={(element) => {
                      if (element) encourageButtons.current.set(member.member_id, element)
                      else encourageButtons.current.delete(member.member_id)
                    }}
                    onClick={() => toggleCompose(member.member_id)}>Encourage</button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {composing && (
        <EncourageDialog key={composing.member_id} member={composing} onCancel={closeCompose} onUnauthorized={onUnauthorized}
          onSent={(to) => { onNotice(`Encouragement sent to ${to}`); closeCompose() }}
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
// from #71 (invite_code is null for everyone else), so only the owner sees this.
export function InviteCard({ group }) {
  const expired = group.invite_expires_at ? isExpired(group.invite_expires_at) : false
  return (
    <section className={expired ? 'buddies-section buddies-invite buddies-invite--expired' : 'buddies-section buddies-invite'} aria-label="Invite code">
      <header className="buddies-section-heading">
        <h2>Invite friends</h2>
      </header>
      <div className="buddies-invite__box">
        <span className="buddies-invite__label">Invite code</span>
        <span className="buddies-invite-code">{group.invite_code}</span>
      </div>
      {expired ? (
        <>
          <span><span className="buddies-pill buddies-pill--warn">Expired {formatExpiry(group.invite_expires_at)}</span></span>
          <span className="buddies-hint">This code no longer works, so nobody new can join. Getting a new code isn&apos;t part of this version.</span>
        </>
      ) : (
        <>
          <span className="buddies-invite__expires">Expires {formatExpiry(group.invite_expires_at)}</span>
          <span className="buddies-hint">Share it in person or by text. Anyone with the code can join until it expires.</span>
        </>
      )}
    </section>
  )
}
