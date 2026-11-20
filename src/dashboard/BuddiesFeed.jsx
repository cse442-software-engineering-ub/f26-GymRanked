import { Link } from 'react-router-dom'
import { formatSentAt, initialsOf } from '../buddies/buddiesFormat.js'

// "From your buddies": the newest encouragement sent to you (api/buddy_group.php, newest first).
// state is {status: 'loading'|'ready'|'error', data} with data the buddies group view, kept up to date while the
// Dashboard is open by useBuddyGroupPoll; fresh lists the ids that arrived meanwhile ("New"), and announcement is read
// out to screen readers.
export default function BuddiesFeed({ state, fresh = [], announcement = '', onRetry }) {
  const { status, data } = state
  const latest = data?.encouragements?.[0]
  return (
    <section className="home-buddies" aria-labelledby="home-buddies-title">
      <header className="home-section-heading">
        <h2 id="home-buddies-title">From your buddies</h2>
        <Link to="/buddies">Open Buddies <span aria-hidden="true">↗</span></Link>
      </header>
      {status === 'loading' && <p className="home-muted" role="status">Loading messages from your buddies…</p>}
      {status === 'error' && (
        <p className="home-error" role="alert">
          Couldn't load your workout buddies. <button type="button" onClick={onRetry}>Try again</button>
        </p>
      )}
      {status === 'ready' && !data.group && (
        <p className="home-muted">You're not in a buddies group yet. <Link to="/buddies">Create or join one</Link> to cheer each other on.</p>
      )}
      {status === 'ready' && data.group && !latest && (
        <p className="home-muted">No encouragement yet. Send one to someone in {data.group.name} from the Buddies page.</p>
      )}
      {status === 'ready' && data.group && latest && (
        <figure key={latest.id} className={fresh.includes(latest.id) ? 'home-buddies__message is-new' : 'home-buddies__message'}>
          <figcaption>
            <span className="home-buddies__avatar" aria-hidden="true">{initialsOf(latest.from)}</span>
            <strong>{latest.from}</strong>
            <span className="home-buddies__where">{data.group.name} · <time dateTime={latest.sent_at}>{formatSentAt(latest.sent_at)}</time></span>
            {fresh.includes(latest.id) && <span className="home-buddies__new">New</span>}
          </figcaption>
          <blockquote>“{latest.message}”</blockquote>
        </figure>
      )}
      <p className="home-sr-only" role="status" aria-live="polite">{announcement}</p>
    </section>
  )
}
