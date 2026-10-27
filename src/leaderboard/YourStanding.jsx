import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  choosesTable,
  formatPounds,
  formatScore,
  liftsLine,
  notOnBoardText,
  rankLine,
  rankSteps,
  standingKind,
  tableLine,
  workoutsText,
} from './leaderboardFormat.js'

const PRIVACY = 'Others see your first name, last initial and scores. Never your body weight, gender, scoring table or lifts in lb.'

// The card above the board: your rank on this board, what you still need, or the test-account note.
export default function YourStanding({ me, board, rankedCount, fullName, busy, error, errorFor, onJoin, onLeave, onSaveTable }) {
  const [table, setTable] = useState(me.scoring_table ?? '')
  const [changing, setChanging] = useState(false)
  const kind = standingKind(me)
  const chooses = choosesTable(me.gender)

  if (kind === 'test') {
    return (
      <section className="leaderboard-me" aria-label="Your standing">
        <p className="leaderboard-me__text">Test accounts aren&apos;t shown on the leaderboard.</p>
      </section>
    )
  }

  const tableChoice = (
    <TableChoice value={table} onChange={setTable} disabled={Boolean(busy)} />
  )
  const actionError = (action) => errorFor === action && <p className="leaderboard-action-error" role="alert">{error}</p>
  const leaveButton = (label) => (
    <button type="button" className="leaderboard-link-button" disabled={Boolean(busy)} onClick={onLeave}>
      {busy === 'leave' ? 'Leaving…' : label}
    </button>
  )
  // "Scored with the women's table · Change", and the choice itself while changing it.
  const tableRow = chooses && me.scoring_table && (changing ? (
    <div className="leaderboard-table-change">
      {tableChoice}
      <div className="leaderboard-actions">
        <button type="button" className="leaderboard-button" disabled={Boolean(busy) || !table}
          onClick={async () => { if (await onSaveTable(table)) setChanging(false) }}>
          {busy === 'table' ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="leaderboard-link-button" disabled={Boolean(busy)}
          onClick={() => { setTable(me.scoring_table); setChanging(false) }}>Cancel</button>
      </div>
      {actionError('table')}
    </div>
  ) : (
    <p className="leaderboard-me__detail">
      {tableLine(me.scoring_table)} · <button type="button" className="leaderboard-link-button" onClick={() => setChanging(true)}>Change</button>
    </p>
  ))

  if (kind === 'ranked' || kind === 'not-on-board') {
    return (
      <section className="leaderboard-me" aria-label="Your standing">
        <div className="leaderboard-me__head">
          <h2>{fullName || 'You'}</h2>
          {kind === 'ranked' && <p className="leaderboard-me__rank">{rankLine(me.rank, rankedCount, board)}</p>}
        </div>
        {kind === 'ranked'
          ? <p className="leaderboard-me__score"><strong>{formatScore(me.score)}</strong> DOTS points</p>
          : <p className="leaderboard-me__text">{notOnBoardText(me, board)}</p>}
        <p className="leaderboard-me__detail">Your best estimated 1RMs: {liftsLine(me.lifts)}</p>
        {tableRow}
        <div className="leaderboard-actions">{leaveButton('Leave the leaderboard')}</div>
        {actionError('leave')}
      </section>
    )
  }

  const [join, details, workouts, lift] = rankSteps(me)
  // Joined as a man or woman, then changed gender in Personal details: the table is still missing.
  const joinedWithoutTable = me.joined && !join.done
  const needsChoice = chooses && !me.scoring_table

  return (
    <section className="leaderboard-me" aria-labelledby="leaderboard-steps-title">
      <h2 id="leaderboard-steps-title">How to get ranked</h2>
      <ol className="leaderboard-steps">
        <Step done={join.done} title="Join the leaderboard">
          {join.done ? (
            <>
              <p>You&apos;ve joined · {leaveButton('Leave')}</p>
              {tableRow}
              {actionError('leave')}
            </>
          ) : (
            <>
              <p>{joinedWithoutTable ? 'Choose a scoring table to finish joining.' : PRIVACY}</p>
              {needsChoice && tableChoice}
              <div className="leaderboard-actions">
                {joinedWithoutTable ? (
                  <button type="button" className="leaderboard-button" disabled={Boolean(busy) || !table} onClick={() => onSaveTable(table)}>
                    {busy === 'table' ? 'Saving…' : 'Save'}
                  </button>
                ) : (
                  <button type="button" className="leaderboard-button" disabled={Boolean(busy) || (needsChoice && !table)}
                    onClick={() => onJoin(needsChoice ? table : undefined)}>
                    {busy === 'join' ? 'Joining…' : 'Join the leaderboard'}
                  </button>
                )}
                {joinedWithoutTable && leaveButton('Leave')}
              </div>
              {needsChoice && !table && <p className="leaderboard-hint">Choose a scoring table.</p>}
              {actionError('join')}
              {actionError('table')}
              {actionError('leave')}
            </>
          )}
        </Step>
        <Step done={details.done} title="Add your body weight and gender">
          {details.done
            ? <p>Saved in Personal details · {formatPounds(me.bodyweight_lb)}</p>
            : <p><Link to="/personal-details">Add personal details</Link></p>}
        </Step>
        <Step done={workouts.done} title="Finish 3 workouts">
          <p>{workoutsText(me.workouts_done, me.workouts_needed)}</p>
        </Step>
        <Step done={lift.done} title="Log a bench press, back squat or deadlift">
          <p>Sets of 1 to 10 reps count.</p>
        </Step>
      </ol>
    </section>
  )
}

function Step({ done, title, children }) {
  return (
    <li className={done ? 'leaderboard-step is-done' : 'leaderboard-step'}>
      <span className="leaderboard-step__tick" aria-hidden="true">
        {done && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        )}
      </span>
      <div className="leaderboard-step__body">
        <h3>{title}<span className="leaderboard-sr-only">{done ? ' (done)' : ' (not done)'}</span></h3>
        {children}
      </div>
    </li>
  )
}

function TableChoice({ value, onChange, disabled }) {
  return (
    <fieldset className="leaderboard-table-choice" aria-describedby="leaderboard-table-hint">
      <legend>Scoring table</legend>
      <p id="leaderboard-table-hint" className="leaderboard-hint">
        DOTS has one table for men and one for women. Choose which one scores your lifts. Nobody else sees this choice.
      </p>
      <div className="leaderboard-table-choice__options">
        {[['men', "Men's table"], ['women', "Women's table"]].map(([option, label]) => (
          <label key={option}>
            <input type="radio" name="scoring-table" value={option} checked={value === option} disabled={disabled}
              onChange={() => onChange(option)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
