// Dates use YYYY-MM-DD in America/New_York, matching the weekly goal API.
export function weeklyDayState(date, todayDate, workout, hasPlan, logged) {
  const rest = hasPlan && !workout
  const restComplete = rest && date <= todayDate
  const complete = logged || restComplete
  return {
    complete,
    today: date === todayDate && !complete,
    mark: complete ? '✓' : rest ? '○' : date === todayDate ? '●' : '·',
    name: workout?.name ?? (rest ? 'Rest day' : 'Choose a plan'),
    status: logged ? 'Logged' : restComplete ? 'Complete' : workout ? date === todayDate ? 'Today' : 'Open' : null,
  }
}
