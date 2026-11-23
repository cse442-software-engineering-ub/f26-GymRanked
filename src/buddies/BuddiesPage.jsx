import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupPanel, { GroupHero, InviteCard } from './GroupPanel.jsx'
import EncouragementList from './EncouragementList.jsx'
import NoGroupPanel from './NoGroupPanel.jsx'
import { useBuddyGroupPoll } from './useBuddyGroupPoll.js'
import { MESSAGES } from './buddiesFormat.js'
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

  const toLogin = useCallback(() => navigate('/login', { replace: true }), [navigate])
  const { state, fresh, announcement, reload, refresh, replace } = useBuddyGroupPoll({ onUnauthorized: toLogin })

  // After joining or creating, the keyboard and screen readers land on the new group's name.
  useEffect(() => {
    if (focusGroupTitle.current && groupTitle.current) {
      focusGroupTitle.current = false
      groupTitle.current.focus()
    }
  }, [state])

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
          <p className="buddies-notice buddies-notice--ok" role="status">
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

        {status === 'ready' && data.group && (
          <>
            <div className={data.group.invite_code ? 'buddies-top' : 'buddies-top buddies-top--single'}>
              <GroupHero group={data.group} me={data.me} titleRef={groupTitle} />
              {data.group.invite_code && <InviteCard group={data.group} />}
            </div>
            <div className="buddies-bottom">
              <GroupPanel group={data.group} onNotice={setNotice} onUnauthorized={toLogin} onMembersChanged={refresh} />
              <EncouragementList encouragements={data.encouragements} fresh={fresh} />
            </div>
          </>
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
