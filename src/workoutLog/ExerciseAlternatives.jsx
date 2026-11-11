import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cachedAlternatives, fetchAlternatives } from './exerciseAlternatives.js'
import {
  NO_MATCH_TITLE, countText, equipmentTag, exerciseLine, introText, levelTag, muscleText, noMatchText, notCoveredText,
  notCoveredTitle, reasonText, setupLine,
} from './exerciseAlternativesFormat.js'
import './exerciseAlternatives.css'

const FOCUSABLE = 'button:not(:disabled), a[href], [tabindex="0"]'

// A "See alternatives" button on the exercise page and the dialog it opens (task #82, story #80): exercises for the
// same movement that fit the user's equipment and experience, from api/exercise_alternatives.php. Nothing is fetched
// until the button is pressed, and the dialog only reads: the plan, the set in progress and saved sets stay as they
// are. The dialog is rendered on <body> so the page behind it can be made inert while it is open.
function ExerciseAlternatives({ exercise }) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState(null) // null while loading
  const buttonRef = useRef(null)
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  // Bumped by every request and every close, so an answer that arrives late is ignored.
  const request = useRef(0)

  function load() {
    const id = ++request.current
    const cached = cachedAlternatives(exercise)
    setAnswer(cached)
    if (cached) return
    fetchAlternatives(exercise).then((result) => {
      if (request.current === id) setAnswer(result)
    })
  }

  function openDialog() {
    setOpen(true)
    load()
  }

  function close() {
    request.current++
    setOpen(false)
  }

  function tryAgain() {
    titleRef.current?.focus()
    load()
  }

  useEffect(() => close, [exercise])

  useEffect(() => {
    if (!open) return undefined
    const button = buttonRef.current
    const page = document.getElementById('root')
    if (page) page.inert = true
    titleRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const inside = focusable.includes(document.activeElement)
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (page) page.inert = false
      button?.focus()
    }
  }, [open])

  const muscles = muscleText(exercise)
  const state = answer?.state ?? 'loading'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="wl-button exercise-guide__button"
        aria-haspopup="dialog"
        onClick={openDialog}
      >
        See alternatives
      </button>
      {open && createPortal(
        <div className="modal-backdrop" onClick={close}>
          <div
            ref={dialogRef}
            className="alternatives-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alternatives-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alternatives-modal__header">
              <h2 id="alternatives-title" ref={titleRef} tabIndex={-1}>Alternatives to {exercise}</h2>
              <button type="button" className="wl-button wl-button--quiet" onClick={close}>
                Close
              </button>
            </div>
            <div className="alternatives-modal__body" aria-busy={state === 'loading'}>
              <div className="alternatives-current">
                <span className="alternatives-current__eyebrow">You&apos;re doing</span>
                <strong>{exercise}</strong>
                {answer?.level && answer?.equipment && <span>{exerciseLine(answer.level, answer.equipment)}</span>}
                {muscles && <span>{muscles}</span>}
              </div>
              {answer?.you && <p className="alternatives-modal__setup">{setupLine(answer.you)}</p>}

              {state === 'loading' && <p className="alternatives-modal__status">Finding alternatives to {exercise}...</p>}
              {state === 'alternatives' && (
                <>
                  <p className="alternatives-modal__intro">{introText(answer.movement)}</p>
                  <p className="alternatives-modal__count">{countText(answer.alternatives.length)}</p>
                  <ol className="alternatives-list" tabIndex={0} aria-label="Alternatives">
                    {answer.alternatives.map((alternative) => (
                      <li key={alternative.name} className="alternatives-item">
                        <h3>{alternative.name}</h3>
                        <div className="alternatives-item__tags">
                          <span className={`level-badge level-badge--${alternative.level}`}>{levelTag(alternative.level)}</span>
                          <span className="alternatives-item__equipment">{equipmentTag(alternative.equipment)}</span>
                        </div>
                        {muscleText(alternative.name) && <p className="alternatives-item__muscles">{muscleText(alternative.name)}</p>}
                        <p className="alternatives-item__reason">
                          {reasonText({ source: exercise, sourceLevel: answer.level, alternative, you: answer.you })}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {state === 'noMatch' && (
                <div className="alternatives-modal__message">
                  <h3>{NO_MATCH_TITLE}</h3>
                  <p>{noMatchText({ exercise, movement: answer.movement, you: answer.you })}</p>
                  <Link to="/profile/training-preferences">Update training preferences ›</Link>
                </div>
              )}
              {state === 'notCovered' && (
                <div className="alternatives-modal__message">
                  <h3>{notCoveredTitle(exercise)}</h3>
                  <p>{notCoveredText(exercise)}</p>
                </div>
              )}
              {state === 'failed' && (
                <div className="alternatives-modal__message">
                  <p className="wl-message wl-message--error" role="alert">
                    Couldn&apos;t load alternatives. Check your connection and try again.
                  </p>
                  <button type="button" className="wl-button" onClick={tryAgain}>
                    Try again
                  </button>
                </div>
              )}
              {state === 'loggedOut' && (
                <div className="alternatives-modal__message">
                  <p>Your login has expired. Log in again to see alternatives.</p>
                  <Link to="/login">Log in</Link>
                </div>
              )}

              <p className="alternatives-modal__footer">
                Suggestions only. Your plan, saved sets and workout history stay the same.
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default ExerciseAlternatives
