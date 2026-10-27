import { Fragment, useEffect, useRef, useState } from 'react'
import { emptyBoardText, formatScore, rankedCountLine } from './leaderboardFormat.js'

// One board: the top 10 (plus anyone tied with 10th), a "· · ·" gap, then you and one person either side.
// Rows show only rank, first name + last initial and score. On phones your row is pinned to the bottom of the
// screen while it is scrolled out of view (research frame P1b).
export default function BoardList({ rows, board, rankedCount }) {
  const meRef = useRef(null)
  const [meVisible, setMeVisible] = useState(true)
  const me = rows.find((row) => row.is_me)

  useEffect(() => {
    const element = meRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setMeVisible(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [rows])

  if (rankedCount === 0) {
    return (
      <section className="leaderboard-board leaderboard-board--empty" aria-label="Board">
        <h2>{emptyBoardText(board)}</h2>
        <p>People appear here once they join, finish 3 workouts and log the lift.</p>
      </section>
    )
  }

  return (
    <section className="leaderboard-board" aria-labelledby="leaderboard-count">
      <h2 id="leaderboard-count" className="leaderboard-board__count">{rankedCountLine(rankedCount, board)}</h2>
      <div className="leaderboard-board__header" aria-hidden="true">
        <span>Rank</span><span>Name</span><span>DOTS points</span>
      </div>
      <ol className="leaderboard-list">
        {rows.map((row) => (
          <Fragment key={`${row.rank}-${row.name}-${row.is_me}`}>
            {row.gap_before && (
              <li className="leaderboard-gap">
                <span aria-hidden="true">· · ·</span><span className="leaderboard-sr-only">Ranks skipped</span>
              </li>
            )}
            <li ref={row.is_me ? meRef : undefined}
              className={row.is_me ? 'leaderboard-row is-me' : 'leaderboard-row'} data-rank={row.rank}
              aria-current={row.is_me ? 'true' : undefined}>
              <span className="leaderboard-rank">{row.rank}</span>
              <span className="leaderboard-who">
                <span className="leaderboard-name">{row.name}</span>
                {row.is_me && <span className="leaderboard-you">You</span>}
              </span>
              <span className="leaderboard-score">{formatScore(row.score)}</span>
            </li>
          </Fragment>
        ))}
      </ol>
      {me && (
        <div className="leaderboard-pinned" hidden={meVisible} aria-hidden="true">
          <span className="leaderboard-rank">{me.rank}</span>
          <span className="leaderboard-who">
            <span>{me.name}</span><span className="leaderboard-you">You</span>
          </span>
          <span>{formatScore(me.score)}</span>
        </div>
      )}
    </section>
  )
}
