import { useMemo, useState } from 'react'
import WorkoutLogger from './WorkoutLogger.jsx'
import { createMockWorkoutLogApi } from './mockWorkoutLogApi.js'
import { summaryPath } from './setLog.js'

// Test page at #/dev/workout-log, used by the story #7 frontend task tests. App.jsx only allows it on aptitude
// and on your own computer, never on cattle (production). Shows the set logging pieces on their own, backed by
// the in-memory stand-in instead of the server, so they can be tested before the active workout screen and the
// backend endpoints exist.

const SESSION_ID = 1
const EXERCISES = ['Bench press', 'Overhead press', 'Push-up']

const SWITCHES = [
  ['offline', 'Simulate being offline'],
  ['loggedOut', 'Simulate a logged-out session'],
  ['serverError', 'Simulate a server error (500)'],
]

export default function WorkoutLogPreview() {
  const [run, setRun] = useState(0)
  const api = useMemo(() => createMockWorkoutLogApi(), [run])
  const [switches, setSwitches] = useState({ offline: false, loggedOut: false, serverError: false })
  const [completedAt, setCompletedAt] = useState(null)

  function toggle(name) {
    const value = !switches[name]
    api.switches[name] = value
    setSwitches((current) => ({ ...current, [name]: value }))
  }

  function startOver() {
    setSwitches({ offline: false, loggedOut: false, serverError: false })
    setCompletedAt(null)
    setRun((value) => value + 1)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gr-bg-page)', color: 'var(--gr-text)', fontFamily: 'var(--gr-font)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gr-warning-text)' }}>TEST PAGE · in-memory data, nothing is saved</p>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 500 }}>Workout logging (story #7)</h1>
        </header>

        <fieldset style={{ border: '1px solid var(--gr-border-strong)', borderRadius: 'var(--gr-radius-card)', padding: 12, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          <legend style={{ fontSize: 13, color: 'var(--gr-text-soft)', padding: '0 4px' }}>Test switches</legend>
          {SWITCHES.map(([name, label]) => (
            <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, fontSize: 14 }}>
              <input type="checkbox" checked={switches[name]} onChange={() => toggle(name)} />
              {label}
            </label>
          ))}
          <button type="button" className="wl-button" onClick={startOver}>Start over</button>
        </fieldset>

        {completedAt && (
          <p className="wl-message wl-message--success" role="status">
            Completed at {new Date(completedAt).toLocaleTimeString()}. In the app this opens #{summaryPath(SESSION_ID)}.
          </p>
        )}

        <WorkoutLogger
          key={run}
          sessionId={SESSION_ID}
          exercises={EXERCISES}
          completed={completedAt !== null}
          api={api}
          onCompleted={(result) => setCompletedAt(result.completed_at ?? new Date().toISOString())}
        />
      </div>
    </main>
  )
}
