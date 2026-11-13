import { useEffect, useRef, useState } from 'react'
import EncourageForm from './EncourageForm.jsx'
import { formatExpiry, initialsOf, isExpired, memberCountLabel } from './buddiesFormat.js'

// The group card: its name and size, the owner's invite code panel, and the members (owner first, then by join time,
// exactly as #71 returns them). Every member but you has an "Encourage" button, which opens one message form at a time
// under that row.
function GroupPanel({ group, me, titleRef, onNotice, onUnauthorized, onMembersChanged }) {
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

  const expired = group.invite_expires_at ? isExpired(group.invite_expires_at) : false
  const alone = group.member_count === 1 && me.is_owner

  return (
    <section className="buddies-card" aria-labelledby="buddies-group-name">
      <div className="buddies-group-head">
        <div>
          <p className="buddies-eyebrow">Your group</p>
          <h2 className="buddies-group-name" id="buddies-group-name" tabIndex={-1} ref={titleRef}>{group.name}</h2>
          <p className="buddies-count">{memberCountLabel(group.member_count)}</p>
        </div>
        {group.invite_code && (
          <div className={expired ? 'buddies-invite buddies-invite--expired' : 'buddies-invite'}>
            <span className="buddies-invite__label">Invite code</span>
            <span className="buddies-invite-code">{group.invite_code}</span>
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
          </div>
        )}
      </div>

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
                  <button type="button" className="buddies-button buddies-button--text buddies-encourage" aria-expanded={open}
                    aria-label={`Encourage ${member.name}`}
                    ref={(element) => {
                      if (element) encourageButtons.current.set(member.member_id, element)
                      else encourageButtons.current.delete(member.member_id)
                    }}
                    onClick={() => toggleCompose(member.member_id)}>Encourage</button>
                )}
              </div>
              {open && (
                <EncourageForm member={member} onCancel={closeCompose} onUnauthorized={onUnauthorized}
                  onSent={(to) => { onNotice(`Encouragement sent to ${to}`); closeCompose() }}
                  onMemberGone={() => {
                    setGoneError(`${member.name} isn't in your group any more.`)
                    setComposeFor(null)
                    onMembersChanged()
                  }} />
              )}
            </li>
          )
        })}
      </ul>

      {alone && <p className="buddies-solo">You&apos;re the only member. Share your invite code so friends can join.</p>}
    </section>
  )
}

export default GroupPanel
