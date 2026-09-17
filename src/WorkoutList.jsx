import { useEffect, useState } from 'react'

const API_URL = `${import.meta.env.BASE_URL}api/workouts.php`

function WorkoutList() {
  const [workouts, setWorkouts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setWorkouts)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="status">Error loading workouts: {error}</p>
  if (workouts === null) return <p className="status">Loading workouts...</p>
  if (workouts.length === 0) return <p className="status">No workouts found</p>

  return (
    <ul className="workout-list">
      {workouts.map((w) => (
        <li key={w.id} className="workout-card">
          {w.exercise} — {w.reps} reps @ {w.weight} lbs
        </li>
      ))}
    </ul>
  )
}

export default WorkoutList
