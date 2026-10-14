// Display values derived from the saved session returned by api/workout_session.php.
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours ? `${hours} hr ${minutes} min ${remainder} sec` : `${minutes} min ${remainder} sec`
}

export function formatVolume(pounds) {
  return `${number.format(Number(pounds) || 0)} lb`
}

export function topSet(sets) {
  return sets.reduce((best, set) => {
    if (!best || set.weight_lb > best.weight_lb) return set
    if (set.weight_lb === best.weight_lb && set.reps > best.reps) return set
    return best
  }, null)
}

export function displaySummary(session) {
  if (!session?.completed_at || !session.summary) return null

  return {
    workoutName: session.name,
    duration: formatDuration(session.summary.duration_seconds),
    totalVolume: formatVolume(session.summary.total_volume_lb),
    setsCompleted: session.summary.set_count,
    exerciseCount: session.summary.exercise_count,
    totalReps: session.summary.total_reps,
    highlights: (session.exercises || []).flatMap(({ name, sets }) => {
      if (!sets?.length) return []
      const strongest = topSet(sets)
      const weight = strongest.weight_lb === 0 ? 'Bodyweight' : formatVolume(strongest.weight_lb)
      return [{ exercise: name, topSet: `${weight} × ${strongest.reps}`, setCount: sets.length }]
    }),
  }
}
