import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import NavBar from '../NavBar.jsx'
import WorkoutLogger from './WorkoutLogger.jsx'
import { createMockWorkoutLogApi } from './mockWorkoutLogApi.js'

// Today's workout page for story #7 at #/dev/workout-log, laid out like the rest of the signed-in site
// (nav bar, page header, cards). Until the real active workout screen and backend exist it shows a fixed
// session (Push day of Push Pull Legs) and saves to an in-memory stand-in, so the task tests can run on
// aptitude. App.jsx only allows it on aptitude and on your own computer, never on cattle (production).
//
// The task tests trigger failures from the address instead of from anything on screen:
//   #/dev/workout-log?simulate=offline        every save and Complete fails as if the connection dropped
//   #/dev/workout-log?simulate=logged-out     the server says the session ended
//   #/dev/workout-log?simulate=server-error   the server returns 500
// Removing ?simulate=… from the address (and pressing Enter) turns it off without reloading the page.

const SESSION = {
  id: 1,
  plan: 'Push Pull Legs',
  name: 'Push',
  focus: 'Chest, shoulders, triceps',
  minutes: 45,
  exercises: ['Bench press', 'Overhead press', 'Triceps pushdown'],
}

const SIMULATIONS = { offline: 'offline', 'logged-out': 'loggedOut', 'server-error': 'serverError' }

export default function WorkoutLogPreview() {
  const api = useMemo(() => createMockWorkoutLogApi(), [])
  const [searchParams] = useSearchParams()
  const simulate = searchParams.get('simulate')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    for (const name of Object.values(SIMULATIONS)) api.switches[name] = false
    if (SIMULATIONS[simulate]) api.switches[SIMULATIONS[simulate]] = true
  }, [api, simulate])

  return (
    <div className="dashboard-page">
      <NavBar current="Workouts" />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-header__eyebrow">TODAY'S WORKOUT</span>
            <h1>{SESSION.name}</h1>
            <p>{SESSION.plan} · {SESSION.focus} · About {SESSION.minutes} min</p>
          </div>
        </header>
        <WorkoutLogger
          sessionId={SESSION.id}
          exercises={SESSION.exercises}
          completed={completed}
          api={api}
          onCompleted={() => setCompleted(true)}
        />
      </main>
    </div>
  )
}
