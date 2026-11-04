import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import { RESET_TEXT, circleLabel, heroKind, progressLine, rankedFromLine, timeLeft } from './weeklyFormat.js'

const TITLES = {
  ranked: (me) => `You're #${me.rank}`,
  join: () => 'Join the weekly competition',
  practice: () => 'Practice week',
  test: () => 'Weekly consistency',
}

// The top card: your group, your rank (or the Join step, or your practice week), your days against your goal, and
// the time left before the Monday reset (Monday visual brief, page 3, "Your place is easy to find").
// busy is 'join' or 'leave' while that request runs; error is the message for the last one that failed.
export default function WeeklyHero({ data, msLeft, busy, error, onJoin, onLeave }) {
  const { me, target_days: target } = data
  const kind = heroKind(me)

  return (
    <section className={me.goal_reached ? 'weekly-hero is-done' : 'weekly-hero'} aria-labelledby="weekly-hero-title">
      <div className="weekly-hero__top">
        <div className="weekly-hero__main">
          <span className="weekly-hero__eyebrow">{circleLabel(target)}</span>
          <h1 id="weekly-hero-title">{TITLES[kind](me)}</h1>
          {kind === 'ranked' && <p className="weekly-hero__text">Show up. Move up. Start fresh.</p>}
          {kind === 'join' && (
            <p className="weekly-hero__text">
              Compete with people who have the same weekly goal. Others see your first name, last initial and how many
              days you&apos;ve trained this week.
            </p>
          )}
          {kind === 'practice' && (
            <p className="weekly-hero__text">
              {me.ranked_from && `${rankedFromLine(me.ranked_from)} `}
              Until then your days count for you, but you aren&apos;t ranked or listed.
            </p>
          )}
          {kind === 'test' && <p className="weekly-hero__text">Test accounts aren&apos;t shown in the weekly competition.</p>}
        </div>
        <div className="weekly-hero__score">
          <p className="weekly-hero__days">{progressLine(me.progress_days, target, me.progress_percent)}</p>
          {me.goal_reached && (
            <span className="weekly-hero__reached">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>Goal reached
            </span>
          )}
        </div>
      </div>

      <span className="weekly-bar weekly-bar--hero" aria-hidden="true">
        <span style={{ width: `${me.progress_percent}%` }} />
      </span>

      <div className="weekly-hero__foot">
        <p className="weekly-time-left">
          <MobileDashboardIcon name="clock" />
          <span>{timeLeft(msLeft)} · {RESET_TEXT}</span>
        </p>
        {(kind === 'ranked' || kind === 'practice') && (
          <button type="button" className="weekly-text-button" onClick={onLeave} disabled={Boolean(busy)}>
            {busy === 'leave' ? 'Leaving…' : 'Leave'}
          </button>
        )}
      </div>

      {kind === 'join' && (
        <div className="weekly-hero__actions">
          <button type="button" className="weekly-button" onClick={onJoin} disabled={Boolean(busy)}>
            {busy === 'join' ? 'Joining…' : 'Join the weekly competition'}
          </button>
        </div>
      )}
      {error && <p className="weekly-hero__error" role="alert">{error}</p>}
    </section>
  )
}
