import { useEffect, useState, useRef } from 'react'
import SidePanel from './components/SidePanel.jsx'
import GuideVideo from './GuideVideo.jsx'
import GuideFallback from './GuideFallback.jsx'
import { mockGuide } from './devGuideMock.js'
import { loadPlaceholderSteps, placeholderSteps } from './guideFallbackPlaceholder.js'

const API_URL = `${import.meta.env.BASE_URL}api/exercise_guide.php`

// Guides fetched so far, by exercise name, so coming back to an exercise shows its guide straight away. Cleared
// on a page reload, which also keeps the signed media links from outliving their ~1 day lifetime.
const guides = new Map()

// A "How to perform it" button that opens a panel with a looping demo clip, the steps and the form tips, from
// WorkoutX through api/exercise_guide.php. The panel is a SidePanel: a pop-up centred over the page on every screen.
// The page behind stays mounted, so the set timer keeps running while it is open. The button always
// shows, beside See alternatives. The guide is fetched up front; while it loads the panel says so, and when the
// exercise has none (404), it can't load, or its clip errors or stalls, the panel shows the pictures and steps
// (GuideFallback) instead, so the timer and set logging are never blocked by it. To make the
// panel feel instant, the poster is fetched as soon as the guide arrives and the clip as soon as the pointer or
// keyboard reaches the button (not for every exercise up front: WorkoutX counts media views against its quota).
function ExerciseGuide({ name }) {
  const [guide, setGuide] = useState(() => guides.get(name) ?? null)
  const [loading, setLoading] = useState(() => !guides.has(name))
  const [open, setOpen] = useState(false)
  const [warm, setWarm] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  // Bumped when the panel opens with no guide, so a guide that failed to load (offline, 503) is asked for again.
  const [attempt, setAttempt] = useState(0)
  const buttonRef = useRef(null)

  useEffect(() => {
    setOpen(false)
    setWarm(false)
    loadPlaceholderSteps(name) // TEMPORARY until #92's backup steps exist (see guideFallbackPlaceholder.js).
  }, [name])

  useEffect(() => {
    let cancelled = false
    // Local `npm run dev` only (see devGuideMock.js); always null in a production build.
    const mock = mockGuide(name)
    if (mock) {
      setGuide(mock.video ? mock : null)
      setLoading(false)
      return undefined
    }
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
  }, [name, attempt])

  function toggle() {
    if (!open) {
      setVideoFailed(false)
      if (!guide && !loading) setAttempt((n) => n + 1)
    }
    setOpen(!open)
  }

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
        onClick={toggle}
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
        title={`How to perform ${name}`}
        returnFocusRef={buttonRef}
        busy={!guide && loading}
        footer={guide ? (videoFailed ? 'Steps and tips from WorkoutX.' : 'Demo clip, steps and tips from WorkoutX.') : null}
      >
        {!guide && loading && (
          <p className="side-panel__status">
            <span className="side-panel__spinner" aria-hidden="true" />
            Loading the guide…
          </p>
        )}
        {/* No guide (none listed, offline, or the server can't reach WorkoutX) or the clip failed: pictures and steps.
            TEMPORARY: placeholderSteps is the stand-in for #92's backup steps. */}
        {((!guide && !loading) || (guide && videoFailed)) && <GuideFallback key={name} steps={placeholderSteps(name)} />}
        {guide && (
          <>
            {!videoFailed && (
              <GuideVideo src={guide.video} poster={guide.poster} name={guide.name} onFail={() => setVideoFailed(true)} />
            )}
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
