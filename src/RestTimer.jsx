import { useEffect, useState } from 'react'

const REST_STEP_SECONDS = 15

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

// Countdown shown between sets. The parent owns the state so it can be remembered across page loads:
//   endsAt    when the rest ends (a timestamp in ms)
//   total     the rest's length in seconds, for the progress bar
//   onAdjust  called with +15 or -15 seconds
//   onDone    called once when the rest runs out or is skipped
function RestTimer({ endsAt, total, onAdjust, onDone }) {
  const [now, setNow] = useState(() => Date.now())
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000))

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (left === 0) onDone?.()
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="rest-timer" aria-label="Rest timer">
      <p className="rest-timer__label">Rest</p>
      <span className="rest-timer__time" role="timer" aria-live="off">{formatClock(left)}</span>
      <div className="rest-timer__bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
      </div>
      <div className="rest-timer__controls">
        <button type="button" className="wl-button wl-button--quiet" onClick={() => onAdjust(-REST_STEP_SECONDS)}>
          −{REST_STEP_SECONDS}s
        </button>
        <button type="button" className="wl-button wl-button--quiet" onClick={() => onAdjust(REST_STEP_SECONDS)}>
          +{REST_STEP_SECONDS}s
        </button>
        <button type="button" className="wl-button wl-button--primary" onClick={() => onDone?.()}>
          Skip rest
        </button>
      </div>
    </section>
  )
}

export default RestTimer
