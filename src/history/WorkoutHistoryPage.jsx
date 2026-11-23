import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import BackLink from '../BackLink.jsx'
import { addReturn, historyParams, readHistoryView } from '../returnTarget.js'
import { summaryPath } from '../workoutLog/setLog.js'
import workoutLogApi from '../workoutLog/workoutLogApi.js'
import WorkoutHistoryItem from './WorkoutHistoryItem.jsx'
import { PAGE_SIZE, countLabel, pageCount, pageList, rangeLabel } from './historyFormat.js'
import './history.css'

// Story #9: the logged-in account's completed and prior-day unfinished workouts, newest first, four per page (Sam's Sprint 1 designs #35
// and #55). The list comes from api/workout_history.php; opening a workout loads its sets from
// api/workout_session.php?id=, once per workout.
function WorkoutHistoryPage() {
  const navigate = useNavigate()
  const listRef = useRef(null)
  const [attempt, setAttempt] = useState(0)
  const [history, setHistory] = useState({ status: 'loading', workouts: [] })
  // The page and open workout live in the address too (replacing the entry, not adding one), so a summary's
  // Go back button, a refresh or a new tab shows the same view. A bad value is ignored (page 1, nothing open).
  const [searchParams, setSearchParams] = useSearchParams()
  const [view] = useState(() => readHistoryView(searchParams))
  const [page, setPage] = useState(view.page)
  const [openId, setOpenId] = useState(view.open)
  // Sets of the workouts opened so far, by id: {status, session}.
  const [details, setDetails] = useState({})

  useEffect(() => {
    let active = true
    setHistory({ status: 'loading', workouts: [] })
    workoutLogApi.getHistory()
      .then((workouts) => {
        if (active) setHistory({ status: 'ready', workouts: Array.isArray(workouts) ? workouts : [] })
      })
      .catch((error) => {
        if (!active) return
        if (error.status === 401) navigate('/login', { replace: true })
        else setHistory({ status: 'error', workouts: [] })
      })
    return () => { active = false }
  }, [attempt, navigate])

  function loadDetail(id) {
    setDetails((current) => ({ ...current, [id]: { status: 'loading' } }))
    workoutLogApi.getSession(id)
      .then((session) => setDetails((current) => ({ ...current, [id]: { status: 'ready', session } })))
      .catch((error) => {
        if (error.status === 401) navigate('/login', { replace: true })
        else setDetails((current) => ({ ...current, [id]: { status: 'error' } }))
      })
  }

  function toggle(id) {
    if (openShown === id) {
      setOpenId(null)
      return
    }
    setOpenId(id)
    if (!details[id] || details[id].status === 'error') loadDetail(id)
  }

  function goToPage(next) {
    setPage(next)
    setOpenId(null)
    // On a phone the pager is below the fold, so bring the new page's first workout into view.
    if (listRef.current && listRef.current.getBoundingClientRect().top < 0) listRef.current.scrollIntoView()
  }

  const { status, workouts } = history
  const pages = pageCount(workouts.length)
  const currentPage = Math.min(page, Math.max(pages, 1))
  const shown = workouts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  // An open workout from the address only counts if it is on the page being shown.
  const openShown = shown.some((workout) => workout.id === openId) ? openId : null

  useEffect(() => {
    if (status !== 'ready') return
    if (currentPage !== page) setPage(currentPage)
    if (openShown !== openId) setOpenId(openShown)
    if (openShown !== null && !details[openShown]) loadDetail(openShown)
  }, [status, currentPage, openShown]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'ready') setSearchParams(historyParams({ page: currentPage, open: openShown }), { replace: true })
  }, [status, currentPage, openShown]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="history-page">
      <main className="history-page__content" aria-busy={status === 'loading'}>
        <BackLink to="/progress">Back to progress</BackLink>
        <div className="history-page__heading">
          <h1>Workout history</h1>
          {status === 'ready' && <p>{countLabel(workouts.length)}</p>}
        </div>

        {status === 'loading' && (
          <p className="history-page__status">Loading your workout history...</p>
        )}

        {status === 'error' && (
          <div className="history-error" role="alert">
            <p>Couldn&apos;t load your workout history. Check your connection and try again.</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
          </div>
        )}

        {status === 'ready' && workouts.length === 0 && (
          <section className="history-empty" aria-labelledby="history-empty-title">
            <h2 id="history-empty-title">No workouts logged yet</h2>
            <p>Log a set in a workout and it will appear here after you finish or after the day ends.</p>
            <Link to="/weekly-plan" className="button-primary history-empty__action">Start a workout</Link>
          </section>
        )}

        {status === 'ready' && workouts.length > 0 && (
          <>
            <ol className="history-list" ref={listRef} aria-label="Workouts in history">
              {shown.map((workout) => (
                <WorkoutHistoryItem
                  key={workout.id}
                  workout={workout}
                  open={openShown === workout.id}
                  summaryTo={addReturn(summaryPath(workout.id), { place: 'history', page: currentPage, open: workout.id })}
                  detail={details[workout.id]}
                  onToggle={() => toggle(workout.id)}
                  onRetry={() => loadDetail(workout.id)}
                />
              ))}
            </ol>
            {pages > 1 && (
              <nav className="history-pager" aria-label="Workout history pages">
                <p className="history-pager__range">{rangeLabel(currentPage, workouts.length)}</p>
                <div className="history-pager__buttons">
                  <button type="button" className="history-pager__step" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                    Previous
                  </button>
                  {pageList(currentPage, pages).map((item, index) =>
                    item === '…' ? (
                      <span key={`gap-${index}`} className="history-pager__gap" aria-hidden="true">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={item === currentPage ? 'history-pager__page history-pager__page--current' : 'history-pager__page'}
                        aria-label={`Page ${item}`}
                        aria-current={item === currentPage ? 'page' : undefined}
                        onClick={() => goToPage(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button type="button" className="history-pager__step" disabled={currentPage === pages} onClick={() => goToPage(currentPage + 1)}>
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default WorkoutHistoryPage
