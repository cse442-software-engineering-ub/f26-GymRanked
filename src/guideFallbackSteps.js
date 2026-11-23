// The backup pictures and steps for the exercise guide (src/ExerciseGuide.jsx), shown by src/GuideFallback.jsx when
// the WorkoutX demo clip is missing, fails or stalls (task #92). The steps are in src/exerciseBackupSteps.json, which
// is bundled with the app, so they are there even when the connection is down; the photo for each is a file in
// public/exercises/ (credits in public/exercises/SOURCES.md). The data is from the public-domain Free Exercise DB.
// Every step shows the exercise's one photo. An exercise with no entry (no match in that data) gets a one-sentence
// description and the "Picture coming soon" stand-in.
import backup from './exerciseBackupSteps.json'

const PHOTO_URL = `${import.meta.env.BASE_URL}exercises/`
const CREDIT = 'Photo and steps from the Free Exercise DB (public domain).'

function localSteps(name) {
  return [{
    image: null,
    instruction: `Do each rep of the ${name} slowly and under control through its full range of motion, keeping your core braced and your form steady.`,
    credit: 'Written by GymRank. A picture for this exercise is coming.',
  }]
}

export function fallbackSteps(name) {
  const entry = backup[name.trim().toLowerCase()]
  if (!entry) return localSteps(name)
  return entry.steps.map((instruction) => ({ image: PHOTO_URL + entry.photo, instruction, credit: CREDIT }))
}

// Fetches the photo ahead of time, when the exercise page opens, so it is already in the browser if the connection
// drops before the guide is opened.
export function preloadFallbackPhoto(name) {
  const entry = backup[name.trim().toLowerCase()]
  if (entry) new Image().src = PHOTO_URL + entry.photo
}
