import { formatSentAt, initialsOf } from './buddiesFormat.js'

// "Encouragements for you": the messages sent to the signed-in member, newest first (the 20 newest #71 returns).
// The text is rendered as plain text, never as HTML. Messages that arrived while the page was open (fresh, from
// useBuddyGroupPoll) carry a "New" mark.
function EncouragementList({ encouragements, fresh = [] }) {
  return (
    <section className="buddies-card" aria-labelledby="buddies-inbox-title">
      <h2 className="buddies-section-title" id="buddies-inbox-title">Encouragements for you</h2>
      {encouragements.length === 0 ? (
        <p className="buddies-empty-inbox">No encouragements yet. When someone in your group encourages you, it appears here.</p>
      ) : (
        <ul className="buddies-inbox">
          {encouragements.map((item) => (
            <li key={item.id} className={fresh.includes(item.id) ? 'buddies-message is-new' : 'buddies-message'}>
              <div className="buddies-message__head">
                <span className="buddies-message__avatar" aria-hidden="true">{initialsOf(item.from)}</span>
                <span className="buddies-message-from">{item.from}</span>
                <time dateTime={item.sent_at}>{formatSentAt(item.sent_at)}</time>
                {fresh.includes(item.id) && <span className="buddies-pill buddies-pill--new">New</span>}
              </div>
              <p className="buddies-message-text">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default EncouragementList
