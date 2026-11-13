import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SidePanel from '../components/SidePanel.jsx'
import { cachedAlternatives, fetchAlternatives } from './exerciseAlternatives.js'
import {
  NO_MATCH_TITLE, countText, equipmentTag, exerciseLine, introText, levelTag, muscleText, noMatchText, notCoveredText,
  notCoveredTitle, reasonText, setupLine,
} from './exerciseAlternativesFormat.js'
import './exerciseAlternatives.css'

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

// A "See alternatives" button on the exercise page and the panel it opens (task #82, story #80): exercises for the
// same movement that fit the user's equipment and experience, from api/exercise_alternatives.php. Nothing is fetched
// until the button is pressed. Each alternative has "Switch", which calls onSwitch(name) (the page switches the
// exercise in today's workout through api/swap_exercise.php and rejects with an Error on failure); there is none
// when `locked` (the exercise already has saved sets) or for an exercise already in the workout (`workoutExercises`).
// The plan and history are never changed. The panel is a SidePanel on the right: docked beside the exercise column
// on wide screens, so the set in progress can still be logged, and a centred modal on narrow ones.
function ExerciseAlternatives({ exercise, workoutExercises = [], locked = false, onSwitch }) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState(null) // null while loading
  const [switching, setSwitching] = useState(null) // the alternative being switched to
  const [switchError, setSwitchError] = useState('')
  const buttonRef = useRef(null)
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

  function openPanel() {
    setOpen(true)
    load()
  }

  function close() {
    request.current++
    setOpen(false)
    setSwitching(null)
    setSwitchError('')
  }

  // On success the page shows the replacement, and the change of `exercise` closes the panel.
  async function switchTo(name) {
    if (switching) return
    setSwitching(name)
    setSwitchError('')
    try {
      await onSwitch(name)
    } catch (err) {
      setSwitchError(err.message)
      setSwitching(null)
    }
  }

  const inWorkout = (name) => workoutExercises.some((other) => other.toLowerCase() === name.toLowerCase())

  function tryAgain() {
    titleRef.current?.focus()
    load()
  }

  useEffect(() => close, [exercise])

  const muscles = muscleText(exercise)
  const state = answer?.state ?? 'loading'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="wl-button exercise-tool"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={open ? close : openPanel}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" />
        </svg>
        See alternatives
      </button>
      <SidePanel
        open={open}
        onClose={close}
        side="right"
        title={`Alternatives to ${exercise}`}
        titleRef={titleRef}
        returnFocusRef={buttonRef}
        busy={state === 'loading'}
        footer="Switching changes today's workout only. Your plan, saved sets and workout history stay the same."
      >
        <section className="alternatives-current" aria-label="Current exercise">
          <div className="alternatives-current__exercise">
            <span className="alternatives-eyebrow">You&apos;re doing</span>
            <strong>{exercise}</strong>
            {answer?.level && answer?.equipment && <span>{exerciseLine(answer.level, answer.equipment)}</span>}
            {muscles && <span>{muscles}</span>}
          </div>
          {answer?.you && <p className="alternatives-current__setup">{setupLine(answer.you)}</p>}
        </section>

        {state === 'loading' && (
          <p className="side-panel__status">
            <span className="side-panel__spinner" aria-hidden="true" />
            Finding alternatives to {exercise}...
          </p>
        )}
        {state === 'alternatives' && (
          <section className="alternatives-results" aria-labelledby="alternatives-count">
            <div className="alternatives-results__heading">
              <h3 id="alternatives-count" className="alternatives-modal__count">{countText(answer.alternatives.length)}</h3>
              <p className="alternatives-modal__intro">{introText(answer.movement)}</p>
            </div>
            {locked && onSwitch && (
              <p className="alternatives-modal__note">
                <InfoIcon />
                You&apos;ve saved sets for {exercise}, so it stays in this workout.
              </p>
            )}
            <ol className="alternatives-list" tabIndex={0} aria-label="Alternatives">
              {answer.alternatives.map((alternative) => (
                <li key={alternative.name} className="alternatives-item">
                  <div className="alternatives-item__top">
                    <h4>{alternative.name}</h4>
                    {onSwitch && !locked && (inWorkout(alternative.name) ? (
                      <span className="alternatives-item__note">Already in this workout</span>
                    ) : (
                      <button
                        type="button"
                        className="wl-button alternatives-item__switch"
                        aria-label={`Switch to ${alternative.name}`}
                        disabled={switching !== null}
                        onClick={() => switchTo(alternative.name)}
                      >
                        {switching === alternative.name ? 'Switching…' : 'Switch'}
                      </button>
                    ))}
                  </div>
                  <div className="alternatives-item__tags">
                    <span className={`level-badge level-badge--${alternative.level}`}>{levelTag(alternative.level)}</span>
                    <span className="alternatives-item__equipment">{equipmentTag(alternative.equipment)}</span>
                    {muscleText(alternative.name) && <span className="alternatives-item__muscles">{muscleText(alternative.name)}</span>}
                  </div>
                  <p className="alternatives-item__reason">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {reasonText({ source: exercise, sourceLevel: answer.level, alternative, you: answer.you })}
                  </p>
                </li>
              ))}
            </ol>
            {switchError && (
              <p className="wl-message wl-message--error" role="alert">
                Couldn&apos;t switch the exercise: {switchError}
              </p>
            )}
          </section>
        )}
        {state === 'noMatch' && (
          <div className="side-panel__message">
            <h3>{NO_MATCH_TITLE}</h3>
            <p>{noMatchText({ exercise, movement: answer.movement, you: answer.you })}</p>
            <Link to="/profile/training-preferences">Update training preferences ›</Link>
          </div>
        )}
        {state === 'notCovered' && (
          <div className="side-panel__message">
            <h3>{notCoveredTitle(exercise)}</h3>
            <p>{notCoveredText(exercise)}</p>
          </div>
        )}
        {state === 'failed' && (
          <div className="side-panel__message">
            <p className="wl-message wl-message--error" role="alert">
              Couldn&apos;t load alternatives. Check your connection and try again.
            </p>
            <button type="button" className="wl-button" onClick={tryAgain}>
              Try again
            </button>
          </div>
        )}
        {state === 'loggedOut' && (
          <div className="side-panel__message">
            <p>Your login has expired. Log in again to see alternatives.</p>
            <Link to="/login">Log in</Link>
          </div>
        )}
      </SidePanel>
    </>
  )
}

export default ExerciseAlternatives
