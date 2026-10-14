import { formatWeight, formatWorkoutDate, sizeLabel } from './historyFormat.js'

// One finished workout in the history list: a row that opens to show a Set / Reps / Weight table per exercise.
// `detail` is {status: 'loading' | 'error' | 'ready', session} once the row has been opened.
function WorkoutHistoryItem({ workout, open, detail, onToggle, onRetry }) {
  const panelId = `workout-${workout.id}-sets`
  const date = formatWorkoutDate(workout.completed_at)
  const exercises = detail?.status === 'ready' ? detail.session.exercises.filter((exercise) => exercise.sets.length > 0) : []

  return (
    <li className={open ? 'history-item history-item--open' : 'history-item'}>
      <button type="button" className="history-item__toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="history-item__title">
          <span className="history-item__name">{workout.name}</span>
          <span className="history-item__date">{date}</span>
        </span>
        <span className="history-item__size">{sizeLabel(workout.exercise_count, workout.set_count)}</span>
        <svg className="history-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="history-item__details" aria-busy={detail?.status === 'loading'}>
          {detail?.status === 'loading' && <p className="history-item__status">Loading workout...</p>}
          {detail?.status === 'error' && (
            <div className="history-error history-error--inline" role="alert">
              <p>Couldn&apos;t load this workout. Try again.</p>
              <button type="button" onClick={onRetry}>Try again</button>
            </div>
          )}
          {detail?.status === 'ready' && exercises.length === 0 && (
            <p className="history-item__status">No sets were logged in this workout.</p>
          )}
          {exercises.length > 0 && (
            <div className="history-item__exercises">
              {exercises.map((exercise) => (
                <table key={exercise.name} className="history-sets">
                  <caption>{exercise.name}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Set</th>
                      <th scope="col">Reps</th>
                      <th scope="col">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set) => (
                      <tr key={set.id}>
                        <td>{set.set_number}</td>
                        <td>{set.reps}</td>
                        <td>{formatWeight(set.weight_lb)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default WorkoutHistoryItem
