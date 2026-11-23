import { useState } from 'react'

// What the exercise guide (src/ExerciseGuide.jsx) shows in place of the demo clip when there is no video, it fails
// to load, or it stalls: a message, then the backup pictures and instructions one step at a time, each with a
// credit line, a "2 of 5" counter, and Back and Next buttons that stop at the first and last step. Steps are
// [{ image, instruction, credit }]; a step without an image shows a labelled stand-in, never an empty box.
function GuideFallback({ steps }) {
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const last = steps.length - 1

  return (
    <section className="guide-fallback" aria-label="Pictures and steps">
      <p className="guide-fallback__notice" role="status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
        Video unavailable. Follow the pictures and steps below.
      </p>
      {step && (
        <figure className="guide-fallback__step">
          {step.image ? (
            <img className="guide-fallback__image" src={step.image} alt={`Step ${index + 1}`} />
          ) : (
            <div className="guide-fallback__image guide-fallback__image--none" role="img" aria-label="No picture for this step yet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="M20.5 15.5l-5-5-8.5 8.5" />
              </svg>
              <span>Picture coming soon</span>
            </div>
          )}
          <figcaption>
            <p className="guide-fallback__instruction">{step.instruction}</p>
            <p className="guide-fallback__credit">{step.credit}</p>
          </figcaption>
        </figure>
      )}
      <div className="guide-fallback__nav">
        <button type="button" className="wl-button guide-fallback__button" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          ‹ Back
        </button>
        <span className="guide-fallback__count" aria-live="polite">
          {index + 1} of {steps.length}
        </span>
        <button type="button" className="wl-button guide-fallback__button" onClick={() => setIndex(index + 1)} disabled={index === last}>
          Next ›
        </button>
      </div>
    </section>
  )
}

export default GuideFallback
