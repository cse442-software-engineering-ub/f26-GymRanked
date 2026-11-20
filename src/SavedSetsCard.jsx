import { formatSet } from './workoutLog/setLog.js'

const formatVolume = (value) => `${Math.round(value).toLocaleString()} lb`

export default function SavedSetsCard({ exercise, sets, totalVolume }) {
  const exerciseVolume = sets.reduce((total, set) => total + Number(set.weight_lb) * Number(set.reps), 0)

  return (
    <section className="active-saved-card" aria-labelledby="active-saved-title">
      <header className="active-saved-card__heading">
        <h2 id="active-saved-title">Saved sets</h2>
        <span>{sets.length} {sets.length === 1 ? 'set' : 'sets'}</span>
      </header>
      <div key={exercise} className="active-saved-card__list" tabIndex={0} aria-label={`Saved sets for ${exercise}`}>
        <h3>{exercise}</h3>
        {sets.length ? (
          <ol>{sets.map((set) => <li key={set.id}><span>Set {set.set_number}</span><strong>{formatSet(set)}</strong></li>)}</ol>
        ) : <p>No sets saved yet</p>}
      </div>
      <footer className="active-saved-card__totals">
        <span>Exercise volume <strong>{formatVolume(exerciseVolume)}</strong></span>
        <span>Total volume <strong>{formatVolume(totalVolume)}</strong></span>
      </footer>
    </section>
  )
}
