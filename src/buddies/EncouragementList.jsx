import { formatSentAt } from './buddiesFormat.js'

// "Encouragements for you": the messages sent to the signed-in member, newest first (the 20 newest #71 returns).
// The text is rendered as plain text, never as HTML.
function EncouragementList({ encouragements }) {
  return (
    <section className="buddies-card" aria-labelledby="buddies-inbox-title">
      <h2 className="buddies-eyebrow" id="buddies-inbox-title">Encouragements for you</h2>
      {encouragements.length === 0 ? (
        <p className="buddies-empty-inbox">No encouragements yet. When someone in your group encourages you, it appears here.</p>
      ) : (
        <ul className="buddies-inbox">
          {encouragements.map((item) => (
            <li key={item.id} className="buddies-message">
              <div className="buddies-message__head">
                <span className="buddies-message-from">{item.from}</span>
                <time dateTime={item.sent_at}>{formatSentAt(item.sent_at)}</time>
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
