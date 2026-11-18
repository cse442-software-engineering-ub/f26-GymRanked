import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import BoardList from './BoardList.jsx'
import { NoGroup } from './BuddiesParts.jsx'
import LeaderboardSwitch from './LeaderboardSwitch.jsx'
import ScopeSwitch from './ScopeSwitch.jsx'
import YourStanding from './YourStanding.jsx'
import { getLeaderboard, joinLeaderboard, leaveLeaderboard } from './leaderboardApi.js'
import { BOARDS, boardByKey } from './leaderboardFormat.js'
import { rankingParams, scopeFrom } from './rankingScope.js'
import './leaderboard.css'

const ACTION_ERRORS = {
  join: "Couldn't join the leaderboard. Try again.",
  leave: "Couldn't leave the leaderboard. Try again.",
  table: "Couldn't save your scoring table. Try again.",
}

// Story #10: all-time DOTS boards for Overall and the three lifts, your own place on them, and how to get ranked
// (research task 113 updated for DOTS, card 120). Every number comes from api/leaderboard.php; the board is in the
// address (#/leaderboard?board=bench) so a refresh keeps it. Card 139 adds Everyone | Buddies: &scope=buddies ranks
// only your own buddies group, and the address keeps that choice too (src/leaderboard/rankingScope.js).
function LeaderboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const board = boardByKey(searchParams.get('board')).key
  const scope = scopeFrom(searchParams.get('scope'))
  const [attempt, setAttempt] = useState(0)
  // The latest answer, for one board and attempt. While another board loads, the last one stays on screen (dimmed),
  // so the page keeps its height and the scroll position instead of jumping to the top.
  const [result, setResult] = useState({ key: null, status: 'loading', data: null })
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    authRequest('session')
      .then((data) => { if (active) setFullName(data.user.full_name.trim()) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const key = `${board}:${scope}:${attempt}`

  useEffect(() => {
    let active = true
    getLeaderboard(board, scope).then((response) => {
      if (!active) return
      if (response.status === 401) navigate('/login', { replace: true })
      else setResult({ key, status: response.ok ? 'ready' : 'error', data: response.ok ? response.data : null })
    })
    return () => { active = false }
  }, [key, board, scope, navigate])

  function chooseBoard(next) {
    setNotice('')
    setActionError(null)
    setSearchParams(rankingParams({ board: next, scope }))
  }

  // Everyone or Buddies, keeping the lift that is open.
  function chooseScope(next) {
    setNotice('')
    setActionError(null)
    setSearchParams(rankingParams({ board: searchParams.get('board') ?? undefined, scope: next }))
  }

  // Join, leave or change the scoring table, then reload this board in place (no loading flash). Resolves to
  // whether the change was saved.
  async function act(action, request) {
    if (busy) return false
    setBusy(action)
    setActionError(null)
    setNotice('')
    const response = await request()
    if (response.status === 401) {
      navigate('/login', { replace: true })
      return false
    }
    if (!response.ok) {
      setBusy(null)
      setActionError(action)
      return false
    }
    const fresh = await getLeaderboard(board, scope)
    setResult({ key, status: fresh.ok ? 'ready' : 'error', data: fresh.ok ? fresh.data : null })
    if (action === 'leave') setNotice("You've left the leaderboard. Your workouts are kept.")
    setBusy(null)
    return true
  }

  const current = result.key === key
  // 'updating': another board is on its way and the last one is still shown.
  const status = current ? result.status : result.status === 'ready' ? 'updating' : 'loading'
  const data = result.status === 'ready' && (current || status === 'updating') ? result.data : null
  // Only a Buddies answer has "group" (null without a group). Read from the answer, not the address, so a Buddies
  // board still on screen while Everyone loads keeps its own labels.
  const buddies = Boolean(data) && 'group' in data

  return (
    <div className="leaderboard-page">
      <main className="leaderboard-page__content" aria-busy={status === 'loading' || status === 'updating'}>
        <LeaderboardSwitch scope={scope} />
        <div className="leaderboard-page__heading">
          <h1>Leaderboard</h1>
          <p>All-time DOTS points from finished workouts. Each lift uses your best estimated 1RM from sets of 1 to 10 reps. Overall adds the three together.</p>
        </div>

        {notice && <p className="leaderboard-notice" role="status">{notice}</p>}

        {data && (
          // workouts_needed comes with the board, not inside me; the steps card reads it from me. The labels follow
          // the board the numbers belong to (data.board), which can still be the last one while the next loads.
          <YourStanding
            me={{ ...data.me, workouts_needed: data.workouts_needed }}
            board={data.board}
            rankedCount={data.ranked_count}
            fullName={fullName}
            buddies={buddies}
            busy={busy}
            error={actionError && ACTION_ERRORS[actionError]}
            errorFor={actionError}
            onJoin={(table) => act('join', () => joinLeaderboard(table))}
            onLeave={() => act('leave', leaveLeaderboard)}
            onSaveTable={(table) => act('table', () => joinLeaderboard(table))}
          />
        )}

        {/* The board card: who to compare with, the lift tabs, then the rows (research frame D1). */}
        <section className={status === 'updating' ? 'leaderboard-board is-updating' : 'leaderboard-board'} aria-label="Rankings">
          <ScopeSwitch scope={scope} onChange={chooseScope} />
          <div className="leaderboard-tabs" role="group" aria-label="Board">
            {BOARDS.map((item) => (
              <button key={item.key} type="button" aria-label={item.label} aria-pressed={board === item.key}
                onClick={() => chooseBoard(item.key)}>
                <span className="leaderboard-tabs__full">{item.label}</span>
                <span className="leaderboard-tabs__short">{item.short}</span>
              </button>
            ))}
          </div>

          {status === 'loading' && <p className="leaderboard-page__status">Loading the leaderboard...</p>}

          {status === 'error' && (
            <div className="leaderboard-error" role="alert">
              <p>Couldn&apos;t load the leaderboard. Check your connection and try again.</p>
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          )}

          {data && (buddies && data.group === null ? <NoGroup /> : (
            <BoardList rows={data.rows} board={data.board} rankedCount={data.ranked_count}
              group={buddies ? data.group : null} unranked={buddies ? data.unranked : []} />
          ))}
        </section>
      </main>
    </div>
  )
}

export default LeaderboardPage
