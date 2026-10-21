import ProgressChart from './ProgressChart.jsx'
import {
  NO_VALUE,
  formatChange,
  formatCount,
  formatDate,
  formatPounds,
  formatReps,
  heaviestSet,
  isBodyweight,
  latestE1rm,
  recordLabel,
} from './progressFormat.js'

// One exercise's numbers for the chosen range: its metrics, a trend chart, a table of its workouts (newest first)
// and its new personal records. A bodyweight exercise (every set 0 lb) is tracked in reps instead of weight.
function ExerciseProgress({ exercise, prs }) {
  const bodyweight = isBodyweight(exercise)
  const workouts = [...exercise.points].reverse()
  const metrics = bodyweight
    ? [
        ['Most reps', formatReps(exercise.best_reps)],
        ['Total reps', formatCount(exercise.total_reps)],
        ['Workouts', formatCount(exercise.sessions)],
        ['New PRs', formatCount(exercise.new_prs)],
      ]
    : [
        ['Heaviest weight', formatPounds(exercise.best_weight_lb)],
        ['Latest estimated 1RM', formatPounds(latestE1rm(exercise))],
        ['Strength change', formatChange(exercise.strength_change_lb, exercise.strength_change_pct),
          exercise.strength_change_lb === null ? 'Needs 2 workouts in this range' : null],
        ['Workouts', formatCount(exercise.sessions)],
        ['Volume', formatPounds(exercise.volume_lb)],
        ['New PRs', formatCount(exercise.new_prs)],
      ]

  return (
    <section className="progress-exercise" aria-labelledby="progress-exercise-title">
      <h2 id="progress-exercise-title" className="progress-exercise__title">{exercise.exercise}</h2>
      {bodyweight && <p className="progress-exercise__note">Bodyweight exercise: progress is counted in reps.</p>}

      <dl className="progress-exercise__metrics">
        {metrics.map(([label, value, hint]) => (
          <div key={label} className="progress-exercise__metric">
            <dt>{label}</dt>
            <dd>{value}</dd>
            {hint && <dd className="progress-exercise__hint">{hint}</dd>}
          </div>
        ))}
      </dl>

      <ProgressChart exercise={exercise} />

      <h3 className="progress-exercise__subtitle">Workouts</h3>
      <div className="progress-table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Heaviest set</th>
              <th scope="col">Est. 1RM</th>
              <th scope="col">Volume</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((point, index) => (
              <tr key={`${point.date}-${index}`}>
                <td>{formatDate(point.date)}</td>
                <td>{heaviestSet(point)}</td>
                <td>{point.e1rm_lb === null ? NO_VALUE : formatPounds(point.e1rm_lb)}</td>
                <td>{formatPounds(point.volume_lb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="progress-exercise__subtitle">Personal records</h3>
      {prs.length === 0 ? (
        <p className="progress-exercise__none">No new personal records in this range.</p>
      ) : (
        <ul className="progress-records">
          {prs.map((pr) => (
            <li key={`${pr.date}-${pr.weight_lb}-${pr.reps}`}>
              <span>{formatDate(pr.date)}</span>
              <span className="progress-records__best">{recordLabel(pr)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ExerciseProgress
