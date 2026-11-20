import { useEffect, useRef, useState } from 'react'

// How long the clip may sit without loading (at first, or after it starts buffering) before the guide gives up on it.
const STALL_MS = 10000

// The exercise guide's demo clip (src/ExerciseGuide.jsx) with one Play/Pause button under it. The clip still
// autoplays, loops and is muted. The button's label follows the video's own play and pause events, so it always
// says what pressing it will do, even if the browser blocks autoplay. Pausing keeps the current frame and Play
// continues from it. The guide pop-up unmounts this when it closes, so reopening starts the clip playing again.
// onFail is called once if the clip errors (bad link, offline) or loads nothing for STALL_MS, so the guide can show
// the picture fallback instead of a frozen or spinning player.
function GuideVideo({ src, poster, name, onFail }) {
  const videoRef = useRef(null)
  const timerRef = useRef(null)
  const failedRef = useRef(false)
  const [playing, setPlaying] = useState(false)

  function fail() {
    if (failedRef.current) return
    failedRef.current = true
    clearTimeout(timerRef.current)
    onFail()
  }

  function watch() {
    if (!timerRef.current) timerRef.current = setTimeout(fail, STALL_MS)
  }

  function settle() {
    clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    watch()
    return settle
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  return (
    <div className="exercise-guide__player">
      <video
        ref={videoRef}
        className="exercise-guide__video"
        src={src}
        poster={poster ?? undefined}
        preload="auto"
        autoPlay
        loop
        muted
        playsInline
        aria-label={`${name} demonstration`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onCanPlay={settle}
        onPlaying={settle}
        onWaiting={watch}
        onStalled={watch}
        onError={fail}
      />
      <button
        type="button"
        className="wl-button exercise-guide__toggle"
        aria-label={playing ? 'Pause demo video' : 'Play demo video'}
        onClick={toggle}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6.5" y="5" width="4" height="14" rx="1" />
            <rect x="13.5" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
          </svg>
        )}
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}

export default GuideVideo
