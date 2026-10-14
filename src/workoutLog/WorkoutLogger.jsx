import { useState } from 'react'
import CompleteWorkoutButton from './CompleteWorkoutButton.jsx'
import SetLogger from './SetLogger.jsx'
import defaultApi from './workoutLogApi.js'

// Everything story #7 adds to the active workout screen, in one piece: a SetLogger per exercise and the
// Complete Workout button, wired together so the button knows how many sets are saved and whether anything
// is still unsaved. The active workout screen renders it like this:
//
//   <WorkoutLogger sessionId={session.id} exercises={['Bench press', 'Overhead press']}
//                  savedSets={flattenedSessionSets} completed={Boolean(session.completed_at)} />
//
// savedSets is every set already saved in the session (any exercise); each exercise gets its own.

export default function WorkoutLogger({ sessionId, exercises, savedSets = [], completed = false, api = defaultApi, onCompleted, onSessionEnded }) {
  const [counts, setCounts] = useState(() => countByExercise(savedSets))
  const [unsaved, setUnsaved] = useState({})

  const setCount = Object.values(counts).reduce((total, count) => total + count, 0)
  const hasUnsaved = Object.values(unsaved).some(Boolean)

  return (
    <div className="wl-workout">
      {exercises.map((exercise) => (
        <SetLogger
          key={exercise}
          sessionId={sessionId}
          exercise={exercise}
          initialSets={savedSets.filter((set) => set.exercise === exercise)}
          locked={completed}
          api={api}
          onSetsChange={(sets) => setCounts((current) => ({ ...current, [exercise]: sets.length }))}
          onUnsavedChange={(value) => setUnsaved((current) => ({ ...current, [exercise]: value }))}
          onSessionEnded={onSessionEnded}
        />
      ))}
      <CompleteWorkoutButton
        sessionId={sessionId}
        setCount={setCount}
        hasUnsaved={hasUnsaved}
        completed={completed}
        api={api}
        onCompleted={onCompleted}
        onSessionEnded={onSessionEnded}
      />
    </div>
  )
}

function countByExercise(sets) {
  return sets.reduce((counts, set) => ({ ...counts, [set.exercise]: (counts[set.exercise] ?? 0) + 1 }), {})
}
