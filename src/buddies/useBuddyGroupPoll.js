import { useCallback, useEffect, useRef, useState } from 'react'
import { getBuddyGroup } from './buddiesApi.js'
import { announceFresh, mergeGroupView, nextDelay, POLL_MS } from './buddiesPoll.js'

// Keeps the buddies group view (Mansur's api/buddy_group.php, card #71) up to date while a page is open, so a new
// private encouragement shows on the Dashboard or the Buddies page without a reload.
// - Asks every 10 seconds while the tab is visible; stops while it is hidden and asks at once when it comes back,
//   when the window gets the focus again and when the connection returns.
// - A failed request keeps what is on screen and tries again after 20s, 40s, then every minute until one works. Only
//   the very first load shows an error (with Try again), and even then the poller keeps trying.
// - An answer that changes nothing changes nothing on screen (mergeGroupView), so text being typed stays put.
// - Messages are merged by id, so one message never shows twice; an answer for another account replaces the view.
// - Only the newest request may change the page; answers that come back after the page closed are dropped.
// Returns { state: {status: 'loading'|'ready'|'error', data}, fresh: ids that arrived while open, announcement,
// reload() to start over with the loading message, refresh() to ask quietly now, replace(data) to show a view the
// page already has (join and create answer with one) }.
export function useBuddyGroupPoll({ onUnauthorized, interval = POLL_MS } = {}) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [fresh, setFresh] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const latest = useRef(0)
  const view = useRef(null)
  const failures = useRef(0)
  const timer = useRef(0)
  const stopped = useRef(false)
  const unauthorized = useRef(onUnauthorized)
  unauthorized.current = onUnauthorized

  const clearTimer = () => {
    window.clearTimeout(timer.current)
    timer.current = 0
  }

  const load = useCallback(async (loud) => {
    if (stopped.current) return
    clearTimer()
    const id = ++latest.current
    if (loud) {
      view.current = null
      setState({ status: 'loading', data: null })
    }
    const response = await getBuddyGroup()
    if (id !== latest.current || stopped.current) return
    if (response.status === 401) {
      stopped.current = true
      unauthorized.current?.()
      return
    }
    if (response.ok) {
      failures.current = 0
      const merged = mergeGroupView(view.current, response.data)
      if (merged.changed || view.current === null) {
        view.current = merged.view
        setState({ status: 'ready', data: merged.view })
      }
      if (merged.fresh.length) {
        setFresh((current) => [...current, ...merged.fresh])
        setAnnouncement(announceFresh(merged.view, merged.fresh))
      }
    } else {
      failures.current += 1
      if (view.current === null) setState({ status: 'error', data: null })
    }
    if (document.visibilityState === 'visible') {
      timer.current = window.setTimeout(() => load(false), nextDelay(failures.current, interval))
    }
  }, [interval])

  useEffect(() => {
    stopped.current = false
    load(true)
    const wake = () => { if (document.visibilityState === 'visible') load(false) }
    const onVisibility = () => { if (document.visibilityState === 'visible') load(false); else clearTimer() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', wake)
    window.addEventListener('online', wake)
    return () => {
      stopped.current = true
      latest.current += 1
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', wake)
      window.removeEventListener('online', wake)
    }
  }, [load])

  const reload = useCallback(() => { failures.current = 0; load(true) }, [load])
  const refresh = useCallback(() => load(false), [load])
  const replace = useCallback((data) => {
    latest.current += 1
    const merged = mergeGroupView(null, data)
    view.current = merged.view
    setState({ status: 'ready', data: merged.view })
    if (document.visibilityState === 'visible') {
      clearTimer()
      timer.current = window.setTimeout(() => load(false), interval)
    }
  }, [load, interval])

  return { state, fresh, announcement, reload, refresh, replace }
}
