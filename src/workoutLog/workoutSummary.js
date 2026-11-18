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

export function formatCompletedDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
  }).format(date)
}

function formatSet(set) {
  if (!set) return ''
  return `${set.weight_lb === 0 ? 'Bodyweight' : formatVolume(set.weight_lb)} × ${set.reps}`
}

export function displaySummary(session, records = null) {
  if (!session?.completed_at || !session.summary) return null

  const recordsByExercise = new Map((Array.isArray(records?.exercises) ? records.exercises : []).map((item) => [item.exercise, item]))

  return {
    workoutName: session.name,
    completedDate: formatCompletedDate(session.completed_at),
    duration: formatDuration(session.summary.duration_seconds),
    totalVolume: formatVolume(session.summary.total_volume_lb),
    setsCompleted: session.summary.set_count,
    exerciseCount: session.summary.exercise_count,
    totalReps: session.summary.total_reps,
    newPrs: records?.new_pr_count ?? null,
    highlights: (session.exercises || []).flatMap(({ name, sets }) => {
      if (!sets?.length) return []
      const record = recordsByExercise.get(name)
      return [{
        exercise: name,
        topSet: formatSet(record?.top_set ?? topSet(sets)),
        versusLast: formatSet(record?.previous),
        isBaseline: record?.is_baseline === true,
        prLabel: record?.is_pr && !record?.is_baseline ? record.metric === 'reps' ? 'Rep PR' : 'Weight PR' : '',
      }]
    }),
  }
}
