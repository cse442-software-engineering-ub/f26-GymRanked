import { useLayoutEffect, useRef, useState } from 'react'
import { ARRIVAL_WAIT_MS, arrivalHeld, onArrivalReady } from './entryHandoff.js'

// The brand panel's colour as a panel fixed to the left of the window, used to carry it between the entry screens
// and the app (see entryHandoff.js). phase:
// Log in:  'exit-sidebar' (or 'exit-none' after a sign-up) narrows from the brand panel while the form slides away;
//          'hold-sidebar' waits at the sidebar's width while the next page is checked; then 'arrive-sidebar' fades
//          into the real sidebar as the page slides in, or 'arrive-none' narrows to nothing for the setup steps.
// Log out: 'to-brand' widens from the sidebar to the brand panel while the page slides away; 'hold' waits at the
//          brand panel's width; 'settle' fades away over the real brand panel once the log in screen is under it.
// An arriving page that is still loading (holdArrival() in entryHandoff.js) keeps the panel waiting at the sidebar's
// width with the page hidden ('arrive-wait') until it is ready, at most ARRIVAL_WAIT_MS, and only then slides it in.
// While it runs, <html data-entry="phase"> lets the page beside it slide (see auth.css). Purely visual: hidden from
// screen readers and never in the way of a click. On a window narrower than 901px it is not drawn at all.
export default function EntryHandoff({ phase, onDone }) {
  const done = useRef(onDone)
  done.current = onDone
  const arriving = phase.startsWith('arrive')
  // null: not decided yet; true: waiting for the page; false: sliding.
  const [waiting, setWaiting] = useState(null)

  // Runs after the arriving page's own layout effects, so a page that asked to be waited for has already said so.
  useLayoutEffect(() => {
    if (arriving && waiting === null) setWaiting(arrivalHeld())
  }, [arriving, waiting])

  // While waiting: slide as soon as the page says it is ready, or after ARRIVAL_WAIT_MS whatever happens.
  useLayoutEffect(() => {
    if (waiting !== true) return undefined
    const go = () => setWaiting(false)
    if (!arrivalHeld()) {
      go()
      return undefined
    }
    const stop = onArrivalReady(go)
    const timer = window.setTimeout(go, ARRIVAL_WAIT_MS)
    return () => { stop(); window.clearTimeout(timer) }
  }, [waiting])

  const shown = arriving && waiting !== false ? 'arrive-wait' : phase

  // A layout effect, so the page beside the panel is set up for its slide before the browser draws it (with a plain
  // effect the new page could show for one frame in its final place, then jump back and slide in).
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.entry = shown
    if (shown.startsWith('hold') || shown === 'arrive-wait') return () => { if (root.dataset.entry === shown) delete root.dataset.entry }
    // Finish even when no animation runs (narrow window, animations off): the next frame after the planned length.
    const length = { settle: 200, 'to-brand': 440, 'exit-sidebar': 440, 'exit-none': 440, 'arrive-sidebar': 420, 'arrive-none': 420 }[shown] ?? 440
    const timer = window.setTimeout(() => done.current?.(), length + 80)
    return () => {
      window.clearTimeout(timer)
      if (root.dataset.entry === shown) delete root.dataset.entry
    }
  }, [shown])

  return <div className={`entry-handoff entry-handoff--${shown}`} aria-hidden="true" />
}
