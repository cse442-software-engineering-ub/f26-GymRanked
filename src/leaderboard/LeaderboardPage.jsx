import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authRequest } from '../auth/api.js'
import NavBar from '../NavBar.jsx'
import BoardList from './BoardList.jsx'
import YourStanding from './YourStanding.jsx'
import { getLeaderboard, joinLeaderboard, leaveLeaderboard } from './leaderboardApi.js'
import { BOARDS, boardByKey } from './leaderboardFormat.js'
import './leaderboard.css'

const ACTION_ERRORS = {
  join: "Couldn't join the leaderboard. Try again.",
  leave: "Couldn't leave the leaderboard. Try again.",
  table: "Couldn't save your scoring table. Try again.",
}

// Story #10: all-time DOTS boards for Overall and the three lifts, your own place on them, and how to get ranked
// (research task 113 updated for DOTS, card 120). Every number comes from api/leaderboard.php; the board is in the
// address (#/leaderboard?board=bench) so a refresh keeps it.
function LeaderboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const board = boardByKey(searchParams.get('board')).key
  const [attempt, setAttempt] = useState(0)
  // The answer for one board and attempt; while another is wanted, the page shows loading, never another board.
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

  const key = `${board}:${attempt}`

  useEffect(() => {
    let active = true
    getLeaderboard(board).then((response) => {
      if (!active) return
      if (response.status === 401) navigate('/login', { replace: true })
      else setResult({ key, status: response.ok ? 'ready' : 'error', data: response.ok ? response.data : null })
    })
    return () => { active = false }
  }, [key, board, navigate])

  function chooseBoard(next) {
    setNotice('')
    setActionError(null)
    setSearchParams({ board: next })
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
    const fresh = await getLeaderboard(board)
    setResult({ key, status: fresh.ok ? 'ready' : 'error', data: fresh.ok ? fresh.data : null })
    if (action === 'leave') setNotice("You've left the leaderboard. Your workouts are kept.")
    setBusy(null)
    return true
  }

  const { status, data } = result.key === key ? result : { status: 'loading', data: null }

  return (
    <div className="leaderboard-page">
      <NavBar current="Leaderboard" />
      <main className="leaderboard-page__content" aria-busy={status === 'loading'}>
        <div className="leaderboard-page__heading">
          <h1>Leaderboard</h1>
          <p>All-time DOTS points from finished workouts. Each lift uses your best estimated 1RM from sets of 1 to 10 reps. Overall adds the three together.</p>
        </div>

        {notice && <p className="leaderboard-notice" role="status">{notice}</p>}

        {status === 'ready' && (
          // workouts_needed comes with the board, not inside me; the steps card reads it from me.
          <YourStanding
            me={{ ...data.me, workouts_needed: data.workouts_needed }}
            board={board}
            rankedCount={data.ranked_count}
            fullName={fullName}
            busy={busy}
            error={actionError && ACTION_ERRORS[actionError]}
            errorFor={actionError}
            onJoin={(table) => act('join', () => joinLeaderboard(table))}
            onLeave={() => act('leave', leaveLeaderboard)}
            onSaveTable={(table) => act('table', () => joinLeaderboard(table))}
          />
        )}

        {/* The board card: who to compare with, the lift tabs, then the rows (research frame D1). */}
        <section className="leaderboard-board" aria-label="Rankings">
          <div className="leaderboard-scope" role="group" aria-label="Compare with">
            <button type="button" aria-pressed="true">Everyone</button>
            <button type="button" aria-pressed="false" disabled>Friends <span className="leaderboard-later">Later</span></button>
          </div>
          <div className="leaderboard-tabs" role="group" aria-label="Board">
            {BOARDS.map((item) => (
              <button key={item.key} type="button" aria-pressed={board === item.key} onClick={() => chooseBoard(item.key)}>
                {item.label}
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

          {status === 'ready' && <BoardList rows={data.rows} board={board} rankedCount={data.ranked_count} />}
        </section>
      </main>
    </div>
  )
}

export default LeaderboardPage
