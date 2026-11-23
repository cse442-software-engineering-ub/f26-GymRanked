import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupPanel, { GroupHero, InviteCard } from './GroupPanel.jsx'
import EncouragementList from './EncouragementList.jsx'
import NoGroupPanel from './NoGroupPanel.jsx'
import SentEncouragements from './SentEncouragements.jsx'
import LeaveGroupDialog from './LeaveGroupDialog.jsx'
import { useBuddyGroupPoll } from './useBuddyGroupPoll.js'
import { MESSAGES, leftNotice } from './buddiesFormat.js'
import './buddies.css'

// Workout buddies (story #78, card #79): a private group joined with an invite code. Someone in no group sees the
// join and create forms; a member sees the group, its members and the encouragements sent to them. Everything shown
// comes from Mansur's api/buddy_*.php (card #71). useBuddyGroupPoll keeps it up to date while the page is open, so a
// new member or encouragement shows without a reload and without touching a message being typed.
function BuddiesPage() {
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const groupTitle = useRef(null)
  const focusGroupTitle = useRef(false)
  // Bumped after a send so "Sent by you" loads again at once; it also loads again whenever the group view changes.
  const [sentVersion, setSentVersion] = useState(0)
  // The Leave group confirmation, and where the focus goes afterwards (the "You left …" notice).
  const [leaving, setLeaving] = useState(false)
  const noticeRef = useRef(null)
  const focusNotice = useRef(false)
  const leaveButton = useRef(null)

  const toLogin = useCallback(() => navigate('/login', { replace: true }), [navigate])
  const { state, fresh, announcement, reload, refresh, replace } = useBuddyGroupPoll({ onUnauthorized: toLogin })

  // After joining or creating, the keyboard and screen readers land on the new group's name.
  useEffect(() => {
    if (focusGroupTitle.current && groupTitle.current) {
      focusGroupTitle.current = false
      groupTitle.current.focus()
    }
  }, [state])

  // After leaving, the keyboard and screen readers land on the "You left …" notice above the join form.
  useEffect(() => {
    if (focusNotice.current && noticeRef.current) {
      focusNotice.current = false
      noticeRef.current.focus()
    }
  }, [state, notice])

  // Leaving answers with the no-group view (plus "left"), so the join and create forms show at once.
  function showLeft(data) {
    const { left, ...view } = data
    setLeaving(false)
    focusNotice.current = true
    setNotice(leftNotice(left))
    replace(view)
  }

  // Already out of the group (left in another tab): show what the server says now.
  function showGone() {
    setLeaving(false)
    focusNotice.current = true
    setNotice("You're no longer in this group.")
    refresh()
  }

  // Focus goes back to "Leave group" once the dialog has closed (not before: a modal dialog keeps the focus inside).
  const returnToLeave = useRef(false)
  useEffect(() => {
    if (!leaving && returnToLeave.current) {
      returnToLeave.current = false
      leaveButton.current?.focus()
    }
  }, [leaving])

  function closeLeave() {
    returnToLeave.current = true
    setLeaving(false)
  }

  // Join and create answer with the same body as GET, so the group shows at once with no second loading screen.
  function showJoinedGroup(data, message) {
    focusGroupTitle.current = true
    setNotice(message)
    replace(data)
  }

  function reloadFromScratch() {
    setNotice('')
    reload()
  }

  const { status, data } = state

  return (
    <div className="buddies-screen">
      <main className="buddies-page buddies-page__content" aria-busy={status === 'loading'}>
        <header className="buddies-heading">
          <p className="buddies-heading__eyebrow">Community</p>
          <h1>Workout buddies</h1>
          <p>A private group for encouraging each other. Only members can see it.</p>
        </header>

        {notice && (
          <p className="buddies-notice buddies-notice--ok" role="status" tabIndex={-1} ref={noticeRef}>
            <span className="buddies-notice__icon" aria-hidden="true">✓</span>{notice}
          </p>
        )}

        {status === 'loading' && <p className="buddies-status" role="status">Loading your workout buddies…</p>}

        {status === 'error' && (
          <div className="buddies-notice buddies-notice--error" role="alert">
            <p><span className="buddies-notice__icon" aria-hidden="true">!</span>{MESSAGES.load}</p>
            <button type="button" className="buddies-button buddies-button--secondary" onClick={reloadFromScratch}>Try again</button>
          </div>
        )}

        {status === 'ready' && !data.group && (
          <div className="buddies-top">
            <NoGroupPanel onJoined={showJoinedGroup} onShowGroup={reloadFromScratch} onUnauthorized={toLogin} onStart={() => setNotice('')} />
            <HowItWorks />
          </div>
        )}
        {status === 'ready' && !data.group && (
          <div className="buddies-sent-row buddies-sent-row--optional">
            <SentEncouragements reloadKey={data} hideWhenEmpty onUnauthorized={toLogin} />
          </div>
        )}

        {status === 'ready' && data.group && (
          <>
            <div className={data.group.invite_code ? 'buddies-top' : 'buddies-top buddies-top--single'}>
              <GroupHero group={data.group} me={data.me} titleRef={groupTitle} leaveRef={leaveButton}
                onLeave={() => { setNotice(''); setLeaving(true) }} />
              {data.group.invite_code && <InviteCard group={data.group} />}
            </div>
            <div className="buddies-bottom">
              <GroupPanel group={data.group} onNotice={setNotice} onUnauthorized={toLogin}
                onMembersChanged={() => { refresh(); setSentVersion((version) => version + 1) }} />
              <EncouragementList encouragements={data.encouragements} fresh={fresh} />
            </div>
            <div className="buddies-sent-row">
              <SentEncouragements reloadKey={data} version={sentVersion} onUnauthorized={toLogin} />
            </div>
          </>
        )}
        {leaving && status === 'ready' && data.group && (
          <LeaveGroupDialog group={data.group} me={data.me} onLeft={showLeft} onGone={showGone} onCancel={closeLeave}
            onUnauthorized={toLogin} />
        )}
        {/* Read out when new encouragement arrives while the page is open. */}
        <p className="buddies-sr-only" role="status" aria-live="polite">{announcement}</p>
      </main>
    </div>
  )
}

// Beside the join and create forms for someone in no group: what a group is for, in three steps.
function HowItWorks() {
  return (
    <section className="buddies-section" aria-labelledby="buddies-how-title">
      <header className="buddies-section-heading">
        <h2 id="buddies-how-title">How it works</h2>
      </header>
      <ol className="buddies-steps">
        <li><strong>Get a code</strong><span>Ask a friend who owns a group for their 8-character invite code.</span></li>
        <li><strong>Join or start a group</strong><span>Enter the code, or create your own group and share its code.</span></li>
        <li><strong>Cheer each other on</strong><span>Send a member a short encouragement. Only they see it.</span></li>
      </ol>
    </section>
  )
}

export default BuddiesPage
