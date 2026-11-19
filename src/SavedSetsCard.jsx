import { formatSet } from './workoutLog/setLog.js'

const formatVolume = (value) => `${Math.round(value).toLocaleString()} lb`

export default function SavedSetsCard({ exercises, savedSets, totalVolume }) {
  const totalSets = exercises.reduce((count, { name }) => count + (savedSets[name]?.length ?? 0), 0)

  return (
    <section className="active-saved-card" aria-labelledby="active-saved-title">
      <header className="active-saved-card__heading">
        <h2 id="active-saved-title">Saved sets</h2>
        <span>{totalSets} {totalSets === 1 ? 'set' : 'sets'}</span>
      </header>
      <div className="active-saved-card__list" tabIndex={0} aria-label="Saved sets by exercise">
        {exercises.map(({ name }) => {
          const sets = savedSets[name] ?? []
          const exerciseVolume = sets.reduce((total, set) => total + Number(set.weight_lb) * Number(set.reps), 0)
          return (
            <div className="active-saved-card__exercise" key={name}>
              <div className="active-saved-card__exercise-heading"><h3>{name}</h3><span>{sets.length} {sets.length === 1 ? 'set' : 'sets'}</span></div>
              {sets.length ? (
                <ol>{sets.map((set) => <li key={set.id}><span>Set {set.set_number}</span><strong>{formatSet(set)}</strong></li>)}</ol>
              ) : <p>No sets saved yet</p>}
              <p className="active-saved-card__exercise-volume">Exercise volume: {formatVolume(exerciseVolume)}</p>
            </div>
          )
        })}
      </div>
      <footer className="active-saved-card__total">Total volume <strong>{formatVolume(totalVolume)}</strong></footer>
    </section>
  )
}
