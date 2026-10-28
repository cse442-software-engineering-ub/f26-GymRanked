import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LIFT_BOARDS,
  boardByKey,
  choosesTable,
  formatPounds,
  formatScore,
  initials,
  notOnBoardText,
  rankLine,
  rankSteps,
  standingKind,
  tableLine,
  workoutsText,
} from './leaderboardFormat.js'

const PRIVACY = 'Others see your first name, last initial and scores. Never your body weight, gender, scoring table or lifts in lb.'

// Above the board (research frames D1 and D4): your card with your rank and lifts, plus the "How to get ranked"
// steps while you aren't ranked yet. A test account only gets a note.
export default function YourStanding({ me, board, rankedCount, fullName, busy, error, errorFor, onJoin, onLeave, onSaveTable }) {
  const [table, setTable] = useState(me.scoring_table ?? '')
  const [changing, setChanging] = useState(false)
  const kind = standingKind(me)
  const chooses = choosesTable(me.gender)

  if (kind === 'test') {
    return (
      <section className="leaderboard-me leaderboard-me--note" aria-label="Your standing">
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

  const onBoards = kind === 'ranked' || kind === 'not-on-board'
  const { label } = boardByKey(board)
  const header = (
    <div className="leaderboard-me__head">
      <span className="leaderboard-me__avatar" aria-hidden="true">{initials(fullName)}</span>
      <div className="leaderboard-me__who">
        <h2>{fullName || 'You'}</h2>
        <p className="leaderboard-me__detail">
          {kind !== 'ranked' && <span className="leaderboard-pill">{onBoards ? 'Not on this board' : 'Unranked'}</span>}
          {onBoards
            ? <>Body weight {formatPounds(me.bodyweight_lb)} · {leaveButton('Leave the leaderboard')}</>
            : 'Not on any board yet'}
        </p>
      </div>
      <div className="leaderboard-me__place">
        <span className="leaderboard-me__label">{kind === 'ranked' ? `Rank · ${label}` : 'Rank'}</span>
        {kind === 'ranked' ? (
          <>
            <p className="leaderboard-me__rank">{rankLine(me.rank, rankedCount, board)}</p>
            <p className="leaderboard-me__score"><strong>{formatScore(me.score)}</strong> DOTS points</p>
          </>
        ) : <p className="leaderboard-me__norank" aria-label="No rank">—</p>}
      </div>
    </div>
  )

  if (onBoards) {
    return (
      <section className="leaderboard-me" aria-label="Your standing">
        <div className="leaderboard-me__card">
          {header}
          {actionError('leave')}
          {kind === 'not-on-board' && <p className="leaderboard-me__text">{notOnBoardText(me, board)}</p>}
          <div className="leaderboard-lifts">
            {LIFT_BOARDS.map((lift) => (
              <div key={lift.key} className={lift.key === board ? 'leaderboard-lift is-current' : 'leaderboard-lift'}>
                <span className="leaderboard-lift__name">{lift.label}</span>
                <strong className="leaderboard-lift__value">{formatPounds(me.lifts?.[lift.key])}</strong>
                <span className="leaderboard-lift__caption">{me.lifts?.[lift.key] == null ? 'Not logged yet' : 'Best estimated 1RM'}</span>
              </div>
            ))}
          </div>
          {tableRow}
          <p className="leaderboard-me__note">
            Each lift is your best estimated 1RM, weight × (1 + reps ÷ 30), from sets of 1 to 10 reps in finished
            workouts. Only you see your weights in lb.
          </p>
        </div>
      </section>
    )
  }

  const [join, details, workouts, lift] = rankSteps(me)
  // Joined as a man or woman, then changed gender in Personal details: the table is still missing.
  const joinedWithoutTable = me.joined && !join.done
  const needsChoice = chooses && !me.scoring_table

  return (
    <section className="leaderboard-me" aria-label="Your standing">
      <div className="leaderboard-me__card">{header}</div>
      <div className="leaderboard-steps-card">
        <p className="leaderboard-eyebrow">Get on the leaderboard</p>
        <h2>How to get ranked</h2>
        <p className="leaderboard-me__text">The leaderboard is opt-in. Nobody sees anything about you until you join and get ranked.</p>
        <ol className="leaderboard-steps">
          <Step number={1} done={join.done} title="Join the leaderboard">
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
          <Step number={2} done={details.done} title="Add your body weight and gender">
            {details.done
              ? <p>Saved in Personal details · {formatPounds(me.bodyweight_lb)}</p>
              : <p><Link to="/personal-details">Add personal details</Link></p>}
          </Step>
          <Step number={3} done={workouts.done} title="Finish 3 workouts"
            action={!workouts.done && <Link className="leaderboard-step__action" to="/weekly-plan">Start a workout ›</Link>}>
            <p>{workoutsText(me.workouts_done, me.workouts_needed)}</p>
            {!workouts.done && (
              <div className="leaderboard-progress" role="progressbar" aria-label="Workouts finished"
                aria-valuemin={0} aria-valuemax={me.workouts_needed} aria-valuenow={Math.min(me.workouts_done, me.workouts_needed)}>
                <span style={{ width: `${(Math.min(me.workouts_done, me.workouts_needed) / me.workouts_needed) * 100}%` }} />
              </div>
            )}
          </Step>
          <Step number={4} done={lift.done} title="Log a bench press, back squat or deadlift">
            <p>Sets of 1 to 10 reps count.</p>
          </Step>
        </ol>
        <p className="leaderboard-me__note">Until then you&apos;re Unranked and don&apos;t appear on any board.</p>
      </div>
    </section>
  )
}

function Step({ number, done, title, action, children }) {
  return (
    <li className={done ? 'leaderboard-step is-done' : 'leaderboard-step'}>
      <span className="leaderboard-step__marker" aria-hidden="true">
        {done ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        ) : number}
      </span>
      <div className="leaderboard-step__body">
        <div className="leaderboard-step__title">
          <h3>{title}<span className="leaderboard-sr-only">{done ? ' (done)' : ' (not done)'}</span></h3>
          {action}
        </div>
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
