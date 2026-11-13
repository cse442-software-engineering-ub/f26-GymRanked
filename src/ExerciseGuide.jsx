import { useEffect, useRef, useState } from 'react'

const API_URL = `${import.meta.env.BASE_URL}api/exercise_guide.php`

// Guides fetched so far, by exercise name, so coming back to an exercise shows its guide straight away. Cleared
// on a page reload, which also keeps the signed media links from outliving their ~1 day lifetime.
const guides = new Map()

// A "How to perform it" button that opens a pop-up with a looping demo clip, the steps and the form tips, from
// WorkoutX through api/exercise_guide.php. The button always shows, beside See alternatives. The guide is fetched
// up front; while it loads, or when the exercise has none (404) or it can't load, the pop-up says so instead, so
// the timer and set logging are never blocked by it. To make the pop-up feel instant, the poster is fetched as soon as the
// guide arrives and the clip as soon as the pointer or keyboard reaches the button (not for every exercise up
// front: WorkoutX counts media views against its quota).
function ExerciseGuide({ name }) {
  const [guide, setGuide] = useState(() => guides.get(name) ?? null)
  const [loading, setLoading] = useState(() => !guides.has(name))
  const [open, setOpen] = useState(false)
  const [warm, setWarm] = useState(false)
  const buttonRef = useRef(null)
  const closeRef = useRef(null)

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

  useEffect(() => {
    if (!open) return undefined
    const button = buttonRef.current
    closeRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      button?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="wl-button exercise-guide__button"
        aria-haspopup="dialog"
        onPointerEnter={() => setWarm(true)}
        onFocus={() => setWarm(true)}
        onTouchStart={() => setWarm(true)}
        onClick={() => setOpen(true)}
      >
        How to perform it
      </button>
      {guide && warm && !open && <video src={guide.video} preload="auto" muted hidden aria-hidden="true" />}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="exercise-guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="exercise-guide-modal__header">
              <h2 id="exercise-guide-title">{guide?.name ?? name}</h2>
              <button
                ref={closeRef}
                type="button"
                className="wl-button wl-button--quiet"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {!guide ? (
              <p className="exercise-guide-modal__message">
                {loading ? 'Loading the guide…' : 'No guide is available for this exercise right now.'}
              </p>
            ) : (
              <>
                <video
                  className="exercise-guide-modal__video"
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
                  <>
                    <h3>Steps</h3>
                    <ol>
                      {guide.instructions.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </>
                )}
                {guide.tips.length > 0 && (
                  <>
                    <h3>Form tips</h3>
                    <ul>
                      {guide.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ExerciseGuide
