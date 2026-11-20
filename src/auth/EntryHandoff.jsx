import { useEffect, useRef } from 'react'

// The brand panel's colour as a panel fixed to the left of the window, used to carry it between the entry screens
// and the app (see entryHandoff.js). phase:
// - 'hold': stays at the brand panel's width while the next page is checked.
// - 'to-sidebar': narrows from the brand panel to the menu sidebar, then fades to show the real sidebar under it.
// - 'to-none': for a page without the menu (the setup steps): narrows to nothing.
// - 'to-brand': widens from the sidebar to the brand panel (Log out).
// - 'settle': fades away over the real brand panel once the log in screen is under it.
// While it runs, <html data-entry="phase"> lets the page beside it slide (see auth.css). Purely visual: hidden from
// screen readers and never in the way of a click. On a window narrower than 901px it is not drawn at all.
export default function EntryHandoff({ phase, onDone }) {
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const root = document.documentElement
    root.dataset.entry = phase
    if (phase === 'hold') return () => { if (root.dataset.entry === phase) delete root.dataset.entry }
    // Finish even when no animation runs (narrow window, animations off): the next frame after the planned length.
    const length = { settle: 200, 'to-brand': 440 }[phase] ?? 620
    const timer = window.setTimeout(() => done.current?.(), length + 80)
    return () => {
      window.clearTimeout(timer)
      if (root.dataset.entry === phase) delete root.dataset.entry
    }
  }, [phase])

  return <div className={`entry-handoff entry-handoff--${phase}`} aria-hidden="true" />
}
