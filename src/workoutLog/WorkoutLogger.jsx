import { useState } from 'react'
import MobileDashboardIcon from '../MobileDashboardIcon.jsx'
import CompleteWorkoutButton from './CompleteWorkoutButton.jsx'
import SetLogger from './SetLogger.jsx'
import defaultApi from './workoutLogApi.js'

// Everything story #7 adds to the active workout screen, in one piece: live stats for the session, a
// SetLogger card per exercise, and the Complete Workout button (or a summary once the workout is completed).
// The active workout screen renders it like this:
//
//   <WorkoutLogger sessionId={session.id} exercises={['Bench press', 'Overhead press']}
//                  savedSets={session.sets} completed={session.completed} />
//
// savedSets is every set already saved in the session (any exercise); each exercise gets its own.

function formatPounds(pounds) {
  return `${pounds.toLocaleString('en-US', { maximumFractionDigits: 2 })} lb`
}

// Weight × reps over every set; bodyweight sets (0 lb) add nothing.
function totalVolume(sets) {
  return Math.round(sets.reduce((total, set) => total + set.weight_lb * set.reps, 0) * 100) / 100
}

function StatTile({ icon, label, value, hint, children }) {
  return (
    <article className="wl-stat">
      <span className="wl-stat__icon" aria-hidden="true"><MobileDashboardIcon name={icon} /></span>
      <div className="wl-stat__body">
        <span className="wl-stat__label">{label}</span>
        <strong className="wl-stat__value">{value}</strong>
        {hint && <span className="wl-stat__hint">{hint}</span>}
        {children}
      </div>
    </article>
  )
}

export default function WorkoutLogger({ sessionId, exercises, savedSets = [], completed = false, api = defaultApi, onCompleted }) {
  const [setsByExercise, setSetsByExercise] = useState(() =>
    Object.fromEntries(exercises.map((exercise) => [exercise, savedSets.filter((set) => set.exercise === exercise)])),
  )
  const [unsaved, setUnsaved] = useState({})

  const allSets = Object.values(setsByExercise).flat()
  const started = exercises.filter((exercise) => (setsByExercise[exercise] ?? []).length > 0).length
  const hasUnsaved = Object.values(unsaved).some(Boolean)
  const volume = totalVolume(allSets)

  return (
    <div className="wl-session">
      {completed ? (
        <section className="wl-done" role="status" aria-label="Workout complete">
          <span className="wl-done__icon" aria-hidden="true"><MobileDashboardIcon name="trophy" /></span>
          <div>
            <h2>Workout complete</h2>
            <p>
              {allSets.length === 1 ? '1 set' : `${allSets.length} sets`} across{' '}
              {started === 1 ? '1 exercise' : `${started} exercises`} · {formatPounds(volume)} lifted
            </p>
          </div>
        </section>
      ) : (
        <section className="wl-stats" aria-label="This workout so far">
          <StatTile icon="dumbbell" label="SETS LOGGED" value={allSets.length} hint={allSets.length === 0 ? 'Save your first set below' : 'Keep them coming'} />
          <StatTile icon="progress" label="VOLUME" value={formatPounds(volume)} hint="Weight × reps, all sets" />
          <StatTile icon="calendar" label="EXERCISES" value={`${started} of ${exercises.length}`}>
            <div className="wl-progress" role="progressbar" aria-label="Exercises started" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={started}>
              <span style={{ width: `${exercises.length ? (started / exercises.length) * 100 : 0}%` }} />
            </div>
          </StatTile>
        </section>
      )}

      <div className="wl-workout">
        {exercises.map((exercise, index) => (
          <SetLogger
            key={exercise}
            sessionId={sessionId}
            exercise={exercise}
            number={index + 1}
            initialSets={savedSets.filter((set) => set.exercise === exercise)}
            locked={completed}
            api={api}
            onSetsChange={(sets) => setSetsByExercise((current) => ({ ...current, [exercise]: sets }))}
            onUnsavedChange={(value) => setUnsaved((current) => ({ ...current, [exercise]: value }))}
          />
        ))}
        {!completed && (
          <CompleteWorkoutButton
            sessionId={sessionId}
            setCount={allSets.length}
            hasUnsaved={hasUnsaved}
            api={api}
            onCompleted={onCompleted}
          />
        )}
      </div>
    </div>
  )
}
