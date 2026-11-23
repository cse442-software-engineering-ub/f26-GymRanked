import { Fragment, useEffect, useRef, useState } from 'react'
import { GroupHeader, UnrankedList } from './BuddiesParts.jsx'
import { boardByKey, emptyBoardText, formatScore, initials, rankedCountLine } from './leaderboardFormat.js'
import { emptyGroupBoardText, strengthGroupLine } from './rankingScope.js'

// One board: the top 10 (plus anyone tied with 10th), a "· · ·" gap, then you and one person either side.
// Rows show only rank, first name + last initial and score. On phones your row is pinned to the bottom of the
// screen while it is scrolled out of view (research frame P1b).
// With a group (Buddies, card 139): the group's name and size, every ranked member, then the members who aren't
// ranked on this board, by name only.
export default function BoardList({ rows, board, rankedCount, group = null, unranked = [] }) {
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

  const { label } = boardByKey(board)
  const groupHeader = group && <GroupHeader name={group.name} line={strengthGroupLine(group.member_count, label)} />
  const unrankedList = group && <UnrankedList title={`Unranked on ${label}`} names={unranked} />

  if (group && rankedCount === 0) {
    return (
      <>
        {groupHeader}
        <div className="leaderboard-empty">
          <p>{emptyGroupBoardText(group.name, label)}</p>
        </div>
        {unrankedList}
      </>
    )
  }

  if (rankedCount === 0) {
    return (
      <div className="leaderboard-empty">
        <h2>{emptyBoardText(board)}</h2>
        <p>People appear here once they join, finish 3 workouts and log the lift.</p>
      </div>
    )
  }

  return (
    <>
      {groupHeader || <h2 className="leaderboard-board__count">{rankedCountLine(rankedCount, board)}</h2>}
      <div className="leaderboard-board__header" aria-hidden="true">
        <span>Rank</span><span>Athlete</span><span>{group ? 'DOTS' : 'Score'}</span>
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
                <span className="leaderboard-avatar" aria-hidden="true">{initials(row.name)}</span>
                <span className="leaderboard-name">{row.name}</span>
                {row.is_me && <span className="leaderboard-you">You</span>}
              </span>
              <span className="leaderboard-score">{formatScore(row.score)}</span>
            </li>
          </Fragment>
        ))}
      </ol>
      {unrankedList}
      {group ? (
        <p className="leaderboard-note">
          Everyone in your group who is ranked on {label}. People with the same score share a rank (2, 2, 4). Other
          people&apos;s weights are never shown.
        </p>
      ) : (
        <p className="leaderboard-note">
          Showing the top 10 and the people around you. People with the same score share a rank (2, 2, 4). Overall scores
          each person&apos;s three best estimated 1RMs added together. Other people&apos;s weights are never shown.
        </p>
      )}
      {me && (
        <div className="leaderboard-pinned" hidden={meVisible} aria-hidden="true">
          <span className="leaderboard-rank">{me.rank}</span>
          <span className="leaderboard-who">
            <span className="leaderboard-avatar">{initials(me.name)}</span>
            <span>{me.name}</span><span className="leaderboard-you">You</span>
          </span>
          <span className="leaderboard-score">{formatScore(me.score)}</span>
        </div>
      )}
    </>
  )
}
