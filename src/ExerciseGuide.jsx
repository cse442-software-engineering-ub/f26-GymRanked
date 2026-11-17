import { useEffect, useState, useRef } from 'react'
import SidePanel from './components/SidePanel.jsx'

const API_URL = `${import.meta.env.BASE_URL}api/exercise_guide.php`

// Guides fetched so far, by exercise name, so coming back to an exercise shows its guide straight away. Cleared
// on a page reload, which also keeps the signed media links from outliving their ~1 day lifetime.
const guides = new Map()

// A "How to perform it" button that opens a panel with a looping demo clip, the steps and the form tips, from
// WorkoutX through api/exercise_guide.php. The panel is a SidePanel on the left: docked beside the exercise column on
// wide screens, so the set can still be timed and logged, and a centred modal on narrow ones. The button always
// shows, beside See alternatives. The guide is fetched up front; while it loads, or when the exercise has none (404)
// or it can't load, the panel says so instead, so the timer and set logging are never blocked by it. To make the
// panel feel instant, the poster is fetched as soon as the guide arrives and the clip as soon as the pointer or
// keyboard reaches the button (not for every exercise up front: WorkoutX counts media views against its quota).
function ExerciseGuide({ name }) {
  const [guide, setGuide] = useState(() => guides.get(name) ?? null)
  const [loading, setLoading] = useState(() => !guides.has(name))
  const [open, setOpen] = useState(false)
  const [warm, setWarm] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setOpen(false)
    setWarm(false)
    if (guides.has(name)) {
      setGuide(guides.get(name))
      setLoading(false)
      return undefined
    }
    setGuide(null)
    setLoading(true)
    fetch(`${API_URL}?name=${encodeURIComponent(name)}`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!body?.video) return
        guides.set(name, body)
        if (!cancelled) setGuide(body)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [name])

  useEffect(() => {
    if (guide?.poster) new Image().src = guide.poster
  }, [guide])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="wl-button exercise-tool"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={() => setWarm(true)}
        onFocus={() => setWarm(true)}
        onTouchStart={() => setWarm(true)}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5l5 3.5-5 3.5z" />
        </svg>
        How to perform it
      </button>
      {guide && warm && !open && <video src={guide.video} preload="auto" muted hidden aria-hidden="true" />}
      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title={`How to perform ${name}`}
        returnFocusRef={buttonRef}
        busy={!guide && loading}
        footer={guide ? 'Demo clip, steps and tips from WorkoutX.' : null}
      >
        {!guide && loading && (
          <p className="side-panel__status">
            <span className="side-panel__spinner" aria-hidden="true" />
            Loading the guide…
          </p>
        )}
        {!guide && !loading && (
          <div className="side-panel__message">
            <h3>No guide yet</h3>
            <p>No guide is available for this exercise right now.</p>
          </div>
        )}
        {guide && (
          <>
            <video
              className="exercise-guide__video"
              src={guide.video}
              poster={guide.poster ?? undefined}
              preload="auto"
              autoPlay
              loop
              muted
              playsInline
              aria-label={`${guide.name} demonstration`}
            />
            {guide.instructions.length > 0 && (
              <section className="exercise-guide__section" aria-labelledby="exercise-guide-steps">
                <h3 id="exercise-guide-steps">Steps</h3>
                <ol className="exercise-guide__steps">
                  {guide.instructions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            )}
            {guide.tips.length > 0 && (
              <section className="exercise-guide__section" aria-labelledby="exercise-guide-tips">
                <h3 id="exercise-guide-tips">Form tips</h3>
                <ul className="exercise-guide__tips">
                  {guide.tips.map((tip) => (
                    <li key={tip}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </SidePanel>
    </>
  )
}

export default ExerciseGuide
