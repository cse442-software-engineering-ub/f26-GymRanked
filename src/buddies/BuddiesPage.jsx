import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupPanel from './GroupPanel.jsx'
import EncouragementList from './EncouragementList.jsx'
import NoGroupPanel from './NoGroupPanel.jsx'
import { getBuddyGroup } from './buddiesApi.js'
import { MESSAGES } from './buddiesFormat.js'
import './buddies.css'

// Workout buddies (story #78, card #79): a private group joined with an invite code. Someone in no group sees the
// join and create forms; a member sees the group, its members and the encouragements sent to them. Everything shown
// comes from Mansur's api/buddy_*.php (card #71). The group loads again whenever the tab comes back into view, so a
// new member or message shows without a manual reload.
function BuddiesPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null })
  const [notice, setNotice] = useState('')
  // Only the newest request may change the page; older answers (and answers after leaving the page) are dropped.
  const latest = useRef(0)
  const groupTitle = useRef(null)
  const focusGroupTitle = useRef(false)

  const toLogin = useCallback(() => navigate('/login', { replace: true }), [navigate])

  // quiet: keep what is on screen while loading, and keep it if the request fails (background refreshes).
  const load = useCallback(async (quiet) => {
    const id = ++latest.current
    if (!quiet) setState({ status: 'loading', data: null })
    const response = await getBuddyGroup()
    if (id !== latest.current) return
    if (response.status === 401) toLogin()
    else if (response.ok) setState({ status: 'ready', data: response.data })
    else if (!quiet) setState({ status: 'error', data: null })
  }, [toLogin])

  useEffect(() => {
    load(false)
    return () => { latest.current += 1 }
  }, [load])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && latest.current > 0) load(true)
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [load])

  // After joining or creating, the keyboard and screen readers land on the new group's name.
  useEffect(() => {
    if (focusGroupTitle.current && groupTitle.current) {
      focusGroupTitle.current = false
      groupTitle.current.focus()
    }
  }, [state])

  // Join and create answer with the same body as GET, so the group shows at once with no second loading screen.
  function showJoinedGroup(data, message) {
    latest.current += 1
    focusGroupTitle.current = true
    setNotice(message)
    setState({ status: 'ready', data })
  }

  function reloadFromScratch() {
    setNotice('')
    load(false)
  }

  const { status, data } = state

  return (
    <div className="buddies-screen">
      <main className="buddies-page buddies-page__content" aria-busy={status === 'loading'}>
        <div className="buddies-heading">
          <h1>Workout buddies</h1>
          <p>A private group for encouraging each other. Only members can see it.</p>
        </div>

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
          <NoGroupPanel onJoined={showJoinedGroup} onShowGroup={reloadFromScratch} onUnauthorized={toLogin} onStart={() => setNotice('')} />
        )}

        {status === 'ready' && data.group && (
          <>
            <GroupPanel group={data.group} me={data.me} titleRef={groupTitle} onNotice={setNotice}
              onUnauthorized={toLogin} onMembersChanged={() => load(true)} />
            <EncouragementList encouragements={data.encouragements} />
          </>
        )}
      </main>
    </div>
  )
}

export default BuddiesPage
