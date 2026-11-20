import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Brand from './Brand.jsx'
import EntryShowcase, { EntryBackdrop, EntryBarbell } from './EntryShowcase.jsx'
import ThemeSwitch from './ThemeSwitch.jsx'
import LoginForm from './LoginPage.jsx'
import RegistrationForm from './RegistrationPage.jsx'
import EntryHandoff from './EntryHandoff.jsx'
import { peekHandoff, reducedMotion, startHandoff } from './entryHandoff.js'
import { ghostOf } from './formGhost.js'

const MODES = ['login', 'register']

// Log in (#/login, story #18) and create account (#/register, story #17) share this one screen: the dark brand
// panel on the left and the form on the right (stacked on a phone). Both routes render this component and
// OnboardingGate keeps it mounted between them, so switching only slides the form: create account comes in from the
// right, log in from the left, while the brand panel stays still. After either form succeeds the form
// slides away while the panel narrows to the sidebar, then the app slides in (entryHandoff.js); after Log out the log in form slides in from the left.
export default function EntryScreen() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = pathname === '/register' ? 'register' : 'login'
  // from: the form that is sliding away, or null when one form is shown.
  const [shown, setShown] = useState({ mode, from: null })
  // Set once a form succeeds: { path, state, target } for the slide into the app.
  const [entering, setEntering] = useState(null)
  const [intro, setIntro] = useState(() => (peekHandoff() === 'leave' ? 'return' : 'first'))
  // The form sliding away is swapped for a look-alike copy before the page is drawn (formGhost.js).
  const [ghost, setGhost] = useState('')
  const outgoingBox = useRef(null)
  // The two forms differ in height. On a phone (900px or narrower, one column) the space they share eases from one
  // height to the other while they slide, so the example cards under it glide instead of jumping when the old form
  // goes. On a computer the forms are centred beside the brand panel and nothing sits under them, so the space keeps
  // its size and the slide stays purely sideways (easing it there made the forms drift up and down).
  const track = useRef(null)
  const slideBoxes = useRef({})
  const heading = useRef(null)
  const switched = useRef(false)

  if (shown.mode !== mode) {
    switched.current = true
    if (intro !== 'none') setIntro('none')
    setShown({ mode, from: reducedMotion() ? null : shown.mode })
    setGhost('')
  }

  useLayoutEffect(() => {
    if (shown.from !== null && !ghost) setGhost(ghostOf(outgoingBox.current) || ' ')
  }, [shown, ghost])

  // After a switch the keyboard and screen readers start at the new form's title.
  useLayoutEffect(() => {
    if (!switched.current) return
    switched.current = false
    // On a short phone, "Log in" at the bottom of the longer create account form leaves the page scrolled down; the
    // new form starts at its title, not above the screen.
    if (heading.current && heading.current.getBoundingClientRect().top < 0) window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
  }, [shown.mode])

  useLayoutEffect(() => {
    const element = track.current
    if (!element) return
    if (shown.from === null) {
      element.style.height = ''
      return
    }
    if (!window.matchMedia('(max-width: 900px)').matches) return
    const from = slideBoxes.current[shown.from]
    const to = slideBoxes.current[shown.mode]
    if (!from || !to) return
    element.style.height = `${from.offsetHeight}px`
    element.getBoundingClientRect()
    element.style.height = `${to.offsetHeight}px`
  }, [shown.from, shown.mode])

  // If the slide never reports its end (animations off, tab in the background), drop the old form anyway.
  useEffect(() => {
    if (shown.from === null) return undefined
    const timer = window.setTimeout(() => setShown((current) => ({ mode: current.mode, from: null })), 700)
    return () => window.clearTimeout(timer)
  }, [shown])

  // target: 'sidebar' after log in (the Dashboard has the menu), 'none' after a sign-up (the setup steps have none).
  function onEnter(path, state, target = 'sidebar') {
    if (reducedMotion()) {
      navigate(path, { replace: true, state })
      return
    }
    setEntering({ path, state, target })
  }

  function exitDone() {
    startHandoff('arrive', entering.target)
    navigate(entering.path, { replace: true, state: entering.state })
  }

  function slideDone(event) {
    if (event.target === event.currentTarget) setShown((current) => ({ mode: current.mode, from: null }))
  }

  const direction = mode === 'register' ? 'next' : 'back'
  const classes = ['entry', `entry--${mode}`, `entry--intro-${intro}`, entering && 'entry--entering'].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <EntryBackdrop />
      <aside className="entry-brand" aria-label="GymRank">
        <div className="entry-brand__glow" aria-hidden="true" />
        <header className="entry-brand__top"><Brand /></header>
        <div className="entry-brand__body">
          <h2 className="entry-hero">Every rep gets a <span className="accent">rank.</span></h2>
          <p className="entry-hero__text">Log your lifts, climb the tiers, and call out rivals head-to-head.</p>
          <EntryShowcase />
        </div>
      </aside>

      <main className="entry-stage" data-direction={direction}>
        <EntryBarbell />
        <div className="entry-track" ref={track}>
        {MODES.filter((name) => name === shown.mode || name === shown.from).map((name) => {
          const outgoing = name !== shown.mode
          const sliding = shown.from !== null
          const Form = name === 'login' ? LoginForm : RegistrationForm
          return (
            <div key={name} ref={(element) => { slideBoxes.current[name] = element }}
              className={`entry-slide${sliding ? (outgoing ? ' entry-slide--out' : ' entry-slide--in') : ''}`}
              inert={outgoing ? '' : undefined} aria-hidden={outgoing || undefined} onAnimationEnd={outgoing ? slideDone : undefined}>
              {outgoing && ghost
                ? <div className="entry-ghost" dangerouslySetInnerHTML={{ __html: ghost }} />
                : <div ref={outgoing ? outgoingBox : undefined}><Form onEnter={onEnter} outgoing={outgoing} headingRef={outgoing ? undefined : heading} /></div>}
            </div>
          )
        })}
        </div>
      </main>
      <ThemeSwitch />
      {entering && <EntryHandoff phase={`exit-${entering.target}`} onDone={exitDone} />}
    </div>
  )
}
