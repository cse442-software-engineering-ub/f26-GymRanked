import { Link } from 'react-router-dom'
import './leaderboard.css'

// Pieces both Rankings boards show in the Buddies view (story #131, card 139). Only names and counts from the API;
// other members' scores stay in the rows, and the unranked list never shows a number.

// "Northside Crew" / "13 members · Group ranks for Overall" / "View group ›"
export function GroupHeader({ name, line }) {
  return (
    <div className="ranking-group">
      <div className="ranking-group__text">
        <h2 className="ranking-group__name">{name}</h2>
        <p className="ranking-group__line">{line}</p>
      </div>
      <Link className="ranking-group__link" to="/buddies">View group ›</Link>
    </div>
  )
}

// Group members with no rank on this board: names only, A to Z as the API sends them.
export function UnrankedList({ title, names }) {
  if (names.length === 0) return null
  return (
    <section className="ranking-unranked" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {names.map((person, index) => <li key={`${person.name}-${index}`}>{person.name}</li>)}
      </ul>
    </section>
  )
}

// Buddies chosen by someone who isn't in a group.
export function NoGroup() {
  return (
    <div className="ranking-no-group">
      <h2>You haven&apos;t joined a buddy group yet</h2>
      <p>Create a group or enter an invite code to compare standings with your workout buddies.</p>
      <Link className="ranking-group__link" to="/buddies">Join or create a group ›</Link>
    </div>
  )
}
