import { Fragment } from 'react'
import { initials } from '../leaderboard/leaderboardFormat.js'
import { daysLine, emptyGroupLine, sharedRankNote } from './weeklyFormat.js'

// This week's group: everyone with the same goal, most days first. Rows show only the rank, first name + last
// initial, the days (capped at the goal) and the percentage; people with the same days share a rank (1, 1, 3).
export default function StandingsList({ rows, targetDays }) {
  if (rows.length === 0) return <p className="weekly-empty">{emptyGroupLine(targetDays)}</p>

  return (
    <>
      <div className="weekly-standings__header" aria-hidden="true">
        <span>Rank</span><span>Member</span><span>Training days</span><span>Goal reached</span>
      </div>
      <ol className="weekly-list">
        {rows.map((row) => (
          <Fragment key={`${row.rank}-${row.name}-${row.is_me}`}>
            {row.gap_before && (
              <li className="weekly-gap">
                <span aria-hidden="true">⋯</span><span className="weekly-sr-only">Ranks skipped</span>
              </li>
            )}
            <li className={row.is_me ? 'weekly-row is-me' : 'weekly-row'} data-rank={row.rank}
              aria-current={row.is_me ? 'true' : undefined}>
              <span className="weekly-rank">#{row.rank}</span>
              <span className="weekly-who">
                <span className="weekly-avatar" aria-hidden="true">{initials(row.name)}</span>
                <span className="weekly-name">{row.name}</span>
                {row.is_me && <span className="weekly-you">You</span>}
              </span>
              <span className="weekly-progress">
                <span className="weekly-days">{daysLine(row.progress_days, targetDays)}</span>
                <span className="weekly-bar" aria-hidden="true"><span style={{ width: `${row.progress_percent}%` }} /></span>
              </span>
              <span className={row.progress_percent === 100 ? 'weekly-percent is-full' : 'weekly-percent'}>
                {row.progress_percent}%
              </span>
            </li>
          </Fragment>
        ))}
      </ol>
      <p className="weekly-note">{sharedRankNote(targetDays)}</p>
    </>
  )
}
