import { useEffect, useState } from 'react'
import { apiRequest } from './onboarding/api.js'

// The logged-in user's saved onboarding answers: { goal, experience, equipment }.
// Stays null when they aren't logged in, haven't finished setup, or the request fails, so pages
// just skip the equipment marks instead of showing an error.
function useUserSetup() {
  const [setup, setSetup] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([apiRequest('setup.php'), apiRequest('preferences.php')]).then(([saved, prefs]) => {
      if (!active) return
      if (saved.ok && saved.data.experience && saved.data.equipment.length > 0) {
        setSetup({
          experience: saved.data.experience,
          equipment: saved.data.equipment,
          goal: prefs.ok ? prefs.data.training_goal : null,
        })
      }
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  return { setup, loaded }
}

export default useUserSetup
